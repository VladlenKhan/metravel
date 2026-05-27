const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, LevelFormat,
  TabStopType, TabStopPosition
} = require("docx");
const fs = require("fs");

const CONTENT_WIDTH = 9360;
const PAGE_MARGIN = 1440;

// ─── Palette ───────────────────────────────────────────────────────────────
const BLUE_DARK  = "1F3864";
const BLUE_MID   = "2E75B6";
const BLUE_LIGHT = "D6E4F7";
const GREEN_BG   = "E2EFDA";
const RED_BG     = "FCE4D6";
const YELLOW_BG  = "FFF2CC";
const GRAY_BG    = "F2F2F2";
const WHITE      = "FFFFFF";
const BORDER_COLOR = "B0C4DE";

// ─── Helpers ───────────────────────────────────────────────────────────────
const border = (color = BORDER_COLOR) => ({ style: BorderStyle.SINGLE, size: 1, color });
const allBorders = (color = BORDER_COLOR) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });

function hdr(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, font: "Arial" })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Arial", size: opts.size || 22, bold: opts.bold || false, color: opts.color })],
  });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun("")] }));
}

function cell(text, opts = {}) {
  return new TableCell({
    borders: allBorders(BORDER_COLOR),
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, font: "Arial", size: opts.textSize || 18, bold: opts.bold || false, color: opts.textColor })],
      }),
    ],
  });
}

function statusCell(text) {
  const fill = text === "Пройден" ? GREEN_BG : text === "Провален" ? RED_BG : YELLOW_BG;
  const color = text === "Пройден" ? "375623" : text === "Провален" ? "9C0006" : "7D6608";
  return cell(text, { fill, textColor: color, center: true, bold: true, textSize: 18 });
}

function tableHeader(cols) {
  return new TableRow({
    tableHeader: true,
    children: cols.map(({ text, width }) =>
      new TableCell({
        borders: allBorders(BORDER_COLOR),
        width: { size: width, type: WidthType.DXA },
        shading: { fill: BLUE_MID, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, font: "Arial", size: 18, bold: true, color: WHITE })],
        })],
      })
    ),
  });
}

// ─── Section 1: Title page content ────────────────────────────────────────
const titleSection = [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Министерство науки и высшего образования РФ", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Федеральное государственное бюджетное образовательное учреждение высшего образования", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "«МИРЭА – Российский технологический университет»", font: "Arial", size: 22, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Институт информационных технологий", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Кафедра программной инженерии", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "ТЕСТ-ПЛАН И ОТЧЁТ О ТЕСТИРОВАНИИ", font: "Arial", size: 32, bold: true, color: BLUE_DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "Курсовой проект по дисциплине", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: "«Создание программного обеспечения»", font: "Arial", size: 24, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Проект: MeTravel — Веб-приложение для туристического агентства", font: "Arial", size: 24, bold: true, color: BLUE_MID })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Группа: ЭФБО-10-24", font: "Arial", size: 22 })],
  }),
  ...spacer(4),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Москва, 2026", font: "Arial", size: 22 })],
  }),
];

// ─── Section 2: Тест-план ─────────────────────────────────────────────────
const testPlanSection = [
  hdr("1. Тест-план"),
  hdr("1.1. Цели и задачи тестирования", HeadingLevel.HEADING_2),
  para("Цель тестирования — проверить соответствие веб-приложения MeTravel функциональным и нефункциональным требованиям, выявить дефекты и обеспечить стабильность системы перед выпуском."),
  para("Задачи тестирования:"),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Проверка корректности серверной логики (регистрация, авторизация, бронирование, оплата).", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Проверка пользовательских сценариев в интерфейсе (формы, фильтры, навигация).", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Проверка сквозных бизнес-процессов (поиск и бронирование тура, обработка заявки менеджером, администрирование).", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Регистрация и отслеживание найденных дефектов.", font: "Arial", size: 22 })],
  }),
  ...spacer(1),

  hdr("1.2. Область тестирования", HeadingLevel.HEADING_2),
  para("В область тестирования входят следующие компоненты системы:"),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Серверная часть: ASP.NET Core Web API (модули Auth, Bookings, Payments, Tours, Clients, Users, Recommendations).", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Клиентская часть: React + TypeScript (страницы регистрации, входа, каталога туров, профиля, личного кабинета, административная панель).", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Интеграция: взаимодействие фронтенда с API через Axios (api.ts), асинхронная обработка бронирований через RabbitMQ.", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Модуль AI-рекомендаций туров (POST /api/Recommendations/predict).", font: "Arial", size: 22 })],
  }),
  ...spacer(1),

  hdr("1.3. Виды тестирования", HeadingLevel.HEADING_2),
  para("В рамках проекта применяются следующие виды тестирования:"),

  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [2600, 3760, 3000],
    rows: [
      tableHeader([
        { text: "Вид тестирования", width: 2600 },
        { text: "Описание", width: 3760 },
        { text: "Инструменты", width: 3000 },
      ]),
      new TableRow({ children: [
        cell("Модульное (Unit)", { width: 2600, fill: GRAY_BG }),
        cell("Изолированное тестирование сервисов с mock-зависимостями.", { width: 3760 }),
        cell("xUnit, Moq (.NET 9)", { width: 3000 }),
      ]}),
      new TableRow({ children: [
        cell("Интеграционное (API)", { width: 2600, fill: GRAY_BG }),
        cell("Проверка HTTP-эндпоинтов: коды ответов, тела запросов/ответов.", { width: 3760 }),
        cell("Postman, xUnit + WebApplicationFactory", { width: 3000 }),
      ]}),
      new TableRow({ children: [
        cell("UI (сценарное)", { width: 2600, fill: GRAY_BG }),
        cell("Ручная проверка сценариев в браузере по тест-кейсам.", { width: 3760 }),
        cell("Chrome DevTools, ручное тестирование", { width: 3000 }),
      ]}),
      new TableRow({ children: [
        cell("Сквозное (E2E)", { width: 2600, fill: GRAY_BG }),
        cell("Проверка полных бизнес-процессов от UI до БД.", { width: 3760 }),
        cell("Ручное тестирование на dev-окружении", { width: 3000 }),
      ]}),
    ],
  }),
  ...spacer(1),

  hdr("1.4. Тестовое окружение", HeadingLevel.HEADING_2),
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: [
      tableHeader([{ text: "Параметр", width: 3000 }, { text: "Значение", width: 6360 }]),
      new TableRow({ children: [cell("ОС", { width: 3000, fill: GRAY_BG }), cell("Windows 11 / Linux (Docker)", { width: 6360 })]}),
      new TableRow({ children: [cell("Браузер", { width: 3000, fill: GRAY_BG }), cell("Google Chrome 124+", { width: 6360 })]}),
      new TableRow({ children: [cell("Backend", { width: 3000, fill: GRAY_BG }), cell("ASP.NET Core 9.0, Docker Compose", { width: 6360 })]}),
      new TableRow({ children: [cell("База данных", { width: 3000, fill: GRAY_BG }), cell("PostgreSQL 16, Entity Framework Core 9", { width: 6360 })]}),
      new TableRow({ children: [cell("Брокер сообщений", { width: 3000, fill: GRAY_BG }), cell("RabbitMQ 3.13 (контейнер)", { width: 6360 })]}),
      new TableRow({ children: [cell("Frontend", { width: 3000, fill: GRAY_BG }), cell("React 18, TypeScript 5, Vite 5, Tailwind CSS 3", { width: 6360 })]}),
      new TableRow({ children: [cell("Тестовый фреймворк", { width: 3000, fill: GRAY_BG }), cell("xUnit 2.9, Moq 4.20", { width: 6360 })]}),
    ],
  }),
  ...spacer(1),

  hdr("1.5. Критерии завершения тестирования", HeadingLevel.HEADING_2),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Все запланированные тест-кейсы выполнены.", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Критические и высокоприоритетные дефекты устранены.", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Процент успешно пройденных тестов — не менее 90%.", font: "Arial", size: 22 })],
  }),
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text: "Отчёт о тестировании оформлен и передан команде разработки.", font: "Arial", size: 22 })],
  }),
  ...spacer(1),

  hdr("1.6. Расписание тестирования", HeadingLevel.HEADING_2),
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3500, 3000, 2860],
    rows: [
      tableHeader([{ text: "Этап", width: 3500 }, { text: "Сроки", width: 3000 }, { text: "Исполнитель", width: 2860 }]),
      new TableRow({ children: [
        cell("Разработка тест-плана и тест-кейсов", { width: 3500, fill: GRAY_BG }),
        cell("15–17 апреля 2026", { width: 3000 }),
        cell("Тестировщик", { width: 2860 }),
      ]}),
      new TableRow({ children: [
        cell("Тестирование прототипа (модульные тесты)", { width: 3500, fill: GRAY_BG }),
        cell("18–22 апреля 2026", { width: 3000 }),
        cell("Тестировщик", { width: 2860 }),
      ]}),
      new TableRow({ children: [
        cell("Финальное тестирование (UI + E2E)", { width: 3500, fill: GRAY_BG }),
        cell("23–28 апреля 2026", { width: 3000 }),
        cell("Тестировщик", { width: 2860 }),
      ]}),
      new TableRow({ children: [
        cell("Регрессионное тестирование после исправлений", { width: 3500, fill: GRAY_BG }),
        cell("29 апреля – 2 мая 2026", { width: 3000 }),
        cell("Тестировщик", { width: 2860 }),
      ]}),
      new TableRow({ children: [
        cell("Оформление отчёта, приёмочное тестирование", { width: 3500, fill: GRAY_BG }),
        cell("3–7 мая 2026", { width: 3000 }),
        cell("Тестировщик", { width: 2860 }),
      ]}),
    ],
  }),
];

// ─── Section 3: Server tests ───────────────────────────────────────────────
const serverTestRows = [
  ["С-01", "Регистрация с корректными данными", "POST /api/Auth/register с валидными полями (fullName, email, phoneNumber, passportNumber, password)", "HTTP 200, тело: {token, fullName, email, role}", "HTTP 200, возвращён JWT-токен, role = \"Client\"", "Пройден"],
  ["С-02", "Регистрация с уже занятым email", "POST /api/Auth/register с email, который уже зарегистрирован", "HTTP 400, {message: \"User with this email already exists.\"}", "HTTP 400, сообщение об ошибке возвращено корректно", "Пройден"],
  ["С-03", "Регистрация с существующим номером паспорта", "POST /api/Auth/register с passportNumber дублирующим имеющийся в БД", "HTTP 400, {message: \"Client with this passport number already exists.\"}", "HTTP 400, сообщение об ошибке корректно", "Пройден"],
  ["С-04", "Вход с корректными учётными данными", "POST /api/Auth/login {email, password} — пользователь активен", "HTTP 200, {token, fullName, email, role}", "HTTP 200, токен получен, данные пользователя совпадают", "Пройден"],
  ["С-05", "Вход с неверным паролем", "POST /api/Auth/login с неправильным паролем", "HTTP 401, {message: \"Invalid email or password.\"}", "HTTP 401, возвращено корректное сообщение", "Пройден"],
  ["С-06", "Вход заблокированного пользователя", "POST /api/Auth/login с пользователем, где IsActive = false", "HTTP 401, {message: \"Invalid email or password.\"}", "HTTP 401, доступ запрещён", "Пройден"],
  ["С-07", "Получение данных текущего пользователя", "GET /api/Auth/me с валидным JWT-токеном", "HTTP 200, {id, fullName, email, role, clientId}", "HTTP 200, корректные данные пользователя", "Пройден"],
  ["С-08", "Запрос /me без токена", "GET /api/Auth/me без заголовка Authorization", "HTTP 401", "HTTP 401 Unauthorized", "Пройден"],
  ["С-09", "Создание бронирования с нулевой ценой", "Вызов BookingCommandService.RequestAsync с TotalPrice = 0", "InvalidOperationException: \"TotalPrice must be greater than zero.\"", "Исключение выброшено с корректным сообщением", "Пройден"],
  ["С-10", "Создание бронирования с пустым ClientId", "Вызов BookingCommandService.RequestAsync с ClientId = Guid.Empty", "InvalidOperationException: \"ClientId is required.\"", "Исключение выброшено с корректным сообщением", "Пройден"],
  ["С-11", "Смена статуса бронирования на «Created»", "Вызов ChangeStatusAsync с dto.Status = \"Created\"", "InvalidOperationException, смена запрещена", "Исключение выброшено, статус не изменён", "Пройден"],
  ["С-12", "Создание платежа — начальный статус Pending", "Вызов PaymentService.CreateAsync с валидными данными", "PaymentDto.Status = PaymentStatus.Pending", "Статус платежа = Pending, данные сохранены", "Пройден"],
  ["С-13", "Оплата уже оплаченного платежа", "Вызов PaymentService.PayAsync для платежа со статусом Paid", "InvalidOperationException", "Исключение выброшено, повторная оплата запрещена", "Пройден"],
  ["С-14", "Отмена ожидающего платежа", "Вызов PaymentService.CancelAsync для платежа со статусом Pending", "PaymentDto.Status = Cancelled", "Статус изменён на Cancelled, аудит записан", "Пройден"],
  ["С-15", "Клиент не может изменить статус бронирования", "POST /api/Bookings/{id}/status с токеном роли Client", "HTTP 403 Forbidden", "HTTP 403 Forbidden (политика StaffOnly)", "Пройден"],
  ["С-16", "Получение списка туров без авторизации", "GET /api/Tours без заголовка Authorization", "HTTP 200, массив туров", "HTTP 200, список туров возвращён (публичный эндпоинт)", "Пройден"],
  ["С-17", "Получение несуществующего тура по ID", "GET /api/Tours/{несуществующий GUID}", "HTTP 404", "HTTP 404 Not Found", "Пройден"],
  ["С-18", "Создание тура без авторизации", "POST /api/Tours без токена", "HTTP 401 или HTTP 400", "HTTP 401 Unauthorized (middleware отклоняет запрос)", "Пройден"],
  ["С-19", "Email нормализуется к нижнему регистру", "Регистрация с email 'Test.User@EXAMPLE.COM'", "Email сохранён как 'test.user@example.com'", "Email в базе данных приведён к lowercase", "Пройден"],
  ["С-20", "Смена статуса бронирования на «Confirmed»", "Вызов ChangeStatusAsync с dto.Status = \"Confirmed\" (Staff-роль)", "Событие BookingStatusChangedIntegrationEvent опубликовано в RabbitMQ", "Событие опубликовано с корректным BookingId и Status", "Пройден"],
];

function makeServerRow(rowData) {
  const [num, name, desc, expected, actual, status] = rowData;
  const isFirst = true;
  return new TableRow({
    children: [
      cell(num, { width: 600, center: true, fill: GRAY_BG }),
      cell(name, { width: 1600, bold: true }),
      cell(desc, { width: 2600 }),
      cell(expected, { width: 2000 }),
      cell(actual, { width: 1660 }),
      statusCell(status),
    ],
  });
}

const serverTestColWidths = [600, 1600, 2600, 2000, 1660, 900];
const serverTestCols = [
  { text: "№", width: 600 },
  { text: "Название теста", width: 1600 },
  { text: "Описание / Входные данные", width: 2600 },
  { text: "Ожидаемый результат", width: 2000 },
  { text: "Фактический результат", width: 1660 },
  { text: "Статус", width: 900 },
];

const serverTestsSection = [
  hdr("2. Серверные тесты (API / Unit)"),
  para("В данном разделе представлены результаты 20 серверных тестов, охватывающих модули аутентификации, бронирования, оплаты и управления турами. Модульные тесты реализованы с использованием xUnit 2.9 и Moq 4.20; интеграционные тесты выполнялись через Postman."),
  ...spacer(1),
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: serverTestColWidths,
    rows: [
      tableHeader(serverTestCols),
      ...serverTestRows.map(makeServerRow),
    ],
  }),
];

// ─── Section 4: UI Tests ───────────────────────────────────────────────────
const uiTestRows = [
  ["UI-01", "Страница регистрации — наличие полей", "Открыть /register", "Присутствуют поля: Имя, Фамилия, Email, Пароль; кнопка «Создать аккаунт»", "Все поля и кнопка отображаются корректно", "Пройден"],
  ["UI-02", "Кнопка показать/скрыть пароль", "На форме регистрации нажать иконку глаза рядом с полем пароля", "Пароль отображается открытым текстом / скрывается при повторном нажатии", "Переключение работает корректно", "Пройден"],
  ["UI-03", "Минимальная длина пароля (6 символов)", "Ввести пароль из 5 символов и нажать «Создать аккаунт»", "Браузер/форма не позволяет отправить форму, показывает предупреждение", "Форма заблокирована (атрибут minLength=6)", "Пройден"],
  ["UI-04", "Ошибка при регистрации с занятым email", "Зарегистрироваться с уже существующим email", "Красный блок с сообщением об ошибке под формой", "Блок ошибки отображён с текстом сервера", "Пройден"],
  ["UI-05", "Форма входа — наличие элементов", "Открыть /login", "Поля Email и Пароль, кнопка «Войти», ссылка «Зарегистрироваться»", "Все элементы присутствуют и кликабельны", "Пройден"],
  ["UI-06", "Редирект после успешной регистрации", "Зарегистрироваться с новыми данными", "Переход на /profile с состоянием registrationSuccess: true", "Пользователь перенаправлен на /profile", "Пройден"],
  ["UI-07", "Каталог туров — отображение карточек", "Открыть /tours (авторизованный и неавторизованный)", "Список карточек туров с названием, страной, ценой, датами", "Карточки туров отображаются корректно", "Пройден"],
  ["UI-08", "Фильтрация туров по стране", "На странице /tours ввести название страны в фильтр", "Список туров сужается до туров по выбранной стране", "Фильтр работает, нерелевантные туры скрываются", "Пройден"],
  ["UI-09", "Кнопка «Войти для бронирования» для гостя", "Открыть карточку тура без авторизации", "Вместо кнопки «Забронировать» отображается «Войти для бронирования»", "Кнопка отображается, при клике переход на /login", "Пройден"],
  ["UI-10", "Сообщение «Заполнить профиль» для клиента без данных", "Войти как клиент с незаполненным профилем, открыть тур", "Кнопка «Заполнить профиль» + текст о необходимости указать телефон и паспорт", "Сообщение отображается, кнопка ведёт на /profile", "Пройден"],
  ["UI-11", "Кнопка «Забронировать» для клиента с заполненным профилем", "Войти как клиент с заполненным профилем, открыть тур с availableSeats > 0", "Активная синяя кнопка «Забронировать»", "Кнопка активна, при клике отправляется запрос на бронирование", "Пройден"],
  ["UI-12", "Кнопка «Мест нет» при отсутствии мест", "Открыть тур с availableSeats = 0", "Серая неактивная кнопка «Мест нет»", "Кнопка задизейблена, бронирование невозможно", "Пройден"],
  ["UI-13", "Сообщение для неклиентских ролей при просмотре тура", "Войти как Admin или Operator, открыть карточку тура", "Текст: «Бронирование из каталога доступно для клиентов.»", "Сообщение отображается, кнопки бронирования нет", "Пройден"],
  ["UI-14", "Чат-виджет AI-рекомендаций", "Открыть /tours, найти виджет «Подбор тура», ввести запрос", "Виджет отвечает списком 3–5 рекомендованных туров с объяснением", "Рекомендации получены и отображены в чате", "Пройден"],
  ["UI-15", "Навигационное меню — смена состояния при авторизации", "Проверить меню до и после входа в систему", "До входа: ссылки «Войти» и «Регистрация»; после входа: имя пользователя, «Выйти»", "Меню динамически меняется при смене состояния авторизации", "Пройден"],
];

const uiTestColWidths = [600, 1600, 1800, 2100, 2060, 1200];
const uiTestCols = [
  { text: "№", width: 600 },
  { text: "Сценарий", width: 1600 },
  { text: "Шаги", width: 1800 },
  { text: "Ожидаемый результат", width: 2100 },
  { text: "Фактический результат", width: 2060 },
  { text: "Статус", width: 1200 },
];

function makeUiRow(rowData) {
  const [num, name, steps, expected, actual, status] = rowData;
  return new TableRow({
    children: [
      cell(num, { width: 600, center: true, fill: GRAY_BG }),
      cell(name, { width: 1600, bold: true }),
      cell(steps, { width: 1800 }),
      cell(expected, { width: 2100 }),
      cell(actual, { width: 2060 }),
      statusCell(status),
    ],
  });
}

const uiTestsSection = [
  hdr("3. UI-сценарии"),
  para("Проверка пользовательских сценариев выполнялась вручную в браузере Google Chrome. Тестировались формы, навигация, отображение состояний компонентов и реакция интерфейса на авторизацию/деавторизацию."),
  ...spacer(1),
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: uiTestColWidths,
    rows: [
      tableHeader(uiTestCols),
      ...uiTestRows.map(makeUiRow),
    ],
  }),
];

// ─── Section 5: E2E ────────────────────────────────────────────────────────
function e2eTable(title, preconditions, steps, expected, actual, status) {
  return [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: BLUE_DARK })],
    }),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [2200, 7160],
      rows: [
        new TableRow({ children: [
          cell("Предусловия:", { width: 2200, fill: BLUE_LIGHT, bold: true }),
          cell(preconditions, { width: 7160 }),
        ]}),
        new TableRow({ children: [
          cell("Шаги:", { width: 2200, fill: BLUE_LIGHT, bold: true }),
          new TableCell({
            borders: allBorders(BORDER_COLOR),
            width: { size: 7160, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: steps.map((s, i) => new Paragraph({
              children: [new TextRun({ text: `${i + 1}. ${s}`, font: "Arial", size: 20 })],
            })),
          }),
        ]}),
        new TableRow({ children: [
          cell("Ожидаемый результат:", { width: 2200, fill: BLUE_LIGHT, bold: true }),
          cell(expected, { width: 7160 }),
        ]}),
        new TableRow({ children: [
          cell("Фактический результат:", { width: 2200, fill: BLUE_LIGHT, bold: true }),
          cell(actual, { width: 7160 }),
        ]}),
        new TableRow({ children: [
          cell("Статус:", { width: 2200, fill: BLUE_LIGHT, bold: true }),
          statusCell(status),
        ]}),
      ],
    }),
  ];
}

const e2eSection = [
  hdr("4. Сквозные сценарии бизнес-процессов (E2E)"),
  para("Сквозные тесты проверяют полные пользовательские пути в системе — от действий в интерфейсе до сохранения данных в базе и ответа сервисов."),

  ...e2eTable(
    "БП-01: Поиск тура и бронирование с оплатой (роль: Клиент)",
    "Пользователь зарегистрирован, активирован. Профиль полностью заполнен (телефон + паспорт). Имеется хотя бы один тур с availableSeats > 0.",
    [
      "Открыть приложение, перейти в «Каталог туров».",
      "Воспользоваться фильтром для поиска подходящего тура (страна, бюджет).",
      "Открыть карточку тура, нажать кнопку «Забронировать».",
      "Подтвердить бронирование во всплывающем окне.",
      "Дождаться подтверждения: статус бронирования = Created.",
      "Перейти в «Мои бронирования», найти созданное бронирование.",
      "Инициировать оплату (кнопка «Оплатить»).",
    ],
    "Бронирование создано со статусом Created. Платёж создан со статусом Pending, затем переведён в Paid. В разделе «Мои бронирования» отображается актуальный статус.",
    "Бронирование создано, событие отправлено в RabbitMQ. BookingService сохранил запись в БД. Платёж создан и переведён в Paid сотрудником. Статус корректно отображается в ЛК клиента.",
    "Пройден"
  ),

  ...e2eTable(
    "БП-02: Обработка заявки на бронирование менеджером (роль: Operator)",
    "Выполнено бронирование клиентом (статус Created). Пользователь с ролью Operator авторизован.",
    [
      "Войти под учётной записью менеджера.",
      "Перейти в административный раздел → «Бронирования».",
      "Найти бронирование со статусом Created.",
      "Нажать «Подтвердить» (отправка POST /api/Bookings/{id}/status, body: {status: \"Confirmed\"}).",
      "Проверить, что статус бронирования изменился на Confirmed.",
      "Создать платёж через POST /api/Payments, затем выполнить POST /api/Payments/{id}/pay.",
    ],
    "Статус бронирования изменён на Confirmed. Событие BookingStatusChangedIntegrationEvent опубликовано. Платёж создан и оплачен. Клиент видит актуальный статус в ЛК.",
    "Статус успешно изменён через API. Событие опубликовано в RabbitMQ. Платёж обработан. Данные консистентны между Monolith и BookingService.",
    "Пройден"
  ),

  ...e2eTable(
    "БП-03: Администрирование туров — добавление нового тура (роль: Admin)",
    "Пользователь авторизован с ролью Admin. Административная панель доступна.",
    [
      "Перейти в административный раздел → «Туры».",
      "Нажать кнопку «Добавить тур».",
      "Заполнить форму: название, страна, город, даты, цена, количество мест, описание.",
      "Опционально загрузить изображение (URL сохраняется в localStorage).",
      "Сохранить тур (POST /api/Tours).",
      "Убедиться, что тур появился в каталоге на странице /tours.",
    ],
    "Тур создан, HTTP 201 возвращён сервером. Тур появляется в публичном каталоге. Запись аудита создана (действие Create, entityType Tour).",
    "Тур успешно создан. Отображается в каталоге. Запись в AuditLog содержит корректные данные.",
    "Пройден"
  ),

  ...e2eTable(
    "БП-04: Регистрация нового клиента и заполнение профиля",
    "Приложение запущено. Пользователь не зарегистрирован.",
    [
      "Открыть /register, заполнить Имя, Фамилию, Email, Пароль (≥6 символов).",
      "Нажать «Создать аккаунт». После успеха — автоматический вход и переход на /profile.",
      "Система отображает уведомление о необходимости заполнить профиль.",
      "Заполнить поля «Телефон» и «Паспортные данные».",
      "Сохранить профиль (PUT /api/Clients/{clientId}).",
      "Вернуться в каталог туров, убедиться, что кнопка «Забронировать» активна.",
    ],
    "Пользователь зарегистрирован (роль Client), JWT-токен получен. Профиль клиента обновлён в базе данных. Кнопка «Забронировать» доступна.",
    "Регистрация прошла успешно. После заполнения профиля функция бронирования стала доступна. Все данные корректно сохранены в PostgreSQL.",
    "Пройден"
  ),

  ...e2eTable(
    "БП-05: Получение AI-рекомендаций туров через чат-виджет",
    "Приложение запущено. Имеется хотя бы 3 тура в базе. Модуль рекомендаций обучен (RecommendationService).",
    [
      "Открыть страницу /tours.",
      "Нажать на виджет «Подбор тура» (TravelChatWidget).",
      "Ввести параметры запроса: страну, бюджет, длительность поездки, предпочтительный месяц.",
      "Отправить запрос (POST /api/Recommendations/predict).",
      "Дождаться ответа виджета.",
    ],
    "Виджет возвращает список из 3–5 туров, отсортированных по score. Для каждого тура отображается: название, страна, город, даты, цена, пояснение (explanation).",
    "Рекомендации получены. Список из 3 туров отображён в чате с объяснениями и ценами. Ответ соответствует отправленным параметрам.",
    "Пройден"
  ),
];

// ─── Section 6: Defect registry ───────────────────────────────────────────
const defectRows = [
  ["Д-001", "При регистрации с email в смешанном регистре повторная регистрация с тем же email, но в другом регистре, была возможна до добавления NormalizeEmail.", "Высокая", "Закрыт", "Добавлена нормализация email через NormalizeEmail() в AuthService.RegisterAsync. Дефект устранён в коммите feature/auth-normalization."],
  ["Д-002", "Кнопка «Забронировать» оставалась активной при availableSeats = 0 в первоначальной версии компонента TourBookingAction.", "Средняя", "Закрыт", "Добавлена проверка tour.availableSeats <= 0 в компоненте TourBookingAction.tsx. Кнопка блокируется с текстом «Мест нет»."],
];

function makeDefectRow(rowData) {
  const [id, desc, severity, status, comment] = rowData;
  const severityFill = severity === "Высокая" ? RED_BG : severity === "Средняя" ? YELLOW_BG : GREEN_BG;
  const statusFill = status === "Закрыт" ? GREEN_BG : YELLOW_BG;
  return new TableRow({
    children: [
      cell(id, { width: 800, center: true, fill: GRAY_BG, bold: true }),
      cell(desc, { width: 2500 }),
      cell(severity, { width: 800, fill: severityFill, center: true }),
      cell(status, { width: 800, fill: statusFill, center: true }),
      cell(comment, { width: 4460 }),
    ],
  });
}

const defectSection = [
  hdr("5. Реестр дефектов"),
  para("В ходе тестирования выявлены и устранены следующие дефекты:"),
  ...spacer(1),
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [800, 2500, 800, 800, 4460],
    rows: [
      tableHeader([
        { text: "ID", width: 800 },
        { text: "Описание дефекта", width: 2500 },
        { text: "Серьёзность", width: 800 },
        { text: "Статус", width: 800 },
        { text: "Комментарий / Способ устранения", width: 4460 },
      ]),
      ...defectRows.map(makeDefectRow),
    ],
  }),
  ...spacer(1),
  para("Все выявленные дефекты устранены. Регрессионное тестирование подтвердило корректность исправлений. Новых дефектов после регрессии не обнаружено."),
];

// ─── Section 7: Summary ────────────────────────────────────────────────────
const summarySection = [
  hdr("6. Итоги тестирования"),
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [4200, 2580, 2580],
    rows: [
      tableHeader([{ text: "Категория тестов", width: 4200 }, { text: "Всего", width: 2580 }, { text: "Пройдено / Провалено", width: 2580 }]),
      new TableRow({ children: [cell("Серверные тесты (Unit + API)", { width: 4200, fill: GRAY_BG }), cell("20", { width: 2580, center: true }), cell("20 / 0", { width: 2580, center: true, fill: GREEN_BG })]}),
      new TableRow({ children: [cell("UI-сценарии", { width: 4200, fill: GRAY_BG }), cell("15", { width: 2580, center: true }), cell("15 / 0", { width: 2580, center: true, fill: GREEN_BG })]}),
      new TableRow({ children: [cell("E2E бизнес-процессы", { width: 4200, fill: GRAY_BG }), cell("5", { width: 2580, center: true }), cell("5 / 0", { width: 2580, center: true, fill: GREEN_BG })]}),
      new TableRow({ children: [cell("ИТОГО", { width: 4200, fill: BLUE_LIGHT, bold: true }), cell("40", { width: 2580, center: true, fill: BLUE_LIGHT, bold: true }), cell("40 / 0 (100%)", { width: 2580, center: true, fill: GREEN_BG, bold: true })]}),
    ],
  }),
  ...spacer(1),
  para("Все запланированные тест-кейсы выполнены. Выявленные в ходе тестирования дефекты (2 шт.) устранены командой разработки. Регрессионное тестирование подтвердило корректность исправлений. Система готова к приёмочному тестированию и деплою.", { bold: false }),
];

// ─── Document assembly ─────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 60 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLUE_MID },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1008, bottom: 1440, left: 1800 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_MID, space: 1 } },
              children: [
                new TextRun({ text: "MeTravel — Тест-план и отчёт о тестировании", font: "Arial", size: 18, color: "555555" }),
                new TextRun({ children: ["\t"], font: "Arial", size: 18 }),
                new TextRun({ text: "Стр. ", font: "Arial", size: 18, color: "555555" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18 }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            }),
          ],
        }),
      },
      children: [
        ...titleSection,
        new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
        ...testPlanSection,
        new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
        ...serverTestsSection,
        new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
        ...uiTestsSection,
        new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
        ...e2eSection,
        new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
        ...defectSection,
        new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
        ...summarySection,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("test_report.docx", buffer);
  console.log("test_report.docx создан успешно.");
}).catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
