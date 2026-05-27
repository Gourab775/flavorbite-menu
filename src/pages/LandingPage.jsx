import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useMenuStore } from "../store/menuStore";
import { HamburgerMenu } from "../components/HamburgerMenu";
import { setStoredSlug } from "../utils/constants";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { AlertCircle } from "lucide-react";

export function LandingPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { loadMenu, restaurant, loading: storeLoading, error: storeError } = useMenuStore();

  const [mainCategories, setMainCategories] = useState([]);
  const [mainCatLoading, setMainCatLoading] = useState(true);
  const [mainCatError, setMainCatError] = useState(null);

  const displayName = restaurant?.name || "";

  const tableToken = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get("table");
    return raw ? raw.trim() : "";
  }, []);

  useEffect(() => {
    if (slug) {
      setStoredSlug(slug);
      loadMenu(slug);
    }
  }, [slug, loadMenu]);

  useEffect(() => {
    if (!slug || !restaurant?.id) return;

    let cancelled = false;
    const fetchMainCategories = async () => {
      setMainCatLoading(true);
      setMainCatError(null);

      if (!isSupabaseConfigured || !supabase) {
        setMainCatError("Supabase not configured");
        setMainCatLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("main_categories")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .order("sort_order", { ascending: true });

        if (cancelled) return;

        if (error) {
          setMainCatError(error.message);
        } else {
          setMainCategories(
            (data || []).map((mc) => ({
              id: String(mc.id),
              name: String(mc.name),
              imageUrl: String(mc.image_url || mc.imageUrl || ""),
              sortOrder: Number(mc.sort_order || mc.sortOrder || 0),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMainCatError(err?.message || "Failed to load");
        }
      } finally {
        if (!cancelled) setMainCatLoading(false);
      }
    };

    fetchMainCategories();
    return () => { cancelled = true; };
  }, [slug, restaurant?.id]);

  const handleMainCategoryClick = (mainCategoryId) => {
    const params = new URLSearchParams();
    if (mainCategoryId) params.set("main_category_id", mainCategoryId);
    if (tableToken) params.set("table", tableToken);
    const qs = params.toString();
    navigate(`/${slug}/menu${qs ? `?${qs}` : ""}`);
  };

  const showLoading = storeLoading && !restaurant?.id;
  const showError = storeError && !restaurant?.id;

  if (showLoading) {
    return (
      <div className="landingPage">
        <main className="loadingPage">
          <div className="loadingSpinner" />
          <p className="loadingText">Loading restaurant...</p>
        </main>
      </div>
    );
  }

  if (showError) {
    return (
      <div className="landingPage">
        <main className="emptyState" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div className="emptyIcon" aria-label="Error icon" style={{ color: "#ff6b6b" }}>
            <AlertCircle size={60} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginTop: "24px" }}>Unable to load restaurant</h2>
          <p className="muted" style={{ maxWidth: "280px", margin: "12px auto" }}>{storeError}</p>
          <div style={{ marginTop: "16px" }}>
            <button className="btn primary" onClick={() => loadMenu(slug)}>Try again</button>
          </div>
        </main>
      </div>
    );
  }

  const showDefaultCard = mainCategories.length === 0 && !mainCatLoading && !mainCatError;

  return (
    <div className="landingPage">
      <div className="landingVideoWrap">
        <video
          className="landingVideo"
          autoPlay
          muted
          loop
          playsInline
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%230a0a0a'/%3E%3C/svg%3E"
        >
          <source src="https://videos.pexels.com/video-files/3191290/3191290-uhd_2560_1440_30fps.mp4" type="video/mp4" />
        </video>
        <div className="landingOverlay" />
      </div>

      <header className="landingHeader">
        <div className="landingBrand">
          <span className="landingBrandName">{displayName || "Restaurant"}</span>
          <span className="landingBrandSubtitle">Premium Dining</span>
        </div>
        <HamburgerMenu slug={slug} />
      </header>

      <main className="landingContent">
        <div className="landingTagline">
          <span className="landingTaglineMain">Discover Our Menu</span>
          <span className="landingTaglineSub">Choose a category to begin</span>
        </div>

        <div className="landingCards">
          {mainCatLoading && (
            <div className="landingCardsLoading">
              {[1, 2, 3].map((n) => (
                <div key={n} className="landingCardSkeleton" />
              ))}
            </div>
          )}

          {!mainCatLoading && mainCatError && (
            <div className="landingCardsError">
              <p>Could not load categories</p>
              <button className="btn primary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {!mainCatLoading && !mainCatError && (
            <div className="landingCardsGrid">
              {mainCategories.map((mc) => (
                <button
                  key={mc.id}
                  className="landingCardBtn"
                  onClick={() => handleMainCategoryClick(mc.id)}
                >
                  {mc.imageUrl && (
                    <div className="landingCardImgWrap">
                      <img
                        src={mc.imageUrl}
                        alt={mc.name}
                        className="landingCardImg"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <span className="landingCardLabel">{mc.name}</span>
                </button>
              ))}
            </div>
          )}

          {showDefaultCard && (
            <div className="landingCardsGrid">
              <button
                className="landingCardBtn landingCardBtnPrimary"
                onClick={() => handleMainCategoryClick("")}
              >
                <span className="landingCardLabel">View Full Menu</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
