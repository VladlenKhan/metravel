// src/components/Header.tsx
import { useState } from 'react';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { FaPlane } from 'react-icons/fa';   

 
interface NavLink {
  name: string;
  href: string;
  hasDropdown?: boolean;
}

const navLinks: NavLink[] = [
  { name: 'Главная', href: '#' },
  { name: 'Туры', href: '#tours', hasDropdown: true },
  { name: 'Страны', href: '#countries' },
  { name: 'О нас', href: '#about' },
  { name: 'Контакты', href: '#contacts' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <FaPlane className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                {/* Альтернатива Feather: <FiSend className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" /> */}
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" />
              </div>
              <span className="font-extrabold text-2xl md:text-3xl tracking-tight">
                <span className="text-indigo-700">Me</span>
                <span className="text-gray-900">Travel</span>
              </span>
            </a>

            {/* Desktop menu */}
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group">
                  <a
                    href={link.href}
                    className="text-gray-700 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1 py-2"
                  >
                    {link.name}
                    {link.hasDropdown && (
                      <FiChevronDown
                        size={16}
                        className="group-hover:rotate-180 transition-transform"
                      />
                    )}
                  </a>

                  {link.hasDropdown && (
                    <div className="absolute top-full left-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-3 min-w-[220px] text-sm">
                        <a href="#" className="block px-5 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          Горящие туры
                        </a>
                        <a href="#" className="block px-5 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          Экскурсионные
                        </a>
                        <a href="#" className="block px-5 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          Пляжный отдых
                        </a>
                        <a href="#" className="block px-5 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          Горнолыжные
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="tel:+74951234567"
                className="hidden lg:flex items-center gap-2 text-gray-700 hover:text-indigo-700 transition-colors"
              >
                <span className="font-medium">+7 (495) 123-45-67</span>
              </a>
              <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Подобрать тур
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              aria-label="Toggle menu"
            >
              {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-[500px] border-b' : 'max-h-0'
          }`}
        >
          <div className="px-5 py-6 space-y-5 bg-white/95 backdrop-blur-sm">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-lg font-medium text-gray-800 hover:text-indigo-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4">
              <button className="w-full py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                Подобрать тур
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 md:pt-0">
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6 md:mb-8">
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
    </>
  );
}