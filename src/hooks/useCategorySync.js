import { useEffect, useRef, useCallback, useMemo } from "react";

const HEADER_OFFSET = 180;

export function useCategorySync(containerId, setActiveCategory) {
  const rafRef = useRef(null);
  const lastActiveRef = useRef(null);
  const sectionsCacheRef = useRef([]);

  const getSectionsWithOffset = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container) return [];

    const sections = container.querySelectorAll('.menuSection');
    if (sections.length === 0) return [];

    return Array.from(sections).map((section, index) => ({
      id: section.id,
      offsetTop: section.offsetTop,
      index
    }));
  }, [containerId]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const updateCategory = () => {
      const sections = getSectionsWithOffset();
      if (sections.length === 0) return;

      const currentScroll = container.scrollTop;
      const targetY = currentScroll + HEADER_OFFSET;

      let closestSection = sections[0];
      let closestDistance = Infinity;

      for (const section of sections) {
        const distance = Math.abs(section.offsetTop - targetY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      }

      if (closestSection && closestSection.id !== lastActiveRef.current) {
        lastActiveRef.current = closestSection.id;
        setActiveCategory(closestSection.id);
      }

      rafRef.current = null;
    };

    const handleScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateCategory);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    sectionsCacheRef.current = getSectionsWithOffset();
    
    setTimeout(() => {
      lastActiveRef.current = '__init__';
      updateCategory();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      sectionsCacheRef.current = getSectionsWithOffset();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerId, setActiveCategory, getSectionsWithOffset]);

  return {};
}