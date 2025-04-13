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
import { I18nOptions, TranslateOptions, CacheOptions } from "./types";
import { DateFormatter, NumberFormatter } from "./formatters";

/**
 * Cache manager class to handle all cache operations
 */
export class CacheManager {
  private cache: LocaleData = {};
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get value from cache
   * @param locale Locale code
   * @param key Translation key (can be nested using dot notation)
   * @returns Cached translation or undefined if not found
   */
  get(locale: string, key: string): string | undefined {
    if (!this.enabled || !this.cache[locale]) {
      return undefined;
    }

    const parts = key.split(".");
    let current: any = this.cache[locale];

    // Navigate through nested keys
    for (const part of parts) {
      if (current[part] === undefined) {
        return undefined;
      }
      current = current[part];
    }

    // Return only if it's a string
    return typeof current === "string" ? current : undefined;
  }

  /**
   * Set value in cache
   * @param locale Locale code
   * @param key Translation key (can be nested using dot notation)
   * @param value Translation value
   */
  set(locale: string, key: string, value: string): void {
    if (!this.enabled) {
      return;
    }

    // Initialize locale cache if it doesn't exist
    if (!this.cache[locale]) {
      this.cache[locale] = {};
    }

    const parts = key.split(".");
    let current: any = this.cache[locale];

    // Create path to the needed key if it doesn't exist
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }

      current = current[part];
    }

    // Set the value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  /**
   * Remove value from cache
   * @param locale Locale code
   * @param key Translation key (can be nested using dot notation)
   * @returns true if value was removed, false otherwise
   */
  remove(locale: string, key: string): boolean {
    if (!this.enabled || !this.cache[locale]) {
      return false;
    }

    const parts = key.split(".");
    let current: any = this.cache[locale];
    const path: any[] = [];

    // Find parent object for the key
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      path.push(current);

      if (current[part] === undefined || typeof current[part] !== "object") {
        return false;
      }

      current = current[part];
    }

    // Remove key from parent object
    const lastPart = parts[parts.length - 1];
    if (current[lastPart] !== undefined) {
      delete current[lastPart];
      return true;
    }

    return false;
  }

  /**
   * Store entire translation map for a locale
   * @param locale Locale code
   * @param translations Translation map
   */
  setTranslations(locale: string, translations: TranslationMap): void {
    if (!this.enabled) {
      return;
    }
    this.cache[locale] = { ...translations };
  }

  /**
   * Get entire translation map for a locale
   * @param locale Locale code
   * @returns Translation map or undefined if not found
   */
  getTranslations(locale: string): TranslationMap | undefined {
    if (!this.enabled) {
      return undefined;
    }
    return this.cache[locale];
  }

  /**
   * Clear cache for a specific locale
   * @param locale Locale code
   */
  clearLocale(locale: string): void {
    delete this.cache[locale];
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache = {};
  }

  /**
   * Get all cached locales
   * @returns Object with all cached translations
   */
  getAllLocales(): LocaleData {
    return this.cache;
  }

  /**
   * Check if a locale exists in cache
   * @param locale Locale code
   * @returns true if locale exists in cache, false otherwise
   */
  hasLocale(locale: string): boolean {
    return this.enabled && !!this.cache[locale];
  }

  /**
   * Merge translations into existing cache
   * @param locale Locale code
   * @param translations Translations to merge
   */
  mergeTranslations(locale: string, translations: TranslationMap): void {
    if (!this.enabled) {
      return;
    }

    if (!this.cache[locale]) {
      this.cache[locale] = {};
    }

    this.recursiveMerge(this.cache[locale], translations);
  }

  /**
   * Recursively merge objects
   */
  private recursiveMerge(target: any, source: any): void {
    for (const key in source) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        this.recursiveMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

export class I18n {
  private options: I18nOptions;
  private dateFormatter: DateFormatter = new DateFormatter();
  private numberFormatter: NumberFormatter = new NumberFormatter();
  private storageProvider: StorageProvider;
  private cacheManager: CacheManager;

  constructor(options: I18nOptions = {}) {
    // Default options
    const defaultOptions: I18nOptions = {
      disableCache: false,
    };

    // Merge with user options
    this.options = { ...defaultOptions, ...options };

    // Get storageProvider from options
    if (!this.options.storageProvider) {
      throw new Error("StorageProvider is required");
    }

    this.storageProvider = this.options.storageProvider;

    // Initialize cache manager
    this.cacheManager = new CacheManager(!this.options.disableCache);
  }

  /**
   * Initialize i18n with loading all available locales or specified in options.locales
   */
  async initialize(locales?: string[]): Promise<void> {
    if (!locales) {
      // Load list of available locales
      locales = await this.getAvailableLocales();
    }

    // Load translations for each locale
    for (const locale of locales) {
      await this.loadTranslations(locale);
    }
  }

  /**
   * Returns list of all available locales
   */
  getAvailableLocales(): Promise<string[]> {
    return this.storageProvider.listAvailableLocales();
  }

  /**
   * Load translations for a specific locale
   */
  async loadTranslations(locale: string): Promise<TranslationMap> {
    // Load translations from provider
    const translations = await this.storageProvider.loadTranslations(locale);

    // Update cache
    this.cacheManager.setTranslations(locale, translations);

    return translations;
  }

  /**
   * Programmatically add translations with versioning and tags
   */
  async addTranslations(
    locale: string,
    translations: TranslationMap,
    userId: string,
    versionTag?: string,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined> {
    // Initialize cache for locale if needed
    if (!this.cacheManager.hasLocale(locale)) {
      this.cacheManager.setTranslations(locale, {});
    }

    const timestamp = Date.now();
    const versionInfo: VersionMeta = {
      userId,
      timestamp,
      tag: versionTag,
    };

    // Process nested keys and add them to storage with tags
    const addedTranslation = await this.processTranslations(
      locale,
      "",
      translations,
      versionInfo,
      tags
    );

    // Update cache with new translations
    this.cacheManager.mergeTranslations(locale, translations);

    return addedTranslation;
  }

  /**
   * Get translation for a key considering version
   */
  async t(key: string, options: TranslateOptions): Promise<string> {
    const { locale, userId, versionTag, timestamp } = options;
    const cacheOptions: CacheOptions = { userId, versionTag, timestamp };

    // Try to get translation from cache if no specific version is requested
    let translation: string | undefined;

    if (!userId && !versionTag && !timestamp) {
      translation = this.cacheManager.get(locale, key);
    }

    // If not in cache or specific version requested, get from storage
    if (translation === undefined) {
      translation = await this.getTranslation(key, locale, cacheOptions);

      // Update cache with fetched translation if no specific version was requested
      if (translation && !userId && !versionTag && !timestamp) {
        this.cacheManager.set(locale, key, translation);
      }
    }

    // Use default value if translation not found
    if (!translation) {
      throw new Error(
        `There is no translation for "${key} and ${JSON.stringify(options)}"`
      );
    }

    // Apply interpolation if needed (could be implemented as a separate method)
    return translation;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cacheManager.clearAll();
  }

  /**
   * Clear cache for a specific locale
   */
  clearLocaleCache(locale: string): void {
    this.cacheManager.clearLocale(locale);
  }

  /**
   * Format date considering locale
   */
  formatDate(
    date: Date,
    locale: string,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return this.dateFormatter.format(date, locale, options);
  }

  /**
   * Format number considering locale
   */
  formatNumber(
    number: number,
    locale: string,
    options?: Intl.NumberFormatOptions
  ): string {
    return this.numberFormatter.format(number, locale, options);
  }

  /**
   * Check if translation exists for a key considering version
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
    // If specific version is requested, check directly in storage
    if (
      options &&
      (options.userId || options.versionTag || options.timestamp)
    ) {
      return await this.storageProvider.exists(locale, key, options);
    }

    // Otherwise, first check in cache
    if (this.cacheManager.get(locale, key) !== undefined) {
      return true;
    }

    // If not in cache, check in storage
    return await this.storageProvider.exists(locale, key, options);
  }

  /**
   * Get loaded locales
   */
  getLoadedLocales(): LocaleData {
    return this.cacheManager.getAllLocales();
  }

  /**
   * Get all translations for a locale
   */
  async getAllTranslations(
    locale: string
  ): Promise<TranslationStorage | undefined> {
    // First check cache
    const cachedTranslations = this.cacheManager.getTranslations(locale);
    if (cachedTranslations && Object.keys(cachedTranslations).length > 0) {
      // Convert to TranslationStorage format if needed
      return { [locale]: cachedTranslations } as TranslationStorage;
    }

    // If not in cache, get from storage
    return await this.storageProvider.getAllTranslations(locale);
  }

  /**
   * Add a new locale document
   */
  async addTranslation(locale: LocaleDocument): Promise<boolean> {
    const result = await this.storageProvider.addLocale(locale);

    // Update cache with new locale
    if (result && locale.translations) {
      this.cacheManager.setTranslations(locale.code, locale.translations);
    }

    return result;
  }

  /**
   * Remove translation by key
   */
  async removeTranslation(locale: string, key: string): Promise<boolean> {
    const result = await this.storageProvider.removeTranslation(locale, key);

    // Update cache if removal was successful
    if (result) {
      this.cacheManager.remove(locale, key);
    }

    return result;
  }

  /**
   * Get version history for a translation
   */
  async getVersionHistory(
    locale: string,
    key: string
  ): Promise<VersionInfo[] | undefined> {
    return await this.storageProvider.getVersionHistory(locale, key);
  }

  /**
   * Get latest version of translation
   */
  async getLatestVersion(
    locale: string,
    key: string
  ): Promise<VersionInfo | undefined> {
    return await this.storageProvider.getLatestVersion(locale, key);
  }

  /**
   * Update translation with version info and optional tags
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

    // Update cache with new translation
    this.cacheManager.set(locale, key, value);

    return updatedTranslation;
  }

  /**
   * Add tags to translation
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
   * Remove tags from translation
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
   * Update (replace) translation tags
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
   * Get list of all tags, optionally filtered by locale
   */
  async listAllTags(locale?: string): Promise<string[]> {
    if (!this.storageProvider.listAllTags) {
      throw new Error("Storage provider does not support tags");
    }
    return await this.storageProvider.listAllTags(locale);
  }

  /**
   * Get translations by tag
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
   * Get translations by tags with possible logic selection (AND/OR)
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
   * Count translations with specified tags
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
   * Get translation with tags
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
   * Remove locale and all related translations from storage.
   * Clears cache for this locale.
   */
  async removeLocale(locale: string): Promise<boolean> {
    const result = await this.storageProvider.removeLocale(locale);
    if (result) {
      this.cacheManager.clearLocale(locale);
    }
    return result;
  }

  async updateLocale(localeData: LocaleDocument): Promise<boolean> {
    return await this.storageProvider.updateLocale(localeData);
  }

  /**
   * Get translation from provider considering version
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
    return await this.storageProvider.getTranslation(locale, key, options);
  }

  /**
   * Process translations recursively for adding to storage with tags
   */
  private async processTranslations(
    locale: string,
    prefix: string,
    translations: TranslationMap,
    versionInfo: VersionMeta,
    tags?: string[]
  ): Promise<TaggedTranslationEntry | undefined> {
    let lastAddedTranslation: TaggedTranslationEntry | undefined;

    for (const key in translations) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = translations[key];

      if (typeof value === "string") {
        // If value is a string, add to storage with tags
        lastAddedTranslation = await this.storageProvider.setTranslation(
          locale,
          fullKey,
          value,
          versionInfo,
          tags
        );
      } else if (typeof value === "object" && value !== null) {
        // Process nested objects recursively
        const nestedTranslation = await this.processTranslations(
          locale,
          fullKey,
          value as TranslationMap,
          versionInfo,
          tags
        );

        if (nestedTranslation) {
          lastAddedTranslation = nestedTranslation;
        }
      }
    }

    return lastAddedTranslation;
  }

  /**
   * Enable or disable cache
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheManager.setEnabled(enabled);
  }

  /**
   * Check if cache is enabled
   */
  isCacheEnabled(): boolean {
    return this.cacheManager.isEnabled();
  }
}
