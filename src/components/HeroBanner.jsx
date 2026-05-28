import { useCallback, useEffect, useRef, useState } from "react";
import { useMenu } from "../hooks/useMenu";
import { FALLBACK_IMG } from "../utils/constants";

const HOLD_DURATION = 3500;
const SWIPE_THRESHOLD = 50;
const DRAG_THRESHOLD = 10;
const SCROLL_THRESHOLD = 15;

export function HeroBanner() {
  const { featuredItems } = useMenu();
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const hasDragged = useRef(false);
  const isScrolling = useRef(false);
  const scrollTimerRef = useRef(null);

  const items = featuredItems.length > 0 ? featuredItems : [];
  const itemCount = items.length;

  const goToSlide = useCallback(
    (index, resetTimer = true) => {
      if (isTransitioning || index === currentIndex) return;

      if (resetTimer) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => goToSlide((currentIndex + 1) % itemCount, false), HOLD_DURATION);
      }

      setIsTransitioning(true);
      setCurrentIndex(index);

      setTimeout(() => setIsTransitioning(false), 600);
    },
    [currentIndex, itemCount, isTransitioning]
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % itemCount);
  }, [currentIndex, itemCount, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentIndex - 1 + itemCount) % itemCount);
  }, [currentIndex, itemCount, goToSlide]);

  useEffect(() => {
    if (itemCount === 0) return;
    timerRef.current = setInterval(nextSlide, HOLD_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [itemCount, nextSlide]);

  const handleSlideClick = useCallback(
    (redirectUrl) => {
      if (hasDragged.current || isScrolling.current) {
        hasDragged.current = false;
        isScrolling.current = false;
        return;
      }
      if (!redirectUrl) return;

      const selector = redirectUrl.startsWith("#") ? redirectUrl.substring(1) : redirectUrl;
      const el = document.getElementById(selector);

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    []
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    hasDragged.current = false;
  };

  const handleTouchMove = (e) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (Math.abs(deltaX) > DRAG_THRESHOLD && deltaX > deltaY) {
      hasDragged.current = true;
    }
    if (Math.abs(deltaY) > DRAG_THRESHOLD && deltaY > deltaX) {
      isScrolling.current = true;
    }
  };

  const handleTouchEnd = (e, redirectUrl) => {
    if (hasDragged.current) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
        hasDragged.current = false;
        isScrolling.current = false;
        return;
      }
    }
    if (!isScrolling.current) {
      handleSlideClick(redirectUrl);
    }
    hasDragged.current = false;
    isScrolling.current = false;
  };

  const handleMouseEnter = () => {
  };

  const handleMouseDown = () => {
    hasDragged.current = false;
    isScrolling.current = false;
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
  };

  const handleMouseUp = () => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  };

  const handleScroll = () => {
    isScrolling.current = true;
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = setTimeout(() => {
      isScrolling.current = false;
    }, 200);
  };

  if (itemCount === 0) return null;

  return (
    <div className="featuredSection">
      <div
        ref={containerRef}
        className="featuredCarousel"
        onMouseEnter={handleMouseEnter}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onScroll={handleScroll}
      >
        {items.map((item, i) => {
          const hasImage = item.imageUrl && item.imageUrl.trim() !== "";
          return (
            <div
              key={item.id}
              className={`featuredSlide ${i === currentIndex ? "active" : ""} ${i === (currentIndex - 1 + itemCount) % itemCount ? "leaving" : ""}`}
              onClick={() => handleSlideClick(item.redirectUrl)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, item.redirectUrl)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleSlideClick(item.redirectUrl)}
            >
              {hasImage ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="featuredImg"
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallback) {
                      e.currentTarget.dataset.fallback = "true";
                      e.currentTarget.src = FALLBACK_IMG;
                    }
                  }}
                />
              ) : (
                <div className="featuredImg placeholder" />
              )}
              <div className="featuredOverlay" />
              <div className="featuredPromo">
                <span className="featuredPromoBadge">Featured</span>
                <span className="featuredPromoTitle">Discover Our Specials</span>
                <span className="featuredPromoSub">Handpicked just for you</span>
              </div>
            </div>
          );
        })}
        <div className="featuredDots">
          {items.map((_, idx) => (
            <button
              key={idx}
              className={`featuredDot ${idx === currentIndex ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        {itemCount > 1 && (
          <>
            <button
              className="featuredArrow featuredArrow--prev"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous slide"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="featuredArrow featuredArrow--next"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next slide"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}