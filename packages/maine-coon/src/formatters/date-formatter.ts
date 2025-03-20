export class DateFormatter {
  format(
    value: Date,
    locale: string,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return new Intl.DateTimeFormat(locale, options).format(value);
  }
}
