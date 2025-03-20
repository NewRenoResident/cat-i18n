export type VersionMeta = Omit<VersionInfo, "key" | "value">;

export interface VersionInfo {
  userId: string;
  timestamp: number;
  tag?: string;
  key: string;
  value: string;
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
   * Сохранение перевода с информацией о версии
   */
  abstract setTranslation(
    locale: string,
    key: string,
    value: string,
    versionInfo: VersionMeta
  ): Promise<TranslationEntry | undefined>;

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
  [key: string]: string | TranslationMap;
};

export interface LocaleData {
  [locale: string]: TranslationMap;
}
