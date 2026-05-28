import { useEffect, useRef } from "react";
import { toTitleCase } from "../utils/constants";

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategorySlider({ categories, activeCategory, onCategoryClick }) {
  const rafRef = useRef(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    if (!activeCategory || isInteractingRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const container = document.querySelector('.catScroll');
    const btn = document.getElementById(`cat-btn-${activeCategory}`);
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    
    const containerWidth = containerRect.width;
    const btnCenter = btnRect.left - containerRect.left + btnRect.width / 2;
    const targetLeft = btnCenter - containerWidth / 2;
    
    const maxScroll = container.scrollWidth - containerWidth;
    const clampedTarget = Math.max(0, Math.min(targetLeft, maxScroll));
    
    const startLeft = container.scrollLeft;
    
    if (Math.abs(clampedTarget - startLeft) <= 2) return;

    const startTime = performance.now();
    const duration = 180;

    const animate = (currentTime) => {
      if (isInteractingRef.current) return;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLeft = startLeft + (clampedTarget - startLeft) * easeProgress;
      container.scrollLeft = currentLeft;

      if (progress < 1 && !isInteractingRef.current) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activeCategory]);

  const handleTouchStart = () => {
    isInteractingRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const handleTouchEnd = (name, e) => {
    isInteractingRef.current = false;
    if (!e) {
      onCategoryClick(name);
    }
  };

  const handleMouseDown = () => {
    isInteractingRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 100);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 100);
  };

  if (!categories || categories.length === 0) return null;

  return (
    <nav aria-label="Menu categories">
      <div 
        className="catScroll"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {categories.map((c) => {
          const slug = slugify(c.name);
          const isActive = slug === activeCategory;
          return (
            <button
              key={c.id}
              id={`cat-btn-${slug}`}
              className={`catPill ${isActive ? "catPill--active" : ""}`}
              onClick={() => onCategoryClick(c.name)}
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(c.name, e)}
              role="tab"
              aria-selected={isActive}
              aria-label={`${c.name} category`}
            >
              <div className="catPillImg">
                {c.imageUrl && c.imageUrl.trim() !== "" ? (
                  <img
                    src={c.imageUrl}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="catPillImgPlaceholder" />
                )}
              </div>
              <span className="catPillName">{toTitleCase(c.name)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}