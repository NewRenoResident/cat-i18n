export type TranslationOptions = {
  defaultLocale: string;
  fallbackLocale?: string;
  initialTranslations?: Record<string, Record<string, string>>;
  apiUrl?: string;
};

class TransFlowCore {
  private locale: string;
  private fallbackLocale: string;
  private translations: Record<string, Record<string, string>> = {};
  private apiUrl: string | null = null;

  constructor(options: TranslationOptions) {
    this.locale = options.defaultLocale;
    this.fallbackLocale = options.fallbackLocale || options.defaultLocale;
    this.translations = options.initialTranslations || {};
    this.apiUrl = options.apiUrl || null;
  }

  async loadLocale(locale: string): Promise<void> {
    if (!this.apiUrl) return;

    try {
      const response = await fetch(
        `${this.apiUrl}/api/translations/translations/${locale}`
      );
      console.log(this.translations);
      const result = await response.json();

      this.translations[locale] = Object.assign(
        this.translations[locale] || {},
        result.data
      );
      console.log(locale);
    } catch (error) {
      console.error(`Failed to load translations for ${locale}`, error);
    }
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  translate(key: string, variables?: Record<string, any>): string {
    // Поиск перевода в текущей локали
    let translation = this.getTranslation(key, this.locale);

    // Если перевод не найден, используем fallback локаль
    if (!translation && this.fallbackLocale !== this.locale) {
      translation = this.getTranslation(key, this.fallbackLocale);
    }

    // Если перевод всё равно не найден, вернём сам ключ
    if (!translation) {
      return key;
    }

    // Подстановка переменных
    return this.interpolate(translation, variables);
  }

  private getTranslation(key: string, locale: string): string | null {
    if (!this.translations[locale]) return null;
    return this.translations[locale][key] || null;
  }

  private interpolate(text: string, variables?: Record<string, any>): string {
    if (!variables) return text;

    return text.replace(/\{([^}]+)\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{${key}}`;
    });
  }

  async getAvailableLocales(): Promise<string[]> {
    if (!this.apiUrl) return Object.keys(this.translations);

    try {
      const response = await fetch(`${this.apiUrl}/api/translations/locales`);
      return (await response.json()).data;
    } catch (error) {
      console.error("Failed to fetch available locales", error);
      return Object.keys(this.translations);
    }
  }

  async getTranslationWithTags(
    key: string,
    locale: string
  ): Promise<{ value: string; tags: string[] }> {
    if (!this.apiUrl) {
      return { value: this.getTranslation(key, locale) || key, tags: [] };
    }

    try {
      const response = await fetch(
        `${
          this.apiUrl
        }/api/translations/translation/tags?key=${encodeURIComponent(
          key
        )}&locale=${locale}`
      );
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch translation with tags for ${key}`, error);
      return { value: this.getTranslation(key, locale) || key, tags: [] };
    }
  }
}

export { TransFlowCore };
