import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { register, saveAuthSession } from "../api/api";
import {
  FIELD_LIMITS,
  sanitizeEmailInput,
  sanitizePersonNameInput,
} from "../lib/formSanitizers";

export default function AuthRegister() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    setIsSubmitting(true);

    try {
      const session = await register({
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        password,
      });

      saveAuthSession(session);
      navigate("/profile", {
        replace: true,
        state: {
          registrationSuccess: true,
        },
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось создать аккаунт. Попробуйте еще раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#eef6ff_0%,#f9f1e5_52%,#fff8ef_100%)] px-6 py-28">
      <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mb-6 text-center">

          <h1 className="text-3xl font-bold text-gray-800">Создайте аккаунт</h1>
          <p className="mt-1 text-sm text-gray-500">
            Укажите основные данные, а остальное можно будет добавить позже в личном кабинете
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-600">Имя</label>
            <input
              type="text"
              value={firstName}
              onChange={(event) =>
                setFirstName(sanitizePersonNameInput(event.target.value, FIELD_LIMITS.firstName))
              }
              placeholder="Иван"
              className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              maxLength={FIELD_LIMITS.firstName}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Фамилия</label>
            <input
              type="text"
              value={lastName}
              onChange={(event) =>
                setLastName(sanitizePersonNameInput(event.target.value, FIELD_LIMITS.lastName))
              }
              placeholder="Иванов"
              className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              maxLength={FIELD_LIMITS.lastName}
              autoComplete="family-name"
            />
          </div>

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
                placeholder="Придумайте пароль"
                className="w-full rounded-xl border px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                minLength={6}
                maxLength={FIELD_LIMITS.password}
                autoComplete="new-password"
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
            {isSubmitting ? "Создаем аккаунт..." : "Создать аккаунт"}
          </button>

          <p className="text-center text-xs text-gray-500">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
