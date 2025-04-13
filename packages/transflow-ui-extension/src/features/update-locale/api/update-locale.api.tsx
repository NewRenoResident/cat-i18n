import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import {
  AddLocaleRequest,
  AddLocaleResponse,
} from "../../add-locale/api/add-locales.api";

export const useUpdateMutation = () => {
  const queryClient = useQueryClient();
  const { api } = useTranslatorUI();
  const { getAvailableLocales } = useTransFlow();

  return useMutation<AddLocaleResponse, Error, AddLocaleRequest>({
    mutationFn: async ({ code, name, nativeName }: AddLocaleRequest) => {
      try {
        const response = await api.put(`api/translations/locales/${code}`, {
          json: { name, nativeName },
        });

        return await response.json<AddLocaleResponse>();
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to add locale: ${error.message}`);
        }
        throw new Error("Failed to add locale");
      }
    },
    onSuccess: () => {
      // Инвалидируем запросы, связанные с локалями, чтобы они обновились
      queryClient.invalidateQueries({ queryKey: ["locales"] });
      getAvailableLocales();
    },
  });
};
