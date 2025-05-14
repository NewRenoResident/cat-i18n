import { create } from "zustand";
import { TranslationRequestQuery } from "@cat-i18n/shared"; // Assuming this path is correct

export type TranslationOptions = {
  defaultLocale: string;
  fallbackLocale?: string;
  initialTranslations?: Record<string, Record<string, string>>;
  apiUrl?: string;
};

interface TransFlowState {
  locale: string;
  fallbackLocale: string;
  translations: Record<string, Record<string, string>>;
  apiUrl: string | null;
  isInitialized: boolean; // To track if initial options are set
}

interface TransFlowActions {
  initialize: (options: TranslationOptions) => void;
  setLocale: (locale: string) => void;
  loadTranslation: (query: TranslationRequestQuery) => Promise<string | null>;
  loadLocale: (locale: string) => Promise<void>;
  getAvailableLocales: () => Promise<string[]>;
  getTranslationWithTags: (
    key: string,
    locale: string
  ) => Promise<{ value: string; tags: string[] }>;
}

const interpolate = (text: string, variables?: Record<string, any>): string => {
  if (!variables) return text;

  return text.replace(/\{([^}]+)\}/g, (_, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] !== undefined
      ? String(variables[trimmedKey])
      : `{${trimmedKey}}`;
  });
};

const useTransFlowStore = create<TransFlowState & TransFlowActions>(
  (set, get) => ({
    locale: "",
    fallbackLocale: "",
    translations: {},
    apiUrl: null,
    isInitialized: false,

    initialize: (options: TranslationOptions) => {
      // Warning moved to TransFlowCore.initialize for better user visibility
      // if (get().isInitialized) {
      //   console.warn(
      //     "TransFlow store already initialized. Re-initialization might override settings."
      //   );
      // }
      set({
        locale: options.defaultLocale,
        fallbackLocale: options.fallbackLocale || options.defaultLocale,
        translations: options.initialTranslations || {},
        apiUrl: options.apiUrl || null,
        isInitialized: true,
      });
    },

    setLocale: (locale: string) => set({ locale }),

    loadTranslation: async ({ key, locale }) => {
      const { apiUrl } = get();
      if (!apiUrl) {
        // console.warn - Keep console messages less verbose unless necessary for debugging
        // console.warn(
        //   "apiUrl is not configured. Cannot load translation from API."
        // );
        return null;
      }

      try {
        const url = `${apiUrl}/api/translations/translation?key=${encodeURIComponent(key)}&locale=${locale}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.error(
            `HTTP error loading translation ${key} for ${locale}: ${response.status}`
          );
          return null; // Return null on HTTP error
        }
        const result = await response.json();
        console.log("result", result);

        if (result.success && result.data?.translation) {
          const newTranslation = result.data.translation;
          set((state) => ({
            translations: {
              ...state.translations,
              [locale]: {
                ...(state.translations[locale] || {}),
                [key]: newTranslation,
              },
            },
          }));
          return newTranslation;
        }
        // Log if API call succeeded but didn't return expected data
        if (!result.success) {
          console.warn(
            `API indicated failure loading translation ${key} for ${locale}. Message: ${result.message || "N/A"}`
          );
        }
        return null;
      } catch (error) {
        console.error(
          `Failed to fetch/parse translation for key: ${key}, locale: ${locale}`,
          error
        );
        return null;
      }
    },

    loadLocale: async (locale: string) => {
      const { apiUrl } = get();
      if (!apiUrl) {
        // console.warn("apiUrl is not configured. Cannot load locale from API.");
        return;
      }
      // Avoid reloading if locale data seems present (basic check)
      // More sophisticated checks might be needed depending on requirements
      if (
        get().translations[locale] &&
        Object.keys(get().translations[locale]).length > 0
      ) {
        // console.log(`Locale ${locale} seems already loaded or initialized. Skipping API fetch.`);
        // return; // Uncomment if you want to strictly avoid refetching
      }

      try {
        const url = `${apiUrl}/api/translations/translations/${locale}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.error(
            `HTTP error loading locale ${locale}: ${response.status}`
          );
          return; // Stop execution on HTTP error
        }
        const result = await response.json();

        if (result.success && result.data) {
          const localeTranslations = result.data;
          // Check if data is an object before merging
          if (
            typeof localeTranslations === "object" &&
            localeTranslations !== null
          ) {
            set((state) => ({
              translations: {
                ...state.translations,
                [locale]: {
                  ...(state.translations[locale] || {}),
                  ...localeTranslations, // Merge new translations
                },
              },
            }));
          } else {
            console.warn(
              `Received non-object data for locale ${locale}. Skipping update.`
            );
          }
        } else {
          console.warn(
            `Failed to load translations for locale ${locale}: API indicated failure or missing/invalid data. Message: ${result.message || "N/A"}`
          );
        }
      } catch (error) {
        console.error(
          `Failed to fetch/parse translations for ${locale}`,
          error
        );
      }
    },

    getAvailableLocales: async (): Promise<string[]> => {
      const { apiUrl, translations } = get();
      const localLocales = Object.keys(translations);

      if (!apiUrl) {
        // console.warn( // Keep console less verbose
        //   "apiUrl is not configured. Returning locales from initial/loaded translations."
        // );
        return localLocales;
      }

      try {
        const response = await fetch(`${apiUrl}/api/translations/locales`);
        if (!response.ok) {
          console.error(
            `HTTP error fetching available locales: ${response.status}`
          );
          return localLocales; // Fallback to local keys on error
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          return result.data;
        } else {
          console.warn(
            "Failed to fetch available locales from API or invalid format. Falling back to local keys.",
            result.message || "" // Log API message if available
          );
          return localLocales;
        }
      } catch (error) {
        console.error("Failed to fetch/parse available locales", error);
        return localLocales; // Fallback on exception
      }
    },

    getTranslationWithTags: async (
      key: string,
      locale: string
    ): Promise<{ value: string; tags: string[] }> => {
      const { apiUrl, translations, fallbackLocale } = get();
      const localTranslation =
        translations[locale]?.[key] || translations[fallbackLocale]?.[key]; // Check fallback locale too
      const fallbackValue = { value: localTranslation || key, tags: [] };

      if (!apiUrl) {
        // console.warn( // Keep console less verbose
        //   "apiUrl is not configured. Cannot fetch translation with tags from API."
        // );
        return fallbackValue;
      }

      try {
        const url = `${apiUrl}/api/translations/translation/tags?key=${encodeURIComponent(key)}&locale=${locale}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.error(
            `HTTP error fetching tags for ${key}/${locale}: ${response.status}`
          );
          return fallbackValue; // Return fallback on error
        }
        const result = await response.json();
        if (result.success && result.data) {
          // Ensure defaults if API returns partial data
          const value = result.data.value ?? localTranslation ?? key; // Prioritize API value, then local, then key
          const tags = Array.isArray(result.data.tags) ? result.data.tags : [];
          return { value, tags };
        } else {
          console.warn(
            `Failed to fetch translation with tags for ${key}/${locale} from API or invalid format. Using fallback. Message: ${result.message || "N/A"}`
          );
          return fallbackValue;
        }
      } catch (error) {
        console.error(
          `Failed to fetch/parse translation with tags for ${key}/${locale}`,
          error
        );
        return fallbackValue;
      }
    },
  })
);

// --- TransFlowCore ---

const TransFlowCore = {
  initialize: (options: TranslationOptions): void => {
    const state = useTransFlowStore.getState();
    if (state.isInitialized) {
      console.warn(
        "TransFlowCore already initialized. Re-initialization will override settings and trigger data fetching again."
      );
      // Allow re-initialization if needed, but warn the user.
    }

    if (!options || !options.defaultLocale) {
      console.error(
        "TransFlowCore initialization failed: 'options' object with 'defaultLocale' is required."
      );
      return;
    }

    // 1. Set initial state in the store
    state.initialize(options);

    // 2. Trigger loading translations for the default locale (async, fire-and-forget)
    // We don't await this in initialize to keep initialize synchronous.
    // Errors are handled within loadLocale.
    console.log(
      `TransFlowCore: Initializing and loading locale '${options.defaultLocale}'...`
    );
    state.loadLocale(options.defaultLocale).catch((error) => {
      // Add extra catch here for visibility during initialization phase
      console.error(
        `TransFlowCore: Initial loadLocale for ${options.defaultLocale} failed during initialization.`,
        error
      );
    });

    // 3. Trigger fetching available locales (async, fire-and-forget)
    // The result isn't stored directly here; components/hooks should call
    // getAvailableLocales() when they need the list. This just starts the fetch early.
    // Errors are handled within getAvailableLocales.
    console.log(`TransFlowCore: Fetching available locales...`);
    state.getAvailableLocales().catch((error) => {
      // Add extra catch here for visibility during initialization phase
      console.error(
        "TransFlowCore: Initial fetch of available locales failed during initialization.",
        error
      );
    });
  },

  setLocale: (locale: string): void => {
    if (!useTransFlowStore.getState().isInitialized) {
      console.error("TransFlowCore not initialized. Call initialize() first.");
      return;
    }
    useTransFlowStore.getState().setLocale(locale);
    // Optionally: Automatically load the new locale if not already loaded
    // useTransFlowStore.getState().loadLocale(locale); // Uncomment to enable auto-loading on setLocale
  },

  getLocale: (): string => {
    if (!useTransFlowStore.getState().isInitialized) {
      // Return default or empty string instead of erroring? Depends on desired behavior.
      console.warn(
        "TransFlowCore not initialized. Call initialize() first. Returning empty string."
      );
      return "";
    }
    return useTransFlowStore.getState().locale;
  },

  translate: (key: string, variables?: Record<string, any>): string => {
    if (!useTransFlowStore.getState().isInitialized) {
      // Return key if not initialized, common practice for i18n libraries
      // console.error("TransFlowCore not initialized. Call initialize() first.");
      return key;
    }
    const { locale, fallbackLocale, translations } =
      useTransFlowStore.getState();

    const getTranslation = (k: string, l: string): string | null => {
      return translations[l]?.[k] ?? null; // Use nullish coalescing
    };

    let translation = getTranslation(key, locale);

    // Only check fallback if primary locale failed AND fallback is different
    if (translation === null && fallbackLocale && fallbackLocale !== locale) {
      translation = getTranslation(key, fallbackLocale);
    }

    // If still no translation, return the key itself
    if (translation === null) {
      // Optionally log missing keys in development?
      // if (process.env.NODE_ENV === 'development') {
      //    console.warn(`Translation missing for key: "${key}" in locale: "${locale}" (and fallback: "${fallbackLocale}")`);
      // }
      return key;
    }

    return interpolate(translation, variables);
  },

  loadTranslation: (query: TranslationRequestQuery): Promise<string | null> => {
    if (!useTransFlowStore.getState().isInitialized) {
      console.error("TransFlowCore not initialized. Call initialize() first.");
      return Promise.resolve(null);
    }
    return useTransFlowStore.getState().loadTranslation(query);
  },

  loadLocale: (locale: string): Promise<void> => {
    if (!useTransFlowStore.getState().isInitialized) {
      console.error("TransFlowCore not initialized. Call initialize() first.");
      return Promise.resolve();
    }
    return useTransFlowStore.getState().loadLocale(locale);
  },

  getAvailableLocales: (): Promise<string[]> => {
    if (!useTransFlowStore.getState().isInitialized) {
      console.error("TransFlowCore not initialized. Call initialize() first.");
      return Promise.resolve([]);
    }
    return useTransFlowStore.getState().getAvailableLocales();
  },

  getTranslationWithTags: (
    key: string,
    locale?: string // Make locale optional, defaults to current locale
  ): Promise<{ value: string; tags: string[] }> => {
    const state = useTransFlowStore.getState();
    const targetLocale = locale || state.locale; // Use provided locale or current store locale

    if (!state.isInitialized) {
      console.error("TransFlowCore not initialized. Call initialize() first.");
      // Provide a sensible fallback even when not initialized
      const localValue =
        state.translations[targetLocale]?.[key] ||
        state.translations[state.fallbackLocale]?.[key] ||
        key;
      return Promise.resolve({ value: localValue, tags: [] });
    }
    // Pass the determined locale to the store action
    return state.getTranslationWithTags(key, targetLocale);
  },

  // Expose the Zustand hook directly for use in components
  useStore: useTransFlowStore,
};

Object.freeze(TransFlowCore); // Freeze the public API

export { TransFlowCore, useTransFlowStore }; // Export hook too if needed elsewhere
