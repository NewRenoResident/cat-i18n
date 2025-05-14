import { I18n } from "@cat-i18n/maine-coon";

/**
 * Интерфейс для API адаптера, который обеспечивает взаимодействие с I18n через REST API
 */
export interface ApiAdapter {
  /**
   * Инициализация API адаптера
   */
  init(): Promise<void> | void;

  /**
   * Закрытие адаптера и освобождение ресурсов
   */
  close?(): Promise<void> | void;

  /**
   * Добавление обработчиков для маршрутов API
   */
  setupRoutes(): void;

  /**
   * Получение экземпляра I18n, используемого адаптером
   */
  getI18nInstance(): I18n;
}

/**
 * Базовый класс для API адаптеров
 */
export abstract class BaseApiAdapter implements ApiAdapter {
  protected i18n: I18n;

  constructor(i18n: I18n) {
    this.i18n = i18n;
  }

  /**
   * Инициализация API адаптера
   */
  async init(): Promise<void> {
    // По умолчанию ничего не делаем, но подклассы могут переопределить
  }

  /**
   * Абстрактный метод для настройки маршрутов API
   */
  abstract setupRoutes(): void;

  /**
   * Получение экземпляра I18n
   */
  getI18nInstance(): I18n {
    return this.i18n;
  }
}

/**
 * Определение стандартных ответов API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Параметры запроса на перевод
 */
export interface TranslationRequest {
  key: string;
  locale: string;
  userId?: string;
  versionTag?: string;
  timestamp?: number;
}

/**
 * Параметры запроса на создание/обновление перевода
 */
export interface TranslationUpdateRequest {
  key: string;
  locale: string;
  value: string;
  userId: string;
  versionTag?: string;
  tags?: string[];
}

/**
 * Параметры запроса для работы с тегами
 */
export interface TagsRequest {
  locale: string;
  key: string;
  tags: string[];
}

/**
 * Параметры запроса для поиска по тегам
 */
export interface SearchByTagsRequest {
  locale: string;
  tags: string[];
  matchAll?: boolean;
}
