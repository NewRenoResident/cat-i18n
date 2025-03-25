import express, { Express, Request, Response, Router } from "express";
import {
  ApiAdapter,
  ApiResponse,
  BaseApiAdapter,
  SearchByTagsRequest,
  TagsRequest,
  TranslationRequest,
  TranslationUpdateRequest,
} from "./types";
import { I18n } from "@cat-i18n/maine-coon";

/**
 * Опции для Express API адаптера
 */
export interface ExpressAdapterOptions {
  /**
   * Корневой путь для API (по умолчанию: '/api/i18n')
   */
  basePath?: string;

  /**
   * Порт для запуска сервера (по умолчанию: 3000)
   */
  port?: number;

  /**
   * Хост для запуска сервера (по умолчанию: 'localhost')
   */
  host?: string;

  /**
   * Использовать существующий экземпляр Express (если указан, порт и хост игнорируются)
   */
  app?: Express;

  /**
   * Включить CORS для всех маршрутов API
   */
  enableCors?: boolean;

  /**
   * Включить логирование запросов
   */
  enableLogging?: boolean;

  /**
   * Приставка для имён логов
   */
  logPrefix?: string;
}

/**
 * Express API адаптер для i18n
 */
export class ExpressAdapter extends BaseApiAdapter implements ApiAdapter {
  private options: Required<ExpressAdapterOptions>;
  private app: Express;
  private server: any; // Server instance
  private router: Router;

  constructor(i18n: I18n, options: ExpressAdapterOptions = {}) {
    super(i18n);

    // Установка значений по умолчанию
    this.options = {
      basePath: "/api/i18n",
      port: 3000,
      host: "localhost",
      app: options.app || express(),
      enableCors: false,
      enableLogging: false,
      logPrefix: "[I18n API]",
      ...options,
    };

    this.app = this.options.app;
    this.router = express.Router();
  }

  /**
   * Инициализация адаптера и запуск сервера
   */
  async init(): Promise<void> {
    await super.init();

    // Настройка middleware
    if (this.options.enableCors) {
      this.app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        );
        next();
      });
    }

    // Логирование запросов
    if (this.options.enableLogging) {
      this.app.use((req, res, next) => {
        console.log(
          `${this.options.logPrefix} ${req.method} ${
            req.url
          } ${new Date().toISOString()}`
        );
        next();
      });
    }

    // Парсинг JSON и URL-encoded данных
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Настройка маршрутов
    this.setupRoutes();

    // Монтирование роутера
    this.app.use(this.options.basePath, this.router);

    // Запуск сервера, если не передан внешний экземпляр Express
    if (!this.options.app) {
      return new Promise((resolve) => {
        this.server = this.app.listen(
          this.options.port,
          this.options.host,
          () => {
            console.log(
              `${this.options.logPrefix} Server running at http://${this.options.host}:${this.options.port}${this.options.basePath}`
            );
            resolve();
          }
        );
      });
    }
  }

  /**
   * Закрытие сервера
   */
  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  /**
   * Настройка маршрутов API
   */
  setupRoutes(): void {
    // GET /locales - получение списка доступных локалей
    this.router.get("/locales", this.handleGetLocales.bind(this));

    // GET /translations/:locale - получение всех переводов для локали
    this.router.get(
      "/translations/:locale",
      this.handleGetAllTranslations.bind(this)
    );

    // GET /translation - получение конкретного перевода
    this.router.get("/translation", this.handleGetTranslation.bind(this));

    // GET /translation/tags - получение перевода с тегами
    this.router.get(
      "/translation/tags",
      this.handleGetTranslationWithTags.bind(this)
    );

    // POST /translation - создание/обновление перевода
    this.router.post("/translation", this.handleUpdateTranslation.bind(this));

    // DELETE /translation - удаление перевода
    this.router.delete("/translation", this.handleRemoveTranslation.bind(this));

    // GET /translation/versions/:locale/:key - получение истории версий перевода
    this.router.get(
      "/translation/versions/:locale/:key",
      this.handleGetVersionHistory.bind(this)
    );

    // GET /translation/latest/:locale/:key - получение последней версии перевода
    this.router.get(
      "/translation/latest/:locale/:key",
      this.handleGetLatestVersion.bind(this)
    );

    // === Маршруты для работы с тегами ===

    // GET /tags - получение всех тегов
    this.router.get("/tags", this.handleGetAllTags.bind(this));

    // GET /tags/:locale - получение всех тегов для локали
    this.router.get("/tags/:locale", this.handleGetTagsByLocale.bind(this));

    // POST /tags - добавление тегов к переводу
    this.router.post("/tags", this.handleAddTags.bind(this));

    // PUT /tags - обновление тегов перевода
    this.router.put("/tags", this.handleUpdateTags.bind(this));

    // DELETE /tags - удаление тегов из перевода
    this.router.delete("/tags", this.handleRemoveTags.bind(this));

    // POST /search/tags - поиск переводов по тегам
    this.router.post("/search/tags", this.handleSearchByTags.bind(this));

    // GET /count/tags - подсчет переводов по тегам
    this.router.post("/count/tags", this.handleCountByTags.bind(this));
  }

  /**
   * Обработчик для получения списка доступных локалей
   */
  private async handleGetLocales(req: Request, res: Response): Promise<void> {
    try {
      const locales = this.i18n.getAvailableLocales();
      this.sendSuccess(res, await locales);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения всех переводов для локали
   */
  private async handleGetAllTranslations(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { locale } = req.params;
      const translations = await this.i18n.getAllTranslations(locale);
      this.sendSuccess(res, translations);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения конкретного перевода
   */
  private async handleGetTranslation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const params = req.query as unknown as TranslationRequest;

      if (!params.key || !params.locale) {
        return this.sendError(
          res,
          new Error("Key and locale are required"),
          400
        );
      }

      const options = {
        userId: params.userId,
        versionTag: params.versionTag,
        timestamp: params.timestamp ? Number(params.timestamp) : undefined,
      };

      const translation = await this.i18n.t(params.key, {
        locale: params.locale,
        ...options,
      });

      this.sendSuccess(res, { translation });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения перевода с тегами
   */
  private async handleGetTranslationWithTags(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const params = req.query as unknown as TranslationRequest;

      if (!params.key || !params.locale) {
        return this.sendError(
          res,
          new Error("Key and locale are required"),
          400
        );
      }

      const options = {
        userId: params.userId,
        versionTag: params.versionTag,
        timestamp: params.timestamp ? Number(params.timestamp) : undefined,
      };

      const translation = await this.i18n.getTranslationWithTags(
        params.key,
        params.locale,
        options
      );

      this.sendSuccess(res, translation);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для создания/обновления перевода
   */
  private async handleUpdateTranslation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const params = req.body as TranslationUpdateRequest;

      if (!params.key || !params.locale || !params.value || !params.userId) {
        return this.sendError(
          res,
          new Error("Key, locale, value, and userId are required"),
          400
        );
      }

      const updatedTranslation = await this.i18n.updateTranslation(
        params.locale,
        params.key,
        params.value,
        params.userId,
        params.versionTag,
        params.tags
      );

      this.sendSuccess(res, updatedTranslation);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для удаления перевода
   */
  private async handleRemoveTranslation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { key, locale } = req.query as { key: string; locale: string };

      if (!key || !locale) {
        return this.sendError(
          res,
          new Error("Key and locale are required"),
          400
        );
      }

      const result = await this.i18n.removeTranslation(locale, key);
      this.sendSuccess(res, { removed: result });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения истории версий перевода
   */
  private async handleGetVersionHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { locale, key } = req.params;
      const versions = await this.i18n.getVersionHistory(locale, key);
      this.sendSuccess(res, versions);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения последней версии перевода
   */
  private async handleGetLatestVersion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { locale, key } = req.params;
      const version = await this.i18n.getLatestVersion(locale, key);
      this.sendSuccess(res, version);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения всех тегов
   */
  private async handleGetAllTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.i18n.listAllTags();
      this.sendSuccess(res, tags);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для получения тегов для конкретной локали
   */
  private async handleGetTagsByLocale(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { locale } = req.params;
      const tags = await this.i18n.listAllTags(locale);
      this.sendSuccess(res, tags);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для добавления тегов к переводу
   */
  private async handleAddTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as TagsRequest;

      if (!params.key || !params.locale || !params.tags) {
        return this.sendError(
          res,
          new Error("Key, locale, and tags are required"),
          400
        );
      }

      const result = await this.i18n.addTagsToTranslation(
        params.locale,
        params.key,
        params.tags
      );

      this.sendSuccess(res, { updated: result });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для обновления тегов перевода
   */
  private async handleUpdateTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as TagsRequest;

      if (!params.key || !params.locale || !params.tags) {
        return this.sendError(
          res,
          new Error("Key, locale, and tags are required"),
          400
        );
      }

      const result = await this.i18n.updateTranslationTags(
        params.locale,
        params.key,
        params.tags
      );

      this.sendSuccess(res, { updated: result });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для удаления тегов из перевода
   */
  private async handleRemoveTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as TagsRequest;

      if (!params.key || !params.locale || !params.tags) {
        return this.sendError(
          res,
          new Error("Key, locale, and tags are required"),
          400
        );
      }

      const result = await this.i18n.removeTagsFromTranslation(
        params.locale,
        params.key,
        params.tags
      );

      this.sendSuccess(res, { updated: result });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для поиска переводов по тегам
   */
  private async handleSearchByTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as SearchByTagsRequest;

      if (!params.locale || !params.tags || !params.tags.length) {
        return this.sendError(
          res,
          new Error("Locale and non-empty tags array are required"),
          400
        );
      }

      const translations = await this.i18n.getTranslationsByTags(
        params.locale,
        params.tags,
        { matchAll: params.matchAll }
      );

      this.sendSuccess(res, translations);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Обработчик для подсчета переводов по тегам
   */
  private async handleCountByTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as SearchByTagsRequest;

      if (!params.locale || !params.tags || !params.tags.length) {
        return this.sendError(
          res,
          new Error("Locale and non-empty tags array are required"),
          400
        );
      }

      const count = await this.i18n.countTranslationsByTags(
        params.locale,
        params.tags,
        { matchAll: params.matchAll }
      );

      this.sendSuccess(res, { count });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Отправка успешного ответа
   */
  private sendSuccess<T>(res: Response, data: T, status: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(status).json(response);
  }

  /**
   * Отправка ответа с ошибкой
   */
  private sendError(
    res: Response,
    error: Error | unknown,
    status: number = 500
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
    };

    res.status(status).json(response);
  }
}
