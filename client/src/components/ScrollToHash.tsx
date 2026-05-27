import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NAVBAR_OFFSET = 104;

export default function ScrollToHash() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const frameId = window.requestAnimationFrame(() => {
        const element = document.getElementById(hash.replace("#", ""));
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
          window.scrollTo({
            top: Math.max(0, top),
            left: 0,
            behavior: "smooth",
          });
        }
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [pathname, search, hash]);

  return null;
}
