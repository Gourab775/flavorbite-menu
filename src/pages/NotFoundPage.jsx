import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import lottie from "lottie-web";
import errorAnimation from "../assets/animations/Error 404.json";
import { getStoredSlug } from "../utils/constants";

export function NotFoundPage() {
  const [, navigate] = useLocation();
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !animationRef.current) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: errorAnimation
      });
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  const goHome = () => {
    const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
    const storedSlug = getStoredSlug();
    if (storedSlug && storedTableId) {
      navigate(`/${storedSlug}/t/${storedTableId}`);
    } else if (storedSlug) {
      navigate(`/${storedSlug}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Error</h1>
      </header>
      <main className="errorPage">
        <div className="errorContent">
          <div className="errorAnimationWrap">
            <div ref={containerRef} className="errorAnimation" />
          </div>
          <h2 className="errorTitle">Page Not Found</h2>
          <p className="errorMessage">The page you're looking for doesn't exist or has been moved.</p>
          <button className="errorBtn" onClick={goHome}>
            Go Back Home
          </button>
        </div>
      </main>
    </div>
  );
}

