import {
  LocaleData,
  LocaleDocument,
  StorageProvider,
  TaggedTranslationEntry,
  TranslationMap,
  TranslationStorage,
  VersionInfo,
  VersionMeta,
} from "@cat-i18n/shared";
import { I18nOptions, TranslateOptions } from "./types";
import { DateFormatter, NumberFormatter } from "./formatters";

export class I18n {
  private options: I18nOptions;
  private translations: LocaleData = {};
  private dateFormatter: DateFormatter = new DateFormatter();
  private numberFormatter: NumberFormatter = new NumberFormatter();
  private storageProvider: StorageProvider;

  constructor(options: I18nOptions = {}) {
    // Установка значений по умолчанию
    const defaultOptions: I18nOptions = {
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

  /**
   * Возвращает список всех доступных локалей
   */
  getAvailableLocales(): Promise<string[]> {
    return this.storageProvider.listAvailableLocales();
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

    return translations;
  }

  /**
   * Программное добавление переводов с версионированием и тегами
   * @param locale Локаль
   * @param translations Переводы
   * @param userId ID пользователя, добавившего перевод
   * @param versionTag Опциональный тег версии
   * @param tags Опциональные теги для категоризации переводов
   */
  async addTranslations(
    locale: string,
    translations: TranslationMap,
    userId: string,
    versionTag?: string,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined> {
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

    // Обработка вложенных ключей и добавление их в хранилище с тегами
    const addedTranslation = await this.processTranslations(
      locale,
      "",
      translations,
      versionInfo,
      tags
    );

    // Добавляем в список локалей, если ее там еще нет

    return addedTranslation;
  }

  /**
   * Получение перевода для ключа с учетом версии
   * @param key Ключ перевода
   * @param options Опции перевода
   */
  async t(key: string, options: TranslateOptions): Promise<string> {
    const { locale, userId, versionTag, timestamp } = options;

    // Получаем перевод по ключу с учетом версии
    let translation = await this.getTranslation(key, locale, {
      userId,
      versionTag,
      timestamp,
    });

    // Используем значение по умолчанию, если перевод не найден
    if (!translation)
      throw new Error(
        `There is no translation for "${key} and ${JSON.stringify(options)}"`
      );

    // Применяем интерполяцию
    return translation;
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

  async addTranslation(locale: LocaleDocument): Promise<boolean> {
    return await this.storageProvider.addLocale(locale);
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
   * Обновление перевода с информацией о версии и опциональными тегами
   */
  async updateTranslation(
    locale: string,
    key: string,
    value: string,
    userId: string,
    versionTag?: string,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined> {
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
      versionInfo,
      tags
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
   * Добавление тегов к переводу
   */
  async addTagsToTranslation(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean> {
    if (!this.storageProvider.addTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.addTags(locale, key, tags);
  }

  /**
   * Удаление тегов из перевода
   */
  async removeTagsFromTranslation(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean> {
    if (!this.storageProvider.removeTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.removeTags(locale, key, tags);
  }

  /**
   * Обновление (замена) тегов перевода
   */
  async updateTranslationTags(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean> {
    if (!this.storageProvider.updateTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.updateTags(locale, key, tags);
  }

  /**
   * Получение списка всех тегов, опционально фильтруемых по локали
   */
  async listAllTags(locale?: string): Promise<string[]> {
    if (!this.storageProvider.listAllTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.listAllTags(locale);
  }

  /**
   * Получение переводов по тегу
   */
  async getTranslationsByTag(
    locale: string,
    tag: string
  ): Promise<Record<string, TaggedTranslationEntry>> {
    if (!this.storageProvider.getTranslationsByTag) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.getTranslationsByTag(locale, tag);
  }

  /**
   * Получение переводов по тегам с возможностью выбора логики (AND/OR)
   */
  async getTranslationsByTags(
    locale: string,
    tags: string[],
    options: { matchAll?: boolean } = {}
  ): Promise<Record<string, TaggedTranslationEntry>> {
    if (!this.storageProvider.getTranslationsByTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.getTranslationsByTags(
      locale,
      tags,
      options
    );
  }

  /**
   * Подсчет количества переводов с указанными тегами
   */
  async countTranslationsByTags(
    locale: string,
    tags: string[],
    options: { matchAll?: boolean } = {}
  ): Promise<number> {
    if (!this.storageProvider.countTranslationsByTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.countTranslationsByTags(
      locale,
      tags,
      options
    );
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
   * Получение перевода с тегами
   */
  async getTranslationWithTags(
    key: string,
    locale: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<TaggedTranslationEntry | undefined> {
    if (!this.storageProvider.getTranslationWithTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.getTranslationWithTags(
      locale,
      key,
      options
    );
  }

  /**
   * Рекурсивная обработка переводов для добавления в хранилище с тегами
   */
  private async processTranslations(
    locale: string,
    prefix: string,
    translations: TranslationMap,
    versionInfo: VersionMeta,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined> {
    for (const key in translations) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = translations[key];

      if (typeof value === "string") {
        // Если значение - строка, добавляем в хранилище с тегами
        return await this.storageProvider.setTranslation(
          locale,
          fullKey,
          value,
          versionInfo,
          tags
        );
      }
    }
  }
}
