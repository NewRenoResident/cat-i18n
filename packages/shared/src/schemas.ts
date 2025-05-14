import { z } from "zod";

// Shared parameter schemas
export const localeParam = z.object({
  locale: z
    .string({ required_error: "Locale parameter is required" })
    .min(1, "Locale parameter cannot be empty"),
});

export const localeAndKeyParams = z.object({
  locale: z
    .string({ required_error: "Locale parameter is required" })
    .min(1, "Locale parameter cannot be empty"),
  key: z
    .string({ required_error: "Key parameter is required" })
    .min(1, "Key parameter cannot be empty"),
});

export const aiTranslateBody = z.object({
  locale: z.string().min(1, "Locale code cannot be empty"),
  userId: z.string().min(1, "User ID cannot be empty"),
});

export const keyAndLocaleQuery = z.object({
  key: z
    .string({ required_error: "Key query parameter is required" })
    .min(1, "Key query parameter cannot be empty"),
  locale: z
    .string({ required_error: "Locale query parameter is required" })
    .min(1, "Locale query parameter cannot be empty"),
});

// Request body schemas
export const addTranslationsBody = z.object({
  locale: z
    .string({ required_error: "locale is required" })
    .min(1, "locale cannot be empty"),
  translations: z.record(
    z.string().min(1, "Translation key cannot be empty"),
    z.string(), // Translation value can be empty string
    { required_error: "translations object is required" }
  ),
  userId: z
    .string({ required_error: "userId is required" })
    .min(1, "userId cannot be empty"),
  versionTag: z
    .string()
    .min(1, "versionTag must be a non-empty string")
    .optional(),
  tags: z
    .array(z.string().min(1, "All tags must be non-empty strings"))
    .optional(),
});

export const addLocalesBody = z.object({
  code: z
    .string({ required_error: "code is required" })
    .min(1, "code cannot be empty"),
  name: z
    .string()
    .min(1, "If provided, name must be a non-empty string")
    .optional(),
  nativeName: z
    .string()
    .min(1, "If provided, nativeName must be a non-empty string")
    .optional(),
});

export const updateTranslationBody = z.object({
  key: z
    .string({ required_error: "key is required" })
    .min(1, "key cannot be empty"),
  locale: z
    .string({ required_error: "locale is required" })
    .min(1, "locale cannot be empty"),
  value: z.string({ required_error: "value is required" }), // Allow empty string value
  userId: z
    .string({ required_error: "userId is required" })
    .min(1, "userId cannot be empty"),
  versionTag: z
    .string()
    .min(1, "versionTag must be a non-empty string")
    .optional(),
  tags: z
    .array(z.string().min(1, "All tags must be non-empty strings"))
    .optional(),
});

export const tagsRequestBody = z.object({
  key: z
    .string({ required_error: "key is required" })
    .min(1, "key cannot be empty"),
  locale: z
    .string({ required_error: "locale is required" })
    .min(1, "locale cannot be empty"),
  tags: z
    .array(z.string().min(1, "All tags must be non-empty strings"))
    .min(1, "tags array cannot be empty"), // Ensure array has at least one tag
});

export const searchByTagsBody = z.object({
  locale: z
    .string({ required_error: "locale is required" })
    .min(1, "locale cannot be empty"),
  tags: z
    .array(z.string().min(1, "All tags must be non-empty strings"))
    .min(1, "tags array cannot be empty"), // Ensure array has at least one tag
  matchAll: z.boolean().optional(),
});

export const translationRequestQuery = z.object({
  key: z
    .string({ required_error: "Key query parameter is required" })
    .min(1, "Key query parameter cannot be empty"),
  locale: z
    .string({ required_error: "Locale query parameter is required" })
    .min(1, "Locale query parameter cannot be empty"),
  userId: z.string().min(1, "userId must be a non-empty string").optional(),
  versionTag: z
    .string()
    .min(1, "versionTag must be a non-empty string")
    .optional(),
  // Validate timestamp as a string, then transform to number
  timestamp: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "timestamp must be a positive number string",
    })
    .transform(Number) // Convert to number after validation
    .optional(),
});

// Export all schema types for easy importing
export type LocaleParam = z.infer<typeof localeParam>;
export type AiTranslateBody = z.infer<typeof aiTranslateBody>;
export type LocaleAndKeyParams = z.infer<typeof localeAndKeyParams>;
export type KeyAndLocaleQuery = z.infer<typeof keyAndLocaleQuery>;
export type AddTranslationsBody = z.infer<typeof addTranslationsBody>;
export type AddLocalesBody = z.infer<typeof addLocalesBody>;
export type UpdateTranslationBody = z.infer<typeof updateTranslationBody>;
export type TagsRequestBody = z.infer<typeof tagsRequestBody>;
export type SearchByTagsBody = z.infer<typeof searchByTagsBody>;
export type TranslationRequestQuery = z.infer<typeof translationRequestQuery>;
