export type TranslationData = { [key: string]: string };

export type TranslationDetail = {
  value: string;
  tags: string[];
};

export interface TranslatorPanelProps {
  apiUrl: string;
}
