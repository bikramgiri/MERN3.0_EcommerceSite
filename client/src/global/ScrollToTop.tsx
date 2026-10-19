import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top when the route changes, or to the matching element
 * when the URL has a #hash (e.g. /#categories).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
