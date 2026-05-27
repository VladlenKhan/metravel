import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiStar } from "react-icons/fi";

const testimonials = [
  {
    id: 1,
    name: "Анна Ковалёва",
    location: "Москва",
    avatar: "https://i.pravatar.cc/150?img=32",
    rating: 5,
    text: "Отличная организация! Тур на Бали прошёл идеально.",
    tour: "Бали • 12 дней",
  },
  {
    id: 2,
    name: "Елена Морозова",
    location: "Санкт-Петербург",
    avatar: "https://i.pravatar.cc/150?img=44",
    rating: 5,
    text: "Поехали семьёй в Дубай. Всё было на высшем уровне.",
    tour: "Дубай • 8 дней",
  },
  {
    id: 3,
    name: "Дмитрий Соколов",
    location: "Екатеринбург",
    avatar: "https://i.pravatar.cc/150?img=65",
    rating: 5,
    text: "Авторский тур в Турцию — это приключение.",
    tour: "Анталья • 10 дней",
  },
  {
    id: 4,
    name: "Максим Петров",
    location: "Новосибирск",
    avatar: "https://i.pravatar.cc/150?img=12",
    rating: 5,
    text: "Мальдивы сбылись благодаря MeTravel.",
    tour: "Мальдивы • 9 дней",
  },
  {
    id: 5,
    name: "Олег Смирнов",
    location: "Казань",
    avatar: "https://i.pravatar.cc/150?img=67",
    rating: 4,
    text: "Тур в ОАЭ прошёл без проблем.",
    tour: "Дубай • 7 дней",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const total = testimonials.length;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [total]);

  const prev = () => setCurrentIndex((prev) => (prev - 1 + total) % total);
  const next = () => setCurrentIndex((prev) => (prev + 1) % total);
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const cardWidth = isMobile ? Math.min(320, viewportWidth - 56) : isTablet ? 400 : 360;
  const sideOffset = isMobile ? viewportWidth : isTablet ? 220 : 260;
  const trackHeight = isMobile ? 340 : isTablet ? 360 : 420;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Что говорят наши путешественники
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Реальные отзывы тех, кто уже отдохнул с нами
          </p>
        </div>

        <div className="relative max-w-[900px] mx-auto overflow-hidden">
          <div
            className="relative flex items-center justify-center"
            style={{ height: `${trackHeight}px` }}
          >
            {testimonials.map((t, index) => {
              let position = index - currentIndex;

              if (position < -1) position += total;
              if (position > 1) position -= total;

              let translateX = 0;
              let scale = isMobile ? 0.96 : 0.8;
              let opacity = 0;
              let zIndex = 0;

              if (position === 0) {
                translateX = 0;
                scale = 1;
                opacity = 1;
                zIndex = 30;
              } else if (position === -1) {
                translateX = -sideOffset;
                scale = isMobile ? 0.96 : 0.9;
                opacity = isMobile ? 0 : 0.85;
                zIndex = 20;
              } else if (position === 1) {
                translateX = sideOffset;
                scale = isMobile ? 0.96 : 0.9;
                opacity = isMobile ? 0 : 0.85;
                zIndex = 20;
              }

              return (
                <div
                  key={t.id}
                  className="absolute transition-all duration-500 ease-out"
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    opacity,
                    zIndex,
                    width: `${cardWidth}px`,
                    pointerEvents: position === 0 ? "auto" : "none",
                  }}
                >
                  <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 border border-gray-100">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-14 h-14 rounded-full object-cover sm:w-16 sm:h-16"
                      />
                      <div>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
                          {t.name}
                        </p>
                        <p className="text-base sm:text-lg text-gray-500">
                          {t.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <FiStar
                          key={i}
                          className="text-amber-400 h-5 w-5"
                          fill="currentColor"
                        />
                      ))}
                    </div>

                    <p className="text-gray-700 text-lg sm:text-xl leading-8 mb-4 min-h-[96px] sm:min-h-[120px]">
                      «{t.text}»
                    </p>

                    <div className="text-sm sm:text-base text-gray-500 border-t pt-3">
                      {t.tour}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center items-center gap-4 sm:gap-8 mt-6 sm:mt-10">
          <button
            onClick={prev}
            className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border rounded-full hover:text-indigo-600 transition"
          >
            <FiChevronLeft size={22} />
          </button>

          <div className="flex gap-2 sm:gap-3">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-indigo-600 w-7 sm:w-8"
                    : "bg-gray-300 w-3"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border rounded-full hover:text-indigo-600 transition"
          >
            <FiChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}
