import { Collection, Db, MongoClient } from "mongodb";
import {
  LocaleDocument,
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
  /**
   * Массив тегов для категоризации переводов
   */
  tags?: string[];
}

/**
 * Расширенная версия TranslationEntry с поддержкой тегов
 */
interface TaggedTranslationEntry extends TranslationEntry {
  tags?: string[];
}

/**
 * Адаптер MongoDB для хранения переводов
 * Реализует интерфейс StorageProvider с расширенной поддержкой тегов
 */
export class MongoDBAdapter implements StorageProvider {
  private client: MongoClient;
  private db: Db | null = null;
  private collection: Collection<TranslationDocument> | null = null;
  private localeCollection: Collection<LocaleDocument> | null = null;
  private options: Required<MongoDBAdapterOptions>;
  private isConnected: boolean = false;

  constructor(options: MongoDBAdapterOptions) {
    this.options = {
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
      this.collection = this.db.collection<TranslationDocument>("translations");
      this.localeCollection = this.db.collection<LocaleDocument>("locales");

      // Создаем индексы для оптимизации запросов
      await this.collection.createIndex(
        { locale: 1, key: 1 },
        { unique: true }
      );
      await this.collection.createIndex({ locale: 1 });
      // Добавляем индекс для тегов для оптимизации поиска по тегам
      await this.collection.createIndex({ tags: 1 });

      // Добавляем индекс для локалей для оптимизации
      await this.localeCollection.createIndex({ code: 1 }, { unique: true });

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

    // Получаем уникальные коды локалей из коллекции locales
    const localesFromCollection = await this.localeCollection!.distinct("code");

    // Если в коллекции locales нет данных, получаем локали из коллекции translations
    if (!localesFromCollection || localesFromCollection.length === 0) {
      return await this.collection!.distinct("locale");
    }

    return localesFromCollection;
  }

  /**
   * Добавление новой локали
   */
  async addLocale(locale: LocaleDocument): Promise<boolean> {
    await this.ensureConnected();

    try {
      // Проверяем, существует ли уже локаль с таким кодом
      const existingLocale = await this.localeCollection!.findOne({
        code: locale.code,
      });

      if (existingLocale) {
        // Обновляем существующую локаль
        await this.localeCollection!.updateOne(
          { code: locale.code },
          { $set: { name: locale.name, nativeName: locale.nativeName } }
        );
      } else {
        // Добавляем новую локаль
        await this.localeCollection!.insertOne(locale);
      }

      return true;
    } catch (error) {
      console.error("Error adding locale:", error);
      return false;
    }
  }
  async updateLocale(locale: LocaleDocument): Promise<boolean> {
    await this.ensureConnected();
    if (!this.localeCollection) {
      console.error("Locale collection is not available in updateLocale.");
      return false;
    }
    try {
      const updateResult = await this.localeCollection.updateOne(
        { code: locale.code },
        { $set: { name: locale.name, nativeName: locale.nativeName } }
      );

      // updateOne returns an object with matchedCount and modifiedCount.
      // We check matchedCount to see if a document with the code was found.
      if (updateResult.matchedCount === 0) {
        console.warn(`Locale with code "${locale.code}" not found for update.`);
        return false; // Locale with the given code wasn't found
      }

      // Optional: Log if modification occurred (matchedCount > 0 implies it was found)
      if (updateResult.modifiedCount > 0) {
        console.log(`Locale with code "${locale.code}" updated successfully.`);
      } else {
        console.log(
          `Locale with code "${locale.code}" found, but data was already up-to-date.`
        );
      }

      return true; // Locale found and update attempt was made (even if data was the same)
    } catch (error) {
      console.error(`Error updating locale with code "${locale.code}":`, error);
      return false;
    }
  }

  /**
   * Получение информации о локали
   */
  async getLocaleInfo(code: string): Promise<LocaleDocument | null> {
    await this.ensureConnected();

    return await this.localeCollection!.findOne({ code });
  }

  /**
   * Получение всех локалей с полной информацией
   */
  async getAllLocales(): Promise<LocaleDocument[]> {
    await this.ensureConnected();

    return await this.localeCollection!.find().toArray();
  }

  /**
   * Удаление локали
   * Примечание: это не удаляет переводы для этой локали
   */
  async removeLocale(code: string): Promise<boolean> {
    await this.ensureConnected();

    const result = await this.localeCollection!.deleteOne({ code });
    return result.deletedCount > 0;
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

    const locales = await this.localeCollection!.findOne({
      code: locale,
    });
    if (locales) {
      const documents = await this.collection!.find({
        locale: locales._id,
      }).toArray();

      if (documents.length === 0) {
        return undefined;
      }

      const storage: TranslationStorage = {};

      for (const doc of documents) {
        storage[doc.key] = doc.value;
      }

      return storage;
    }
    return undefined;
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
   * Получение перевода по ключу вместе с тегами
   */
  async getTranslationWithTags(
    locale: string,
    key: string,
    options?: {
      userId?: string;
      versionTag?: string;
      timestamp?: number;
    }
  ): Promise<TaggedTranslationEntry | undefined> {
    await this.ensureConnected();

    const doc = await this.collection!.findOne({ locale, key });

    if (!doc) {
      return undefined;
    }

    // Если не указаны опции версионирования, возвращаем текущее значение с тегами
    if (
      !options ||
      (!options.userId && !options.versionTag && !options.timestamp)
    ) {
      return {
        value: doc.value,
        versions: doc.versions,
        tags: doc.tags,
      };
    }

    // Поиск конкретной версии перевода (аналогично методу getTranslation)
    const { userId, versionTag, timestamp } = options;
    let matchingVersion: VersionInfo | undefined;

    for (const version of doc.versions) {
      if (timestamp !== undefined && version.timestamp <= timestamp) {
        if (!matchingVersion || version.timestamp > matchingVersion.timestamp) {
          matchingVersion = version;
        }
        continue;
      }

      if (userId !== undefined && version.userId === userId) {
        if (!matchingVersion || version.timestamp > matchingVersion.timestamp) {
          matchingVersion = version;
        }
        continue;
      }

      if (versionTag !== undefined && version.tag === versionTag) {
        if (!matchingVersion || version.timestamp > matchingVersion.timestamp) {
          matchingVersion = version;
        }
        continue;
      }
    }

    return {
      value: matchingVersion ? matchingVersion.value : doc.value,
      versions: doc.versions,
      tags: doc.tags,
    };
  }

  /**
   * Установка перевода по ключу с информацией о версии
   */
  async setTranslation(
    locale: string,
    key: string,
    value: string,
    versionMeta: VersionMeta,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined> {
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

      // Обновляем документ с учетом тегов (если предоставлены)
      await this.collection!.updateOne(
        { locale, key },
        {
          $set: {
            value,
            versions,
            ...(tags !== undefined && { tags }),
          },
        }
      );
    } else {
      // Создаем новый документ с тегами (если предоставлены)
      await this.collection!.insertOne({
        locale,
        key,
        value,
        versions: [versionInfo],
        ...(tags !== undefined && { tags }),
      });

      // При создании нового перевода, проверяем, есть ли локаль в коллекции locales
      // Если нет, автоматически добавляем её с базовой информацией
      const localeExists = await this.localeCollection!.findOne({
        code: locale,
      });
      if (!localeExists) {
        await this.localeCollection!.insertOne({
          code: locale,
          name: locale, // Временное значение
          nativeName: locale, // Временное значение
        });
      }
    }

    return {
      value,
      versions: existingDoc
        ? [versionInfo, ...existingDoc.versions].slice(
            0,
            this.options.maxVersions
          )
        : [versionInfo],
      tags,
    };
  }

  /**
   * Обновление тегов для существующего перевода
   */
  async updateTags(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean> {
    await this.ensureConnected();

    const result = await this.collection!.updateOne(
      { locale, key },
      { $set: { tags } }
    );

    return result.matchedCount > 0;
  }

  /**
   * Добавление тегов к существующему переводу
   */
  async addTags(locale: string, key: string, tags: string[]): Promise<boolean> {
    await this.ensureConnected();

    // $addToSet добавляет элементы в массив, если их еще нет
    const result = await this.collection!.updateOne(
      { locale, key },
      { $addToSet: { tags: { $each: tags } } }
    );

    return result.matchedCount > 0;
  }

  /**
   * Удаление тегов из существующего перевода
   */
  async removeTags(
    locale: string,
    key: string,
    tags: string[]
  ): Promise<boolean> {
    await this.ensureConnected();

    const result = await this.collection!.updateOne(
      { locale, key },
      { $pull: { tags: { $in: tags } } }
    );

    return result.matchedCount > 0;
  }

  /**
   * Получение всех доступных тегов
   */
  async listAllTags(locale?: string): Promise<string[]> {
    await this.ensureConnected();

    const query = locale ? { locale } : {};
    const tags = await this.collection!.distinct("tags", query).then(
      (result) => result as string[]
    );

    return tags.filter(Boolean); // Фильтруем возможные null/undefined значения
  }

  /**
   * Получение переводов по одному тегу
   */
  async getTranslationsByTag(
    locale: string,
    tag: string
  ): Promise<Record<string, TaggedTranslationEntry>> {
    await this.ensureConnected();

    const documents = await this.collection!.find({
      locale,
      tags: tag,
    }).toArray();

    const result: Record<string, TaggedTranslationEntry> = {};

    for (const doc of documents) {
      result[doc.key] = {
        value: doc.value,
        versions: doc.versions,
        tags: doc.tags,
      };
    }

    return result;
  }

  /**
   * Получение переводов по нескольким тегам с возможностью выбора логики (AND/OR)
   */
  async getTranslationsByTags(
    locale: string,
    tags: string[],
    options: { matchAll?: boolean } = {}
  ): Promise<Record<string, TaggedTranslationEntry>> {
    await this.ensureConnected();

    if (!tags.length) {
      return {};
    }

    // Определяем, используем ли логику AND (все теги должны присутствовать)
    // или логику OR (хотя бы один из тегов должен присутствовать)
    const matchAll = options.matchAll ?? false;
    let query;

    if (matchAll) {
      // Логика AND: все указанные теги должны присутствовать
      query = {
        locale,
        tags: { $all: tags },
      };
    } else {
      // Логика OR: хотя бы один из указанных тегов должен присутствовать
      query = {
        locale,
        tags: { $in: tags },
      };
    }

    const documents = await this.collection!.find(query).toArray();

    const result: Record<string, TaggedTranslationEntry> = {};

    for (const doc of documents) {
      result[doc.key] = {
        value: doc.value,
        versions: doc.versions,
        tags: doc.tags,
      };
    }

    return result;
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
    const locales = await this.localeCollection!.findOne({
      code: locale,
    });

    const result = await this.collection!.deleteOne({
      locale: locales?._id,
      key,
    });
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
   * Подсчет количества переводов с заданными тегами
   */
  async countTranslationsByTags(
    locale: string,
    tags: string[],
    options: { matchAll?: boolean } = {}
  ): Promise<number> {
    await this.ensureConnected();

    if (!tags.length) {
      return 0;
    }

    const matchAll = options.matchAll ?? false;
    let query;

    if (matchAll) {
      query = {
        locale,
        tags: { $all: tags },
      };
    } else {
      query = {
        locale,
        tags: { $in: tags },
      };
    }

    return await this.collection!.countDocuments(query);
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
