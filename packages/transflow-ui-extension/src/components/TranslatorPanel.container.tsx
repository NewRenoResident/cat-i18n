import { useTranslatorUI } from "../context/TranslatorUIContext";
import { TranslatorPanel } from "./TranslatorPanel";

export const TranslatorPanelContainer = () => {
  const { isPanelVisible } = useTranslatorUI();
  if (!isPanelVisible) {
    return null;
  }
  return <TranslatorPanel />;
};
