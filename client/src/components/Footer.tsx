// src/components/Footer.tsx
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import Logo from '../assets/images/metravel-logo-alt.svg';

export default function Footer() {
  return (
    <footer id="contacts"  className="bg-gray-900 text-gray-300">
      <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
        
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-10"> 
                <img src={Logo} alt="logo" /> 
              </div>
              <span className="logo font-extrabold text-3xl tracking-tight text-white">
                <span className="text-indigo-400">Me</span>Travel
              </span>
            </div>
            <p className="mb-6 leading-relaxed">
              Создаём незабываемые путешествия с 2023 года. Более 1000 довольных клиентов уже открыли мир вместе с нами.
            </p>
 
          </div>

          {/* Навигация */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-6">Навигация</h4>
            <ul className="space-y-3">
              <li><a href="/#main" className="hover:text-white transition-colors">Главная</a></li>
              <li><a href="/tours" className="hover:text-white transition-colors">Туры</a></li>
              <li><a href="/#countries" className="hover:text-white transition-colors">Страны</a></li>
              <li><a href="/#about" className="hover:text-white transition-colors">О компании</a></li> 
            </ul>
          </div>

          {/* Контакты */}
          <div >
            <h4 className="text-white text-lg font-semibold mb-6">Контакты</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-1 text-indigo-400" />
                <span>Москва, ул. Тверская 12, офис 304</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-indigo-400" />
                <a href="tel:+74951234567" className="hover:text-white transition-colors">+7 (495) 123-45-67</a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-indigo-400" />
                <a href="mailto:info@metravel.ru" className="hover:text-white transition-colors">info@metravel.ru</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 text-center text-sm">
          <p>© 2023–{new Date().getFullYear()} MeTravel. Все права защищены.</p>
          <p className="mt-2 text-gray-500">
            Политика конфиденциальности • Публичная оферта • Согласие на обработку персональных данных
          </p>
        </div>
      </div>
    </footer>
  );
}
