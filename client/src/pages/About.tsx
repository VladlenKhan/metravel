import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const features = [
  "каталог туров с актуальными ценами, датами и количеством мест",
  "личный кабинет клиента с бронированиями, оплатой и сохраненными направлениями",
  "рабочая панель менеджера и администратора для сопровождения заявок",
  "ИИ помощник для подбора тура в формате чата",
] as const;

const workflow = [
  "Пользователь выбирает тур в каталоге или через ИИ помощника.",
  "После бронирования заявка поступает в рабочую панель менеджера.",
  "Сотрудник подтверждает поездку, выставляет счет и сопровождает клиента.",
  "После оплаты и завершения тура история сохраняется в личном кабинете.",
] as const;

export default function About() {
  return (
    <>
      <section className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <div className="rounded-[28px] bg-white px-8 py-12 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">
              О нас
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              MeTravel — сервис для выбора, бронирования и сопровождения поездок
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
              Мы создаем удобную систему, в которой пользователь может спокойно выбрать
              направление, отправить заявку на бронирование, получить подтверждение и следить за
              статусом поездки в одном личном кабинете. Сервис объединяет каталог туров,
              бронирования, оплаты и рабочие инструменты сотрудников в единой логике.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tours"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Перейти в каталог
                <FiArrowRight />
              </Link>
              <Link
                to="#contacts"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Связаться с нами
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <section className="rounded-[24px] bg-white px-7 py-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Для кого создан сервис</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  Клиент использует MeTravel для просмотра каталога, сохранения интересных
                  направлений, бронирования тура и отслеживания своих заявок.
                </p>
                <p>
                  Менеджер работает с клиентскими карточками, подтверждает или отменяет заявки,
                  выставляет счета и ведет поездку до завершения.
                </p>
                <p>
                  Администратор управляет пользователями, ролями, каталогом туров, услугами и
                  ключевыми рабочими разделами системы.
                </p>
              </div>
            </section>

            <section className="rounded-[24px] bg-white px-7 py-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Что уже реализовано</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                {features.map((item) => (
                  <li key={item} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8 rounded-[24px] bg-white px-7 py-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Как работает MeTravel</h2>
            <div className="mt-6 space-y-4">
              {workflow.map((step, index) => (
                <div key={step} className="flex gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-0.5 text-sm leading-7 text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[24px] bg-white px-7 py-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Наша задача</h2>
            <p className="mt-5 text-sm leading-8 text-slate-600">
              Главная идея сервиса — сделать планирование поездки более понятным и спокойным.
              Пользователю не нужно разбираться в сложных шагах вручную: каталог, бронирования,
              статусы и оплаты уже встроены в единый понятный сценарий.
            </p>
          </section>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  );
}
