export function interpolate(
  text: string,
  values: Record<string, any> = {},
  prefix: string = "{{",
  suffix: string = "}}"
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    const regex = new RegExp(`${prefix}\\s*${key}\\s*${suffix}`, "g");
    return result.replace(regex, String(value));
  }, text);
}
