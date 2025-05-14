import React from "react";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TranslatorPanel } from "../features/panel/ui/translator-panel";

export const TranslatorPanelContainer = () => {
  const queryClient = new QueryClient();

  const { isPanelVisible } = useTranslatorUI();
  if (!isPanelVisible) {
    return null;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <TranslatorPanel />
    </QueryClientProvider>
  );
};
