import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  fetchClient,
  fetchCurrentUser,
  isClientProfileComplete,
  login,
  saveAuthSession,
} from "../api/api";
import { FIELD_LIMITS, sanitizeEmailInput } from "../lib/formSanitizers";

type LoginLocationState = {
  registrationSuccess?: boolean;
  email?: string;
};

export default function AuthLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (locationState?.email) {
      setEmail(locationState.email);
    }
  }, [locationState?.email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login({
        email: email.trim(),
        password,
      });

      saveAuthSession(session);

      if (session.role === "Client") {
        const currentUser = await fetchCurrentUser();
        if (currentUser.clientId) {
          const profile = await fetchClient(currentUser.clientId);
          if (!isClientProfileComplete(profile)) {
            navigate("/profile", {
              replace: true,
              state: {
                profileSetupRequired: true,
              },
            });
            return;
          }
        }
      }

      navigate(
        session.role === "Admin" || session.role === "Operator" ? "/admin" : "/tours",
        { replace: true }
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось выполнить вход. Попробуйте еще раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f8f3e8_0%,#f4f7fb_45%,#dfe9f5_100%)] px-6 py-28">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mb-6 text-center">
 
          <h1 className="text-3xl font-bold text-gray-800">С возвращением!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Войдите, чтобы продолжить планировать поездку и смотреть свои бронирования
          </p>
        </div>

        {locationState?.registrationSuccess ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Аккаунт создан. Теперь войдите в систему.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(sanitizeEmailInput(event.target.value))}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              maxLength={FIELD_LIMITS.email}
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Пароль</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                minLength={6}
                maxLength={FIELD_LIMITS.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 transition hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-amber-500 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Входим..." : "Войти"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Нет аккаунта?{" "}
            <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
