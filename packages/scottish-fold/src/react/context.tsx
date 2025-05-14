import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { TransFlowCore, TranslationOptions, useTransFlowStore } from "../core";

type TransFlowProviderProps = {
  children: React.ReactNode;
  options: TranslationOptions;
  initializingComponent?: React.ReactNode;
};

interface TransFlowContextValue {
  t: (key: string, variables?: Record<string, any>) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  getAvailableLocales: () => Promise<string[]>;
  availableLocales: string[];
  isInitialized: boolean;
  loadLocale: (locale: string) => Promise<void>;
  loadTranslation: (key: string, locale: string) => Promise<string | null>;
}

const TransFlowContext = createContext<TransFlowContextValue | null>(null);

export const TransFlowProvider: React.FC<TransFlowProviderProps> = ({
  children,
  options,
  initializingComponent = null,
}) => {
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);

  // --- Zustand Store Interaction ---
  const storeLocale = useTransFlowStore((state) => state.locale);
  const isInitialized = useTransFlowStore((state) => state.isInitialized);
  // *** 👇 ADD THIS SUBSCRIPTION 👇 ***
  // Subscribe to the entire translations object.
  // This ensures the provider re-renders when *any* translation is loaded or updated.
  const translations = useTransFlowStore((state) => state.translations);

  // --- Initialization Effect ---
  useEffect(() => {
    console.log("TransFlowProvider: Initializing Core...");
    TransFlowCore.initialize(options);

    if (options.apiUrl) {
      console.log("TransFlowProvider: Fetching available locales on init...");
      TransFlowCore.getAvailableLocales()
        .then((locales) => {
          console.log("TransFlowProvider: Available locales fetched:", locales);
          setAvailableLocales(locales);
        })
        .catch((err) => {
          console.error(
            "TransFlowProvider: Failed to fetch initial available locales:",
            err
          );
          setAvailableLocales(Object.keys(options.initialTranslations || {}));
        });
    } else {
      const initialKeys = Object.keys(options.initialTranslations || {});
      console.log(
        "TransFlowProvider: No apiUrl, using initial translation keys as available locales:",
        initialKeys
      );
      setAvailableLocales(initialKeys);
    }
  }, [options]); // Keep dependency only on options

  // --- Actions ---

  // t function itself remains the same (useCallback with no deps)
  // It reads the latest state via getState() *when called* during a render cycle.
  const t = useCallback((key: string, variables?: Record<string, any>) => {
    if (!TransFlowCore.useStore.getState().isInitialized) {
      return key;
    }
    // This will now read the updated store state because the component
    // calling `t` will have been re-rendered by the Provider's update.
    return TransFlowCore.translate(key, variables);
  }, []);

  const setLocale = useCallback(async (newLocale: string) => {
    if (!TransFlowCore.useStore.getState().isInitialized) {
      console.error(
        "TransFlowProvider: Cannot set locale, Core not initialized."
      );
      return;
    }
    try {
      console.log(`TransFlowProvider: Setting locale to ${newLocale}...`);
      // loadLocale updates the store, triggering a re-render via the 'translations' subscription
      await TransFlowCore.loadLocale(newLocale);
      // setLocale updates the store, triggering a re-render via the 'storeLocale' subscription
      TransFlowCore.setLocale(newLocale);
      console.log(`TransFlowProvider: Locale set to ${newLocale}.`);
    } catch (error) {
      console.error(
        `TransFlowProvider: Failed to set locale to ${newLocale}:`,
        error
      );
    }
  }, []);

  const getAvailableLocales = useCallback(async () => {
    if (!TransFlowCore.useStore.getState().isInitialized) {
      console.error(
        "TransFlowProvider: Cannot get available locales, Core not initialized."
      );
      return [];
    }
    console.log("TransFlowProvider: Re-fetching available locales...");
    try {
      const locales = await TransFlowCore.getAvailableLocales();
      setAvailableLocales(locales);
      console.log("TransFlowProvider: Available locales updated:", locales);
      return locales;
    } catch (error) {
      console.error(
        "TransFlowProvider: Failed to fetch available locales:",
        error
      );
      setAvailableLocales([]);
      return [];
    }
  }, []);

  const loadLocale = useCallback(async (localeToLoad: string) => {
    if (!TransFlowCore.useStore.getState().isInitialized) {
      console.error(
        "TransFlowProvider: Cannot load locale, Core not initialized."
      );
      return;
    }
    // This updates the store, triggering a re-render via the 'translations' subscription
    await TransFlowCore.loadLocale(localeToLoad);
  }, []);

  const loadTranslation = useCallback(
    async (key: string, localeToLoad: string) => {
      if (!TransFlowCore.useStore.getState().isInitialized) {
        console.error(
          "TransFlowProvider: Cannot load translation, Core not initialized."
        );
        return null;
      }
      // This updates the store, triggering a re-render via the 'translations' subscription
      return TransFlowCore.loadTranslation({ key, locale: localeToLoad });
    },
    []
  );

  // --- Context Value ---
  // Memoize the context value. It will now recalculate if storeLocale,
  // isInitialized, availableLocales, OR the 'translations' object changes.
  const contextValue = useMemo<TransFlowContextValue>(
    () => ({
      t,
      locale: storeLocale,
      setLocale,
      getAvailableLocales,
      availableLocales,
      isInitialized,
      loadLocale,
      loadTranslation,
    }),
    [
      t, // t reference doesn't change, but included for completeness
      storeLocale,
      setLocale, // function reference doesn't change
      getAvailableLocales, // function reference doesn't change
      availableLocales, // local state
      isInitialized,
      loadLocale, // function reference doesn't change
      loadTranslation, // function reference doesn't change
      // *** 👇 ADD DEPENDENCY 👇 ***
      translations, // Add the translations object as a dependency
    ]
  );

  // --- Render ---
  if (!isInitialized && initializingComponent) {
    return <>{initializingComponent}</>;
  }

  return (
    <TransFlowContext.Provider value={contextValue}>
      {children}
    </TransFlowContext.Provider>
  );
};

export const useTransFlow = (): TransFlowContextValue => {
  const context = useContext(TransFlowContext);
  if (!context) {
    throw new Error("useTransFlow must be used within a TransFlowProvider");
  }
  return context;
};
