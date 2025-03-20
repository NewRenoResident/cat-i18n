import { I18n } from "@cat-i18n/maine-coon";
import { MongoDBAdapter } from "./src";

async function main() {
  try {
    console.log("Подключение к MongoDB...");

    // Создание адаптера MongoDB
    const mongoAdapter = new MongoDBAdapter({
      uri: "mongodb://localhost:27017",
      dbName: "i18n",
      collectionName: "translations",
      maxVersions: 10,
    });

    // Проверка соединения с MongoDB перед инициализацией I18n
    try {
      await mongoAdapter.connect();
      console.log("✅ Успешное подключение к MongoDB");
    } catch (dbError) {
      console.error("❌ Ошибка подключения к MongoDB:", dbError.message);
      throw dbError;
    }

    // Создание экземпляра I18n с MongoDB адаптером
    const i18n = new I18n({
      storageProvider: mongoAdapter,
    });

    // Инициализация I18n
    console.log("Инициализация I18n...");
    await i18n.init();

    console.log("✅ I18n успешно инициализирован");

    // Получение списка доступных локалей для проверки
    const locales = i18n.getAvailableLocales();
    console.log(
      `Доступные локали: ${locales.length > 0 ? locales.join(", ") : "нет"}`
    );

    // Здесь можно добавить тестовый перевод для проверки
    if (locales.length === 0) {
      console.log("Добавление тестового перевода...");
      await i18n.addTranslations(
        "en",
        {
          test: "This is a test translation",
        },
        "admin"
      );
      console.log("✅ Тестовый перевод добавлен");
    }
    await i18n.addTranslations(
      "en",
      {
        test: "This is a test translation 2",
      },
      "admin"
    );

    return i18n; // Возвращаем инициализированный экземпляр i18n
  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    process.exit(1);
  }
}

// Вызываем функцию main
main()
  .then((i18n) => {
    console.log("✅ Адаптер MongoDB успешно настроен и готов к использованию");
  })
  .catch((err) => {
    // Обработка ошибок уже происходит внутри main, но добавим дополнительный обработчик на всякий случай
    console.error("❌ Неперехваченная ошибка:", err);
  });
