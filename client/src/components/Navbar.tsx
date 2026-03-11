// src/components/Navbar.tsx
import { useState } from "react";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import Logo from "../assets/images/metravel-logo.svg";

interface NavLink {
  name: string;
  href: string;
  hasDropdown?: boolean;
}

const navLinks: NavLink[] = [
  { name: "Главная", href: "/#main" },
  { name: "Туры", href: "/#tours" },
  { name: "Страны", href: "/#countries" },
  { name: "О нас", href: "/#about" },
  { name: "Контакты", href: "#contacts" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.getElementById(href.substring(1));

      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }

      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-4 w-[95%] max-w-7xl left-1/2 -translate-x-1/2 z-50 bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={Logo} alt="logo" className="w-10" />
            <span className="font-extrabold text-2xl logo">
              <span className="text-indigo-700">Me</span>
              <span className="text-gray-900">Travel</span>
            </span>
          </a>

          {/* Desktop Menu ≥1170px */}
          <div className="hidden min-[1170px]:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-gray-700 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1" >
                {link.name}

                {link.hasDropdown && (
                  <FiChevronDown
                    size={16}
                    className="transition-transform"/>
                )}
              </a>
            ))}
          </div>

          {/* Desktop Buttons ≥1170px */}
          <div className="hidden min-[1170px]:flex items-center gap-3">
            <a
              href="#contacts"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition">
              Подобрать тур
            </a>

            <a
              href="/register"
              className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-700 text-white rounded-full transition">
              Регистрация
            </a>

            <a
              href="/login"
              className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-700 text-white rounded-full transition">
              Вход
            </a>
          </div>

          {/* Burger <1170px */}
          <button
            className="min-[1170px]:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu">
            {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`min-[1170px]:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px]" : "max-h-0"
          }`}>
        <div className="px-6 py-6 space-y-5">

          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="block text-lg font-medium text-gray-800 hover:text-indigo-600">
              {link.name}
            </a>
          ))}

          <div className="flex flex-col gap-3 pt-4">
            <a
              href="#contacts"
              className="w-full text-center py-3 bg-indigo-600 text-white rounded-xl">
              Подобрать тур
            </a>

            <a
              href="/register"
              className="w-full text-center py-3 bg-indigo-900 text-white rounded-xl">
              Регистрация
            </a>

            <a
              href="/login"
              className="w-full text-center py-3 bg-indigo-900 text-white rounded-xl">
              Вход
            </a>
          </div>

        </div>
      </div>
    </nav>
  );
}