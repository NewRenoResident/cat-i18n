import { TranslationMap } from "../types";

export function resolveKey(
  translations: TranslationMap,
  key: string
): string | undefined {
  const parts = key.split(".");
  let current: any = translations;

  for (const part of parts) {
    if (current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}
