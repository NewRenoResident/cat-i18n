import { ThemeProvider, Theme } from "@mui/material";
import { createContext, useState, ReactNode, useMemo, useContext } from "react";
// Import both theme definitions
import {
  catppuccinTheme,
  catppuccinLightTheme,
} from "../theme/catppuccin.constant"; // Assuming both themes are in this file now
import ky, { KyInstance } from "ky";

const userId = crypto.randomUUID();

// Define the possible theme modes
type ThemeMode = "light" | "dark";

interface TranslatorUIContextType {
  isHighlightingEnabled: boolean;
  setHighlightingEnabled: (enabled: boolean) => void;
  isPanelVisible: boolean;
  setIsPanelVisible: (visible: boolean) => void;
  apiUrl: string;
  api: KyInstance;
  userId: string;
  // --- New properties for theme switching ---
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeTheme: Theme; // Expose the currently active theme object
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
  // --- State for theme mode ---
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark"); // Default to dark theme

  // Memoize the API instance creation
  const api = useMemo(
    () =>
      ky.extend({
        prefixUrl: apiUrl,
      }),
    [apiUrl]
  );

  // --- Select the active theme based on the mode ---
  // Memoize the theme object selection to avoid unnecessary re-renders
  const activeTheme = useMemo(() => {
    return themeMode === "light" ? catppuccinLightTheme : catppuccinTheme;
  }, [themeMode]);

  return (
    // --- Use the dynamically selected activeTheme ---
    <ThemeProvider theme={activeTheme}>
      <TranslatorUIContext.Provider
        value={{
          api,
          apiUrl,
          isHighlightingEnabled,
          setHighlightingEnabled,
          isPanelVisible,
          setIsPanelVisible,
          userId,
          // --- Provide theme state and setter ---
          themeMode,
          setThemeMode,
          activeTheme, // Provide the active theme object itself if needed
        }}
      >
        {children}
      </TranslatorUIContext.Provider>
    </ThemeProvider>
  );
};

export const useTranslatorUI = () => {
  const context = useContext(TranslatorUIContext);
  if (!context) {
    throw new Error(
      "useTranslatorUI must be used within a TranslatorUIProvider"
    );
  }
  return context;
};
