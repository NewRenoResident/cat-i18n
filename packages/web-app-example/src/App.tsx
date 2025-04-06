import { useState, useEffect } from "react";
import {
  TransFlowProvider,
  Trans,
  useTransFlow,
} from "../../cat-i18n/packages/scottish-fold";

import "./App.css";
import {
  TranslatorUIProvider,
  TranslatorPanelContainer,
  TranslatorToggle,
} from "../../cat-i18n/packages/transflow-ui-extension";

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
  const initialTranslations = {
    en: {
      "welcome.message":
        "Hello, {name}! Click <bold>here</bold> or go to your <link>dashboard</link> to get started.",
      "features.title": "Key Features",
      "features.card1.title": "Easy Integration",
      "features.card1.description":
        "Integrate our solution with just a few lines of code.",
      "features.card2.title": "Powerful Analytics",
      "features.card2.description":
        "Get detailed insights about your business performance.",
      "features.card3.title": "Secure Platform",
      "features.card3.description":
        "Your data is always secure with our enterprise-grade security.",
      "common.learnMore": "Learn More",
      "notifications.unread":
        "You have <badge>{count}</badge> unread messages. <icon>Check them now!</icon>",
      "footer.copyright": "© {year} TransFlow Demo. All rights reserved.",
      "footer.terms": "Terms of Service",
      "footer.privacy": "Privacy Policy",
      "footer.contact": "Contact Us",
    },
    ru: {
      "welcome.message":
        "Привет, {name}! Нажмите <bold>здесь</bold> или перейдите в свою <link>панель управления</link>, чтобы начать работу.",
      "features.title": "Ключевые возможности",
      "features.card1.title": "Простая интеграция",
      "features.card1.description":
        "Интегрируйте наше решение всего несколькими строками кода.",
      "features.card2.title": "Мощная аналитика",
      "features.card2.description":
        "Получайте подробные сведения о производительности вашего бизнеса.",
      "features.card3.title": "Безопасная платформа",
      "features.card3.description":
        "Ваши данные всегда защищены нашей системой безопасности корпоративного уровня.",
      "common.learnMore": "Узнать больше",
      "notifications.unread":
        "У вас <badge>{count}</badge> непрочитанных сообщений. <icon>Проверьте их сейчас!</icon>",
      "footer.copyright": "© {year} TransFlow Demo. Все права защищены.",
      "footer.terms": "Условия использования",
      "footer.privacy": "Политика конфиденциальности",
      "footer.contact": "Связаться с нами",
    },
  };

  return (
    <TransFlowProvider
      options={{
        defaultLocale: "ru",
        fallbackLocale: "en",
        initialTranslations: initialTranslations,
        apiUrl: "http://localhost:3000",
      }}
    >
      <TranslatorUIProvider>
        <DemoApp />
        <TranslatorToggle />
        <TranslatorPanelContainer apiUrl="http://localhost:3000" />
      </TranslatorUIProvider>
    </TransFlowProvider>
  );
}
