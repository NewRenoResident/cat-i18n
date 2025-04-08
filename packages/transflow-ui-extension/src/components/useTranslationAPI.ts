import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TranslationData, TranslationDetail } from "../types/types";

export const useTranslationAPI = (apiUrl: string, locale: string) => {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Запрос на получение всех переводов для указанной локали
  const {
    data: translations = {},
    isLoading: isLoadingTranslations,
    refetch: refetchTranslations,
  } = useQuery<TranslationData>({
    queryKey: ["translations", locale],
    queryFn: async () => {
      const response = await fetch(
        `${apiUrl}/api/translations/translations/${locale}`
      );
      if (!response.ok) throw new Error("Failed to fetch translations");
      const result = await response.json();
      return result.data || {};
    },
    enabled: !!locale,
  });

  // Запрос на получение детальной информации о переводе
  const { isLoading: isLoadingDetails } = useQuery<TranslationDetail>({
    queryKey: ["translationDetail", selectedKey, locale],
    queryFn: async () => {
      if (!selectedKey) throw new Error("No key selected");

      const response = await fetch(
        `${apiUrl}/api/translations/translation/tags?key=${encodeURIComponent(selectedKey)}&locale=${locale}`
      );

      if (!response.ok) {
        // Если детали недоступны, используем значение из общего списка переводов
        setEditValue(translations[selectedKey] || "");
        throw new Error("Failed to fetch translation details");
      }

      const details = await response.json();
      setEditValue(details.value);
      return details;
    },
    enabled: !!selectedKey && !!locale,
  });

  useEffect(() => {
    if (selectedKey && isLoadingDetails === false) {
      const queryState = queryClient.getQueryState([
        "translationDetail",
        selectedKey,
        locale,
      ]);
      if (queryState?.status === "error") {
        setEditValue(translations[selectedKey] || "");
      }
    }
  }, [selectedKey, isLoadingDetails, queryClient, locale, translations]);

  // Мутация для сохранения изменений перевода
  const { mutate: saveChanges, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!selectedKey || !editValue) throw new Error("Missing key or value");

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
      return response.json();
    },
    onSuccess: () => {
      // Обновляем кеш для отображения изменений без перезагрузки
      queryClient.setQueryData<TranslationData>(
        ["translations", locale],
        (oldData) => {
          if (!oldData || !selectedKey) return oldData;
          return { ...oldData, [selectedKey]: editValue };
        }
      );

      // Инвалидируем кеш деталей, чтобы они обновились при следующем запросе
      queryClient.invalidateQueries({
        queryKey: ["translationDetail", selectedKey, locale],
      });

      alert("Translation saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving translation:", error);
      alert("Error saving translation!");
    },
  });

  const handleSelectKey = (key: string) => {
    setSelectedKey(key);
  };

  const handleSaveChanges = () => {
    saveChanges();
  };

  const isLoading = isLoadingTranslations || isLoadingDetails || isSaving;

  return {
    translations,
    selectedKey,
    editValue,
    isLoading,
    setEditValue,
    handleSelectKey,
    handleSaveChanges,
    refetchTranslations,
  };
};
