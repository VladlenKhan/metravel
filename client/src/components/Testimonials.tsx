// src/components/Testimonials.tsx
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
  const total = testimonials.length;

  // autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [total]);

  const prev = () => setCurrentIndex((prev) => (prev - 1 + total) % total);
  const next = () => setCurrentIndex((prev) => (prev + 1) % total);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Что говорят наши путешественники
          </h2>
          <p className="text-xl text-gray-600">
            Реальные отзывы тех, кто уже отдохнул с нами
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-[900px] mx-auto overflow-hidden">
          <div className="relative h-[460px] flex items-center justify-center">
            
            {testimonials.map((t, index) => {
              // ✅ FIX позиционирования
              let position = index - currentIndex;

              if (position < -1) position += total;
              if (position > 1) position -= total;

              let translateX = 0;
              let scale = 0.8;
              let opacity = 0;
              let zIndex = 0;

              if (position === 0) {
                translateX = 0;
                scale = 1;
                opacity = 1;
                zIndex = 30;
              } else if (position === -1) {
                translateX = -260;
                scale = 0.9;
                opacity = 0.85;
                zIndex = 20;
              } else if (position === 1) {
                translateX = 260;
                scale = 0.9;
                opacity = 0.85;
                zIndex = 20;
              }

              return (
                <div
                  key={t.id}
                  className="absolute w-[360px] transition-all duration-500 ease-out"
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    opacity,
                    zIndex,
                  }}
                >
                  <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                    
                    {/* User */}
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-14 h-14 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t.location}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <FiStar
                          key={i}
                          className="text-amber-400"
                          fill="currentColor"
                        />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-gray-700 text-sm mb-4">
                      «{t.text}»
                    </p>

                    {/* Tour */}
                    <div className="text-xs text-gray-500 border-t pt-3">
                      {t.tour}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-8 mt-10">
          <button
            onClick={prev}
            className="w-12 h-12 flex items-center justify-center border rounded-full hover:text-indigo-600 transition"
          >
            <FiChevronLeft size={24} />
          </button>

          {/* ✅ Dots */}
          <div className="flex gap-3">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-indigo-600 w-8"
                    : "bg-gray-300 w-3"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-12 h-12 flex items-center justify-center border rounded-full hover:text-indigo-600 transition"
          >
            <FiChevronRight size={24} />
          </button>
        </div>

      </div>
    </section>
  );
}