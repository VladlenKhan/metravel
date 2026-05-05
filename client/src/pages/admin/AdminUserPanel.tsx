import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePlus,
  CalendarRange,
  CheckCircle2,
  ConciergeBell,
  CreditCard,
  ImagePlus,
  Link2,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  adminCreateUser,
  createTour,
  deleteUser,
  deleteTour,
  fetchTours,
  fetchUsers,
  type AdminUser,
  type Tour,
  type TourUpsertPayload,
  type UserRole,
  updateTour,
  updateUserRole,
  updateUserStatus,
} from "../../api/api";
import Footer from "../../components/Footer";
import ScrollToTop from "../../components/ScrollToTop";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useFrontOfficeStore } from "../../hooks/useFrontOfficeStore";
import {
  FIELD_LIMITS,
  sanitizeEmailInput,
  sanitizeIntegerInput,
  sanitizeMultilineTextInput,
  sanitizePassportInput,
  sanitizePersonNameInput,
  sanitizePhoneInput,
  sanitizeShortTextInput,
  sanitizeTitleInput,
  sanitizeUrlInput,
} from "../../lib/formSanitizers";
import { deleteLocalTourRelatedData, pruneLocalTourData } from "../../lib/frontOfficeStore";
import BookingsSection from "../../components/admin/BookingsSection";
import ClientsSection from "../../components/admin/ClientsSection";
import PaymentsSection from "../../components/admin/PaymentsSection";
import ServicesSection from "../../components/admin/ServicesSection";

type AdminSection =
  | "users"
  | "clients"
  | "bookings"
  | "payments"
  | "services"
  | "tours";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  passportNumber: string;
  role: UserRole;
  isActive: boolean;
};

type TourFormState = {
  id: string | null;
  title: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  basePrice: string;
  totalSeats: string;
  availableSeats: string;
  description: string;
  imageUrl: string;
};

type UserDirectoryView = "team" | "clients";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "Client", label: "Клиент" },
  { value: "Operator", label: "Менеджер" },
  { value: "Admin", label: "Админ" },
];

function createInitialUserForm(): UserFormState {
  return {
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    passportNumber: "",
    role: "Client",
    isActive: true,
  };
}

function createInitialTourForm(): TourFormState {
  return {
    id: null,
    title: "",
    country: "",
    city: "",
    startDate: "",
    endDate: "",
    basePrice: "",
    totalSeats: "",
    availableSeats: "",
    description: "",
    imageUrl: "",
  };
}

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

function sortUsers(users: AdminUser[]): AdminUser[] {
  const roleOrder: Record<UserRole, number> = {
    Admin: 0,
    Operator: 1,
    Client: 2,
  };

  return [...users].sort((left, right) => {
    const roleDelta = roleOrder[left.role] - roleOrder[right.role];
    if (roleDelta !== 0) {
      return roleDelta;
    }

    return left.fullName.localeCompare(right.fullName, "ru");
  });
}

function getUserHint(user: AdminUser): string {
  switch (user.role) {
    case "Admin":
      return "Полный доступ к сайту и каталогу.";
    case "Operator":
      return "Работает с турами и заявками.";
    case "Client":
    default:
      return user.clientId
        ? "Карточка клиента связана с аккаунтом."
        : "Карточка клиента еще не подключена.";
  }
}

function sortTours(tours: Tour[]): Tour[] {
  return [...tours].sort((left, right) => {
    const leftDate = new Date(left.startDate).getTime();
    const rightDate = new Date(right.startDate).getTime();

    if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) {
      return left.title.localeCompare(right.title, "ru");
    }

    return leftDate - rightDate;
  });
}

function toTourFormState(tour: Tour): TourFormState {
  return {
    id: tour.id,
    title: tour.title,
    country: tour.country,
    city: tour.city,
    startDate: tour.startDate,
    endDate: tour.endDate,
    basePrice: `${tour.basePrice}`,
    totalSeats: `${tour.totalSeats}`,
    availableSeats: `${tour.availableSeats}`,
    description: tour.description ?? "",
    imageUrl: tour.imageUrl ?? "",
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось обработать изображение."));
    };

    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatDate(value: string): string {
  if (!value) {
    return "Дата уточняется";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildTourPayload(form: TourFormState): TourUpsertPayload {
  const normalizedTitle = sanitizeTitleInput(form.title, FIELD_LIMITS.title).trim();
  const normalizedCountry = sanitizeShortTextInput(form.country, FIELD_LIMITS.location).trim();
  const normalizedCity = sanitizeShortTextInput(form.city, FIELD_LIMITS.location).trim();
  const normalizedDescription = sanitizeMultilineTextInput(
    form.description,
    FIELD_LIMITS.description
  ).trim();
  const normalizedImageUrl = sanitizeUrlInput(form.imageUrl).trim();
  const basePrice = Number(form.basePrice);
  const totalSeats = Number(form.totalSeats);
  const availableSeats = Number(form.availableSeats);

  if (!normalizedTitle || !normalizedCountry || !normalizedCity) {
    throw new Error("Заполните название, страну и город.");
  }

  if (!form.startDate || !form.endDate) {
    throw new Error("Укажите даты поездки.");
  }

  if (new Date(form.endDate).getTime() < new Date(form.startDate).getTime()) {
    throw new Error("Дата окончания не может быть раньше даты начала.");
  }

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error("Стоимость тура должна быть больше нуля.");
  }

  if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
    throw new Error("Количество мест должно быть положительным числом.");
  }

  if (!Number.isInteger(availableSeats) || availableSeats < 0) {
    throw new Error("Свободные места должны быть нулем или положительным числом.");
  }

  if (availableSeats > totalSeats) {
    throw new Error("Свободных мест не может быть больше, чем мест всего.");
  }

  return {
    title: normalizedTitle,
    country: normalizedCountry,
    city: normalizedCity,
    startDate: form.startDate,
    endDate: form.endDate,
    basePrice,
    totalSeats,
    availableSeats,
    description: normalizedDescription,
    imageUrl: normalizedImageUrl,
  };
}

export const AdminUsersPanel = () => {
  const session = useAuthSession();
  const { bookings, payments, services } = useFrontOfficeStore();
  const canManageUsers = session?.role === "Admin";
  const canManageClients = session?.role === "Admin" || session?.role === "Operator";
  const canManageBookings = session?.role === "Admin" || session?.role === "Operator";
  const canManagePayments = session?.role === "Admin" || session?.role === "Operator";
  const canManageServices = session?.role === "Admin";
  const canManageTours = session?.role === "Admin" || session?.role === "Operator";
  const canEditExistingTours = session?.role === "Admin";
  const [activeSection, setActiveSection] = useState<AdminSection>(
    session?.role === "Admin" ? "users" : "bookings"
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTours, setLoadingTours] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [toursError, setToursError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [userForm, setUserForm] = useState<UserFormState>(createInitialUserForm);
  const [tourForm, setTourForm] = useState<TourFormState>(createInitialTourForm);
  const [userDirectoryView, setUserDirectoryView] =
    useState<UserDirectoryView>("team");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isSavingTour, setIsSavingTour] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);
  const [isUploadingTourImage, setIsUploadingTourImage] = useState(false);
  const tourImageInputRef = useRef<HTMLInputElement | null>(null);

  const loadUsers = async () => {
    if (!canManageUsers) {
      setUsers([]);
      setUsersError("");
      setLoadingUsers(false);
      return;
    }

    setUsersError("");

    try {
      const data = await fetchUsers();
      setUsers(sortUsers(data));
    } catch (loadError) {
      setUsersError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить список пользователей."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTours = async () => {
    if (!canManageTours) {
      setTours([]);
      setToursError("");
      setLoadingTours(false);
      return;
    }

    setToursError("");

    try {
      const data = await fetchTours();
      pruneLocalTourData(data.map((tour) => tour.id));
      setTours(sortTours(data));
    } catch (loadError) {
      setToursError(
        loadError instanceof Error ? loadError.message : "Не удалось загрузить туры."
      );
    } finally {
      setLoadingTours(false);
    }
  };

  useEffect(() => {
    if (!canManageUsers && activeSection === "users") {
      setActiveSection("bookings");
    }

    if (!canManageClients && activeSection === "clients") {
      setActiveSection("bookings");
    }

    if (!canManageBookings && activeSection === "bookings") {
      setActiveSection("tours");
    }

    if (!canManagePayments && activeSection === "payments") {
      setActiveSection("tours");
    }

    if (!canManageServices && activeSection === "services") {
      setActiveSection("tours");
    }

    if (!canEditExistingTours && tourForm.id) {
      setTourForm(createInitialTourForm());
    }
  }, [
    activeSection,
    canEditExistingTours,
    canManageBookings,
    canManageClients,
    canManagePayments,
    canManageServices,
    canManageUsers,
    tourForm.id,
  ]);

  useEffect(() => {
    if (canManageUsers) {
      void loadUsers();
    } else {
      setUsers([]);
      setUsersError("");
      setLoadingUsers(false);
    }

    if (canManageTours) {
      void loadTours();
    } else {
      setTours([]);
      setToursError("");
      setLoadingTours(false);
    }
  }, [canManageTours, canManageUsers]);

  const teamUsers = useMemo(
    () => users.filter((user) => user.role === "Admin" || user.role === "Operator"),
    [users]
  );
  const clientUsers = useMemo(
    () => users.filter((user) => user.role === "Client"),
    [users]
  );
  const selectedUserDirectory = userDirectoryView === "team" ? teamUsers : clientUsers;
  const shouldScrollSelectedUserDirectory = selectedUserDirectory.length > 3;
  const shouldScrollTourCatalog = tours.length > 3;
  const selectedUserDirectoryMeta =
    userDirectoryView === "team"
      ? {
          title: "Команда",
          description: "Админы и менеджеры сайта и каталога.",
          emptyState: "В команде пока нет добавленных сотрудников.",
        }
      : {
          title: "Клиенты",
          description: "Пользователи сайта и их клиентские карточки.",
          emptyState: "Клиенты появятся здесь после первых регистраций.",
        };

  const stats = useMemo(
    () =>
      canManageUsers
        ? [
            {
              title: "Команда",
              value: teamUsers.length,
              description: "Админы и менеджеры",
            },
            {
              title: "Клиенты",
              value: clientUsers.length,
              description: "Путешественники с аккаунтом",
            },
            {
              title: "Заявки",
              value: bookings.length,
              description: "Всего в обработке и истории",
            },
            {
              title: "Услуги",
              value: services.length,
              description: "Добавлены в витрину туров",
            },
          ]
        : [
            {
              title: "Клиенты",
              value: clientUsers.length,
              description: "Карточки для сопровождения",
            },
            {
              title: "Заявки",
              value: bookings.length,
              description: "Новые и активные бронирования",
            },
            {
              title: "Оплаты",
              value: payments.length,
              description: "Создано по заявкам",
            },
            {
              title: "Туры",
              value: tours.length,
              description: "Доступны в каталоге",
            },
          ],
    [bookings.length, canManageUsers, clientUsers.length, payments.length, services.length, teamUsers.length, tours.length]
  );

  const renderUserCard = (user: AdminUser) => {
    const roleMeta = getRoleMeta(user.role);
    const isCurrentAdmin =
      session?.email.trim().toLowerCase() === user.email.trim().toLowerCase();
    const isPending = pendingUserId === user.id;
    const isDeleting = deletingUserId === user.id;

    return (
      <article
        key={user.id}
        className="mx-auto w-full max-w-[900px] rounded-[20px] border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4"
      >
        <div className="space-y-3 md:grid md:grid-cols-[minmax(0,1fr)_290px] md:gap-3 md:space-y-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="text-[1.3rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.45rem]">
                {user.fullName}
              </h3>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${roleMeta.badgeClassName}`}
              >
                {roleMeta.label}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  user.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {user.isActive ? "Активен" : "Отключен"}
              </span>
              {isCurrentAdmin ? (
                <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  Текущий аккаунт
                </span>
              ) : null}
            </div>

            <p className="mt-2.5 break-words text-[13px] text-slate-600">{user.email}</p>
            <div className="mt-2.5 rounded-xl bg-white px-3 py-2 text-[13px] leading-5 text-slate-500 ring-1 ring-slate-200">
              {getUserHint(user)}
            </div>
          </div>

          <div className="h-fit rounded-[18px] border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Доступ
            </div>

            <label className="mt-2.5 block text-[13px] text-slate-500">
              <span className="block pb-1">Роль пользователя</span>
              <select
                value={user.role}
                disabled={isPending || isCurrentAdmin}
                onChange={(event) =>
                  void handleRoleChange(user.id, event.target.value as UserRole)
                }
                className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-0 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {roleOptions.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={isPending || isCurrentAdmin || isDeleting}
              onClick={() => void handleStatusToggle(user)}
              className={`mt-2.5 h-[42px] w-full rounded-xl px-3 py-0 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                user.isActive
                  ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isPending
                ? "Сохраняем..."
                : user.isActive
                  ? "Отключить доступ"
                  : "Включить доступ"}
            </button>

            <button
              type="button"
              disabled={isCurrentAdmin || isPending || isDeleting}
              onClick={() => void handleUserDelete(user)}
              className="mt-2 h-[40px] w-full rounded-xl bg-rose-50 px-3 py-0 text-[13px] font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Удаляем..." : "Удалить пользователя"}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setIsCreatingUser(true);

    try {
      await adminCreateUser({
        fullName: sanitizePersonNameInput(userForm.fullName, FIELD_LIMITS.fullName).trim(),
        email: sanitizeEmailInput(userForm.email).trim(),
        password: userForm.password,
        phoneNumber: sanitizePhoneInput(userForm.phoneNumber).trim(),
        passportNumber: sanitizePassportInput(userForm.passportNumber).trim(),
        role: userForm.role,
        isActive: userForm.isActive,
      });

      await loadUsers();
      setUserForm(createInitialUserForm());
      setFeedback({
        type: "success",
        message: "Пользователь успешно добавлен в систему.",
      });
    } catch (creationError) {
      setFeedback({
        type: "error",
        message:
          creationError instanceof Error
            ? creationError.message
            : "Не удалось создать пользователя.",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setFeedback(null);
    setPendingUserId(userId);

    try {
      const updatedUser = await updateUserRole(userId, role);
      setUsers((currentUsers) =>
        sortUsers(
          currentUsers.map((user) => (user.id === userId ? updatedUser : user))
        )
      );
      setFeedback({
        type: "success",
        message: "Роль пользователя обновлена.",
      });
    } catch (updateError) {
      setFeedback({
        type: "error",
        message:
          updateError instanceof Error
            ? updateError.message
            : "Не удалось обновить роль пользователя.",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const handleStatusToggle = async (user: AdminUser) => {
    setFeedback(null);
    setPendingUserId(user.id);

    try {
      const updatedUser = await updateUserStatus(user.id, !user.isActive);
      setUsers((currentUsers) =>
        sortUsers(
          currentUsers.map((currentUser) =>
            currentUser.id === user.id ? updatedUser : currentUser
          )
        )
      );
      setFeedback({
        type: "success",
        message: updatedUser.isActive
          ? "Пользователь снова активен."
          : "Пользователь отключен.",
      });
    } catch (updateError) {
      setFeedback({
        type: "error",
        message:
          updateError instanceof Error
            ? updateError.message
            : "Не удалось изменить статус пользователя.",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const handleUserDelete = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Удалить пользователя «${user.fullName}» из системы?`
    );
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingUserId(user.id);

    try {
      await deleteUser(user.id);
      setUsers((currentUsers) =>
        sortUsers(currentUsers.filter((currentUser) => currentUser.id !== user.id))
      );
      setFeedback({
        type: "success",
        message: "Пользователь удален из системы.",
      });
    } catch (deleteError) {
      setFeedback({
        type: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Не удалось удалить пользователя.",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const resetTourForm = () => {
    setTourForm(createInitialTourForm());
    if (tourImageInputRef.current) {
      tourImageInputRef.current.value = "";
    }
  };

  const handleTourImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "Выберите файл изображения.",
      });
      event.target.value = "";
      return;
    }

    setFeedback(null);
    setIsUploadingTourImage(true);

    try {
      const imageUrl = await readFileAsDataUrl(selectedFile);
      setTourForm((current) => ({ ...current, imageUrl }));
    } catch (uploadError) {
      setFeedback({
        type: "error",
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Не удалось загрузить фотографию.",
      });
    } finally {
      setIsUploadingTourImage(false);
    }
  };

  const handleTourSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setIsSavingTour(true);

    try {
      const payload = buildTourPayload(tourForm);

      if (tourForm.id) {
        const updatedTour = await updateTour(tourForm.id, payload);
        setTours((currentTours) =>
          sortTours(
            currentTours.map((tour) => (tour.id === updatedTour.id ? updatedTour : tour))
          )
        );
        setFeedback({
          type: "success",
          message: "Тур успешно обновлен.",
        });
      } else {
        const createdTour = await createTour(payload);
        setTours((currentTours) => sortTours([createdTour, ...currentTours]));
        setFeedback({
          type: "success",
          message: "Новый тур добавлен в каталог.",
        });
      }

      resetTourForm();
    } catch (saveError) {
      setFeedback({
        type: "error",
        message:
          saveError instanceof Error
            ? saveError.message
            : "Не удалось сохранить тур.",
      });
    } finally {
      setIsSavingTour(false);
    }
  };

  const handleTourDelete = async (tour: Tour) => {
    const confirmed = window.confirm(`Удалить тур «${tour.title}»?`);
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingTourId(tour.id);

    try {
      await deleteTour(tour.id);
      deleteLocalTourRelatedData(tour.id);
      setTours((currentTours) =>
        sortTours(currentTours.filter((currentTour) => currentTour.id !== tour.id))
      );

      if (tourForm.id === tour.id) {
        resetTourForm();
      }

      setFeedback({
        type: "success",
        message: "Тур удален из каталога вместе со связанными заявками и оплатами.",
      });
    } catch (deleteError) {
      setFeedback({
        type: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Не удалось удалить тур.",
      });
    } finally {
      setDeletingTourId(null);
    }
  };

  return (
    <>
      <section className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_48%,#22c55e_100%)] px-8 py-12 text-white shadow-[0_24px_90px_rgba(15,23,42,0.24)]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
                  Админ-панель
                </p>
                <h1 className="text-4xl font-bold leading-tight md:text-6xl">
                  {canManageUsers
                    ? "Единая панель управления сайтом, клиентами и каталогом"
                    : "Рабочая панель менеджера по заявкам, клиентам и турам"}
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-white/80">
                  {canManageUsers
                    ? "Здесь собраны доступы сотрудников, база клиентов, заявки, оплаты, услуги и весь туристический каталог."
                    : "Здесь удобно сопровождать заявки, вести клиентов, отмечать оплаты и публиковать новые направления."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {stats.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm"
                  >
                    <div className="text-sm text-white/70">{item.title}</div>
                    <div className="mt-2 text-3xl font-semibold">{item.value}</div>
                    <div className="mt-1 text-sm text-white/70">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {canManageUsers ? (
              <button
                type="button"
                onClick={() => setActiveSection("users")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeSection === "users"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <Users size={18} />
                Пользователи
              </button>
            ) : null}

            {canManageClients ? (
              <button
                type="button"
                onClick={() => setActiveSection("clients")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeSection === "clients"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <UserRound size={18} />
                Клиенты
              </button>
            ) : null}

            {canManageBookings ? (
              <button
                type="button"
                onClick={() => setActiveSection("bookings")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeSection === "bookings"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 size={18} />
                Бронирования
              </button>
            ) : null}

            {canManagePayments ? (
              <button
                type="button"
                onClick={() => setActiveSection("payments")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeSection === "payments"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <CreditCard size={18} />
                Оплаты
              </button>
            ) : null}

            {canManageServices ? (
              <button
                type="button"
                onClick={() => setActiveSection("services")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeSection === "services"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <ConciergeBell size={18} />
                Услуги
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setActiveSection("tours")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeSection === "tours"
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              }`}
            >
              <CalendarRange size={18} />
              Туры
            </button>
          </div>

          {feedback ? (
            <div
              className={`mt-6 rounded-2xl px-5 py-4 text-sm ${
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {activeSection === "users" ? (
            <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.82fr_1.58fr]">
              <div className="h-fit rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm xl:sticky xl:top-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <BadgePlus size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Новый пользователь</h2>
                    <p className="text-sm text-slate-500">
                      Создайте аккаунт и сразу назначьте нужный уровень доступа.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateUser} className="mt-8 space-y-4">
                  <div>
                    <label className="text-sm text-slate-500">Имя и фамилия</label>
                    <input
                      type="text"
                      value={userForm.fullName}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          fullName: sanitizePersonNameInput(
                            event.target.value,
                            FIELD_LIMITS.fullName
                          ),
                        }))
                      }
                      placeholder="Иван Иванов"
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      required
                      minLength={2}
                      maxLength={FIELD_LIMITS.fullName}
                      autoComplete="name"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-500">Email</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(event) =>
                          setUserForm((current) => ({
                            ...current,
                            email: sanitizeEmailInput(event.target.value),
                          }))
                        }
                        placeholder="user@metravel.local"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        required
                        maxLength={FIELD_LIMITS.email}
                        inputMode="email"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Пароль</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, password: event.target.value }))
                        }
                        placeholder="Минимум 6 символов"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        required
                        minLength={6}
                        maxLength={FIELD_LIMITS.password}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-500">Телефон</label>
                      <input
                        type="tel"
                        value={userForm.phoneNumber}
                        onChange={(event) =>
                          setUserForm((current) => ({
                            ...current,
                            phoneNumber: sanitizePhoneInput(event.target.value),
                          }))
                        }
                        placeholder="+7 999 123-45-67"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        required
                        minLength={6}
                        maxLength={FIELD_LIMITS.phone}
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Паспортные данные</label>
                      <input
                        type="text"
                        value={userForm.passportNumber}
                        onChange={(event) =>
                          setUserForm((current) => ({
                            ...current,
                            passportNumber: sanitizePassportInput(event.target.value),
                          }))
                        }
                        placeholder="1234 567890"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        required
                        minLength={5}
                        maxLength={FIELD_LIMITS.passport}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <label className="text-sm text-slate-500">Роль</label>
                      <select
                        value={userForm.role}
                        onChange={(event) =>
                          setUserForm((current) => ({
                            ...current,
                            role: event.target.value as UserRole,
                          }))
                        }
                        className="mt-1 h-[50px] w-full rounded-2xl border border-slate-200 px-4 py-0 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        {roleOptions.map((roleOption) => (
                          <option key={roleOption.value} value={roleOption.value}>
                            {roleOption.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex h-[50px] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-0 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={userForm.isActive}
                        onChange={(event) =>
                          setUserForm((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                      />
                      Аккаунт активен
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
                  >
                    {isCreatingUser ? <RefreshCw size={18} className="animate-spin" /> : <UserCog size={18} />}
                    {isCreatingUser ? "Создаем аккаунт..." : "Добавить пользователя"}
                  </button>
                </form>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-2xl font-bold text-slate-900">Команда и клиенты</h2>
                    <p className="text-sm text-slate-500">
                      Выберите нужную группу сверху и просматривайте карточки без перегруза и лишней тесноты.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoadingUsers(true);
                      void loadUsers();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCw size={16} />
                    Обновить
                  </button>
                </div>

                {usersError ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {usersError}
                  </div>
                ) : loadingUsers ? (
                  <div className="mt-6 space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-32 animate-pulse rounded-[24px] bg-slate-100"
                      />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                    Пока нет пользователей для управления.
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setUserDirectoryView("team")}
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                          userDirectoryView === "team"
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span>Команда</span>
                        <span
                          className={`inline-flex min-w-7 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                            userDirectoryView === "team"
                              ? "bg-white/15 text-white"
                              : "bg-white text-slate-600"
                          }`}
                        >
                          {teamUsers.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserDirectoryView("clients")}
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                          userDirectoryView === "clients"
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span>Клиенты</span>
                        <span
                          className={`inline-flex min-w-7 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                            userDirectoryView === "clients"
                              ? "bg-white/15 text-white"
                              : "bg-white text-slate-600"
                          }`}
                        >
                          {clientUsers.length}
                        </span>
                      </button>
                    </div>

                    <section className="mt-4 flex min-h-0 flex-col rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {selectedUserDirectoryMeta.title}
                          </h3>
                          <p className="text-[13px] text-slate-500">
                            {selectedUserDirectoryMeta.description}
                          </p>
                        </div>
                        <span className="inline-flex w-fit rounded-full bg-white px-2.5 py-0.5 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200">
                          {selectedUserDirectory.length}
                        </span>
                      </div>

                      {selectedUserDirectory.length === 0 ? (
                        <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                          {selectedUserDirectoryMeta.emptyState}
                        </div>
                      ) : (
                        <div
                          className={`mt-4 min-h-0 flex-1 space-y-4 ${
                            shouldScrollSelectedUserDirectory
                              ? "max-h-[620px] overflow-y-auto pr-1"
                              : ""
                          }`}
                        >
                          {selectedUserDirectory.map((user) => renderUserCard(user))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </div>
          ) : activeSection === "clients" ? (
            <ClientsSection />
          ) : activeSection === "bookings" ? (
            <BookingsSection />
          ) : activeSection === "payments" ? (
            <PaymentsSection />
          ) : activeSection === "services" ? (
            <ServicesSection tours={tours} />
          ) : (
            <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {tourForm.id ? "Редактирование тура" : "Новый тур"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {canEditExistingTours
                        ? "Заполните основные данные, и направление сразу появится в каталоге."
                        : "Менеджер может публиковать новые направления в каталоге без доступа к управлению пользователями."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTourSave} className="mt-8 space-y-4">
                  <div>
                    <label className="text-sm text-slate-500">Название тура</label>
                    <input
                      type="text"
                      value={tourForm.title}
                      onChange={(event) =>
                        setTourForm((current) => ({
                          ...current,
                          title: sanitizeTitleInput(event.target.value, FIELD_LIMITS.title),
                        }))
                      }
                      placeholder="Istanbul City Break"
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                      maxLength={FIELD_LIMITS.title}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-500">Страна</label>
                      <input
                        type="text"
                        value={tourForm.country}
                        onChange={(event) =>
                          setTourForm((current) => ({
                            ...current,
                            country: sanitizeShortTextInput(
                              event.target.value,
                              FIELD_LIMITS.location
                            ),
                          }))
                        }
                        placeholder="Турция"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                        maxLength={FIELD_LIMITS.location}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Город</label>
                      <input
                        type="text"
                        value={tourForm.city}
                        onChange={(event) =>
                          setTourForm((current) => ({
                            ...current,
                            city: sanitizeShortTextInput(
                              event.target.value,
                              FIELD_LIMITS.location
                            ),
                          }))
                        }
                        placeholder="Стамбул"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                        maxLength={FIELD_LIMITS.location}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-500">Дата начала</label>
                      <input
                        type="date"
                        value={tourForm.startDate}
                        onChange={(event) =>
                          setTourForm((current) => ({ ...current, startDate: event.target.value }))
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Дата окончания</label>
                      <input
                        type="date"
                        value={tourForm.endDate}
                        onChange={(event) =>
                          setTourForm((current) => ({ ...current, endDate: event.target.value }))
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm text-slate-500">Фотография тура</label>
                      <button
                        type="button"
                        onClick={() => tourImageInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ImagePlus size={14} />
                        {isUploadingTourImage ? "Загружаем..." : "Загрузить фото"}
                      </button>
                    </div>

                    <input
                      ref={tourImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleTourImageUpload(event)}
                      className="hidden"
                    />

                    <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link2 size={16} />
                        Или вставьте ссылку на изображение
                      </div>
                      <input
                        type="url"
                        value={tourForm.imageUrl.startsWith("data:") ? "" : tourForm.imageUrl}
                        onChange={(event) =>
                          setTourForm((current) => ({
                            ...current,
                            imageUrl: sanitizeUrlInput(event.target.value),
                          }))
                        }
                        placeholder="https://example.com/tour-cover.jpg"
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        maxLength={FIELD_LIMITS.imageUrl}
                        inputMode="url"
                      />
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Если загрузите файл, он сохранится только во фронте и будет виден на этом устройстве.
                      </p>
                    </div>

                    {tourForm.imageUrl ? (
                      <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <img
                            src={tourForm.imageUrl}
                            alt="Предпросмотр тура"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setTourForm((current) => ({ ...current, imageUrl: "" }))
                            }
                            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950"
                            aria-label="Удалить фото"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-500">Стоимость</label>
                      <input
                        type="number"
                        min="1"
                        max={FIELD_LIMITS.price}
                        value={tourForm.basePrice}
                        onChange={(event) =>
                          setTourForm((current) => ({
                            ...current,
                            basePrice: sanitizeIntegerInput(event.target.value, {
                              min: 1,
                              max: FIELD_LIMITS.price,
                            }),
                          }))
                        }
                        placeholder="145000"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                        inputMode="numeric"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Мест всего</label>
                      <input
                        type="number"
                        min="1"
                        max={FIELD_LIMITS.seats}
                        value={tourForm.totalSeats}
                        onChange={(event) =>
                          setTourForm((current) => ({
                            ...current,
                            totalSeats: sanitizeIntegerInput(event.target.value, {
                              min: 1,
                              max: FIELD_LIMITS.seats,
                              maxDigits: 3,
                            }),
                          }))
                        }
                        placeholder="20"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                        inputMode="numeric"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Свободно сейчас</label>
                      <input
                        type="number"
                        min="0"
                        max={FIELD_LIMITS.seats}
                        value={tourForm.availableSeats}
                        onChange={(event) =>
                          setTourForm((current) => ({
                            ...current,
                            availableSeats: sanitizeIntegerInput(event.target.value, {
                              min: 0,
                              max: FIELD_LIMITS.seats,
                              maxDigits: 3,
                            }),
                          }))
                        }
                        placeholder="20"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                        inputMode="numeric"
                        step="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-500">Описание</label>
                    <textarea
                      value={tourForm.description}
                      onChange={(event) =>
                        setTourForm((current) => ({
                          ...current,
                          description: sanitizeMultilineTextInput(
                            event.target.value,
                            FIELD_LIMITS.description
                          ),
                        }))
                      }
                      rows={5}
                      placeholder="Кратко опишите впечатления, формат отдыха и атмосферу тура."
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      maxLength={FIELD_LIMITS.description}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSavingTour}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    >
                      {isSavingTour ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : tourForm.id ? (
                        <PencilLine size={18} />
                      ) : (
                        <BadgePlus size={18} />
                      )}
                      {isSavingTour
                        ? "Сохраняем..."
                        : canEditExistingTours && tourForm.id
                          ? "Сохранить изменения"
                          : "Добавить тур"}
                    </button>

                    {canEditExistingTours && tourForm.id ? (
                      <button
                        type="button"
                        onClick={resetTourForm}
                        className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Отменить
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Каталог туров</h2>
                    <p className="text-sm text-slate-500">
                      {canEditExistingTours
                        ? "Редактируйте карточки направлений и держите каталог в актуальном виде."
                        : "Здесь можно просматривать уже опубликованные направления и добавлять новые туры."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoadingTours(true);
                      void loadTours();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCw size={16} />
                    Обновить
                  </button>
                </div>

                {toursError ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {toursError}
                  </div>
                ) : loadingTours ? (
                  <div className="mt-6 space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-40 animate-pulse rounded-[24px] bg-slate-100"
                      />
                    ))}
                  </div>
                ) : tours.length === 0 ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                    Каталог пока пуст. Добавьте первый тур, чтобы он появился на сайте.
                  </div>
                ) : (
                  <div
                    className={`mt-6 space-y-4 ${
                      shouldScrollTourCatalog ? "max-h-[980px] overflow-y-auto pr-2" : ""
                    }`}
                  >
                    {tours.map((tour) => {
                      const isEditing = tourForm.id === tour.id;
                      const isDeleting = deletingTourId === tour.id;

                      return (
                        <article
                          key={tour.id}
                          className={`rounded-[24px] border p-5 transition ${
                            isEditing
                              ? "border-indigo-300 bg-indigo-50/60"
                              : "border-slate-200 bg-slate-50/80"
                          }`}
                        >
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-300 sm:w-44">
                                {tour.imageUrl ? (
                                  <img
                                    src={tour.imageUrl}
                                    alt={tour.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.42))]" />
                              </div>

                              <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-semibold text-slate-900">
                                  {tour.title}
                                </h3>
                                {isEditing ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                    <CheckCircle2 size={12} />
                                    В редакторе
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 text-sm text-slate-600">
                                {tour.country}, {tour.city}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                              </p>

                              <p className="mt-4 text-sm leading-6 text-slate-600">
                                {tour.description?.trim() ||
                                  "Описание пока не добавлено. Можно заполнить его в редакторе справа."}
                              </p>
                              </div>
                            </div>

                            {canEditExistingTours ? (
                              <div className="flex flex-wrap gap-2 xl:max-w-[220px] xl:justify-end">
                                <button
                                  type="button"
                                  onClick={() => setTourForm(toTourFormState(tour))}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <PencilLine size={16} />
                                  Изменить
                                </button>

                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => void handleTourDelete(tour)}
                                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 size={16} />
                                  {isDeleting ? "Удаляем..." : "Удалить"}
                                </button>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Стоимость
                              </div>
                              <div className="mt-2 text-lg font-semibold text-slate-900">
                                {formatPrice(tour.basePrice)} ₽
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Мест всего
                              </div>
                              <div className="mt-2 text-lg font-semibold text-slate-900">
                                {tour.totalSeats}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Свободно
                              </div>
                              <div className="mt-2 text-lg font-semibold text-slate-900">
                                {tour.availableSeats}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  );
};
