import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { useTransFlow } from "@cat-i18n/scottish-fold";

export const useRemoveLocaleMutation = () => {
  const queryClient = useQueryClient();
  const { api } = useTranslatorUI();
  const { getAvailableLocales } = useTransFlow();

  return useMutation<void, Error, string>({
    mutationFn: async (locale: string) => {
      const response = await api.delete(`api/translations/locales/${locale}`);

      if (!response.ok) {
        let errorPayload: any = {};
        try {
          errorPayload = await response.json();
        } catch (e) {}
        throw new Error(
          `Failed to delete locale ${locale}: ${response.status} ${response.statusText}`,
          { cause: errorPayload }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locales"] });
      getAvailableLocales();
    },
    onError: (error, variables, context) => {
      console.error(`Error deleting locale ${variables}:`, error);
    },
  });
};
