export function getPluralForm(
  count: number,
  forms: string[],
  locale: string
): string {
  if (forms.length === 0) return "";
  if (forms.length === 1) return forms[0];

  // Simple plural rules for English and similar languages
  // For more complex rules, a proper plural rules library would be needed
  if (locale.startsWith("en")) {
    return count === 1 ? forms[0] : forms[1];
  }

  // Russian plural forms as an example of more complex rules
  if (locale.startsWith("ru")) {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return forms[0]; // one
    } else if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) {
      return forms[1]; // few
    } else {
      return forms[2]; // many
    }
  }

  // Default to the first form
  return forms[0];
}
