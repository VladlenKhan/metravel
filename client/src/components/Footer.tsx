import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import Logo from "../assets/images/metravel-logo-alt.svg";

const navigationLinks = [
  { label: "Главная", to: "/#main" },
  { label: "Туры", to: "/tours" },
  { label: "Страны", to: "/#countries" },
  { label: "О нас", to: "/about" }, 
] as const;

export default function Footer() {
  return (
    <footer id="contacts" className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.15fr_0.75fr_0.9fr]">
          <section>
            <div className="flex items-center gap-3">
              <img src={Logo} alt="MeTravel" className="h-12 w-12 shrink-0" />
              <div>
                <div className="logo text-3xl font-extrabold tracking-tight text-white">
                  <span className="text-indigo-300">Me</span>Travel
                </div>
                <p className="text-sm text-slate-400">
                  Туристический сервис для поиска и бронирования поездок
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
              MeTravel помогает выбрать направление, оставить заявку на бронирование и отслеживать
              статус поездки в одном удобном личном кабинете.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white">Навигация</h3>
            <nav className="mt-4 flex flex-col gap-3 text-sm">
              {navigationLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-slate-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white">Контакты</h3>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3 text-slate-400">
                <FiMapPin className="mt-0.5 shrink-0 text-indigo-300" />
                <span>
                  Москва, ул. Тверская, 12
                  <br />
                  офис 304
                </span>
              </div>

              <a
                href="tel:+74951234567"
                className="flex items-center gap-3 text-slate-400 transition hover:text-white"
              >
                <FiPhone className="shrink-0 text-indigo-300" />
                <span>+7 (495) 123-45-67</span>
              </a>

              <a
                href="mailto:info@metravel.ru"
                className="flex items-center gap-3 text-slate-400 transition hover:text-white"
              >
                <FiMail className="shrink-0 text-indigo-300" />
                <span>info@metravel.ru</span>
              </a>
            </div>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6">
          <div className="flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© 2023–{new Date().getFullYear()} MeTravel. Все права защищены.</p>
            <div className="flex flex-wrap gap-4">
              <span>Политика конфиденциальности</span>
              <span>Пользовательское соглашение</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
