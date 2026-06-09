import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { VegToggle } from "../components/VegToggle";
import { HeroBanner } from "../components/HeroBanner";
import { CategorySlider } from "../components/CategorySlider";
import { MenuItemCard } from "../components/MenuItemCard";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { useMenuSearch } from "../hooks/useMenuSearch";
import { useCart } from "../hooks/useCart";
import { useCategorySync } from "../hooks/useCategorySync";
import { setStoredSlug } from "../utils/constants";
import { initSession, setTableData } from "../utils/session";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { AlertCircle, Search } from "lucide-react";

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SCROLL_HEADER_OFFSET = 240;

export function MenuPage() {
  const { slug } = useParams();
  const { loadMenu, restaurant: storeRestaurant, loading: storeLoading, error: storeError } = useMenuStore();
  const { vegMode, searchQuery } = useCart();
  const { categories, menuItems, loading, error, refetch } = useMenu();
  const { results: searchResults, searching } = useMenuSearch(searchQuery);
  const isSearching = searchQuery.trim() !== "";

  const [tableStatus, setTableStatus] = useState("validating");
  const tableLookupDone = useRef(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollLockRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const mainCategoryId = new URLSearchParams(window.location.search).get("main_category_id") || "";

  const filteredCategories = useMemo(() => {
    if (!mainCategoryId) return categories;
    return categories.filter((c) => c.mainCategoryId === mainCategoryId);
  }, [categories, mainCategoryId]);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    setIsScrolled(scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const grouped = useMemo(() => {
    if (isSearching) {
      if (searchResults.length === 0) return [];
      let items = [...searchResults];
      if (vegMode) items = items.filter((i) => i.isVeg);
      return [{ category: { id: "__search", name: `Results for "${searchQuery}"` }, items }];
    }

    return filteredCategories
      .map((c) => {
        let items = menuItems.filter((i) => i.categoryId === c.id);
        if (vegMode) items = items.filter((i) => i.isVeg);
        return { category: c, items };
      })
      .filter((g) => g.items.length > 0);
  }, [filteredCategories, menuItems, searchResults, vegMode, searchQuery, isSearching]);

  // ── Default to first category when none is active ──
  const activeCategoryOrDefault = useMemo(() => {
    if (activeCategory !== null) return activeCategory;
    if (filteredCategories.length > 0) return slugify(filteredCategories[0].name);
    return null;
  }, [activeCategory, filteredCategories]);

  // ── Scroll sync: container scroll → update active category ──
  useCategorySync("menu-container", setActiveCategory, scrollLockRef);

  // ── Smooth scroll to category section ──
  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    const container = document.getElementById("menu-container");
    if (!el || !container) return;

    const targetScroll = el.offsetTop - SCROLL_HEADER_OFFSET;
    container.scrollTo({ top: targetScroll, behavior: "smooth" });
  }, []);

  // ── Category click → scroll to section ──
  const handleCategoryClick = useCallback(
    (categoryName) => {
      const id = slugify(categoryName);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollLockRef.current = true;
      setActiveCategory(id);
      scrollToSection(id);
      scrollTimeoutRef.current = setTimeout(() => {
        scrollLockRef.current = false;
        scrollTimeoutRef.current = null;
      }, 500);
    },
    [scrollToSection]
  );

  // ── Init session + handle table_token extraction ────────────────────────
  useEffect(() => {
    if (slug && typeof slug === "string") {
      setStoredSlug(slug);
      loadMenu(slug);
      initSession();
    }

    const params = new URLSearchParams(window.location.search);
    const rawParam = params.get("table");
    const tableParam = rawParam ? decodeURIComponent(rawParam).trim() : null;

    if (tableParam) {
      localStorage.setItem("table_token", tableParam);
      sessionStorage.setItem("qr_table_param", tableParam);
    } else {
      const storedToken = localStorage.getItem("table_token");
      if (storedToken) {
        sessionStorage.setItem("qr_table_param", storedToken);
      }
    }
  }, [slug, loadMenu]);

  // Cleanup scroll lock timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // ── Look up the table row using table_token ──────────────────────
  useEffect(() => {
    if (!storeRestaurant?.id) return;
    if (tableLookupDone.current) return;

    const tableToken =
      new URLSearchParams(window.location.search).get("table") ||
      localStorage.getItem("table_token");

    if (!tableToken) {
      setTableStatus("missing");
      tableLookupDone.current = true;
      return;
    }

    let cancelled = false;

    const doLookup = async () => {
      try {
        setTableStatus("validating");

        const rawParam = new URLSearchParams(window.location.search).get("table") || localStorage.getItem("table_token");
        const tableParam = rawParam ? decodeURIComponent(rawParam).trim() : null;

        if (!tableParam) {
          if (!cancelled) setTableStatus("missing");
          tableLookupDone.current = true;
          return;
        }

        if (!isSupabaseConfigured || !supabase) {
          if (!cancelled) setTableStatus("invalid");
          tableLookupDone.current = true;
          return;
        }

        const { data: byToken, error: tokenErr } = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("table_token", tableParam)
          .maybeSingle();

        if (cancelled) return;

        if (tokenErr) {
          console.error("[MenuPage] table_token lookup error:", tokenErr.message);
          setTableStatus("invalid");
          tableLookupDone.current = true;
          return;
        }

        if (byToken && byToken.restaurant_id === storeRestaurant.id) {
          setTableData(byToken);
          localStorage.setItem("table_id", byToken.id);
          localStorage.setItem("table_token", byToken.table_token);
          setTableStatus("ok");
        } else {
          console.warn("[MenuPage] No matching table found for token:", tableToken);
          setTableStatus("invalid");
        }
        tableLookupDone.current = true;
      } catch (err) {
        if (!cancelled) {
          console.error("[MenuPage] Table lookup exception:", err);
          setTableStatus("invalid");
          tableLookupDone.current = true;
        }
      }
    };

    doLookup();
    return () => { cancelled = true; };
  }, [storeRestaurant?.id]);

  // Handle restaurant loading state
  if (storeLoading && !storeRestaurant?.id && tableStatus !== "missing") {
    return (
      <div className="menuLayout">
        <main className="loadingPage">
          <div className="loaderDots">
            <span className="loaderDot" />
            <span className="loaderDot" />
            <span className="loaderDot" />
          </div>
          <p className="loadingText">Loading restaurant...</p>
        </main>
      </div>
    );
  }

  // Handle restaurant fetch failure
  if (storeError && !storeRestaurant?.id) {
    return (
      <div className="menuLayout">
        <main className="emptyState" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="emptyIcon" aria-label="Error icon" style={{ color: "var(--nonveg)" }}>
            <AlertCircle size={60} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginTop: "24px" }}>Unable to load restaurant</h2>
          <p className="muted" style={{ maxWidth: "280px", margin: "12px auto" }}>
            {storeError}
          </p>
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <button className="btn primary" onClick={() => loadMenu(slug)}>
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Handle blocking states
  if (tableStatus === "missing") {
    return (
      <div className="menuLayout">
        <main className="emptyState" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="emptyIcon" style={{ color: "var(--warn)" }}>
            <AlertCircle size={60} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginTop: "24px" }}>Table Required</h2>
          <p className="muted" style={{ maxWidth: "280px", margin: "12px auto" }}>
            Please scan the QR code located on your table to view the menu and place orders.
          </p>
        </main>
      </div>
    );
  }

  if (tableStatus === "invalid") {
    return (
      <div className="menuLayout">
        <main className="emptyState" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="emptyIcon" style={{ color: "var(--nonveg)" }}>
            <AlertCircle size={60} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginTop: "24px" }}>Invalid Table</h2>
          <p className="muted" style={{ maxWidth: "280px", margin: "12px auto" }}>
            The QR code scanned is invalid or not recognized. Please scan the QR code from your table again.
          </p>
        </main>
      </div>
    );
  }

  if (tableStatus === "validating") {
    return (
      <div className="menuLayout">
        <main className="loadingPage">
          <div className="loaderDots">
            <span className="loaderDot" />
            <span className="loaderDot" />
            <span className="loaderDot" />
          </div>
          <p className="loadingText">Verifying table...</p>
        </main>
      </div>
    );
  }

  // Only render menu if tableStatus === "ok"
  if (tableStatus !== "ok") return null;

  return (
    <div className="menuLayout">
      <main id="menu-container" className="menuScroll hideScrollbar">
        <div className="topSection">
          <Header />
          <div className={`stickyHeader ${isScrolled ? "scrolled" : ""}`}>
            <div className="searchBarContainer">
              <SearchBar />
              <VegToggle />
            </div>
          </div>
          {!isSearching && (
            <div className={`categoryWrapper ${isScrolled ? "scrolled" : ""}`}>
              <CategorySlider
                categories={filteredCategories}
                activeCategory={activeCategoryOrDefault}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          )}
        </div>

        {!isSearching && <HeroBanner />}

        <div className="container">
          {(loading || searching) && (
            <>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="skeletonCard" />
              ))}
            </>
          )}

          {!loading && !searching && error && (
            <div className="emptyState">
              <div className="emptyIcon" aria-label="Error icon" style={{ color: "var(--nonveg)" }}>
                <AlertCircle size={40} strokeWidth={1.5} />
              </div>
              <h2>Unable to load menu</h2>
              <p className="muted">{error}</p>
              <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
                <button className="btn primary" onClick={refetch}>Try again</button>
              </div>
              <p className="muted" style={{ marginTop: "12px", fontSize: "0.85rem", opacity: 0.7 }}>
                Check console for detailed error logs
              </p>
            </div>
          )}

          {!loading && !searching && !error && grouped.length > 0 && (
            <>
              <div className="sections">
                {grouped.map(({ category, items }) => (
                  <div
                    key={category.id}
                    id={slugify(category.name)}
                    className="menuSection"
                  >
                    <div className="sectionHeader">
                      <h2>{category?.name?.toUpperCase() ?? ""}</h2>
                      <span className="sectionItemCount">
                        {`${items.length} item${items.length === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    {items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !searching && !error && grouped.length === 0 && (
            <div className="emptyState">
              {isSearching ? (
                <>
                  <div className="emptyIcon" aria-label="Search icon">
                    <Search size={40} strokeWidth={1.5} />
                  </div>
                  <h2>No dishes found</h2>
                  <p className="muted">Try a different search term.</p>
                </>
              ) : (
                <>
                  <h2>No menu items available</h2>
                  <p className="muted">Check back later for new items.</p>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
