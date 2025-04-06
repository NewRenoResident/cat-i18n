import { useState, useCallback, useEffect } from "react";
import { TranslationData, TranslationDetail } from "../types/types";

export const useTranslationAPI = (apiUrl: string, locale: string) => {
  const [translations, setTranslations] = useState<TranslationData>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchTranslations = useCallback(
    async (currentLocale: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/translations/translations/${currentLocale}`
        );
        if (!response.ok) throw new Error("Failed to fetch translations");
        const result = await response.json();
        setTranslations(result.data || {});
      } catch (error) {
        console.error("Error fetching translations:", error);
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  const handleSelectKey = async (key: string) => {
    setSelectedKey(key);
    try {
      const response = await fetch(
        `${apiUrl}/api/translations/translation/tags?key=${encodeURIComponent(key)}&locale=${locale}`
      );
      if (response.ok) {
        const details: TranslationDetail = await response.json();
        setEditValue(details.value);
      } else {
        setEditValue(translations[key] || "");
      }
    } catch (error) {
      console.error("Error fetching translation details:", error);
      setEditValue(translations[key] || "");
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedKey || !editValue) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/translations/translation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedKey,
          locale: locale,
          value: editValue,
          userId: "translator-ui",
          versionTag: `ui-${Date.now()}`,
        }),
      });
      if (!response.ok) throw new Error("Failed to save translation");
      setTranslations((prev) => ({ ...prev, [selectedKey]: editValue }));
      alert("Translation saved successfully!");
    } catch (error) {
      console.error("Error saving translation:", error);
      alert("Error saving translation!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (locale) {
      fetchTranslations(locale);
    }
  }, [locale, fetchTranslations]);

  return {
    translations,
    selectedKey,
    editValue,
    isLoading,
    setEditValue,
    handleSelectKey,
    handleSaveChanges,
  };
};
