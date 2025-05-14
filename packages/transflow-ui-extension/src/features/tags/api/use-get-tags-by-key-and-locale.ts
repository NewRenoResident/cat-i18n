import { LocaleAndKeyParams, TaggedTranslationEntry } from "@cat-i18n/shared";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const useGetTagsByKeyAndLocale = (
  params: LocaleAndKeyParams,
  options?: Omit<
    UseQueryOptions<
      TaggedTranslationEntry,
      Error,
      TaggedTranslationEntry,
      (string | LocaleAndKeyParams)[]
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { api } = useTranslatorUI();
  const url = `api/translations/translation/tags?key=${params.key}&locale=${params.locale}`;
  return useQuery<
    TaggedTranslationEntry,
    Error,
    TaggedTranslationEntry,
    (string | LocaleAndKeyParams)[]
  >({
    queryKey: ["tags", params],
    queryFn: async () => {
      try {
        const response = await api.get(url);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              `Translation not found for key '${params.key}' in locale '${params.locale}'.`
            );
          }
          let errorBody = "Unknown error";
          try {
            errorBody = await response.text();
          } catch (_) {}
          throw new Error(
            `Failed to fetch translation (status ${response.status}): ${errorBody}`
          );
        }
        const jsonData = await response.json<{
          data: TaggedTranslationEntry;
        }>();
        return jsonData.data;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to fetch history: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while fetching history");
      }
    },
    ...options,
  });
};

export interface VersionInfo {
  userId: string;
  timestamp: number;
  tag?: string;
  key: string;
  value: string;
}
