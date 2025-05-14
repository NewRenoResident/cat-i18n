import { LocaleAndKeyParams } from "@cat-i18n/shared";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { useQuery, UseQueryOptions } from "@tanstack/react-query"; // Import UseQueryOptions

export const useGetVersionHistory = (
  params: LocaleAndKeyParams,
  options?: Omit<
    UseQueryOptions<
      VersionInfo[],
      Error,
      VersionInfo[],
      (string | LocaleAndKeyParams)[]
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { api } = useTranslatorUI();
  const url = `api/translations/translation/versions/${params.locale}/${params.key}`;

  return useQuery<
    VersionInfo[],
    Error,
    VersionInfo[],
    (string | LocaleAndKeyParams)[]
  >({
    queryKey: ["history", params],
    queryFn: async () => {
      try {
        const response = await api.get(url); // Assuming api.get returns a Response-like object
        if (!response.ok) {
          // Check if the response status is not OK (e.g., 404, 500)
          if (response.status === 404) {
            throw new Error(
              `Translation not found for key '${params.key}' in locale '${params.locale}'.`
            );
          }
          // Attempt to get error message from response body if possible
          let errorBody = "Unknown error";
          try {
            errorBody = await response.text(); // or response.json() if error details are in JSON
          } catch (_) {
            /* ignore */
          }
          throw new Error(
            `Failed to fetch translation (status ${response.status}): ${errorBody}`
          );
        }
        // Ensure response.json<T>() is the correct way to parse JSON for your api client
        // If api.get already returns parsed JSON, adjust accordingly
        const jsonData = await response.json<{ data: VersionInfo[] }>();
        return jsonData.data;
      } catch (error) {
        // Rethrow specific errors or a generic one
        if (error instanceof Error) {
          // No need to check for 'response' property if using standard Fetch API or similar
          // The check above handles HTTP errors
          throw new Error(`Failed to fetch history: ${error.message}`);
        }
        // Catch non-Error throws if necessary
        throw new Error("An unexpected error occurred while fetching history");
      }
    },
    // Spread any additional options passed to the hook
    ...options,
  });
};

// Keep VersionInfo interface if not already imported from shared types
export interface VersionInfo {
  userId: string;
  timestamp: number;
  tag?: string;
  key: string;
  value: string;
}
