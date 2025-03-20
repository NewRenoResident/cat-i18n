export class NumberFormatter {
  format(
    value: number,
    locale: string,
    options?: Intl.NumberFormatOptions
  ): string {
    return new Intl.NumberFormat(locale, options).format(value);
  }
}
