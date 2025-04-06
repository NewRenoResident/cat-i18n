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
import { I18n } from "@cat-i18n/maine-coon"; // Assuming I18n has these methods

// Define Zod Schemas for validation
const Schemas = {
  // Params Schemas
  localeParam: z.object({
    locale: z
      .string({ required_error: "Locale parameter is required" })
      .min(1, "Locale parameter cannot be empty"),
  }),
  localeAndKeyParams: z.object({
    locale: z
      .string({ required_error: "Locale parameter is required" })
      .min(1, "Locale parameter cannot be empty"),
    key: z
      .string({ required_error: "Key parameter is required" })
      .min(1, "Key parameter cannot be empty"),
  }),

  // Query Schemas
  keyAndLocaleQuery: z.object({
    key: z
      .string({ required_error: "Key query parameter is required" })
      .min(1, "Key query parameter cannot be empty"),
    locale: z
      .string({ required_error: "Locale query parameter is required" })
      .min(1, "Locale query parameter cannot be empty"),
  }),
  translationRequestQuery: z.object({
    key: z
      .string({ required_error: "Key query parameter is required" })
      .min(1, "Key query parameter cannot be empty"),
    locale: z
      .string({ required_error: "Locale query parameter is required" })
      .min(1, "Locale query parameter cannot be empty"),
    userId: z.string().min(1, "userId must be a non-empty string").optional(),
    versionTag: z
      .string()
      .min(1, "versionTag must be a non-empty string")
      .optional(),
    // Validate timestamp as a string, then transform to number
    timestamp: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "timestamp must be a positive number string",
      })
      .transform(Number) // Convert to number after validation
      .optional(),
  }),

  // Body Schemas
  addLocalesBody: z.object({
    code: z
      .string({ required_error: "code is required" })
      .min(1, "code cannot be empty"),
    name: z
      .string()
      .min(1, "If provided, name must be a non-empty string")
      .optional(),
    nativeName: z
      .string()
      .min(1, "If provided, nativeName must be a non-empty string")
      .optional(),
  }),
  updateTranslationBody: z.object({
    key: z
      .string({ required_error: "key is required" })
      .min(1, "key cannot be empty"),
    locale: z
      .string({ required_error: "locale is required" })
      .min(1, "locale cannot be empty"),
    value: z.string({ required_error: "value is required" }), // Allow empty string value
    userId: z
      .string({ required_error: "userId is required" })
      .min(1, "userId cannot be empty"),
    versionTag: z
      .string()
      .min(1, "versionTag must be a non-empty string")
      .optional(),
    tags: z
      .array(z.string().min(1, "All tags must be non-empty strings"))
      .optional(),
  }),
  tagsRequestBody: z.object({
    key: z
      .string({ required_error: "key is required" })
      .min(1, "key cannot be empty"),
    locale: z
      .string({ required_error: "locale is required" })
      .min(1, "locale cannot be empty"),
    tags: z
      .array(z.string().min(1, "All tags must be non-empty strings"))
      .min(1, "tags array cannot be empty"), // Ensure array has at least one tag
  }),
  searchByTagsBody: z.object({
    locale: z
      .string({ required_error: "locale is required" })
      .min(1, "locale cannot be empty"),
    tags: z
      .array(z.string().min(1, "All tags must be non-empty strings"))
      .min(1, "tags array cannot be empty"), // Ensure array has at least one tag
    matchAll: z.boolean().optional(),
  }),
};

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
    if (this.options.app) {
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
          this.sendError(res, error);
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
          this.sendError(res, error);
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
          this.sendError(res, error);
        }
      }
    };

  /**
   * Настройка маршрутов API с использованием Zod валидации
   */
  setupRoutes(): void {
    // GET /locales - получение списка доступных локалей
    this.router.get("/locales", this.handleGetLocales.bind(this));

    // POST /locales - добавление новой локали
    this.router.post(
      "/locales",
      this.validateBody(Schemas.addLocalesBody), // Validate body
      this.handleAddLocales.bind(this)
    );

    // GET /translations/:locale - получение всех переводов для локали
    this.router.get(
      "/translations/:locale",
      this.validateParams(Schemas.localeParam), // Validate route params
      this.handleGetAllTranslations.bind(this)
    );

    // GET /translation - получение конкретного перевода
    this.router.get(
      "/translation",
      this.validateQuery(Schemas.translationRequestQuery), // Validate query params
      this.handleGetTranslation.bind(this)
    );

    // GET /translation/tags - получение перевода с тегами
    this.router.get(
      "/translation/tags",
      this.validateQuery(Schemas.translationRequestQuery), // Validate query params
      this.handleGetTranslationWithTags.bind(this)
    );

    // POST /translation - создание/обновление перевода
    this.router.post(
      "/translation",
      this.validateBody(Schemas.updateTranslationBody), // Validate body
      this.handleUpdateTranslation.bind(this)
    );

    // DELETE /translation - удаление перевода
    this.router.delete(
      "/translation",
      this.validateQuery(Schemas.keyAndLocaleQuery), // Validate query params
      this.handleRemoveTranslation.bind(this)
    );

    // GET /translation/versions/:locale/:key - получение истории версий перевода
    this.router.get(
      "/translation/versions/:locale/:key",
      this.validateParams(Schemas.localeAndKeyParams), // Validate route params
      this.handleGetVersionHistory.bind(this)
    );

    // GET /translation/latest/:locale/:key - получение последней версии перевода
    this.router.get(
      "/translation/latest/:locale/:key",
      this.validateParams(Schemas.localeAndKeyParams), // Validate route params
      this.handleGetLatestVersion.bind(this)
    );

    // === Маршруты для работы с тегами ===

    // GET /tags - получение всех тегов
    this.router.get("/tags", this.handleGetAllTags.bind(this));

    // GET /tags/:locale - получение всех тегов для локали
    this.router.get(
      "/tags/:locale",
      this.validateParams(Schemas.localeParam), // Validate route params
      this.handleGetTagsByLocale.bind(this)
    );

    // POST /tags - добавление тегов к переводу
    this.router.post(
      "/tags",
      this.validateBody(Schemas.tagsRequestBody), // Validate body
      this.handleAddTags.bind(this)
    );

    // PUT /tags - обновление тегов перевода
    this.router.put(
      "/tags",
      this.validateBody(Schemas.tagsRequestBody), // Validate body
      this.handleUpdateTags.bind(this)
    );

    // DELETE /tags - удаление тегов из перевода (Note: DELETE usually doesn't have a body, common practice is query params or route params. Adjusting to validate body as per original code structure)
    this.router.delete(
      "/tags",
      this.validateBody(Schemas.tagsRequestBody), // Validate body (as per original code)
      // Consider changing to query params for DELETE: this.validateQuery(Schemas.tagsRequestQuery) and define tagsRequestQuery schema
      this.handleRemoveTags.bind(this)
    );

    // POST /search/tags - поиск переводов по тегам
    this.router.post(
      "/search/tags",
      this.validateBody(Schemas.searchByTagsBody), // Validate body
      this.handleSearchByTags.bind(this)
    );

    // POST /count/tags - подсчет переводов по тегам
    this.router.post(
      "/count/tags",
      this.validateBody(Schemas.searchByTagsBody), // Validate body
      this.handleCountByTags.bind(this)
    );
  }

  // --- Route Handlers (Mostly Unchanged, but use validated data) ---

  private async handleGetLocales(req: Request, res: Response): Promise<void> {
    try {
      const locales = await this.i18n.getAvailableLocales(); // Assume async
      this.sendSuccess(res, locales);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAddLocales(req: Request, res: Response): Promise<void> {
    try {
      // req.body is now validated and typed by Zod
      const { code, name, nativeName } = req.body as z.infer<
        typeof Schemas.addLocalesBody
      >;
      // Assuming addTranslation exists and handles this structure
      const result = await this.i18n.addTranslation({ code, name, nativeName });
      this.sendSuccess(res, result, 201); // Use 201 Created status
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
      const { locale } = req.params as z.infer<typeof Schemas.localeParam>;
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
      // req.query is validated and timestamp is transformed to number
      const params = req.query as z.infer<
        typeof Schemas.translationRequestQuery
      >;

      const options = {
        userId: params.userId,
        versionTag: params.versionTag,
        timestamp: params.timestamp, // Already a number or undefined
      };

      const translation = await this.i18n.t(params.key, {
        locale: params.locale,
        ...options,
      });

      this.sendSuccess(res, { translation });
    } catch (error) {
      // Handle specific i18n errors like 'translation not found' potentially
      this.sendError(res, error);
    }
  }

  private async handleGetTranslationWithTags(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // req.query is validated and timestamp is transformed to number
      const params = req.query as z.infer<
        typeof Schemas.translationRequestQuery
      >;

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
      const params = req.body as z.infer<typeof Schemas.updateTranslationBody>;

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
      // req.query is validated
      const { key, locale } = req.query as z.infer<
        typeof Schemas.keyAndLocaleQuery
      >;

      const result = await this.i18n.removeTranslation(locale, key);
      // Consider returning 204 No Content if successful and no body needed
      this.sendSuccess(res, { removed: result });
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
      const { locale, key } = req.params as z.infer<
        typeof Schemas.localeAndKeyParams
      >;
      const versions = await this.i18n.getVersionHistory(locale, key);
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
      const { locale, key } = req.params as z.infer<
        typeof Schemas.localeAndKeyParams
      >;
      const version = await this.i18n.getLatestVersion(locale, key);
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
      const { locale } = req.params as z.infer<typeof Schemas.localeParam>;
      const tags = await this.i18n.listAllTags(locale);
      this.sendSuccess(res, tags);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAddTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof Schemas.tagsRequestBody>;

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

  private async handleUpdateTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof Schemas.tagsRequestBody>;

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

  private async handleRemoveTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated (as per original structure)
      const params = req.body as z.infer<typeof Schemas.tagsRequestBody>;

      const result = await this.i18n.removeTagsFromTranslation(
        params.locale,
        params.key,
        params.tags
      );

      // Consider 204 No Content
      this.sendSuccess(res, { updated: result });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleSearchByTags(req: Request, res: Response): Promise<void> {
    try {
      // req.body is validated
      const params = req.body as z.infer<typeof Schemas.searchByTagsBody>;

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
      const params = req.body as z.infer<typeof Schemas.searchByTagsBody>;

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
      .map((e) => `${e.path.join(".") || "error"}: ${e.message}`)
      .join("; ");
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
   * Отправка ответа с ошибкой валидации Zod
   */
  private sendZodError(res: Response, error: ZodError): void {
    const errorMessage = this.formatZodError(error);
    console.warn(`${this.options.logPrefix} Validation Error: ${errorMessage}`); // Log validation errors
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    };
    res.status(400).json(response); // Use 400 Bad Request for validation errors
  }

  /**
   * Отправка ответа с ошибкой
   */
  private sendError(
    res: Response,
    error: Error | unknown,
    status: number = 500 // Default to 500 Internal Server Error
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    // Log internal server errors
    if (status >= 500) {
      console.error(`${this.options.logPrefix} Server Error:`, error);
    } else {
      console.warn(
        `${this.options.logPrefix} Client Error (${status}): ${errorMessage}`
      );
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      // Optionally add more details in dev mode
      // stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    };

    res.status(status).json(response);
  }
}
