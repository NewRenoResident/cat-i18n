import express from "express";
import { ExpressAdapter } from "@cat-i18n/adapters";
import { MongoDBAdapter } from "@cat-i18n/thief-the-cat";
import { I18n } from "@cat-i18n/maine-coon";
import { LocaleDocument, TranslationMap } from "@cat-i18n/shared";

async function startServer() {
  try {
    // 1. Создаем MongoDB адаптер для хранения данных
    const storageAdapter = new MongoDBAdapter({
      uri: "mongodb://translator:translator123@localhost:27017/translations?authSource=translations",
      dbName: "translations",
      maxVersions: 15, // хранить до 15 версий каждого перевода
    });

    // 2. Инициализируем I18n с MongoDB адаптером
    const i18n = new I18n({
      storageProvider: storageAdapter,
      disableCache: false, // включаем кэширование для повышения производительности
    });

    // 3. Создаем Express приложение
    const app = express();

    // 4. Создаем Express адаптер для I18n
    const apiAdapter = new ExpressAdapter(i18n, {
      app, // используем существующий экземпляр Express
      basePath: "/api/translations", // базовый путь для API
      enableCors: true, // включаем CORS
    });

    // 5. Инициализируем API адаптер и настраиваем маршруты
    await apiAdapter.init();

    // 6. Настраиваем дополнительные маршруты приложения
    app.get("/", (req, res) => {
      res.send("I18n API Server is running");
    });

    // 7. Запускаем сервер
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    // 8. Добавляем обработку сигналов для корректного завершения работы
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received, closing connections...");
      await storageAdapter.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT signal received, closing connections...");
      await storageAdapter.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Запускаем сервер
startServer();

// async function main() {
//   try {
//     console.log("Инициализация MongoDBAdapter...");

//     // Инициализация MongoDB адаптера
//     const mongoAdapter = new MongoDBAdapter({
//       uri: "mongodb://translator:translator123@localhost:27017/translations?authSource=translations",
//       dbName: "translations",
//       maxVersions: 15,
//     });

//     // Подключение к базе данных
//     await mongoAdapter.connect();
//     console.log("Подключение к MongoDB успешно установлено");

//     // Инициализация I18n с MongoDB адаптером
//     const i18n = new I18n({
//       storageProvider: mongoAdapter,
//       disableCache: false, // Включаем кеширование
//     });

//     // 1. Добавление локалей
//     console.log("\n1. Добавление локалей");

//     const ruLocale: LocaleDocument = {
//       code: "ru",
//       name: "Russian",
//       nativeName: "Русский",
//     };

//     const enLocale: LocaleDocument = {
//       code: "en",
//       name: "English",
//       nativeName: "English",
//     };

//     await i18n.addLocale(ruLocale);
//     await i18n.addLocale(enLocale);

//     console.log("Локали добавлены");

//     // 2. Получение списка доступных локалей
//     console.log("\n2. Получение списка доступных локалей");
//     const availableLocales = await i18n.getAvailableLocales();
//     console.log("Доступные локали:", availableLocales);

//     // 3. Добавление переводов для локалей
//     console.log("\n3. Добавление переводов для локалей");

//     // Переводы для русского языка
//     const ruTranslations: TranslationMap = {
//       welcome: "Добро пожаловать",
//       ["navigation.home"]: "Главная",
//       ["navigation.about"]: "О нас",
//       ["navigation.contacts"]: "Контакты",
//       ["form.submit"]: "Отправить",
//       ["form.cancel"]: "Отмена",
//       ["form.validation.required"]: "Это поле обязательно для заполнения",
//       ["form.validation.email"]: "Введите корректный email адрес",
//     };

//     // Переводы для английского языка
//     const enTranslations: TranslationMap = {
//       welcome: "Welcome",
//       ["navigation.home"]: "navigation.home",
//       ["navigation.about"]: "О нас",
//       ["navigation.contacts"]: "Контакты",
//       ["form.submit"]: "Отправить",
//       ["form.cancel"]: "Отмена",
//       ["form.validation.required"]: "Это поле обязательно для заполнения",
//       ["form.validation.email"]: "Введите корректный email адрес",
//     };

//     // Добавление переводов с указанием пользователя и тегов
//     await i18n.addTranslations("ru", ruTranslations, "admin", "initial", [
//       "common",
//       "ui",
//     ]);
//     await i18n.addTranslations("en", enTranslations, "admin", "initial", [
//       "common",
//       "ui",
//     ]);

//     console.log("Переводы добавлены");

//     // 4. Получение переводов
//     console.log("\n4. Получение переводов");

//     const welcomeRu = await i18n.t("welcome", { locale: "ru" });
//     const homeEn = await i18n.t("navigation.home", { locale: "en" });
//     const cancelRu = await i18n.t("form.cancel", { locale: "ru" });

//     console.log("welcome (ru):", welcomeRu); // Добро пожаловать
//     console.log("navigation.home (en):", homeEn); // Home
//     console.log("form.cancel (ru):", cancelRu); // Отмена

//     // 5. Обновление переводов
//     console.log("\n5. Обновление переводов");

//     await i18n.updateTranslation(
//       "ru",
//       "form.submit",
//       "Отправить форму",
//       "editor",
//       "update-1",
//       ["form", "buttons"]
//     );

//     const updatedSubmit = await i18n.t("form.submit", { locale: "ru" });
//     console.log("Updated form.submit (ru):", updatedSubmit); // Отправить форму

//     // 6. Получение истории версий перевода
//     console.log("\n6. Получение истории версий перевода");

//     const versionHistory = await i18n.getVersionHistory("ru", "form.submit");
//     console.log('История версий для "form.submit" (ru):', versionHistory);

//     // 7. Получение определенной версии перевода
//     console.log("\n7. Получение определенной версии перевода");

//     // Получение перевода с конкретным тегом версии
//     const initialSubmit = await i18n.t("form.submit", {
//       locale: "ru",
//       versionTag: "initial",
//     });

//     console.log("Initial version of form.submit (ru):", initialSubmit); // Отправить

//     // 8. Работа с тегами
//     console.log("\n8. Работа с тегами");

//     // Добавление тегов к существующему переводу
//     await i18n.addTagsToTranslation("en", "welcome", [
//       "important",
//       "landing-page",
//     ]);

//     // Получение всех тегов
//     const allTags = await i18n.listAllTags();
//     console.log("Все теги:", allTags);

//     // Получение переводов по тегу
//     const uiTranslations = await i18n.getTranslationsByTag("ru", "ui");
//     console.log('Переводы с тегом "ui" (ru):', uiTranslations);

//     // Получение переводов по нескольким тегам с логикой "AND"
//     const formButtonTranslations = await i18n.getTranslationsByTags(
//       "ru",
//       ["form", "buttons"],
//       { matchAll: true }
//     );
//     console.log(
//       'Переводы с тегами "form" И "buttons" (ru):',
//       formButtonTranslations
//     );

//     // 9. Удаление тегов
//     console.log("\n9. Удаление тегов");

//     await i18n.removeTagsFromTranslation("ru", "form.submit", ["buttons"]);
//     const updatedTags = await i18n.getTranslationWithTags("form.submit", "ru");
//     console.log('Обновленные теги для "form.submit" (ru):', updatedTags?.tags);

//     // 10. Форматирование даты и чисел
//     console.log("\n10. Форматирование даты и чисел");

//     const now = new Date();
//     const formattedDateRu = i18n.formatDate(now, "ru", { dateStyle: "full" });
//     const formattedDateEn = i18n.formatDate(now, "en", { dateStyle: "full" });

//     console.log("Форматированная дата (ru):", formattedDateRu);
//     console.log("Форматированная дата (en):", formattedDateEn);

//     const number = 1234567.89;
//     const formattedNumberRu = i18n.formatNumber(number, "ru", {
//       style: "currency",
//       currency: "RUB",
//     });
//     const formattedNumberEn = i18n.formatNumber(number, "en", {
//       style: "currency",
//       currency: "USD",
//     });

//     console.log("Форматированное число (ru):", formattedNumberRu);
//     console.log("Форматированное число (en):", formattedNumberEn);

//     // 11. Проверка наличия перевода
//     console.log("\n11. Проверка наличия перевода");

//     const exists = await i18n.exists("form.cancel", "ru");
//     console.log('Перевод "form.cancel" существует для ru:', exists);

//     const notExists = await i18n.exists("not.existing.key", "ru");
//     console.log('Перевод "not.existing.key" существует для ru:', notExists);

//     // 12. Удаление перевода
//     console.log("\n12. Удаление перевода");

//     await i18n.removeTranslation("ru", "form.cancel");
//     const cancelExists = await i18n.exists("form.cancel", "ru");
//     console.log(
//       'Перевод "form.cancel" существует для ru после удаления:',
//       cancelExists
//     );

//     // 13. Управление кешем
//     console.log("\n13. Управление кешем");

//     // Очистка кеша для конкретной локали
//     i18n.clearLocaleCache("ru");
//     console.log('Кеш для "ru" очищен');

//     // Очистка всего кеша
//     i18n.clearCache();
//     console.log("Весь кеш очищен");

//     // 14. Обновление информации о локали
//     console.log("\n14. Обновление информации о локали");

//     const updatedRuLocale: LocaleDocument = {
//       code: "ru",
//       name: "Russian",
//       nativeName: "Русский язык", // Изменено
//     };

//     await i18n.updateLocale(updatedRuLocale);
//     const ruInfo = await mongoAdapter.getLocaleInfo("ru");
//     console.log("Обновленная информация о русской локали:", ruInfo);

//     // 15. Удаление локали
//     console.log("\n15. Удаление локали");

//     // Создаем временную локаль для удаления
//     await i18n.addLocale({
//       code: "temp",
//       name: "Temporary",
//       nativeName: "Temporary",
//     });

//     // Проверяем, что локаль добавлена
//     const beforeRemove = await i18n.getAvailableLocales();
//     console.log("Локали до удаления:", beforeRemove);

//     // Удаляем локаль
//     await i18n.removeLocale("temp");

//     // Проверяем, что локаль удалена
//     const afterRemove = await i18n.getAvailableLocales();
//     console.log("Локали после удаления:", afterRemove);

//     // Закрытие соединения с базой данных
//     await mongoAdapter.close();
//     console.log("\nСоединение с базой данных закрыто");
//   } catch (error) {
//     console.error("Произошла ошибка:", error);
//   }
// }

// // Запуск примера
// main().catch(console.error);
