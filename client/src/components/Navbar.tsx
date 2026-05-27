import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LogOut, Shield, Ticket, UserCircle2 } from "lucide-react";
import { FiMenu, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthSession, type UserRole } from "../api/api";
import Logo from "../assets/images/metravel-logo.svg";
import { useAuthSession } from "../hooks/useAuthSession";
import { useFavoriteTours } from "../hooks/useFavoriteTours";

interface NavLink {
  name: string;
  to: string;
}

const navLinks: NavLink[] = [
  { name: "Главная", to: "/#main" },
  { name: "Туры", to: "/tours" },
  { name: "Страны", to: "/#countries" },
  { name: "О нас", to: "/about" },
  { name: "Контакты", to: "#contacts" },
];

function getRoleMeta(role: UserRole): { label: string; badgeClassName: string } {
  switch (role) {
    case "Admin":
      return {
        label: "Админ",
        badgeClassName: "bg-red-100 text-red-700 ring-1 ring-red-200",
      };
    case "Operator":
      return {
        label: "Менеджер",
        badgeClassName: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      };
    case "Client":
    default:
      return {
        label: "Клиент",
        badgeClassName: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
      };
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const session = useAuthSession();
  const { favoriteCount, isAvailable: favoritesAvailable } = useFavoriteTours();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const roleMeta = session ? getRoleMeta(session.role) : null;

  const handleLogout = () => {
    clearAuthSession();
    setIsOpen(false);
    setIsUserMenuOpen(false);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1170) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav className="fixed top-4 left-1/2 z-50 w-[95%] max-w-7xl -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md">
        <div className="px-6">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="logo" className="w-10" />
              <span className="logo text-2xl font-extrabold">
                <span className="text-indigo-700">Me</span>
                <span className="text-gray-900">Travel</span>
              </span>
            </Link>

            <div className="hidden min-[1170px]:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1 font-medium text-gray-700 transition-colors hover:text-indigo-700"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="hidden min-[1170px]:flex items-center gap-3">
              {session ? (
                <>
                  {favoritesAvailable ? (
                    <Link
                      to="/favorites"
                      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-rose-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                      aria-label="Желаемые туры"
                    >
                      <Heart size={20} fill={favoriteCount > 0 ? "currentColor" : "none"} />
                      {favoriteCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                          {favoriteCount}
                        </span>
                      ) : null}
                    </Link>
                  ) : null}

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((current) => !current)}
                      className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-1 text-left text-sm text-gray-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-semibold">{session.fullName}</div>
                        <span
                          className={`mt-0.5 inline-flex rounded-xl px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.1em] uppercase ${roleMeta?.badgeClassName ?? ""}`}
                        >
                          {roleMeta?.label}
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-slate-500 transition-transform ${
                          isUserMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isUserMenuOpen ? (
                      <div className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                        <div className="border-b border-slate-100 px-3 pb-3">
                          <div className="font-semibold text-slate-900">{session.fullName}</div>
                          <div className="mt-1 text-sm text-slate-500">{session.email}</div>
                        </div>

                        <div className="mt-3 space-y-1">
                          {session.role === "Client" ? (
                            <>
                              <Link
                                to="/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <UserCircle2 size={18} />
                                Профиль
                              </Link>
                              <Link
                                to="/bookings"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <Ticket size={18} />
                                Мои бронирования
                              </Link>
                            </>
                          ) : null}

                          {session.role === "Admin" || session.role === "Operator" ? (
                            <Link
                              to="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <Shield size={18} />
                              {session.role === "Operator" ? "Панель менеджера" : "Админ-панель"}
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-rose-600 transition hover:bg-rose-50"
                          >
                            <LogOut size={18} />
                            Выйти
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-full bg-indigo-600 px-5 py-2.5 text-white transition hover:bg-indigo-700"
                  >
                    Регистрация
                  </Link>

                  <Link
                    to="/login"
                    className="rounded-full bg-indigo-600 px-5 py-2.5 text-white transition hover:bg-indigo-700"
                  >
                    Вход
                  </Link>
                </>
              )}
            </div>

            <button
              className="min-[1170px]:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 min-[1170px]:hidden bg-slate-950/20 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <div
        className={`fixed inset-x-4 top-24 bottom-4 z-40 min-[1170px]:hidden rounded-[32px] border border-white/60 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-md transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="h-full overflow-y-auto overscroll-contain px-6 py-6">
          <div className="space-y-5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="block text-lg font-medium text-gray-800 hover:text-indigo-600"
              >
                {link.name}
              </Link>
            ))}

            <div className="flex flex-col gap-3 pt-4">
              {session ? (
                <>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    <div className="font-semibold">{session.fullName}</div>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${roleMeta?.badgeClassName ?? ""}`}
                    >
                      {roleMeta?.label}
                    </span>

                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-3">
                      {session.role === "Admin" || session.role === "Operator" ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-white"
                        >
                          <Shield size={16} />
                          {session.role === "Operator" ? "Панель менеджера" : "Админ-панель"}
                        </Link>
                      ) : null}

                      {session.role === "Client" ? (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-white"
                          >
                            <UserCircle2 size={18} />
                            Профиль
                          </Link>
                          <Link
                            to="/bookings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-white"
                          >
                            <Ticket size={18} />
                            Мои бронирования
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {favoritesAvailable ? (
                    <Link
                      to="/favorites"
                      onClick={() => setIsOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-center font-medium text-rose-600"
                    >
                      <Heart size={18} fill={favoriteCount > 0 ? "currentColor" : "none"} />
                      Желаемые туры
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl bg-indigo-900 py-3 text-center text-white"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl bg-indigo-900 py-3 text-center text-white"
                  >
                    Регистрация
                  </Link>

                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl bg-indigo-900 py-3 text-center text-white"
                  >
                    Вход
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
