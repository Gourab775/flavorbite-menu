import { useEffect, useRef } from "react";

export function useCategorySync(containerId, setActiveCategory) {
  const tickingRef = useRef(false);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

const updateActiveCategory = () => {
      const sections = container.querySelectorAll('.menuSection');
      const headerOffset = 180;
      let closestId = '';
      let closestDistance = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - headerOffset);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = section.id;
        }
      });

      if (closestId && closestId !== lastActiveRef.current) {
        lastActiveRef.current = closestId;
        setActiveCategory(closestId);
      }

      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(updateActiveCategory);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    requestAnimationFrame(updateActiveCategory);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [containerId, setActiveCategory]);
}
