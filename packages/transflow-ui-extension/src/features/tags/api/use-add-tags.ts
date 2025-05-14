import { TagsRequestBody } from "@cat-i18n/shared";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { useMutation } from "@tanstack/react-query";

interface AddTagsResponse {
  success: boolean;
  data?: {
    updated: boolean;
    message: string;
  };
}

export const useAddTags = () => {
  const { api } = useTranslatorUI();
  const url = `api/translations/tags`;

  return useMutation({
    mutationFn: async (params: TagsRequestBody) => {
      try {
        const response = await api.post(url, { json: params });

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
            `Failed to add tags (status ${response.status}): ${errorBody}`
          );
        }

        const jsonData = await response.json<{
          data: AddTagsResponse;
        }>();

        return jsonData.data;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to add tags: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while adding tags");
      }
    },
  });
};
