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
import { supabase } from "../lib/supabaseClient";
import { AlertCircle, Search } from "lucide-react";

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SCROLL_HEADER_OFFSET = 180;

export function MenuPage() {
  const { slug } = useParams();
  const { loadMenu } = useMenuStore();

  const [restaurant, setRestaurant] = useState(null);

  // ── 1. Fetch restaurant by slug ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchRestaurant = async () => {
      try {
        if (!slug || typeof slug !== "string") return;
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", slug)
          .single();
        if (error) {
          console.error("Failed to fetch restaurant:", error);
          if (!cancelled) setRestaurant(null);
          return;
        }
        if (!cancelled) setRestaurant(data);
      } catch (e) {
        console.error("Unexpected error fetching restaurant:", e);
        if (!cancelled) setRestaurant(null);
      }
    };
    fetchRestaurant();
    return () => { cancelled = true; };
  }, [slug]);

  // ── 2. Init session + cache the ?table= param immediately ────────────────
  //    The restaurant fetch is async; we must persist the URL param NOW before
  //    SPA navigation (cart, checkout) strips it from window.location.search.
  useEffect(() => {
    if (slug && typeof slug === "string") {
      setStoredSlug(slug);
      loadMenu(slug);
      initSession();
    }
    const params = new URLSearchParams(window.location.search);
    const tableToken = params.get("table");
    if (tableToken) {
      sessionStorage.setItem("qr_table_param", tableToken);
      // Do NOT store in localStorage yet - wait for verification
      console.log("[MenuPage] Cached table_token:", tableToken);
    }
  }, [slug, loadMenu]);

  // ── 3. Look up the table row using table_token ──────────────────────
  useEffect(() => {
    if (!restaurant?.id) return;

    const tableToken =
      new URLSearchParams(window.location.search).get("table") ||
      sessionStorage.getItem("qr_table_param");

    if (!tableToken) return;

    const doLookup = async () => {
      try {
        // Query using table_token column (QR code contains table_token, NOT id)
        const { data: byToken, error: tokenErr } = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("table_token", tableToken)
          .maybeSingle();

        if (!tokenErr && byToken && byToken.restaurant_id === restaurant.id) {
          console.log("FETCHED_TABLE_ID:", byToken?.id);
          console.log("[MenuPage] Table found by table_token:", byToken.table_number);
          setTableData(byToken);
          // Store the actual id (primary key) in localStorage as table_id for order insert
          localStorage.setItem("table_id", byToken.id);
          localStorage.setItem("table_token", byToken.table_token);
          console.log("[MenuPage] Stored table_id:", byToken.id);
          console.log("[MenuPage] Stored table_token:", byToken.table_token);
          return;
        }

        if (tokenErr) {
          console.error("[MenuPage] table_token lookup error:", tokenErr.message);
        }

        console.warn("[MenuPage] No matching table found for token:", tableToken);
      } catch (err) {
        console.error("[MenuPage] Table lookup exception:", err);
      }
    };

    doLookup();
  }, [restaurant?.id]);

  const { vegMode, searchQuery } = useCart();
  const { categories, menuItems, loading, error, refetch } = useMenu();
  const { results: searchResults, searching } = useMenuSearch(searchQuery);

  const isSearching = searchQuery.trim() !== "";

  const [activeCategory, setActiveCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

    return categories
      .map((c) => {
        let items = menuItems.filter((i) => i.categoryId === c.id);
        if (vegMode) items = items.filter((i) => i.isVeg);
        return { category: c, items };
      })
      .filter((g) => g.items.length > 0);
  }, [categories, menuItems, searchResults, vegMode, searchQuery, isSearching]);

  // ── Scroll sync: container scroll → update active category ──
  useCategorySync("menu-container", setActiveCategory);

  // ── Interruptible smooth scroll with precise offset ──
  const scrollRafRef = useRef(null);
  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    const container = document.getElementById("menu-container");
    if (!el || !container) return;

    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    const targetScroll = el.offsetTop - SCROLL_HEADER_OFFSET;

    const doScroll = () => {
      const currentScrollTop = container.scrollTop;
      const diff = targetScroll - currentScrollTop;

      if (Math.abs(diff) <= 1) return;

      const nextScroll = currentScrollTop + diff * 0.35;
      container.scrollTop = nextScroll;

      const remaining = Math.abs(targetScroll - container.scrollTop);
      if (remaining > 1) {
        scrollRafRef.current = requestAnimationFrame(doScroll);
      }
    };

    container.scrollTop = targetScroll;
    requestAnimationFrame(doScroll);
  }, []);

  // ── Category click → scroll to section ──
  const handleCategoryClick = useCallback(
    (categoryName) => {
      const id = slugify(categoryName);
      setActiveCategory(id);
      scrollToSection(id);
    },
    [scrollToSection]
  );

  // Do not render until restaurant data is loaded
  if (!restaurant) return null;

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
                categories={categories}
                activeCategory={activeCategory}
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
              <div className="emptyIcon" aria-label="Error icon" style={{ color: "#ff6b6b" }}>
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
                      <h2>{category?.name ?? ""}</h2>
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
