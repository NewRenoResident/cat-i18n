export type VersionMeta = Omit<VersionInfo, "key" | "value">;

export interface VersionInfo {
  userId: string;
  timestamp: number;
  tag?: string;
  key: string;
  value: string;
}

export interface TaggedTranslationEntry extends TranslationEntry {
  tags?: string[];
}

export abstract class StorageProvider {
  /**
   * Получение перевода по ключу с возможностью получения конкретной версии
   */
  abstract getTranslation(
    locale: string,
    key: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<string | undefined>;

  /**
   * Получение перевода по ключу вместе с тегами
   */
  abstract getTranslationWithTags?(
    locale: string,
    key: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<TaggedTranslationEntry | undefined>;

  /**
   * Сохранение перевода с информацией о версии и опциональными тегами
   */
  abstract setTranslation(
    locale: string,
    key: string,
    value: string,
    versionInfo: VersionMeta,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined>;

  /**
   * Удаление перевода по ключу
   */
  abstract removeTranslation(locale: string, key: string): Promise<boolean>;

  /**
   * Получение истории версий перевода по ключу
   */
  abstract getVersionHistory(
    locale: string,
    key: string
  ): Promise<VersionInfo[] | undefined>;

  /**
   * Получение последней версии перевода
   */
  abstract getLatestVersion(
    locale: string,
    key: string
  ): Promise<VersionInfo | undefined>;

  /**
   * Получение всех переводов для указанной локали
   */
  abstract getAllTranslations(
    locale: string
  ): Promise<TranslationStorage | undefined>;

  /**
   * Проверка существования перевода
   */
  abstract exists(
    locale: string,
    key: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<boolean>;

  /**
   * Получение списка доступных локалей
   */
  abstract listAvailableLocales(): Promise<string[]>;

  /**
   * Загрузка переводов для локали
   */
  abstract loadTranslations(locale: string): Promise<TranslationMap>;

  /**
   * Обновление тегов для перевода
   */
  abstract updateTags?(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean>;

  /**
   * Добавление тегов к переводу
   */
  abstract addTags?(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean>;

  /**
   * Удаление тегов из перевода
   */
  abstract removeTags?(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean>;

  /**
   * Получение всех тегов, опционально фильтруемых по локали
   */
  abstract listAllTags?(locale?: string): Promise<string[]>;

  /**
   * Получение переводов по тегу
   */
  abstract getTranslationsByTag?(
    locale: string,
    tag: string
  ): Promise<Record<string, TaggedTranslationEntry>>;

  /**
   * Получение переводов по нескольким тегам
   */
  abstract getTranslationsByTags?(
    locale: string,
    tags: string[],
    options?: { matchAll?: boolean }
  ): Promise<Record<string, TaggedTranslationEntry>>;

  /**
   * Подсчет количества переводов с указанными тегами
   */
  abstract countTranslationsByTags?(
    locale: string,
    tags: string[],
    options?: { matchAll?: boolean }
  ): Promise<number>;
}

export interface TranslationStorage {
  [key: string]: TranslationEntry;
}

export interface LocaleStorage {
  [locale: string]: TranslationStorage;
}

export interface TranslationEntry {
  value: string;
  versions: VersionInfo[];
}

export type TranslationMap = {
  [key: string]: string;
};

export interface LocaleData {
  [locale: string]: TranslationMap;
}
