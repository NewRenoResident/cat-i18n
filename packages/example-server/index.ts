import express from "express";
import { ExpressAdapter } from "@cat-i18n/adapters";
import { MongoDBAdapter } from "@cat-i18n/thief-the-cat";
import { I18n } from "@cat-i18n/maine-coon";

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
      enableLogging: true, // включаем логирование запросов
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
