import { I18nOptions, TranslateOptions } from "./types.js";
import { interpolate } from "./utils/interpolation.js";
import { getPluralForm } from "./utils/plural.js";
import { DateFormatter } from "./formatters/date-formatter.js";
import { NumberFormatter } from "./formatters/number-formatter.js";
import {
  LocaleData,
  StorageProvider,
  TranslationEntry,
  TranslationMap,
  TranslationStorage,
  VersionInfo,
  VersionMeta,
} from "@cat-i18n/shared";

export class I18n {
  private options: I18nOptions;
  private translations: LocaleData = {};
  private dateFormatter: DateFormatter = new DateFormatter();
  private numberFormatter: NumberFormatter = new NumberFormatter();
  private availableLocales: string[] = [];
  private storageProvider: StorageProvider;

  constructor(options: I18nOptions = {}) {
    // Установка значений по умолчанию
    const defaultOptions: I18nOptions = {
      interpolation: {
        prefix: "{{",
        suffix: "}}",
      },
      pluralSeparator: "|",
      disableCache: false,
    };

    // Объединение с пользовательскими опциями
    this.options = { ...defaultOptions, ...options };

    // Получение storageProvider из опций
    if (!this.options.storageProvider) {
      throw new Error("StorageProvider is required");
    }

    this.storageProvider = this.options.storageProvider;
  }

  /**
   * Инициализация i18n с загрузкой всех доступных локалей или указанных в options.locales
   */
  async init(): Promise<void> {
    // Получаем список доступных локалей из провайдера
    this.availableLocales = await this.storageProvider.listAvailableLocales();

    // Если в опциях указаны локали, загружаем только их
    const localesToLoad = this.options.locales || this.availableLocales;

    // Загружаем переводы для всех локалей
    await Promise.all(
      localesToLoad.map(async (locale) => {
        // Загружаем переводы из провайдера
        const translations = await this.storageProvider.loadTranslations(
          locale
        );

        // Сохраняем в кэше, если кэширование не отключено
        if (!this.options.disableCache) {
          this.translations[locale] = translations;
        }
      })
    );
  }

  /**
   * Возвращает список всех доступных локалей
   */
  getAvailableLocales(): string[] {
    return [...this.availableLocales];
  }

  /**
   * Загрузка переводов для конкретной локали
   */
  async loadTranslations(locale: string): Promise<TranslationMap> {
    // Загружаем переводы из провайдера
    const translations = await this.storageProvider.loadTranslations(locale);

    // Обновляем кэш, если кэширование не отключено
    if (!this.options.disableCache) {
      this.translations[locale] = translations;
    }

    // Добавляем в список локалей, если ее там еще нет
    if (!this.availableLocales.includes(locale)) {
      this.availableLocales.push(locale);
    }

    return translations;
  }

  /**
   * Программное добавление переводов с версионированием
   * @param locale Локаль
   * @param translations Переводы
   * @param userId ID пользователя, добавившего перевод
   * @param versionTag Опциональный тег версии
   */
  async addTranslations(
    locale: string,
    translations: TranslationMap,
    userId: string,
    versionTag?: string
  ): Promise<TranslationEntry | undefined> {
    // Если для локали еще нет переводов и кэширование не отключено, инициализируем пустым объектом
    if (!this.options.disableCache && !this.translations[locale]) {
      this.translations[locale] = {};
    }

    const timestamp = Date.now();
    const versionInfo: VersionMeta = {
      userId,
      timestamp,
      tag: versionTag,
    };

    // Обработка вложенных ключей и добавление их в хранилище
    const addedTranslation = await this.processTranslations(
      locale,
      "",
      translations,
      versionInfo
    );

    // Добавляем в список локалей, если ее там еще нет
    if (!this.availableLocales.includes(locale)) {
      this.availableLocales.push(locale);
    }
    return addedTranslation;
  }

  /**
   * Получение перевода для ключа с учетом версии
   * @param key Ключ перевода
   * @param options Опции перевода
   */
  async t(key: string, options: TranslateOptions): Promise<string> {
    const {
      locale,
      count,
      defaultValue,
      userId,
      versionTag,
      timestamp,
      interpolation = {},
    } = options;

    // Получаем перевод по ключу с учетом версии
    let translation = await this.getTranslation(key, locale, {
      userId,
      versionTag,
      timestamp,
    });

    // Обработка множественных форм
    if (count !== undefined && translation) {
      const pluralSeparator = this.options.pluralSeparator || "|";
      const pluralForms = translation
        .split(pluralSeparator)
        .map((form) => form.trim());
      translation = getPluralForm(count, pluralForms, locale);

      // Добавляем count в значения для интерполяции, если не указано явно
      if (!("count" in interpolation)) {
        (interpolation as Record<string, unknown>).count = count;
      }
    }

    // Используем значение по умолчанию, если перевод не найден
    if (!translation && defaultValue) {
      translation = defaultValue;
    }

    // Возвращаем ключ, если перевод не найден
    if (!translation) {
      return key;
    }

    // Применяем интерполяцию
    return interpolate(
      translation,
      interpolation,
      this.options.interpolation?.prefix,
      this.options.interpolation?.suffix
    );
  }

  /**
   * Очистка кэша переводов
   */
  clearCache(): void {
    this.translations = {};
  }

  /**
   * Очистка кэша переводов для указанной локали
   */
  clearLocaleCache(locale: string): void {
    delete this.translations[locale];
  }

  /**
   * Форматирование даты с учетом локали
   */
  formatDate(
    date: Date,
    locale: string,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return this.dateFormatter.format(date, locale, options);
  }

  /**
   * Форматирование числа с учетом локали
   */
  formatNumber(
    number: number,
    locale: string,
    options?: Intl.NumberFormatOptions
  ): string {
    return this.numberFormatter.format(number, locale, options);
  }

  /**
   * Проверка наличия перевода для ключа с учетом версии
   */
  async exists(
    key: string,
    locale: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<boolean> {
    return await this.storageProvider.exists(locale, key, options);
  }

  /**
   * Получение загруженных локалей
   */
  getLoadedLocales(): LocaleData {
    return this.translations;
  }

  /**
   * Получение всех переводов для указанной локали
   */
  async getAllTranslations(
    locale: string
  ): Promise<TranslationStorage | undefined> {
    return await this.storageProvider.getAllTranslations(locale);
  }

  /**
   * Удаление перевода по ключу
   * @returns true если перевод был успешно удален, false если перевод не найден
   */
  async removeTranslation(locale: string, key: string): Promise<boolean> {
    const result = await this.storageProvider.removeTranslation(locale, key);

    // Если успешно удалили из хранилища и кэширование не отключено,
    // обновляем также кэш
    if (result && !this.options.disableCache) {
      const translations = this.translations[locale];
      if (translations) {
        const parts = key.split(".");
        let current: any = translations;
        const path: string[] = [];

        // Найти родительский объект для ключа
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          path.push(part);

          if (
            current[part] === undefined ||
            typeof current[part] !== "object"
          ) {
            return true; // Уже удалено из хранилища
          }

          current = current[part];
        }

        // Удалить ключ из родительского объекта в кэше
        const lastPart = parts[parts.length - 1];
        if (current[lastPart] !== undefined) {
          delete current[lastPart];
        }
      }
    }

    return result;
  }

  /**
   * Получение истории версий перевода
   */
  async getVersionHistory(
    locale: string,
    key: string
  ): Promise<VersionInfo[] | undefined> {
    return await this.storageProvider.getVersionHistory(locale, key);
  }

  /**
   * Получение последней версии перевода
   */
  async getLatestVersion(
    locale: string,
    key: string
  ): Promise<VersionInfo | undefined> {
    return await this.storageProvider.getLatestVersion(locale, key);
  }

  /**
   * Обновление перевода с информацией о версии
   */
  async updateTranslation(
    locale: string,
    key: string,
    value: string,
    userId: string,
    versionTag?: string
  ): Promise<TranslationEntry | undefined> {
    const timestamp = Date.now();
    const versionInfo: VersionMeta = {
      userId,
      timestamp,
      tag: versionTag,
    };

    const updatedTranslation = await this.storageProvider.setTranslation(
      locale,
      key,
      value,
      versionInfo
    );

    // Обновляем кэш, если кэширование не отключено
    if (!this.options.disableCache) {
      const translations = this.translations[locale];
      if (translations) {
        const parts = key.split(".");
        let current: any = translations;

        // Создаем путь до нужного ключа, если его нет
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];

          if (!current[part] || typeof current[part] !== "object") {
            current[part] = {};
          }

          current = current[part];
        }

        // Устанавливаем значение
        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
      }
    }
    return updatedTranslation;
  }

  /**
   * Получение перевода из указанной локали с учетом версии
   */
  private async getTranslation(
    key: string,
    locale: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<string | undefined> {
    // Если кэширование отключено или нужна конкретная версия, запрашиваем напрямую из провайдера
    if (
      this.options.disableCache ||
      (options && (options.userId || options.versionTag || options.timestamp))
    ) {
      return await this.storageProvider.getTranslation(locale, key, options);
    }

    // Проверяем кэш
    if (this.translations[locale]) {
      const parts = key.split(".");
      let current: any = this.translations[locale];

      // Ищем по вложенным ключам
      for (const part of parts) {
        if (current[part] === undefined) {
          // Если ключ не найден в кэше, запрашиваем из провайдера
          return await this.storageProvider.getTranslation(
            locale,
            key,
            options
          );
        }

        current = current[part];
      }

      // Если нашли строку в кэше, возвращаем её
      if (typeof current === "string") {
        return current;
      }
    }

    // Если не нашли в кэше или ключ не строка, запрашиваем из провайдера
    return await this.storageProvider.getTranslation(locale, key, options);
  }

  /**
   * Рекурсивная обработка переводов для добавления в хранилище
   */
  private async processTranslations(
    locale: string,
    prefix: string,
    translations: TranslationMap,
    versionInfo: VersionMeta
  ): Promise<TranslationEntry | undefined> {
    for (const key in translations) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = translations[key];

      if (typeof value === "string") {
        // Если значение - строка, добавляем в хранилище
        return await this.storageProvider.setTranslation(
          locale,
          fullKey,
          value,
          versionInfo
        );
      } else if (typeof value === "object" && value !== null) {
        // Если значение - объект, рекурсивно обрабатываем вложенные ключи
        return await this.processTranslations(
          locale,
          fullKey,
          value as TranslationMap,
          versionInfo
        );
      }
    }
  }
}
