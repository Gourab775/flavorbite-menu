import { useEffect, useRef, useCallback } from "react";

const HEADER_OFFSET = 180;

export function useCategorySync(containerId, setActiveCategory) {
  const rafRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const updateCategory = () => {
      const sections = container.querySelectorAll('.menuSection');
      if (sections.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      let closestId = '';
      let closestDistance = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        const distance = Math.abs(relativeTop - HEADER_OFFSET);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = section.id;
        }
      });

      if (closestId && closestId !== lastActiveRef.current) {
        lastActiveRef.current = closestId;
        setActiveCategory(closestId);
      }

      rafRef.current = null;
    };

    const handleScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateCategory);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    setTimeout(() => {
      lastActiveRef.current = '__init__';
      updateCategory();
    }, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerId, setActiveCategory]);

  const markScrolling = useCallback(() => {
  }, []);

  return { markScrolling };
}