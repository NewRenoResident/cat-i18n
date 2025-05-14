import { useMutation } from "@tanstack/react-query";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { TagsRequestBody } from "@cat-i18n/shared";

export const useDeleteTags = () => {
  const { api } = useTranslatorUI();
  const url = `api/translations/tags`;

  return useMutation({
    mutationFn: async (params: TagsRequestBody) => {
      try {
        const response = await api.delete(url, { json: params });

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
            `Failed to delete tags (status ${response.status}): ${errorBody}`
          );
        }

        const jsonData = await response.json<{
          updated: boolean;
          message: string;
        }>();

        return jsonData;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to delete tags: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while deleting tags");
      }
    },
  });
};
