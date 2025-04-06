// Подключаемся как root user
db = db.getSiblingDB("admin");
db.auth("admin", "password");

// Переключаемся на нашу базу данных
db = db.getSiblingDB("translations");

// Создаем пользователя с правильными правами
db.createUser({
  user: "translator",
  pwd: "translator123",
  roles: [
    {
      role: "readWrite",
      db: "translations",
    },
    {
      role: "dbAdmin",
      db: "translations",
    },
  ],
});

// Создаем коллекцию для переводов
db.createCollection("translations");

// Вставляем запрошенный документ с заданным ObjectId
db.translations.insertOne({
  _id: ObjectId("67e7db17690769baf198cdc9"),
  locale: "ru",
  key: "common.button.submit",
  value: "Ебать тебя в сраку Саня",
  versions: [
    {
      userId: "translator-ui",
      timestamp: 1743860421714,
      tag: "ui-1743860421689",
      key: "common.button.submit",
      value: "Ебать тебя в сраку Саня",
    },
    {
      userId: "translator-ui",
      timestamp: 1743856089648,
      tag: "ui-1743856089618",
      key: "common.button.submit",
      value: "Получить",
    },
    {
      userId: "user123",
      timestamp: 1743248151135,
      tag: "v1.0",
      key: "common.button.submit",
      value: "Отправить",
    },
  ],
  tags: ["button", "form", "common"],
});

// Создаем индекс для быстрого поиска по key и locale
db.translations.createIndex({ key: 1, locale: 1 }, { unique: true });

print(
  "Database and collection initialized successfully with the requested data"
);
