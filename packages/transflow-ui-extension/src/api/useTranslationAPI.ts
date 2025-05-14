import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TranslationData, TranslationDetail } from "../types/types";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import { useTranslationStore } from "./useTranslationApiStore";

export const useTranslationAPI = (value?: string) => {
  const { apiUrl } = useTranslatorUI();
  const { locale } = useTransFlow();
  const queryClient = useQueryClient();

  const { selectedKey, setSelectedKey } = useTranslationStore();

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

  const { mutate: saveChanges, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!selectedKey || !value) throw new Error("Missing key or value");

      const response = await fetch(`${apiUrl}/api/translations/translation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedKey,
          locale: locale,
          value: value,
          userId: "translator-ui",
          versionTag: `ui-${Date.now()}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to save translation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData<TranslationData>(
        ["translations", locale],
        (oldData) => {
          if (!oldData || !selectedKey) return oldData;
          return { ...oldData, [selectedKey]: value };
        }
      );

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

  const isLoading = isLoadingTranslations || isSaving;

  return {
    translations,
    selectedKey,
    isLoading,
    handleSelectKey,
    handleSaveChanges,
    refetchTranslations,
  };
};
