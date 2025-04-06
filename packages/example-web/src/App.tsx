import { useState, useEffect } from "react";
import {
  TransFlowProvider,
  Trans,
  useTransFlow,
} from "@cat-i18n/scottish-fold";

import "./App.css";
import {
  TranslatorUIProvider,
  TranslatorPanelContainer,
  TranslatorToggle,
} from "@cat-i18n/transflow-ui-extension";

// Наш демонстрационный компонент с переводами
function DemoApp() {
  const { t, setLocale, locale, getAvailableLocales } = useTransFlow();
  const [locales, setLocales] = useState<string[]>([]);
  const [selectedLocale, setSelectedLocale] = useState("");

  useEffect(() => {
    // Загружаем доступные локали
    const loadLocales = async () => {
      const availableLocales = await getAvailableLocales();

      setLocales(availableLocales);

      setSelectedLocale(locale);
    };

    loadLocales();
  }, [getAvailableLocales, locale]);

  const handleLocaleChange = (e) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    setSelectedLocale(newLocale);
  };

  const userName = "Алексей";
  const unreadMessages = 5;

  return (
    <div className="demo-app">
      <header className="app-header">
        <div className="logo">TransFlow Demo</div>
        <div className="locale-selector">
          <select value={selectedLocale} onChange={handleLocaleChange}>
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {locale === "ru"
                  ? "Русский"
                  : locale === "en"
                    ? "English"
                    : locale}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-content">
        <section className="welcome-section">
          <h1>{t("welcome.title")}</h1>
          <p>
            <Trans
              id="welcome.message"
              variables={{ name: userName }}
              components={{
                bold: <strong />,
                link: <a href="/dashboard" />,
              }}
            />
            <Trans id="common.button.submit" />
          </p>
        </section>

        <section className="features-section">
          <h2>{t("features.title")}</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>{t("features.card1.title")}</h3>
              <p>{t("features.card1.description")}</p>
              <button>{t("common.learnMore")}</button>
            </div>
            <div className="feature-card">
              <h3>{t("features.card2.title")}</h3>
              <p>{t("features.card2.description")}</p>
              <button>{t("common.learnMore")}</button>
            </div>
            <div className="feature-card">
              <h3>{t("features.card3.title")}</h3>
              <p>{t("features.card3.description")}</p>
              <button>{t("common.learnMore")}</button>
            </div>
          </div>
        </section>

        <section className="notifications-section">
          <div className="notification">
            <Trans
              id="notifications.unread"
              variables={{ count: unreadMessages }}
              components={{
                badge: <span className="badge" />,
                icon: <span className="notification-icon" />,
              }}
            />
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        <nav>
          <a href="/terms">{t("footer.terms")}</a>
          <a href="/privacy">{t("footer.privacy")}</a>
          <a href="/contact">{t("footer.contact")}</a>
        </nav>
      </footer>
    </div>
  );
}

// Основной компонент приложения
export default function App() {
  // Начальные переводы для демонстрации

  return (
    <TransFlowProvider
      options={{
        defaultLocale: "ru",
        fallbackLocale: "en",

        apiUrl: "http://localhost:3000",
      }}
    >
      <TranslatorUIProvider apiUrl="http://localhost:3000">
        <DemoApp />
        <TranslatorToggle />
        <TranslatorPanelContainer />
      </TranslatorUIProvider>
    </TransFlowProvider>
  );
}
