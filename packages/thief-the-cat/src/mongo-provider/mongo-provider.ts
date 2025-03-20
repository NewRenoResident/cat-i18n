import { Collection, Db, MongoClient } from "mongodb";
import {
  LocaleData,
  StorageProvider,
  TranslationEntry,
  TranslationMap,
  TranslationStorage,
  VersionInfo,
  VersionMeta,
} from "@cat-i18n/shared";

interface MongoDBAdapterOptions {
  /**
   * URL подключения к MongoDB
   */
  uri: string;

  /**
   * Название базы данных
   */
  dbName: string;

  /**
   * Название коллекции для хранения переводов
   * По умолчанию: "translations"
   */
  collectionName?: string;

  /**
   * Максимальное количество версий, хранящихся для каждого перевода
   * По умолчанию: 10
   */
  maxVersions?: number;
}

interface TranslationDocument {
  locale: string;
  key: string;
  value: string;
  versions: VersionInfo[];
}

/**
 * Адаптер MongoDB для хранения переводов
 * Реализует интерфейс StorageProvider
 */
export class MongoDBAdapter implements StorageProvider {
  private client: MongoClient;
  private db: Db | null = null;
  private collection: Collection<TranslationDocument> | null = null;
  private options: Required<MongoDBAdapterOptions>;
  private isConnected: boolean = false;

  constructor(options: MongoDBAdapterOptions) {
    this.options = {
      collectionName: "translations",
      maxVersions: 10,
      ...options,
    };

    this.client = new MongoClient(this.options.uri);
  }

  /**
   * Подключение к базе данных
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.db = this.client.db(this.options.dbName);
      this.collection = this.db.collection<TranslationDocument>(
        this.options.collectionName
      );

      // Создаем индексы для оптимизации запросов
      await this.collection.createIndex(
        { locale: 1, key: 1 },
        { unique: true }
      );
      await this.collection.createIndex({ locale: 1 });

      this.isConnected = true;
    }
  }

  /**
   * Закрытие соединения с базой данных
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  /**
   * Получение списка доступных локалей
   */
  async listAvailableLocales(): Promise<string[]> {
    await this.ensureConnected();

    const locales = await this.collection!.distinct("locale").then(
      (result) => result as string[]
    );

    return locales;
  }

  /**
   * Загрузка всех переводов для указанной локали
   */
  async loadTranslations(locale: string): Promise<TranslationMap> {
    await this.ensureConnected();

    const documents = await this.collection!.find({ locale }).toArray();

    const translations: TranslationMap = {};

    // Преобразуем плоский список в структуру с вложенными ключами
    for (const doc of documents) {
      const parts = doc.key.split(".");
      let current: any = translations;

      // Создаем вложенную структуру для ключа
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      // Устанавливаем значение для последнего уровня
      const lastPart = parts[parts.length - 1];
      current[lastPart] = doc.value;
    }

    return translations;
  }

  /**
   * Получение всех переводов для локали с историей версий
   */
  async getAllTranslations(
    locale: string
  ): Promise<TranslationStorage | undefined> {
    await this.ensureConnected();

    const documents = await this.collection!.find({ locale }).toArray();

    if (documents.length === 0) {
      return undefined;
    }

    const storage: TranslationStorage = {};

    for (const doc of documents) {
      storage[doc.key] = {
        value: doc.value,
        versions: doc.versions,
      };
    }

    return storage;
  }

  /**
   * Получение перевода по ключу с опциональной информацией о версии
   */
  async getTranslation(
    locale: string,
    key: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<string | undefined> {
    await this.ensureConnected();

    const doc = await this.collection!.findOne({ locale, key });

    if (!doc) {
      return undefined;
    }

    // Если не указаны опции версионирования, возвращаем текущее значение
    if (
      !options ||
      (!options.userId && !options.versionTag && !options.timestamp)
    ) {
      return doc.value;
    }

    // Поиск конкретной версии перевода
    const { userId, versionTag, timestamp } = options;
    let matchingVersion: VersionInfo | undefined;

    for (const version of doc.versions) {
      // Если указан timestamp, ищем версию, созданную до указанной временной метки
      if (timestamp !== undefined && version.timestamp <= timestamp) {
        if (!matchingVersion || version.timestamp > matchingVersion.timestamp) {
          matchingVersion = version;
        }
        continue;
      }

      // Если указан userId, ищем версию, созданную указанным пользователем
      if (userId !== undefined && version.userId === userId) {
        if (!matchingVersion || version.timestamp > matchingVersion.timestamp) {
          matchingVersion = version;
        }
        continue;
      }

      // Если указан versionTag, ищем версию с указанным тегом
      if (versionTag !== undefined && version.tag === versionTag) {
        if (!matchingVersion || version.timestamp > matchingVersion.timestamp) {
          matchingVersion = version;
        }
        continue;
      }
    }

    return matchingVersion ? matchingVersion.value : doc.value;
  }

  /**
   * Установка перевода по ключу с информацией о версии
   */
  async setTranslation(
    locale: string,
    key: string,
    value: string,
    versionMeta: VersionMeta
  ): Promise<TranslationEntry | undefined> {
    await this.ensureConnected();

    // Создаем полную информацию о версии
    const versionInfo: VersionInfo = {
      ...versionMeta,
      key,
      value,
    };

    // Ищем существующий документ
    const existingDoc = await this.collection!.findOne({ locale, key });

    if (existingDoc) {
      // Добавляем новую версию к существующим
      const versions = [versionInfo, ...existingDoc.versions].slice(
        0,
        this.options.maxVersions
      ); // Ограничиваем количество хранимых версий

      // Обновляем документ
      await this.collection!.updateOne(
        { locale, key },
        {
          $set: {
            value,
            versions,
          },
        }
      );
    } else {
      // Создаем новый документ
      await this.collection!.insertOne({
        locale,
        key,
        value,
        versions: [versionInfo],
      });
    }

    return {
      value,
      versions: existingDoc
        ? [versionInfo, ...existingDoc.versions].slice(
            0,
            this.options.maxVersions
          )
        : [versionInfo],
    };
  }

  /**
   * Проверка существования перевода
   */
  async exists(
    locale: string,
    key: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<boolean> {
    await this.ensureConnected();

    const translation = await this.getTranslation(locale, key, options);
    return translation !== undefined;
  }

  /**
   * Удаление перевода по ключу
   */
  async removeTranslation(locale: string, key: string): Promise<boolean> {
    await this.ensureConnected();

    const result = await this.collection!.deleteOne({ locale, key });
    return result.deletedCount > 0;
  }

  /**
   * Получение истории версий перевода
   */
  async getVersionHistory(
    locale: string,
    key: string
  ): Promise<VersionInfo[] | undefined> {
    await this.ensureConnected();

    const doc = await this.collection!.findOne({ locale, key });
    return doc ? doc.versions : undefined;
  }

  /**
   * Получение последней версии перевода
   */
  async getLatestVersion(
    locale: string,
    key: string
  ): Promise<VersionInfo | undefined> {
    await this.ensureConnected();

    const doc = await this.collection!.findOne({ locale, key });
    return doc && doc.versions.length > 0 ? doc.versions[0] : undefined;
  }

  /**
   * Вспомогательный метод для проверки и установки соединения
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}
