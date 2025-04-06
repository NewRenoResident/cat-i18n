import { ThemeProvider } from "@mui/material";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { catppuccinTheme } from "../theme/catppuccin.constant";

interface TranslatorUIContextType {
  isHighlightingEnabled: boolean;
  setHighlightingEnabled: (enabled: boolean) => void;
  isPanelVisible: boolean; // <-- Добавлено
  setIsPanelVisible: (visible: boolean) => void; // <-- Добавлено
}

const TranslatorUIContext = createContext<TranslatorUIContextType | null>(null);

export const TranslatorUIProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isHighlightingEnabled, setHighlightingEnabled] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false); // <-- Добавлено начальное состояние (скрыто)

  return (
    <ThemeProvider theme={catppuccinTheme}>
      <TranslatorUIContext.Provider
        value={{
          isHighlightingEnabled,
          setHighlightingEnabled,
          isPanelVisible, // <-- Передаем в контекст
          setIsPanelVisible, // <-- Передаем в контекст
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
