// src/components/Navbar.tsx
import { useState } from 'react';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { FaPlane } from 'react-icons/fa';

interface NavLink {
  name: string;
  href: string;
  hasDropdown?: boolean;
}

const navLinks: NavLink[] = [
  { name: 'Главная', href: '#main' },
  { name: 'Туры', href: '#tours', hasDropdown: true },
  { name: 'Страны', href: '#countries' },
  { name: 'О нас', href: '#about' },
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
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <FaPlane className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" />
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
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="block text-lg font-medium text-gray-800 hover:text-indigo-600 transition-colors"
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
  );
}