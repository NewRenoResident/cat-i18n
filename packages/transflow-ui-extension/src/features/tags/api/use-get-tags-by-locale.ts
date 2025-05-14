import { LocaleParam } from "@cat-i18n/shared";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export interface TaggedTranslationEntry {
  tags: string[];
}

export const useGetTagsByLocale = (
  params: LocaleParam,
  options?: Omit<
    UseQueryOptions<string[], Error, string[], [string, LocaleParam]>,
    "queryKey" | "queryFn"
  >
) => {
  const { api } = useTranslatorUI();
  const url = `api/translations/tags/${params.locale}`;

  return useQuery<string[], Error, string[], [string, LocaleParam]>({
    queryKey: ["tags", params],
    queryFn: async () => {
      try {
        const response = await api.get(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Tags not found for locale '${params.locale}'.`);
          }

          let errorBody = "Unknown error";
          try {
            errorBody = await response.text();
          } catch (_) {}

          throw new Error(
            `Failed to fetch tags (status ${response.status}): ${errorBody}`
          );
        }

        const jsonData = await response.json<{ data: string[] }>();
        return jsonData.data;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to fetch tags: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while fetching tags");
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
