import { useEffect, useRef } from "react";

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategorySlider({ categories, activeCategory, onCategoryClick }) {
  const isDragging = useRef(false);
  const isUserInteracting = useRef(false);
  const rafRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!activeCategory) return;
    if (activeCategory === lastActiveRef.current && isUserInteracting.current) return;
    lastActiveRef.current = activeCategory;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const container = document.querySelector('.catScroll');
    const btn = document.getElementById(`cat-btn-${activeCategory}`);
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    
    const targetLeft = btnRect.left - containerRect.left + (btnRect.width / 2) - (containerRect.width / 2);
    const startLeft = container.scrollLeft;
    
    if (Math.abs(targetLeft - startLeft) <= 4) return;

    const startTime = performance.now();
    const duration = 300;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLeft = startLeft + (targetLeft - startLeft) * easeProgress;
      container.scrollLeft = currentLeft;

      if (progress < 1) {
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
    isDragging.current = false;
    isUserInteracting.current = true;
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const handleTouchMove = () => {
    isDragging.current = true;
  };

  const handleTouchEnd = (name) => {
    if (!isDragging.current) {
      onCategoryClick(name);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
  };

  const handleMouseDown = () => {
    isUserInteracting.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const handleMouseUp = () => {
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
  };

  const handleMouseLeave = () => {
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
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
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(c.name)}
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
              <span className="catPillName">{c.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}