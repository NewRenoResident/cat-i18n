import ky from "ky";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTransFlow } from "@cat-i18n/scottish-fold";

interface AddLocaleRequest {
  code: string;
  name: string;
  nativeName: string;
}

interface AddLocaleResponse {
  success: boolean;
  error?: string;
}

export const useAddLocaleMutation = (api: string) => {
  const queryClient = useQueryClient();
  const { getAvailableLocales } = useTransFlow();

  return useMutation<AddLocaleResponse, Error, AddLocaleRequest>({
    mutationFn: async ({ code, name, nativeName }: AddLocaleRequest) => {
      try {
        const response = await ky.post(api + "/api/translations/locales", {
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
