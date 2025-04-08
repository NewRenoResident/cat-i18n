import React from "react";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import { TranslatorPanel } from "./TranslatorPanel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
