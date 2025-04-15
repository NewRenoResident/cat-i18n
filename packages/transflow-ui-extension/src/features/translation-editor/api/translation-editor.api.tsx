import { useQuery } from "@tanstack/react-query";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { TranslationRequestQuery } from "@cat-i18n/shared";

/**
 * Хук для получения перевода с использованием React Query и ky
 * @param params - Параметры запроса перевода
 * @param options - Дополнительные опции для useQuery
 * @returns Query объект React Query
 */
export const useGetTranslation = (
  params: TranslationRequestQuery,
  options = {}
) => {
  const { api } = useTranslatorUI();

  const queryParams = new URLSearchParams(
    params as unknown as Record<string, string>
  );
  const queryString = queryParams.toString();

  const url = `api/translation${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: ["translation", params],
    queryFn: async () => {
      try {
        const response = await api.get(url);

        return await response.json<TranslationResponse>();
      } catch (error) {
        if (error instanceof Error) {
          if ("response" in error && (error as any).response?.status === 404) {
            throw new Error(
              `Translation not found for key '${params.key}' in locale '${params.locale}'.`
            );
          }

          throw new Error(`Failed to fetch translation: ${error.message}`);
        }

        throw new Error("Network error while fetching translation");
      }
    },
    ...options,
  });
};
