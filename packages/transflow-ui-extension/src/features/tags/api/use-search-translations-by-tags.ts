import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { z } from "zod";
import { useTranslatorUI } from "../../../context/TranslatorUIContext"; // Предполагается, что путь корректен
import { SearchByTagsBody } from "@cat-i18n/shared";

// Определяем ожидаемую структуру ответа от translations
export interface TranslationsObject {
  [key: string]: any; // Или более конкретный тип, например, string или сложный объект перевода
}

// Определяем возможную структуру ответа API
interface ApiResponse {
  data?: TranslationsObject; // Поле data может быть опциональным
  [key: string]: any; // Позволяет иметь другие поля или быть непосредственно TranslationsObject
}

export interface SearchTranslationsResponse extends TranslationsObject {}

export const useSearchTranslationsByTags = (
  options?: Omit<
    UseMutationOptions<SearchTranslationsResponse, Error, SearchByTagsBody>,
    "mutationFn"
  >
): UseMutationResult<SearchTranslationsResponse, Error, SearchByTagsBody> => {
  const { api } = useTranslatorUI();
  const mutationFn = async (
    body: SearchByTagsBody
  ): Promise<SearchTranslationsResponse> => {
    const url = `api/translations/search/tags`;

    try {
      const response = await api.post(url, {
        json: body,
      });

      if (!response.ok) {
        let errorBody = "Unknown error";
        try {
          errorBody = await response.text();
        } catch (e) {
          // Игнорируем, если тело ошибки не может быть прочитано
        }
        throw new Error(
          `Failed to search translations by tags (status ${response.status}): ${errorBody}`
        );
      }

      // Указываем ожидаемый тип для jsonData
      const jsonData: ApiResponse = await response.json<ApiResponse>();

      // Логика извлечения данных: если есть jsonData.data, используем его,
      // иначе используем сам jsonData (если это объект переводов напрямую),
      // в крайнем случае возвращаем пустой объект.
      return (
        jsonData.data ??
        (typeof jsonData === "object" && jsonData !== null && !jsonData.data
          ? (jsonData as TranslationsObject)
          : {})
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors
          .map((err) => `${err.path.join(".")} - ${err.message}`)
          .join("; ");
        throw new Error(`Invalid request body: ${formattedErrors}`);
      }
      if (error instanceof Error) {
        // Можно было бы сохранить оригинальное сообщение об ошибке, если оно более информативно
        throw new Error(`Failed to search translations: ${error.message}`);
      }
      throw new Error(
        "An unexpected error occurred while searching translations by tags"
      );
    }
  };

  return useMutation<SearchTranslationsResponse, Error, SearchByTagsBody>({
    mutationFn,
    ...options,
  });
};
