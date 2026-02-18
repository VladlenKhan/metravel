// src/components/MainContent.tsx
import { useState } from 'react';
import { FiMapPin, FiClock, FiDollarSign, FiArrowRight } from 'react-icons/fi';
import { FaPlaneDeparture } from 'react-icons/fa';

const popularDestinations = [
  { id: 1, name: 'Бали, Индонезия', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', price: 'от 89 000 ₽', days: '10–14 дней' },
  { id: 2, name: 'Мальдивы', image: 'https://images.unsplash.com/photo-1514282401047-dab278ca7553?w=800', price: 'от 145 000 ₽', days: '7–12 дней' },
  { id: 3, name: 'Турция, Анталья', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', price: 'от 65 000 ₽', days: '7–10 дней' },
  { id: 4, name: 'ОАЭ, Дубай', image: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=800', price: 'от 78 000 ₽', days: '5–9 дней' },
];

const whyUs = [
  { icon: FiClock, title: 'Круглосуточная поддержка', desc: '24/7 на связи в чате, по телефону и WhatsApp' },
  { icon: FaPlaneDeparture, title: 'Проверенные отели', desc: 'Только те, где сами отдыхали и рекомендуем' },
  { icon: FiDollarSign, title: 'Лучшие цены', desc: 'Гарантия лучшей цены или вернём разницу' },
  { icon: FiMapPin, title: 'Авторские маршруты', desc: 'Не шаблонные туры, а настоящие приключения' },
];

export default function MainContent() {
  const [activeTab, setActiveTab] = useState<'beach' | 'excursion' | 'ski'>('beach');

  return (
    <main className="pt-8 pb-20 bg-gray-50">
      {/* Популярные направления */}
      <section id="tours" className="py-16 md:py-20">
        <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Популярные направления
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Самые востребованные туры на 2026 год
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {popularDestinations.map((dest) => (
              <div
                key={dest.id}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
              >
                <div className="aspect-[4/5] relative">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl md:text-2xl font-bold mb-1">{dest.name}</h3>
                    <p className="text-white/90 text-sm md:text-base">{dest.days}</p>
                    <p className="text-amber-300 font-bold mt-2 text-lg md:text-xl">{dest.price}</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-indigo-700 font-medium text-sm">
                  Горящий тур
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              Показать все направления <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* Почему выбирают нас */}
      <section id="about" className="py-16 md:py-20 bg-white">
        <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Почему выбирают MeTravel
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {whyUs.map((item, idx) => (
              <div key={idx} className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl">
                  <item.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Горящие туры */}
      <section id="countries" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Горящие предложения
            </h2>
          </div>

          <div className="flex justify-center gap-4 mb-10 flex-wrap">
            {['Пляжный отдых', 'Экскурсии', 'Горные туры'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab === 'Пляжный отдых' ? 'beach' : tab === 'Экскурсии' ? 'excursion' : 'ski')}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  (tab === 'Пляжный отдых' && activeTab === 'beach') ||
                  (tab === 'Экскурсии' && activeTab === 'excursion') ||
                  (tab === 'Горные туры' && activeTab === 'ski')
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-center py-12 text-gray-500">
            Карточки туров по выбранной категории (реализуйте по аналогии с popularDestinations)
          </div>
        </div>
      </section>

      {/* Форма подбора тура */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Подберём идеальный тур за 5 минут
            </h2>
            <p className="text-xl opacity-90">
              Оставьте заявку — менеджер свяжется с вами и предложит лучшие варианты
            </p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            <input
              type="text"
              placeholder="Куда хотите поехать?"
              className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition"
            />
            <input
              type="text"
              placeholder="Даты поездки"
              className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition"
            />
            <input
              type="text"
              placeholder="Количество человек"
              className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 transition"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              Подобрать тур
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}