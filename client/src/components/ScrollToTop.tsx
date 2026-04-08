// src/components/ScrollToTop.tsx
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';  

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Показываем кнопку после прокрутки на 300px вниз
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Вернуться наверх"
          className={`
            fixed bottom-6 right-6 z-50
            flex h-12 w-12 items-center justify-center
            rounded-full bg-amber-500 text-white
            shadow-lg hover:bg-amber-600 active:bg-amber-700
            transition-all duration-300 hover:scale-110
            focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-offset-2
          `}
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
}