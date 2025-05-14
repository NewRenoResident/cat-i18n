// Подключаемся как root user
db = db.getSiblingDB("admin");
db.auth("admin", "password");

// Переключаемся на нашу базу данных
db = db.getSiblingDB("translations");

// --- Опционально: Удаляем старые данные для чистого старта ---
print("Dropping existing collections (if they exist)...");
db.translations.drop();
db.locales.drop();
db.users.drop(); // Удаляем старых пользователей, если нужно пересоздать
print("Collections dropped.");
// ----------------------------------------------------------

// Создаем пользователя с правильными правами
print("Creating 'translator' user...");
db.createUser({
  user: "translator",
  pwd: "translator123",
  roles: [
    {
      role: "readWrite",
      db: "translations",
    },
    {
      role: "dbAdmin", // dbAdmin нужен для createCollection и createIndex
      db: "translations",
    },
  ],
});
print("User 'translator' created.");

// Создаем коллекцию для локалей
print("Creating 'locales' collection...");
db.createCollection("locales");
print("'locales' collection created.");

// Генерируем ID для локалей
const ruLocaleId = ObjectId();
const enLocaleId = ObjectId();

// Вставляем документы для локалей
print("Inserting locale documents...");
db.locales.insertMany([
  {
    _id: ruLocaleId,
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
  },
  {
    _id: enLocaleId,
    code: "en",
    name: "English",
    nativeName: "English",
  },
]);
print("Locale documents inserted.");

// Создаем коллекцию для переводов
print("Creating 'translations' collection...");
db.createCollection("translations");
print("'translations' collection created.");

// Базовая версия для начальной инициализации
const initialVersion = {
  userId: "init-script",
  timestamp: new Date().getTime(), // Используем текущее время для инициализации
  tag: "initial-v1.0",
  // key и value будут добавлены ниже
};

// Вставляем переводы для всех ключей из DemoApp
print("Inserting translation documents...");
db.translations.insertMany([
  // --- Header ---
  {
    locale: ruLocaleId,
    key: "header.logo.text",
    value: "ТрансФлоу Демо",
    versions: [
      { ...initialVersion, key: "header.logo.text", value: "ТрансФлоу Демо" },
    ],
    tags: ["header", "common"],
  },
  {
    locale: enLocaleId,
    key: "header.logo.text",
    value: "TransFlow Demo",
    versions: [
      { ...initialVersion, key: "header.logo.text", value: "TransFlow Demo" },
    ],
    tags: ["header", "common"],
  },

  // --- Welcome Section ---
  {
    locale: ruLocaleId,
    key: "welcome.title",
    value: "Добро пожаловать!",
    versions: [
      { ...initialVersion, key: "welcome.title", value: "Добро пожаловать!" },
    ],
    tags: ["welcome", "heading"],
  },
  {
    locale: enLocaleId,
    key: "welcome.title",
    value: "Welcome!",
    versions: [{ ...initialVersion, key: "welcome.title", value: "Welcome!" }],
    tags: ["welcome", "heading"],
  },
  {
    // Пример с переменными и компонентами
    locale: ruLocaleId,
    key: "welcome.message",
    value:
      "Здравствуйте, <bold>{name}</bold>! Для начала работы перейдите по <link>ссылке</link>.",
    versions: [
      {
        ...initialVersion,
        key: "welcome.message",
        value:
          "Здравствуйте, <bold>{name}</bold>! Для начала работы перейдите по <link>ссылке</link>.",
      },
    ],
    tags: ["welcome", "greeting"],
  },
  {
    locale: enLocaleId,
    key: "welcome.message",
    value:
      "Hello, <bold>{name}</bold>! Please follow the <link>link</link> to get started.",
    versions: [
      {
        ...initialVersion,
        key: "welcome.message",
        value:
          "Hello, <bold>{name}</bold>! Please follow the <link>link</link> to get started.",
      },
    ],
    tags: ["welcome", "greeting"],
  },
  {
    // Используем значение из примера пользователя как базовое
    locale: ruLocaleId,
    key: "common.button.submit",
    value: "Отправить",
    // Добавляем историю версий из примера пользователя + начальную
    versions: [
      {
        userId: "init-script",
        timestamp: initialVersion.timestamp,
        tag: "initial-v1.0",
        key: "common.button.submit",
        value: "Отправить",
      }, // Наша начальная
      {
        userId: "translator-ui",
        timestamp: 1743860421714,
        tag: "ui-1743860421689",
        key: "common.button.submit",
        value: "Привет2",
      },
      {
        userId: "translator-ui",
        timestamp: 1743856089648,
        tag: "ui-1743856089618",
        key: "common.button.submit",
        value: "Получить",
      },
      // { userId: "user123", timestamp: 1743248151135, tag: "v1.0", key: "common.button.submit", value: "Отправить" }, // Эта версия совпадает с начальной, можно не дублировать
    ].sort((a, b) => b.timestamp - a.timestamp), // Сортируем по убыванию времени
    tags: ["button", "form", "common"],
  },
  {
    locale: enLocaleId,
    key: "common.button.submit",
    value: "Submit",
    versions: [
      { ...initialVersion, key: "common.button.submit", value: "Submit" },
    ],
    tags: ["button", "form", "common"],
  },

  // --- Features Section ---
  {
    locale: ruLocaleId,
    key: "features.title",
    value: "Основные возможности",
    versions: [
      {
        ...initialVersion,
        key: "features.title",
        value: "Основные возможности",
      },
    ],
    tags: ["features", "heading"],
  },
  {
    locale: enLocaleId,
    key: "features.title",
    value: "Core Features",
    versions: [
      { ...initialVersion, key: "features.title", value: "Core Features" },
    ],
    tags: ["features", "heading"],
  },
  {
    locale: ruLocaleId,
    key: "features.card1.title",
    value: "Гибкая Интеграция",
    versions: [
      {
        ...initialVersion,
        key: "features.card1.title",
        value: "Гибкая Интеграция",
      },
    ],
    tags: ["features", "card", "title"],
  },
  {
    locale: enLocaleId,
    key: "features.card1.title",
    value: "Flexible Integration",
    versions: [
      {
        ...initialVersion,
        key: "features.card1.title",
        value: "Flexible Integration",
      },
    ],
    tags: ["features", "card", "title"],
  },
  {
    locale: ruLocaleId,
    key: "features.card1.description",
    value: "Легко встраивайте переводы в ваше приложение.",
    versions: [
      {
        ...initialVersion,
        key: "features.card1.description",
        value: "Легко встраивайте переводы в ваше приложение.",
      },
    ],
    tags: ["features", "card", "description"],
  },
  {
    locale: enLocaleId,
    key: "features.card1.description",
    value: "Easily integrate translations into your application.",
    versions: [
      {
        ...initialVersion,
        key: "features.card1.description",
        value: "Easily integrate translations into your application.",
      },
    ],
    tags: ["features", "card", "description"],
  },
  {
    locale: ruLocaleId,
    key: "features.card2.title",
    value: "Мгновенное Обновление",
    versions: [
      {
        ...initialVersion,
        key: "features.card2.title",
        value: "Мгновенное Обновление",
      },
    ],
    tags: ["features", "card", "title"],
  },
  {
    locale: enLocaleId,
    key: "features.card2.title",
    value: "Instant Updates",
    versions: [
      {
        ...initialVersion,
        key: "features.card2.title",
        value: "Instant Updates",
      },
    ],
    tags: ["features", "card", "title"],
  },
  {
    locale: ruLocaleId,
    key: "features.card2.description",
    value: "Переводы обновляются без перезагрузки страницы.",
    versions: [
      {
        ...initialVersion,
        key: "features.card2.description",
        value: "Переводы обновляются без перезагрузки страницы.",
      },
    ],
    tags: ["features", "card", "description"],
  },
  {
    locale: enLocaleId,
    key: "features.card2.description",
    value: "Translations update without page reload.",
    versions: [
      {
        ...initialVersion,
        key: "features.card2.description",
        value: "Translations update without page reload.",
      },
    ],
    tags: ["features", "card", "description"],
  },
  {
    locale: ruLocaleId,
    key: "features.card3.title",
    value: "Удобный Интерфейс",
    versions: [
      {
        ...initialVersion,
        key: "features.card3.title",
        value: "Удобный Интерфейс",
      },
    ],
    tags: ["features", "card", "title"],
  },
  {
    locale: enLocaleId,
    key: "features.card3.title",
    value: "User-Friendly UI",
    versions: [
      {
        ...initialVersion,
        key: "features.card3.title",
        value: "User-Friendly UI",
      },
    ],
    tags: ["features", "card", "title"],
  },
  {
    locale: ruLocaleId,
    key: "features.card3.description",
    value: "Интуитивно понятный интерфейс для переводчиков.",
    versions: [
      {
        ...initialVersion,
        key: "features.card3.description",
        value: "Интуитивно понятный интерфейс для переводчиков.",
      },
    ],
    tags: ["features", "card", "description"],
  },
  {
    locale: enLocaleId,
    key: "features.card3.description",
    value: "Intuitive interface for translators.",
    versions: [
      {
        ...initialVersion,
        key: "features.card3.description",
        value: "Intuitive interface for translators.",
      },
    ],
    tags: ["features", "card", "description"],
  },
  {
    locale: ruLocaleId,
    key: "common.learnMore",
    value: "Узнать больше",
    versions: [
      { ...initialVersion, key: "common.learnMore", value: "Узнать больше" },
    ],
    tags: ["button", "common", "link"],
  },
  {
    locale: enLocaleId,
    key: "common.learnMore",
    value: "Learn More",
    versions: [
      { ...initialVersion, key: "common.learnMore", value: "Learn More" },
    ],
    tags: ["button", "common", "link"],
  },

  // --- Notifications Section ---
  {
    // Пример с плюрализацией ICU
    locale: ruLocaleId,
    key: "notifications.unread",
    value:
      "<icon/>У вас <badge>{count, plural, one {# непрочитанное сообщение} few {# непрочитанных сообщения} many {# непрочитанных сообщений} other {# непрочитанных сообщения}}</badge>.",
    versions: [
      {
        ...initialVersion,
        key: "notifications.unread",
        value:
          "<icon/>У вас <badge>{count, plural, one {# непрочитанное сообщение} few {# непрочитанных сообщения} many {# непрочитанных сообщений} other {# непрочитанных сообщения}}</badge>.",
      },
    ],
    tags: ["notifications", "plural"],
  },
  {
    locale: enLocaleId,
    key: "notifications.unread",
    value:
      "<icon/>You have <badge>{count, plural, one {# unread message} other {# unread messages}}</badge>.",
    versions: [
      {
        ...initialVersion,
        key: "notifications.unread",
        value:
          "<icon/>You have <badge>{count, plural, one {# unread message} other {# unread messages}}</badge>.",
      },
    ],
    tags: ["notifications", "plural"],
  },

  // --- Footer ---
  {
    locale: ruLocaleId,
    key: "footer.copyright",
    value: "© {year} Ваша Компания. Все права защищены.",
    versions: [
      {
        ...initialVersion,
        key: "footer.copyright",
        value: "© {year} Ваша Компания. Все права защищены.",
      },
    ],
    tags: ["footer", "common", "legal"],
  },
  {
    locale: enLocaleId,
    key: "footer.copyright",
    value: "© {year} Your Company. All rights reserved.",
    versions: [
      {
        ...initialVersion,
        key: "footer.copyright",
        value: "© {year} Your Company. All rights reserved.",
      },
    ],
    tags: ["footer", "common", "legal"],
  },
  {
    locale: ruLocaleId,
    key: "footer.terms",
    value: "Условия использования",
    versions: [
      {
        ...initialVersion,
        key: "footer.terms",
        value: "Условия использования",
      },
    ],
    tags: ["footer", "link", "legal"],
  },
  {
    locale: enLocaleId,
    key: "footer.terms",
    value: "Terms of Service",
    versions: [
      { ...initialVersion, key: "footer.terms", value: "Terms of Service" },
    ],
    tags: ["footer", "link", "legal"],
  },
  {
    locale: ruLocaleId,
    key: "footer.privacy",
    value: "Политика конфиденциальности",
    versions: [
      {
        ...initialVersion,
        key: "footer.privacy",
        value: "Политика конфиденциальности",
      },
    ],
    tags: ["footer", "link", "legal"],
  },
  {
    locale: enLocaleId,
    key: "footer.privacy",
    value: "Privacy Policy",
    versions: [
      { ...initialVersion, key: "footer.privacy", value: "Privacy Policy" },
    ],
    tags: ["footer", "link", "legal"],
  },
  {
    locale: ruLocaleId,
    key: "footer.contact",
    value: "Связаться с нами",
    versions: [
      { ...initialVersion, key: "footer.contact", value: "Связаться с нами" },
    ],
    tags: ["footer", "link", "contact"],
  },
  {
    locale: enLocaleId,
    key: "footer.contact",
    value: "Contact Us",
    versions: [
      { ...initialVersion, key: "footer.contact", value: "Contact Us" },
    ],
    tags: ["footer", "link", "contact"],
  },
]);
print("Translation documents inserted.");

// Создаем уникальный индекс для ключа и локали
print("Creating unique index on 'translations' (key, locale)...");
db.translations.createIndex({ key: 1, locale: 1 }, { unique: true });
print("Index created.");

print(
  "\nDatabase 'translations' initialized successfully with default data for 'ru' and 'en' locales."
);
