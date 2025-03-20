import { StorageProvider } from "@cat-i18n/shared";

export interface I18nOptions {
  locales?: string[];
  interpolation?: {
    prefix?: string;
    suffix?: string;
  };
  pluralSeparator?: string;
  storageProvider?: StorageProvider;
  disableCache?: boolean;
}

export interface TranslateOptions {
  locale: string;
  count?: number;
  defaultValue?: string;
  userId?: string;
  versionTag?: string;
  timestamp?: number;
  interpolation?: Record<string, unknown>;
}
