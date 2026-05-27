import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useMenuStore } from "../store/menuStore";
import { HamburgerMenu } from "../components/HamburgerMenu";
import { setStoredSlug } from "../utils/constants";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { AlertCircle, ChefHat, X, UtensilsCrossed } from "lucide-react";

export function LandingPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { loadMenu, restaurant, loading: storeLoading, error: storeError } = useMenuStore();

  const [backgroundVideo, setBackgroundVideo] = useState("");
  const [mainCategories, setMainCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

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
    requestAnimationFrame(() => setPageLoaded(true));
  }, []);

  useEffect(() => {
    if (!slug || !restaurant?.id) return;
    let cancelled = false;

    const fetchData = async () => {
      setCatLoading(true);
      setCatError(null);

      if (!isSupabaseConfigured || !supabase) {
        setCatLoading(false);
        return;
      }

      try {
        const { data: lps } = await supabase
          .from("landing_page_settings")
          .select("background_video_url")
          .eq("restaurant_id", restaurant.id)
          .maybeSingle();

        if (!cancelled && lps?.background_video_url) {
          setBackgroundVideo(lps.background_video_url);
          setVideoError(false);
        }

        const { data: catData, error: catErr } = await supabase
          .from("main_categories")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .order("sort_order", { ascending: true });

        if (cancelled) return;

        if (catErr) {
          setCatError(catErr.message);
        } else {
          setMainCategories(
            (catData || []).map((mc) => ({
              id: String(mc.id),
              name: String(mc.name),
              imageUrl: String(mc.image_url || mc.imageUrl || ""),
              sortOrder: Number(mc.sort_order || mc.sortOrder || 0),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) setCatError(err?.message || "Failed to load");
      } finally {
        if (!cancelled) setCatLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [slug, restaurant?.id]);

  const navigateToMenu = (mainCategoryId) => {
    setShowPicker(false);
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
        <main
          className="emptyState"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "24px",
          }}
        >
          <div className="emptyIcon" aria-label="Error icon" style={{ color: "#ff6b6b" }}>
            <AlertCircle size={60} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginTop: "24px" }}>Unable to load restaurant</h2>
          <p className="muted" style={{ maxWidth: "280px", margin: "12px auto" }}>
            {storeError}
          </p>
          <div style={{ marginTop: "16px" }}>
            <button className="btn primary" onClick={() => loadMenu(slug)}>
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="landingPage">
      <div className="landingVideoWrap">
        {backgroundVideo && !videoError ? (
          <video
            className="landingVideo"
            autoPlay
            muted
            loop
            playsInline
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%230a0a0a'/%3E%3C/svg%3E"
            onError={() => setVideoError(true)}
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          <div className="landingVideoFallback" />
        )}
        <div className="landingOverlay" />
      </div>

      <header className={`landingHeader ${pageLoaded ? "visible" : ""}`}>
        <div className="landingBrand">
          <span className="landingBrandName">{displayName || "Restaurant"}</span>
          <span className="landingBrandSubtitle">Premium Dining</span>
        </div>
        <HamburgerMenu slug={slug} />
      </header>

      <main className="landingContent">
        <div className={`landingCtaWrap ${pageLoaded ? "visible" : ""}`}>
          <div className="landingCtaGlow" />
          <button className="landingCtaBtn" onClick={() => setShowPicker(true)}>
            <ChefHat size={22} strokeWidth={2} />
            <span>View Menu</span>
          </button>
        </div>
      </main>

      {showPicker && (
        <div className="landingPickerOverlay" onClick={() => setShowPicker(false)}>
          <div className="landingPicker" onClick={(e) => e.stopPropagation()}>
            <button
              className="landingPickerClose"
              onClick={() => setShowPicker(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="landingPickerHeader">
              <UtensilsCrossed size={22} strokeWidth={1.8} />
              <h3>What are you in the mood for?</h3>
            </div>

            {catLoading && (
              <div className="landingPickerLoad">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="landingPickerSkeleton" />
                ))}
              </div>
            )}

            {catError && (
              <div className="landingPickerError">
                <p>Could not load categories</p>
                <button className="btn primary" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}

            {!catLoading && !catError && (
              <>
                <div className="landingPickerGrid">
                  {mainCategories.map((mc) => (
                    <button
                      key={mc.id}
                      className="landingPickerItem"
                      onClick={() => navigateToMenu(mc.id)}
                    >
                      {mc.imageUrl && (
                        <div className="landingPickerItemImgWrap">
                          <img
                            src={mc.imageUrl}
                            alt={mc.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <span>{mc.name}</span>
                    </button>
                  ))}
                </div>
                <div className="landingPickerFooter">
                  <button
                    className="landingPickerAllBtn"
                    onClick={() => navigateToMenu("")}
                  >
                    View Full Menu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
