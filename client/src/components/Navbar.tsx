// src/components/Navbar.tsx
import { useState } from 'react';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi'; 
import Logo from '../assets/images/metravel-logo.svg'

interface NavLink {
  name: string;
  href: string;
  hasDropdown?: boolean;
}

const navLinks: NavLink[] = [
  { name: 'Главная', href: 'home#main' },
  { name: 'Туры', href: 'home#tours'},
  { name: 'Страны', href: 'home#countries' },
  { name: 'О нас', href: 'home#about' },
  { name: 'Контакты', href: '#contacts' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }

      setIsOpen(false);

      window.history.replaceState(null, '', href);
    }
  };

  return (
    <nav className="fixed top-4 w-[95%] max-w-7xl left-1/2 -translate-x-1/2  z-50 bg-white/60 rounded-2xl backdrop-blur-md border border-gray-200/60 shadow-sm">
      <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Logo */}
          <a href="/home" className="flex items-center gap-2.5 group">
            <div className="relative w-10">
              <img src={Logo} alt="logo" /> 
            </div>
            <span className="font-extrabold text-2xl md:text-3xl tracking-tight logo">
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
                  onClick={(e) => handleAnchorClick(e, link.href)}
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
              </div>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="home#contacts"  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Подобрать тур
            </a>
          </div>
            <div className="hidden lg:flex items-center gap-4">
            <a href="#"  className="px-6 py-2.5 bg-indigo-900 hover:bg-indigo-700 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Регистрация
            </a>
          </div>
            <div className="hidden lg:flex items-center gap-4">
            <a href="#"  className="px-6 py-2.5 bg-indigo-900 hover:bg-indigo-700 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Вход
            </a>
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
        className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] ' : 'max-h-0'
          }`}
      >
        <div className="px-5 py-6 space-y-5  ">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="block text-lg font-medium text-gray-800 hover:text-indigo-600 transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4">
            <a href="home#countries" className="w-full py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
              Подобрать тур
            </a>
          </div>
           <div className="pt-4">
            <a href="#" className="w-full py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
              Регистрация
            </a>
          </div>
           <div className="pt-4">
            <a href="#" className="w-full py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
              Вход
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}