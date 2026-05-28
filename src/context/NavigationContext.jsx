import { createContext, useContext, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

const NavContext = createContext(null);

export function NavigationProvider({ children }) {
  const [location, navigate] = useLocation();
  const historyRef = useRef([]);
  const prevLocationRef = useRef(location);
  const isBackNavRef = useRef(false);

  useEffect(() => {
    if (isBackNavRef.current) {
      isBackNavRef.current = false;
      prevLocationRef.current = location;
      return;
    }

    const prev = prevLocationRef.current;
    if (location !== prev) {
      historyRef.current.push(prev);
      prevLocationRef.current = location;
    }
  }, [location]);

  const goBack = useCallback(() => {
    if (historyRef.current.length >= 1) {
      const prevPath = historyRef.current.pop();
      isBackNavRef.current = true;
      navigate(prevPath);
      return true;
    }
    return false;
  }, [navigate]);

  return (
    <NavContext.Provider value={goBack}>
      {children}
    </NavContext.Provider>
  );
}

export function useGoBack(fallback) {
  const goBack = useContext(NavContext);
  const [, navigate] = useLocation();

  return useCallback(() => {
    if (!goBack() && fallback) {
      navigate(fallback);
    }
  }, [goBack, fallback, navigate]);
}
