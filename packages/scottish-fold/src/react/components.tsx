import React from "react";
import { useTransFlow } from "./context";

// Компонент для переключения языков
export const LocaleSwitcher: React.FC = () => {
  const { locale, setLocale, getAvailableLocales } = useTransFlow();
  const [locales, setLocales] = React.useState<string[]>([]);

  React.useEffect(() => {
    getAvailableLocales().then(setLocales);
  }, []);

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc}
        </option>
      ))}
    </select>
  );
};

// Компонент для форматирования дат согласно локали
export const FormattedDate: React.FC<{
  date: Date;
  format?: Intl.DateTimeFormatOptions;
}> = ({ date, format }) => {
  const { locale } = useTransFlow();

  const formattedDate = new Intl.DateTimeFormat(locale, format).format(date);

  return <>{formattedDate}</>;
};
