import express, {
  Express,
  Request,
  Response,
  Router,
  NextFunction,
} from "express";
import { z, ZodError } from "zod"; // Import Zod
import {
  ApiAdapter,
  ApiResponse,
  BaseApiAdapter,
  SearchByTagsRequest,
  TagsRequest,
  TranslationRequest,
  TranslationUpdateRequest,
} from "./types"; // Assuming types.ts defines these interfaces
// Assume I18n interface/class includes `removeLocale` method
import { I18n } from "@cat-i18n/maine-coon";

import {
  localeParam,
  localeAndKeyParams,
  keyAndLocaleQuery,
  addTranslationsBody,
  addLocalesBody,
  updateTranslationBody,
  tagsRequestBody,
  searchByTagsBody,
  translationRequestQuery,
  LocaleParam,
  LocaleAndKeyParams,
  KeyAndLocaleQuery,
  AddTranslationsBody,
  AddLocalesBody,
  UpdateTranslationBody,
  TagsRequestBody,
  SearchByTagsBody,
  TranslationRequestQuery,
} from "@cat-i18n/shared";
/**
 * Опции для Express API адаптера
 */
export interface ExpressAdapterOptions {
  basePath?: string;
  port?: number;
  host?: string;
  app?: Express;
  enableCors?: boolean;
  enableLogging?: boolean;
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

    // Middleware setup (CORS, Logging, JSON/URL-encoded)
    if (this.options.enableCors) {
      this.app.use(this.options.basePath, (req, res, next) => {
        // Apply CORS only to API routes
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        );
        // Handle preflight requests
        if (req.method === "OPTIONS") {
          return res.sendStatus(200);
        }
        next();
      });
    }

    if (this.options.enableLogging) {
      this.app.use((req, res, next) => {
        if (req.originalUrl.startsWith(this.options.basePath)) {
          // Log only API requests
          console.log(
            `${this.options.logPrefix} ${req.method} ${req.url} ${new Date().toISOString()}`
          );
        }
        next();
      });
    }

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Настройка маршрутов
    this.setupRoutes();

    // Монтирование роутера
    this.app.use(this.options.basePath, this.router);

    // Запуск сервера, если не передан внешний экземпляр Express
    if (!this.options.app) {
      // Use original options check here
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
    } else {
      console.log(
        `${this.options.logPrefix} Attached to existing Express app. Routes available at ${this.options.basePath}`
      );
      return Promise.resolve(); // Resolve immediately if using external app
    }
  }

  /**
   * Закрытие сервера
   */
  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err?: Error) => {
          // Add optional error param type
          if (err) {
            console.error(
              `${this.options.logPrefix} Error closing server:`,
              err
            );
            reject(err);
          } else {
            console.log(`${this.options.logPrefix} Server closed.`);
            resolve();
          }
        });
      });
    }
    return Promise.resolve();
  }

  // --- Zod Validation Middleware ---

  /**
   * Middleware for validating request body using a Zod schema.
   */
  private validateBody =
    (schema: z.ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Parse and replace req.body with validated data (incl. transformations)
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          this.sendZodError(res, error);
        } else {
          // Pass other errors to the default error handler
          next(error);
        }
      }
    };

  /**
   * Middleware for validating request query parameters using a Zod schema.
   */
  private validateQuery =
    (schema: z.ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Parse and replace req.query with validated data (incl. transformations)
        req.query = schema.parse(req.query);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          this.sendZodError(res, error);
        } else {
          // Pass other errors to the default error handler
          next(error);
        }
      }
    };

  /**
   * Middleware for validating request route parameters using a Zod schema.
   */
  private validateParams =
    (schema: z.ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Parse and replace req.params with validated data (incl. transformations)
        req.params = schema.parse(req.params);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          this.sendZodError(res, error);
        } else {
          // Pass other errors to the default error handler
          next(error);
        }
      }
    };

  /**
   * Настройка маршрутов API с использованием Zod валидации
   */
  setupRoutes(): void {
    // === Locales Routes ===
    // GET /locales - получение списка доступных локалей
    this.router.get("/locales", this.handleGetLocales.bind(this));

    this.router.post(
      "/translations",
      this.validateBody(addTranslationsBody),
      this.handleAddTranslations.bind(this)
    );

    // POST /locales - добавление новой локали
    this.router.post(
      "/locales",
      this.validateBody(addLocalesBody), // Validate body
      this.handleAddLocales.bind(this)
    );

    // DELETE /locales/:locale - удаление локали // *** NEW ROUTE ***
    this.router.delete(
      "/locales/:locale",
      this.validateParams(addLocalesBody), // Validate route parameter 'locale'
      this.handleRemoveLocale.bind(this)
    );

    this.router.put(
      "/locales/:locale",
      this.validateParams(localeParam), // Validate route parameter 'locale'
      this.handleUpdateLocale.bind(this)
    );

    // === Translations Routes ===
    // GET /translations/:locale - получение всех переводов для локали
    this.router.get(
      "/translations/:locale",
      this.validateParams(localeParam), // Validate route params
      this.handleGetAllTranslations.bind(this)
    );

    // GET /translation - получение конкретного перевода
    this.router.get(
      "/translation",
      this.validateQuery(translationRequestQuery), // Validate query params
      this.handleGetTranslation.bind(this)
    );

    // GET /translation/tags - получение перевода с тегами
    this.router.get(
      "/translation/tags",
      this.validateQuery(translationRequestQuery), // Validate query params
      this.handleGetTranslationWithTags.bind(this)
    );

    // POST /translation - создание/обновление перевода
    this.router.post(
      "/translation",
      this.validateBody(updateTranslationBody),
      this.handleUpdateTranslation.bind(this)
    );

    // DELETE /translation - удаление перевода
    this.router.delete(
      "/translation",
      this.validateQuery(keyAndLocaleQuery), // Validate query params
      this.handleRemoveTranslation.bind(this)
    );

    // === Translation Version Routes ===
    // GET /translation/versions/:locale/:key - получение истории версий перевода
    this.router.get(
      "/translation/versions/:locale/:key",
      this.validateParams(localeAndKeyParams), // Validate route params
      this.handleGetVersionHistory.bind(this)
    );

    // GET /translation/latest/:locale/:key - получение последней версии перевода
    this.router.get(
      "/translation/latest/:locale/:key",
      this.validateParams(localeAndKeyParams), // Validate route params
      this.handleGetLatestVersion.bind(this)
    );

    // === Tag Routes ===
    // GET /tags - получение всех тегов
    this.router.get("/tags", this.handleGetAllTags.bind(this));

    // GET /tags/:locale - получение всех тегов для локали
    this.router.get(
      "/tags/:locale",
      this.validateParams(localeParam), // Validate route params
      this.handleGetTagsByLocale.bind(this)
    );

    // POST /tags - добавление тегов к переводу
    this.router.post(
      "/tags",
      this.validateBody(tagsRequestBody), // Validate body
      this.handleAddTags.bind(this)
    );

    // PUT /tags - обновление тегов перевода
    this.router.put(
      "/tags",
      this.validateBody(tagsRequestBody), // Validate body
      this.handleUpdateTags.bind(this)
    );

    // DELETE /tags - удаление тегов из перевода
    this.router.delete(
      "/tags",
      this.validateBody(tagsRequestBody), // Validate body (as per original code)
      this.handleRemoveTags.bind(this)
    );

    // POST /search/tags - поиск переводов по тегам
    this.router.post(
      "/search/tags",
      this.validateBody(searchByTagsBody), // Validate body
      this.handleSearchByTags.bind(this)
    );

    // POST /count/tags - подсчет переводов по тегам
    this.router.post(
      "/count/tags",
      this.validateBody(searchByTagsBody), // Validate body
      this.handleCountByTags.bind(this)
    );

    // Centralized Error Handler for unexpected errors passed via next(error)
    this.router.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        // Log the error stack for debugging server errors
        console.error(`${this.options.logPrefix} Unhandled Error:`, err.stack);
        // Send a generic 500 error response
        this.sendError(res, "An internal server error occurred.", 500);
      }
    );
  }

  // --- Route Handlers ---

  private async handleGetLocales(req: Request, res: Response): Promise<void> {
    try {
      const locales = await this.i18n.getAvailableLocales(); // Assume async
      this.sendSuccess(res, locales);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAddTranslations(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const params = req.body as z.infer<typeof addTranslationsBody>;

      const result = await this.i18n.addTranslations(
        params.locale,
        params.translations,
        params.userId,
        params.versionTag,
        params.tags
      );

      this.sendSuccess(
        res,
        {
          success: true,
          message: `Successfully added ${Object.keys(params.translations).length} translations to locale '${params.locale}'`,
          result,
        },
        201
      ); // Используем 201 Created для создания ресурсов
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAddLocales(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, nativeName } = req.body as z.infer<
        typeof addLocalesBody
      >;
      const result = await this.i18n.addLocale({ code, name, nativeName });
      this.sendSuccess(res, result, 201); // Use 201 Created status
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleUpdateLocale(req: Request, res: Response): Promise<void> {
    try {
      const { locale } = req.params as z.infer<typeof localeParam>;
      const { name, nativeName } = req.body as z.infer<typeof addLocalesBody>;

      const updated = await this.i18n.updateLocale({
        code: locale,
        name,
        nativeName,
      });

      if (updated) {
        this.sendSuccess(res, { success: true });
      } else {
        res.status(404).json({
          success: false,
          message: `Locale with code '${locale}' not found.`,
        });
        return;
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleRemoveLocale(req: Request, res: Response): Promise<void> {
    try {
      const { locale } = req.params as z.infer<typeof localeParam>;

      const success = await this.i18n.removeLocale(locale);

      if (success) {
        this.sendSuccess(res, {
          message: `Locale '${locale}' removed successfully.`,
          deleted: true,
        });
      } else {
        this.sendError(
          res,
          new Error(`Locale '${locale}' not found or could not be removed.`),
          404
        );
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetAllTranslations(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.params is validated
      const { locale } = req.params as z.infer<typeof localeParam>;
      const translations = await this.i18n.getAllTranslations(locale);
      this.sendSuccess(res, translations);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetTranslation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const params = req.query as unknown as TranslationRequestQuery;

      const options = {
        userId: params.userId,
        versionTag: params.versionTag,
        timestamp: params.timestamp, // Already a number or undefined
      };

      // Handle potential "translation not found" errors from i18n.t specifically
      try {
        const translation = await this.i18n.t(params.key, {
          locale: params.locale,
          ...options,
        });
        this.sendSuccess(res, { translation });
      } catch (tError: any) {
        // Assuming the i18n library throws an error containing 'not found' or similar
        if (
          tError.message &&
          tError.message.toLowerCase().includes("not found")
        ) {
          this.sendError(
            res,
            new Error(
              `Translation not found for key '${params.key}' in locale '${params.locale}'.`
            ),
            404
          );
        } else {
          throw tError; // Re-throw other errors to be caught by the outer catch
        }
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetTranslationWithTags(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.query is validated and timestamp is transformed to number
      const params = req.query as z.infer<typeof translationRequestQuery>;

      const options = {
        userId: params.userId,
        versionTag: params.versionTag,
        timestamp: params.timestamp, // Already a number or undefined
      };

      const translation = await this.i18n.getTranslationWithTags(
        params.key,
        params.locale,
        options
      );
      // Handle case where translation might not exist
      if (!translation) {
        this.sendError(
          res,
          new Error(
            `Translation with tags not found for key '${params.key}' in locale '${params.locale}'.`
          ),
          404
        );
        return;
      }

      this.sendSuccess(res, translation);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleUpdateTranslation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof updateTranslationBody>;

      const updatedTranslation = await this.i18n.updateTranslation(
        params.locale,
        params.key,
        params.value,
        params.userId,
        params.versionTag,
        params.tags // Pass tags if present
      );

      this.sendSuccess(res, updatedTranslation);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleRemoveTranslation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { key, locale } = req.query as z.infer<typeof keyAndLocaleQuery>;

      const result = await this.i18n.removeTranslation(locale, key);
      if (result) {
        // Consider returning 204 No Content if successful and no body needed
        // res.status(204).send();
        this.sendSuccess(res, {
          message: `Translation '${key}' for locale '${locale}' removed.`,
          removed: true,
        });
      } else {
        this.sendError(
          res,
          new Error(`Translation '${key}' for locale '${locale}' not found.`),
          404
        );
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetVersionHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.params is validated
      const { locale, key } = req.params as z.infer<typeof localeAndKeyParams>;
      const versions = await this.i18n.getVersionHistory(locale, key);
      if (!versions || versions.length === 0) {
        this.sendError(
          res,
          new Error(
            `No version history found for key '${key}' in locale '${locale}'.`
          ),
          404
        );
        return;
      }
      this.sendSuccess(res, versions);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetLatestVersion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.params is validated
      const { locale, key } = req.params as z.infer<typeof localeAndKeyParams>;
      const version = await this.i18n.getLatestVersion(locale, key);
      if (!version) {
        this.sendError(
          res,
          new Error(
            `Latest version not found for key '${key}' in locale '${locale}'.`
          ),
          404
        );
        return;
      }
      this.sendSuccess(res, version);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetAllTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.i18n.listAllTags();
      this.sendSuccess(res, tags);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetTagsByLocale(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.params is validated
      const { locale } = req.params as z.infer<typeof localeParam>;
      const tags = await this.i18n.listAllTags(locale);
      this.sendSuccess(res, tags);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAddTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof tagsRequestBody>;

      const result = await this.i18n.addTagsToTranslation(
        params.locale,
        params.key,
        params.tags
      );
      // Check result, potentially return 404 if translation doesn't exist
      if (!result) {
        // Assuming addTagsToTranslation returns boolean or similar
        this.sendError(
          res,
          new Error(
            `Translation not found for key '${params.key}' in locale '${params.locale}' to add tags.`
          ),
          404
        );
        return;
      }

      this.sendSuccess(res, {
        updated: true,
        message: `Tags added to ${params.locale}/${params.key}.`,
      });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleUpdateTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof tagsRequestBody>;

      const result = await this.i18n.updateTranslationTags(
        params.locale,
        params.key,
        params.tags
      );
      // Check result, potentially return 404 if translation doesn't exist
      if (!result) {
        // Assuming updateTranslationTags returns boolean or similar
        this.sendError(
          res,
          new Error(
            `Translation not found for key '${params.key}' in locale '${params.locale}' to update tags.`
          ),
          404
        );
        return;
      }

      this.sendSuccess(res, {
        updated: true,
        message: `Tags updated for ${params.locale}/${params.key}.`,
      });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleRemoveTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated (as per original structure)
      const params = req.body as z.infer<typeof tagsRequestBody>;

      const result = await this.i18n.removeTagsFromTranslation(
        params.locale,
        params.key,
        params.tags
      );

      // Check result, potentially return 404 if translation doesn't exist
      if (!result) {
        // Assuming removeTagsFromTranslation returns boolean or similar
        this.sendError(
          res,
          new Error(
            `Translation not found for key '${params.key}' in locale '${params.locale}' to remove tags.`
          ),
          404
        );
        return;
      }

      // Consider 204 No Content
      this.sendSuccess(res, {
        updated: true,
        message: `Specified tags removed from ${params.locale}/${params.key}.`,
      });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleSearchByTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof searchByTagsBody>;

      const translations = await this.i18n.getTranslationsByTags(
        params.locale,
        params.tags,
        { matchAll: params.matchAll ?? false } // Default matchAll to false if not provided
      );

      this.sendSuccess(res, translations);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleCountByTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof searchByTagsBody>;

      const count = await this.i18n.countTranslationsByTags(
        params.locale,
        params.tags,
        { matchAll: params.matchAll ?? false } // Default matchAll to false
      );

      this.sendSuccess(res, { count });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  // --- Response Helpers ---

  /**
   * Formats Zod errors into a user-friendly string.
   */
  private formatZodError(error: ZodError): string {
    return error.errors
      .map((e) => `${e.path.join(".") || "field"}: ${e.message}`) // Changed "error" to "field"
      .join("; ");
  }

  /**
   * Отправка успешного ответа
   */
  private sendSuccess<T>(res: Response, data: T, status: number = 200): void {
    if (res.headersSent) return; // Avoid setting headers after they are sent
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(status).json(response);
  }

  /**
   * Отправка ответа с ошибкой валидации Zod
   */
  private sendZodError(res: Response, error: ZodError): void {
    if (res.headersSent) return;
    const errorMessage = this.formatZodError(error);
    console.warn(`${this.options.logPrefix} Validation Error: ${errorMessage}`); // Log validation errors
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${errorMessage}`,
      details: error.flatten(), // Optionally include detailed errors
    };
    res.status(400).json(response); // Use 400 Bad Request for validation errors
  }

  /**
   * Отправка ответа с ошибкой
   */
  private sendError(
    res: Response,
    error: Error | unknown,
    status?: number // Made status optional, will determine based on error type
  ): void {
    if (res.headersSent) return;

    let errorMessage = "An unknown error occurred";
    let statusCode = status ?? 500; // Default to 500 if status not provided

    if (error instanceof Error) {
      errorMessage = error.message;
      // Simple check for typical "Not Found" errors to set 404, can be refined
      if (!status && error.message.toLowerCase().includes("not found")) {
        statusCode = 404;
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // Log appropriately based on status code
    if (statusCode >= 500) {
      console.error(
        `${this.options.logPrefix} Server Error (${statusCode}): ${errorMessage}`,
        error instanceof Error ? error.stack : error
      );
    } else {
      console.warn(
        `${this.options.logPrefix} Client Error (${statusCode}): ${errorMessage}`
      );
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      // Optionally add more details in dev mode
      // stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    };

    res.status(statusCode).json(response);
  }
}
