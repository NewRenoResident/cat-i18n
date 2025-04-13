import ky from "ky";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";

interface AddLocaleRequest {
  code: string;
  name: string;
  nativeName: string;
}

interface AddLocaleResponse {
  success: boolean;
  error?: string;
}

export const useAddLocaleMutation = () => {
  const queryClient = useQueryClient();
  const { api } = useTranslatorUI();
  const { getAvailableLocales } = useTransFlow();

  return useMutation<AddLocaleResponse, Error, AddLocaleRequest>({
    mutationFn: async ({ code, name, nativeName }: AddLocaleRequest) => {
      try {
        const response = await api.post("api/translations/locales", {
          json: { code, name, nativeName },
        });

        // Предполагаем, что API возвращает ответ в формате JSON
        // Если API возвращает 204 No Content, можно заменить на:
        // return { success: true };
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
      // Optional: Handle errors globally here (e.g., show a toast notification)
      console.error(`Error deleting locale ${variables}:`, error);
    },
  });
};
export const useUpdateMutation = () => {
  const queryClient = useQueryClient();
  const { api } = useTranslatorUI();
  const { getAvailableLocales } = useTransFlow();

  return useMutation<AddLocaleResponse, Error, AddLocaleRequest>({
    mutationFn: async ({ code, name, nativeName }: AddLocaleRequest) => {
      try {
        const response = await api.put("api/translations/locales", {
          json: { code, name, nativeName },
        });

        // Предполагаем, что API возвращает ответ в формате JSON
        // Если API возвращает 204 No Content, можно заменить на:
        // return { success: true };
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
