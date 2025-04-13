import { ThemeProvider } from "@mui/material";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { catppuccinTheme } from "../theme/catppuccin.constant";
import ky, { KyInstance } from "ky";

interface TranslatorUIContextType {
  isHighlightingEnabled: boolean;
  setHighlightingEnabled: (enabled: boolean) => void;
  isPanelVisible: boolean;
  setIsPanelVisible: (visible: boolean) => void;
  apiUrl: string;
  api: KyInstance;
}

const TranslatorUIContext = createContext<TranslatorUIContextType | null>(null);

export const TranslatorUIProvider = ({
  children,
  apiUrl,
}: {
  children: ReactNode;
  apiUrl: string;
}) => {
  const [isHighlightingEnabled, setHighlightingEnabled] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const api = ky.extend({
    prefixUrl: apiUrl,
  });

  return (
    <ThemeProvider theme={catppuccinTheme}>
      <TranslatorUIContext.Provider
        value={{
          api,
          apiUrl,
          isHighlightingEnabled,
          setHighlightingEnabled,
          isPanelVisible,
          setIsPanelVisible,
        }}
      >
        {children}
      </TranslatorUIContext.Provider>
    </ThemeProvider>
  );
};

// Хук useTranslatorUI остается без изменений
export const useTranslatorUI = () => {
  const context = useContext(TranslatorUIContext);
  if (!context) {
    throw new Error(
      "useTranslatorUI must be used within a TranslatorUIProvider"
    );
  }
  return context;
};
