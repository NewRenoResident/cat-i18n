import React from "react";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import { TranslatorPanel } from "./TranslatorPanel";
interface ITranslatorPanelContainer {
  apiUrl: string;
}

export const TranslatorPanelContainer = ({
  apiUrl,
}: ITranslatorPanelContainer) => {
  const { isPanelVisible } = useTranslatorUI();
  if (!isPanelVisible) {
    return null;
  }
  return <TranslatorPanel apiUrl={apiUrl} />;
};
