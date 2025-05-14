import { useState, useEffect } from "react";
import {
  TransFlowProvider,
  Trans, // Убедитесь, что Trans импортирован
  useTransFlow,
} from "@cat-i18n/scottish-fold";

import "./App.css";
import {
  TranslatorUIProvider,
  TranslatorPanelContainer,
  TranslatorToggle,
} from "@cat-i18n/transflow-ui-extension";

function DemoApp() {
  const { setLocale, locale, getAvailableLocales } = useTransFlow();
  const [locales, setLocales] = useState<string[]>([]);
  const [selectedLocale, setSelectedLocale] = useState("");

  useEffect(() => {
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
  const currentYear = new Date().getFullYear(); // Вычисляем год один раз

  return (
    <div className="demo-app">
      <header className="app-header">
        <div className="logo">
          <Trans id="header.logo.text" defaultMessage="TransFlow Demo" />
        </div>
        <div className="locale-selector">
          <select value={selectedLocale} onChange={handleLocaleChange}>
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {loc === "ru" ? "Русский" : loc === "en" ? "English" : loc}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-content">
        <section className="welcome-section">
          {/* Заменяем t() на Trans */}
          <h1>
            <Trans id="welcome.title" />
          </h1>
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
          <h2>
            <Trans id="features.title" />
          </h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>
                <Trans id="features.card1.title" />
              </h3>
              <p>
                <Trans id="features.card1.description" />
              </p>
              <button>
                <Trans id="common.learnMore" />
              </button>
            </div>
            <div className="feature-card">
              <h3>
                <Trans id="features.card2.title" />
              </h3>
              <p>
                <Trans id="features.card2.description" />
              </p>
              <button>
                <Trans id="common.learnMore" />
              </button>
            </div>
            <div className="feature-card">
              <h3>
                <Trans id="features.card3.title" />
              </h3>
              <p>
                <Trans id="features.card3.description" />
              </p>
              <button>
                <Trans id="common.learnMore" />
              </button>
            </div>
          </div>
        </section>

        <section className="notifications-section">
          <div className="notification">
            {/* Этот уже использовал Trans, оставляем как есть */}
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
        <p>
          <Trans id="footer.copyright" variables={{ year: currentYear }} />
        </p>
        <nav>
          <a href="/terms">
            <Trans id="footer.terms" />
          </a>
          <a href="/privacy">
            <Trans id="footer.privacy" />
          </a>
          <a href="/contact">
            <Trans id="footer.contact" />
          </a>
        </nav>
      </footer>
    </div>
  );
}

export default function App() {
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
