// src/components/Hero.tsx
export default function Hero() {
  return (
    <section id="main" className="relative min-h-screen flex items-center pt-16 md:pt-0">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 via-purple-900/60 to-blue-900/70 mix-blend-multiply" />
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=90"
          alt="Горный пейзаж для путешествий"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl w-full">
        <div className="max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6 md:mb-8 mt-5 title">
            Путешествия,<br />
            <span className="text-amber-300">которые меняют</span><br />
            тебя навсегда
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 font-light mb-10 md:mb-14 max-w-2xl">
            Авторские туры • Горящие предложения • Индивидуальный подход
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <button className="px-8 py-5 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              Найти тур мечты
            </button>
            <button className="px-8 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-medium rounded-xl border border-white/30 transition-all duration-300">
              Посмотреть направления
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-8 md:gap-12 mt-12 md:mt-16 text-white/90">
            <div>
              <div className="text-3xl md:text-4xl font-bold">8 лет</div>
              <div className="text-sm md:text-base">на рынке</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">24 000+</div>
              <div className="text-sm md:text-base">счастливых туристов</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">97%</div>
              <div className="text-sm md:text-base">рекомендуют нас</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}