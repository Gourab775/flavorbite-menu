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
  const { loadMenu, restaurant, mainCategories, loading: storeLoading, error: storeError } = useMenuStore();

  const [backgroundVideo, setBackgroundVideo] = useState("");
  const [videoError, setVideoError] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);


  /* ── Dynamic viewport height — guarantees fullscreen on all devices ── */
  useEffect(() => {
    const updateVH = () => {
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    };
    updateVH();
    const evts = ["resize", "orientationchange"];
    evts.forEach((e) => window.addEventListener(e, updateVH));
    return () => evts.forEach((e) => window.removeEventListener(e, updateVH));
  }, []);

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

    const fetchVideo = async () => {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: lps } = await supabase
          .from("landing_page_settings")
          .select("background_video_url")
          .eq("restaurant_id", restaurant.id)
          .maybeSingle();

        if (!cancelled && lps?.background_video_url) {
          setBackgroundVideo(lps.background_video_url);
          setVideoError(false);
        } else if (!cancelled) {
          setVideoReady(true);
        }
      } catch {
        if (!cancelled) { setVideoError(true); setVideoReady(true); }
      }
    };

    fetchVideo();
    return () => { cancelled = true; };
  }, [slug, restaurant?.id]);

  const buildMenuUrl = (mainCategoryId) => {
    const params = new URLSearchParams();
    if (tableToken) params.set("table", tableToken);
    if (mainCategoryId) params.set("main_category_id", mainCategoryId);
    const qs = params.toString();
    return `/${slug}/menu${qs ? `?${qs}` : ""}`;
  };

  const navigateToMenu = () => {
    navigate(buildMenuUrl());
  };

  const showLoading = storeLoading && !restaurant?.id;
  const showError = storeError && !restaurant?.id;

  if (showLoading) {
    return (
      <div className="landingPage">
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
          <div className="emptyIcon" aria-label="Error icon" style={{ color: "var(--nonveg)" }}>
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
            onCanPlay={() => setVideoReady(true)}
            onError={() => { setVideoError(true); setVideoReady(true); }}
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          <div className="landingVideoFallback" />
        )}
      </div>

      <div className={`landingVideoLoader ${videoReady ? "ready" : ""}`} />
      <header className={`landingHeader ${pageLoaded ? "visible" : ""}`}>
        <div className="landingBrandGroup">
          {restaurant?.logo && (
            <img src={restaurant.logo} alt={displayName || "Restaurant"} className="landingLogo" />
          )}
          <div className="landingBrand">
            <span className="landingBrandName">{displayName || "Restaurant"}</span>
            <span className="landingBrandSubtitle">Premium Dining</span>
          </div>
        </div>
        <HamburgerMenu slug={slug} />
      </header>

      {restaurant?.logo && (
        <div className="landingCenterLogo">
          <img src={restaurant.logo} alt={displayName || "Restaurant"} />
        </div>
      )}

      <main className="landingContent">
        <div className={`landingCtaWrap ${pageLoaded ? "visible" : ""}`}>
          <div className="landingCtaGlow" />
          <button className="landingCtaBtn" onClick={navigateToMenu}>
            <span>{mainCategories.length > 0 ? mainCategories[0].name : "View Menu"}</span>
          </button>
        </div>
      </main>

    </div>
  );
}
