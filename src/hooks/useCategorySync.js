import { useEffect, useRef, useCallback } from "react";

const HEADER_OFFSET = 180;

export function useCategorySync(containerId, setActiveCategory) {
  const tickingRef = useRef(false);
  const lastActiveRef = useRef(null);
  const rafIdRef = useRef(null);

  const updateActiveCategory = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sections = container.querySelectorAll('.menuSection');
    if (sections.length === 0) return;

    const containerRect = container.getBoundingClientRect();
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

    tickingRef.current = false;
  }, [containerId, setActiveCategory]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(updateActiveCategory);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    requestAnimationFrame(updateActiveCategory);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [containerId, updateActiveCategory]);
}