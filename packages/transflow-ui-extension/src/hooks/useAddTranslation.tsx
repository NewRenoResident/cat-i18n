import { AddTranslationsBody } from "@cat-i18n/shared";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

export type AddTranslationResponse = {
  success: boolean;
  translationId?: string;
  message?: string;
};

export const useAddTranslation = (
  options?: UseMutationOptions<
    AddTranslationResponse,
    Error,
    AddTranslationsBody
  >
) => {
  const { api } = useTranslatorUI();

  return useMutation<AddTranslationResponse, Error, AddTranslationsBody>({
    mutationKey: ["addTranslation"],
    mutationFn: async (translationData: AddTranslationsBody) => {
      try {
        const response = await api.post("api/translations/translations", {
          body: JSON.stringify(translationData),
          headers: {
            "Content-Type": "application/json",
          },
        });

        return await response.json<AddTranslationResponse>();
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to add translation: ${error.message}`);
        }
        throw new Error("Network error while adding translation");
      }
    },
    ...options,
  });
};
