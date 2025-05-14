import { I18n } from "@cat-i18n/maine-coon";
import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import { z, ZodError } from "zod"; // Import Zod
import { ApiAdapter, ApiResponse, BaseApiAdapter } from "./types";

import {
  addLocalesBody,
  addTranslationsBody,
  AiClient,
  keyAndLocaleQuery,
  localeAndKeyParams,
  localeParam,
  searchByTagsBody,
  tagsRequestBody,
  translationRequestQuery,
  TranslationRequestQuery,
  updateTranslationBody,
} from "@cat-i18n/shared";

const aiTranslateBody = z.object({
  translateFromLocale: z.string().min(1, "Locale code cannot be empty"),
  translateToLocale: z.string().min(1, "Locale code cannot be empty"),
  userId: z.string().min(1, "User ID cannot be empty"),
});

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
  private aiClient: AiClient;

  constructor(
    i18n: I18n,
    aiClient: AiClient,
    options: ExpressAdapterOptions = {}
  ) {
    super(i18n);

    if (!aiClient) {
      throw new Error("AiClient instance is required for ExpressAdapter.");
    }
    this.aiClient = aiClient;

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

  async init(): Promise<void> {
    await super.init();

    if (this.options.enableCors) {
      this.app.use(this.options.basePath, (req, res, next) => {
        // Apply CORS only to API routes
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        );
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

    this.setupRoutes();

    this.app.use(this.options.basePath, this.router);

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
      return Promise.resolve();
    }
  }

  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err?: Error) => {
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

  private validateBody =
    (schema: z.ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          this.sendZodError(res, error);
        } else {
          next(error);
        }
      }
    };

  private validateQuery =
    (schema: z.ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        req.query = schema.parse(req.query);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          this.sendZodError(res, error);
        } else {
          next(error);
        }
      }
    };

  private validateParams =
    (schema: z.ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        req.params = schema.parse(req.params);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          this.sendZodError(res, error);
        } else {
          next(error);
        }
      }
    };

  /**
   * Настройка маршрутов API с использованием Zod валидации
   */
  setupRoutes(): void {
    this.router.get("/locales", this.handleGetLocales.bind(this));
    this.router.post(
      "/locales",
      this.validateBody(addLocalesBody),
      this.handleAddLocales.bind(this)
    );
    this.router.delete(
      "/locales/:locale",
      this.validateParams(localeParam),
      this.handleRemoveLocale.bind(this)
    );
    this.router.put(
      "/locales/:locale",
      this.validateParams(localeParam),
      this.validateBody(addLocalesBody),
      this.handleUpdateLocale.bind(this)
    );

    this.router.post(
      "/translations",
      this.validateBody(addTranslationsBody),
      this.handleAddTranslations.bind(this)
    );
    this.router.get(
      "/translations/:locale",
      this.validateParams(localeParam),
      this.handleGetAllTranslations.bind(this)
    );
    this.router.get(
      "/translation",
      this.validateQuery(translationRequestQuery),
      this.handleGetTranslation.bind(this)
    );
    this.router.get(
      "/translation/tags",
      this.validateQuery(translationRequestQuery),
      this.handleGetTranslationWithTags.bind(this)
    );
    this.router.post(
      "/translation",
      this.validateBody(updateTranslationBody),
      this.handleUpdateTranslation.bind(this)
    );
    this.router.delete(
      "/translation",
      this.validateQuery(keyAndLocaleQuery),
      this.handleRemoveTranslation.bind(this)
    );

    // === Translation Version Routes ===
    // ... (existing version routes) ...
    this.router.get(
      "/translation/versions/:locale/:key",
      this.validateParams(localeAndKeyParams),
      this.handleGetVersionHistory.bind(this)
    );
    this.router.get(
      "/translation/latest/:locale/:key",
      this.validateParams(localeAndKeyParams),
      this.handleGetLatestVersion.bind(this)
    );

    this.router.get("/tags", this.handleGetAllTags.bind(this));
    this.router.get(
      "/tags/:locale",
      this.validateParams(localeParam),
      this.handleGetTagsByLocale.bind(this)
    );
    this.router.post(
      "/tags",
      this.validateBody(tagsRequestBody),
      this.handleAddTags.bind(this)
    );
    this.router.put(
      "/tags",
      this.validateBody(tagsRequestBody),
      this.handleUpdateTags.bind(this)
    );
    this.router.delete(
      "/tags",
      this.validateBody(tagsRequestBody),
      this.handleRemoveTags.bind(this)
    ); // Assuming body validation needed as before
    this.router.post(
      "/search/tags",
      this.validateBody(searchByTagsBody),
      this.handleSearchByTags.bind(this)
    );
    this.router.post(
      "/count/tags",
      this.validateBody(searchByTagsBody),
      this.handleCountByTags.bind(this)
    );

    // === AI Translation Route ===
    // *** ADD NEW AI TRANSLATION ROUTE ***
    this.router.post(
      "/ai/translate",
      this.validateBody(aiTranslateBody), // Validate request body
      this.handleAiTranslate.bind(this) // Bind the new handler
    );
    // *** END NEW ROUTE ***

    // Centralized Error Handler
    this.router.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(`${this.options.logPrefix} Unhandled Error:`, err.stack);
        this.sendError(res, "An internal server error occurred.", 500);
      }
    );
  }

  // --- Route Handlers ---

  // ... (existing handlers: handleGetLocales, handleAddTranslations, etc.) ...
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
          message: `Successfully initiated adding ${Object.keys(params.translations).length} translation keys/prefixes to locale '${params.locale}'. Check result field for details.`,
          result, // result is TaggedTranslationEntry | undefined
        },
        201 // Use 201 Created
      );
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
      if (result) {
        this.sendSuccess(res, { code, name, nativeName, created: true }, 201); // Use 201 Created status
      } else {
        this.sendError(
          res,
          new Error(`Failed to add locale '${code}'. It might already exist.`),
          409
        ); // Conflict
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleUpdateLocale(req: Request, res: Response): Promise<void> {
    try {
      const { locale } = req.params as z.infer<typeof localeParam>;
      // Body contains optional name/nativeName
      const { name, nativeName } = req.body as Partial<
        z.infer<typeof addLocalesBody>
      >;

      const updated = await this.i18n.updateLocale({
        code: locale,
        name, // Pass undefined if not provided
        nativeName, // Pass undefined if not provided
      });

      if (updated) {
        this.sendSuccess(res, {
          updated: true,
          message: `Locale '${locale}' updated.`,
        });
      } else {
        this.sendError(
          res,
          new Error(`Locale with code '${locale}' not found.`),
          404
        );
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleRemoveLocale(req: Request, res: Response): Promise<void> {
    try {
      const { locale } = req.params as z.infer<typeof localeParam>; // Use validated params
      const success = await this.i18n.removeLocale(locale);

      if (success) {
        // Use 204 No Content for successful deletion with no response body
        res.status(204).send();
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
      const { locale } = req.params as z.infer<typeof localeParam>;
      const translations = await this.i18n.getAllTranslations(locale);
      if (
        translations === undefined ||
        Object.keys(translations).length === 0
      ) {
        this.sendSuccess(res, {}); // Return empty object if no translations found
      } else {
        this.sendSuccess(res, translations);
      }
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
        timestamp: params.timestamp,
      };

      try {
        const translation = await this.i18n.t(params.key, {
          locale: params.locale,
          ...options,
        });
        this.sendSuccess(res, {
          key: params.key,
          locale: params.locale,
          translation,
        });
      } catch (tError: any) {
        if (
          tError.message &&
          tError.message.toLowerCase().includes("translation not found")
        ) {
          this.sendError(
            res,
            new Error(
              `Translation not found for key '${params.key}' in locale '${params.locale}'.`
            ),
            404
          );
        } else {
          throw tError;
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
      const params = req.query;
      const options = {
        userId: params.userId,
        versionTag: params.versionTag,
        timestamp: params.timestamp,
      };

      const translation = await this.i18n.getTranslationWithTags(
        params.key,
        params.locale,
        options
      );
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
      const params = req.body as z.infer<typeof updateTranslationBody>;
      const updatedTranslation = await this.i18n.updateTranslation(
        params.locale,
        params.key,
        params.value,
        params.userId,
        params.versionTag,
        params.tags
      );
      if (!updatedTranslation) {
        // This might happen if the underlying storage fails, though setTranslation might throw
        this.sendError(
          res,
          new Error(
            `Failed to update translation for key '${params.key}' in locale '${params.locale}'.`
          ),
          500
        );
        return;
      }
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
        res.status(204).send(); // 204 No Content is appropriate here
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
      const { locale, key } = req.params as z.infer<typeof localeAndKeyParams>;
      const versions = await this.i18n.getVersionHistory(locale, key);
      if (!versions || versions.length === 0) {
        // Return empty array instead of 404 if history just doesn't exist yet
        this.sendSuccess(res, []);
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
      this.sendSuccess(res, tags ?? []); // Ensure array even if provider returns undefined/null
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleGetTagsByLocale(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { locale } = req.params as z.infer<typeof localeParam>;
      const tags = await this.i18n.listAllTags(locale);
      this.sendSuccess(res, tags ?? []); // Ensure array
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAddTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as z.infer<typeof tagsRequestBody>;
      const result = await this.i18n.addTagsToTranslation(
        params.locale,
        params.key,
        params.tags
      );
      if (!result) {
        this.sendError(
          res,
          new Error(
            `Translation not found for key '${params.key}' in locale '${params.locale}' or failed to add tags.`
          ),
          404
        ); // Or 400 if tags invalid
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
      const params = req.body as z.infer<typeof tagsRequestBody>;
      const result = await this.i18n.updateTranslationTags(
        params.locale,
        params.key,
        params.tags
      );
      if (!result) {
        this.sendError(
          res,
          new Error(
            `Translation not found for key '${params.key}' in locale '${params.locale}' or failed to update tags.`
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
      const params = req.body as z.infer<typeof tagsRequestBody>;
      const result = await this.i18n.removeTagsFromTranslation(
        params.locale,
        params.key,
        params.tags
      );
      if (!result) {
        this.sendError(
          res,
          new Error(
            `Translation not found for key '${params.key}' in locale '${params.locale}' or failed to remove tags.`
          ),
          404
        );
        return;
      }
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
      const params = req.body as z.infer<typeof searchByTagsBody>;
      const translations = await this.i18n.getTranslationsByTags(
        params.locale,
        params.tags,
        { matchAll: params.matchAll ?? false }
      );
      this.sendSuccess(res, translations ?? {}); // Ensure object
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleCountByTags(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body as z.infer<typeof searchByTagsBody>;
      const count = await this.i18n.countTranslationsByTags(
        params.locale,
        params.tags,
        { matchAll: params.matchAll ?? false }
      );
      this.sendSuccess(res, { count });
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private async handleAiTranslate(req: Request, res: Response): Promise<void> {
    try {
      // Body is validated by middleware
      const { translateFromLocale, translateToLocale, userId } =
        req.body as z.infer<typeof aiTranslateBody>;

      const result = await this.i18n.translateWithAI(
        translateFromLocale,
        translateToLocale,
        this.aiClient,
        userId
      );

      if (result) {
        this.sendSuccess(
          res,
          {
            message: `AI translation process completed for locale '${translateToLocale}'. Check result for details of the last added entry.`,
            result: result, // Contains TaggedTranslationEntry details
          },
          200
        ); // 200 OK is suitable here
      } else {
        console.log(
          `${this.options.logPrefix} AI translation for locale '${translateToLocale}' completed, but no new entries were added (perhaps source was empty or AI returned no data).`
        );
        this.sendSuccess(
          res,
          {
            message: `AI translation process completed for locale '${translateToLocale}', but no new translation entries were added. This might happen if the source was empty or the AI response was empty/invalid after parsing.`,
            result: undefined,
          },
          200
        ); // Still a success, but indicating nothing was added
      }
    } catch (error: any) {
      // Specific error handling (e.g., locale not found is handled inside translateWithAI now, but API/AI client errors)
      console.error(`${this.options.logPrefix} AI translation failed:`, error);
      // Keep generic sendError which detects status code or defaults to 500
      this.sendError(res, error);
    }
  }
  // --- END NEW HANDLER ---

  // --- Response Helpers ---
  // ... (sendSuccess, sendZodError, sendError, formatZodError remain the same) ...
  private formatZodError(error: ZodError): string {
    return error.errors
      .map((e) => `${e.path.join(".") || "field"}: ${e.message}`)
      .join("; ");
  }

  private sendSuccess<T>(res: Response, data: T, status: number = 200): void {
    if (res.headersSent) return;
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(status).json(response);
  }

  private sendZodError(res: Response, error: ZodError): void {
    if (res.headersSent) return;
    const errorMessage = this.formatZodError(error);
    console.warn(`${this.options.logPrefix} Validation Error: ${errorMessage}`);
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${errorMessage}`,
      details: error.flatten(),
    };
    res.status(400).json(response);
  }

  private sendError(
    res: Response,
    error: Error | unknown,
    status?: number
  ): void {
    if (res.headersSent) return;

    let errorMessage = "An unknown error occurred";
    let statusCode = status ?? 500;
    let errorStack: string | undefined; // Add stack trace for server errors

    if (error instanceof Error) {
      errorMessage = error.message;
      // Simple check for typical "Not Found" errors or AI client errors to set appropriate status
      if (!status && error.message.toLowerCase().includes("not found")) {
        statusCode = 404;
      } else if (
        !status &&
        error.message.toLowerCase().includes("failed") &&
        error.message.toLowerCase().includes("ai")
      ) {
        // If AI client fails specifically, maybe 502 Bad Gateway or 503 Service Unavailable? Let's use 500 for now.
        statusCode = 500; // Or could be more specific like 502/503 if known
      }
      errorStack = error.stack; // Capture stack trace
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    if (statusCode >= 500) {
      console.error(
        `${this.options.logPrefix} Server Error (${statusCode}): ${errorMessage}`,
        errorStack || error
      );
    } else {
      console.warn(
        `${this.options.logPrefix} Client Error (${statusCode}): ${errorMessage}`
      );
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      // Optionally add stack in dev mode ONLY
      // stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    };

    res.status(statusCode).json(response);
  }
} // End of ExpressAdapter class
