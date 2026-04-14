import { useEffect, useRef, useCallback } from "react";

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategorySlider({ categories, activeCategory, onCategoryClick }) {
  const isDragging = useRef(false);
  const scrollRafRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToActiveCategory = useCallback(() => {
    if (!activeCategory) return;
    const container = scrollContainerRef.current;
    const btn = document.getElementById(`cat-btn-${activeCategory}`);
    if (!container || !btn) return;

    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const targetLeft = btnRect.left - containerRect.left + (btnRect.width / 2) - (containerRect.width / 2);
    
    const doScroll = () => {
      const currentLeft = container.scrollLeft;
      const diff = targetLeft - currentLeft;
      
      if (Math.abs(diff) <= 2) return;
      
      const nextLeft = currentLeft + diff * 0.25;
      container.scrollLeft = nextLeft;
      
      const remaining = Math.abs(targetLeft - container.scrollLeft);
      if (remaining > 2) {
        scrollRafRef.current = requestAnimationFrame(doScroll);
      }
    };

    container.scrollLeft = targetLeft;
    requestAnimationFrame(doScroll);
  }, [activeCategory]);

  useEffect(() => {
    scrollToActiveCategory();
  }, [scrollToActiveCategory]);

  const handleTouchStart = () => {
    isDragging.current = false;
  };

  const handleTouchMove = () => {
    isDragging.current = true;
  };

  const handleTouchEnd = (name) => {
    if (!isDragging.current) {
      onCategoryClick(name);
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <nav aria-label="Menu categories">
      <div className="catScroll" ref={scrollContainerRef}>
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
