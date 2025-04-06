import React, { createContext, useContext, useState, useEffect } from "react";
import { TransFlowCore, TranslationOptions } from "../core";

type TransFlowProviderProps = {
  children: React.ReactNode;
  options: TranslationOptions;
};

const TransFlowContext = createContext<{
  t: (key: string, variables?: Record<string, any>) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  getAvailableLocales: () => Promise<string[]>;
} | null>(null);

export const TransFlowProvider: React.FC<TransFlowProviderProps> = ({
  children,
  options,
}) => {
  const [transFlow] = useState(() => new TransFlowCore(options));
  const [locale, setLocaleState] = useState(options.defaultLocale);

  useEffect(() => {
    transFlow.loadLocale(options.defaultLocale);
  }, []);

  const setLocale = async (newLocale: string) => {
    await transFlow.loadLocale(newLocale);
    transFlow.setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const t = (key: string, variables?: Record<string, any>) => {
    return transFlow.translate(key, variables);
  };

  const getAvailableLocales = () => {
    return transFlow.getAvailableLocales();
  };

  return (
    <TransFlowContext.Provider
      value={{ t, locale, setLocale, getAvailableLocales }}
    >
      {children}
    </TransFlowContext.Provider>
  );
};

export const useTransFlow = () => {
  const context = useContext(TransFlowContext);
  if (!context) {
    throw new Error("useTransFlow must be used within a TransFlowProvider");
  }
  return context;
};
