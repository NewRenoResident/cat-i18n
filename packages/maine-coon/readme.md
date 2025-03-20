# cat-i18n

Многофункциональная серверная библиотека для интернационализации (i18n) приложений на TypeScript/JavaScript с поддержкой множества локалей, гибкой интерполяцией и REST API.

## Содержание

- [Установка](#установка)
- [Основные возможности](#основные-возможности)
- [Начало работы](#начало-работы)
- [API библиотеки](#api-библиотеки)
- [Форматы локализации](#форматы-локализации)
- [REST API](#rest-api)
- [Примеры использования](#примеры-использования)
- [Расширение функциональности](#расширение-функциональности)

## Установка

```bash
npm install cat-i18n
# или
yarn add cat-i18n
```

## Основные возможности

- **Поддержка множества локалей**: загрузка и управление любым количеством языковых локалей
- **Гибкая система файлов**: поддержка JSON и YAML форматов
- **Интерполяция**: подстановка переменных в строки перевода
- **Множественные формы**: поддержка правил множественного числа для разных языков
- **Вложенные ключи**: организация переводов в иерархическую структуру
- **Форматирование**: встроенное форматирование дат и чисел с учетом локали
- **REST API**: полноценный HTTP интерфейс для доступа к переводам
- **TypeScript**: полная поддержка типов
- **Отсутствие зависимостей**: минимальное количество внешних библиотек

## Начало работы

### Структура файлов

Создайте директорию `locales` в корне вашего проекта и добавьте файлы локализации:

```
locales/
  ├── ru.json
  ├── en.json
  └── de.json
```

### Пример файла локализации (ru.json)

```json
{
  "greeting": "Привет",
  "welcome": "Добро пожаловать, {{name}}!",
  "items": "У вас {{count}} элемент|У вас {{count}} элемента|У вас {{count}} элементов",
  "common": {
    "yes": "Да",
    "no": "Нет",
    "save": "Сохранить",
    "cancel": "Отмена"
  }
}
```

### Базовое использование

```typescript
import { I18n } from "cat-i18n";

async function example() {
  // Инициализация
  const i18n = new I18n({
    loadPath: "locales",
    fileFormat: "json",
  });

  // Загрузка всех доступных локалей
  await i18n.init();

  // Получение списка доступных локалей
  const locales = i18n.getAvailableLocales(); // ['ru', 'en', 'de', ...]

  // Простой перевод
  console.log(i18n.t("greeting", { locale: "ru" })); // "Привет"
  console.log(i18n.t("greeting", { locale: "en" })); // "Hello"

  // Перевод с интерполяцией
  console.log(
    i18n.t("welcome", {
      locale: "ru",
      interpolation: { name: "Иван" },
    })
  ); // "Добро пожаловать, Иван!"

  // Перевод с множественными формами
  console.log(i18n.t("items", { locale: "ru", count: 1 })); // "У вас 1 элемент"
  console.log(i18n.t("items", { locale: "ru", count: 3 })); // "У вас 3 элемента"
  console.log(i18n.t("items", { locale: "ru", count: 5 })); // "У вас 5 элементов"

  // Перевод с вложенным ключом
  console.log(i18n.t("common.save", { locale: "ru" })); // "Сохранить"
}

example();
```

## API библиотеки

### Класс I18n

#### Конструктор

```typescript
new I18n(options?: I18nOptions)
```

**Параметры:**

- `options`: Объект конфигурации:
  - `loadPath`: Путь к директории с файлами локализации (по умолчанию: 'locales')
  - `fileFormat`: Формат файлов ('json' или 'yaml', по умолчанию: 'json')
  - `locales`: Массив локалей для предварительной загрузки (необязательно)
  - `interpolation`: Настройки интерполяции
    - `prefix`: Префикс для переменных (по умолчанию: '{{')
    - `suffix`: Суффикс для переменных (по умолчанию: '}}')
  - `pluralSeparator`: Разделитель форм множественного числа (по умолчанию: '|')

#### Методы

##### init()

Загружает все доступные локали из указанной директории.

```typescript
async init(): Promise<void>
```

##### loadTranslations(locale)

Загружает переводы для указанной локали.

```typescript
async loadTranslations(locale: string): Promise<TranslationMap>
```

##### addTranslations(locale, translations)

Программное добавление переводов для локали.

```typescript
addTranslations(locale: string, translations: TranslationMap): void
```

##### t(key, options)

Получение перевода для ключа.

```typescript
t(key: string, options: TranslateOptions): string
```

**Параметры:**

- `key`: Ключ перевода (может содержать точки для доступа к вложенным ключам)
- `options`: Опции перевода
  - `locale`: Локаль (обязательно)
  - `count`: Число для множественных форм (необязательно)
  - `defaultValue`: Значение по умолчанию, если перевод не найден (необязательно)
  - `interpolation`: Объект с переменными для подстановки (необязательно)

##### formatDate(date, locale, options)

Форматирование даты с учетом локали.

```typescript
formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string
```

##### formatNumber(number, locale, options)

Форматирование числа с учетом локали.

```typescript
formatNumber(number: number, locale: string, options?: Intl.NumberFormatOptions): string
```

##### exists(key, locale)

Проверка наличия перевода для ключа.

```typescript
exists(key: string, locale: string): boolean
```

##### getAvailableLocales()

Получение списка всех доступных локалей.

```typescript
getAvailableLocales(): string[]
```

##### getLoadedLocales()

Получение объекта со всеми загруженными переводами.

```typescript
getLoadedLocales(): LocaleData
```

##### getTranslations(locale)

Получение всех переводов для указанной локали.

```typescript
getTranslations(locale: string): TranslationMap | undefined
```

##### removeTranslation(locale, key)

Удаление перевода по ключу.

```typescript
removeTranslation(locale: string, key: string): boolean
```

## Форматы локализации

### Простые переводы

```json
{
  "greeting": "Привет",
  "app_name": "Моё приложение"
}
```

### Интерполяция

```json
{
  "welcome": "Добро пожаловать, {{name}}!",
  "signed_in": "Вы вошли как {{username}} в {{time}}"
}
```

### Множественные формы

Для английского и подобных языков (одна/две формы):

```json
{
  "items": "You have {{count}} item|You have {{count}} items"
}
```

Для русского языка (три формы):

```json
{
  "items": "У вас {{count}} элемент|У вас {{count}} элемента|У вас {{count}} элементов"
}
```

Для французского (две формы):

```json
{
  "items": "Vous avez {{count}} élément|Vous avez {{count}} éléments"
}
```

### Вложенные ключи

```json
{
  "common": {
    "yes": "Да",
    "no": "Нет",
    "save": "Сохранить",
    "cancel": "Отмена"
  },
  "auth": {
    "login": "Вход",
    "register": "Регистрация",
    "fields": {
      "username": "Имя пользователя",
      "password": "Пароль"
    }
  }
}
```

## REST API

Библиотека предоставляет REST API для доступа к переводам через HTTP-запросы.

### Запуск REST API

```typescript
import { I18n, I18nRestApi } from "cat-i18n";

async function startApiServer() {
  const i18n = new I18n({ loadPath: "locales" });
  await i18n.init();

  const api = new I18nRestApi(i18n, {
    port: 3000,
    host: "localhost",
    apiPath: "/api/i18n",
    cors: true,
    authentication: {
      enabled: false, // Можно включить для защиты API
      // apiKey: 'your-secret-api-key'
    },
  });

  await api.start();
}

startApiServer();
```

### API Endpoints

#### 1. Получение списка локалей

```
GET /api/i18n/locales
```

**Ответ:**

```json
{
  "locales": ["ru", "en", "de"]
}
```

#### 2. Получение всех переводов для локали

```
GET /api/i18n/translations/:locale
```

**Ответ:**

```json
{
  "locale": "ru",
  "translations": {
    "greeting": "Привет",
    "welcome": "Добро пожаловать, {{name}}!"
    // ...
  }
}
```

#### 3. Получение перевода для ключа

```
GET /api/i18n/translate/:locale/:key?param1=value1
```

**Ответ:**

```json
{
  "locale": "ru",
  "key": "welcome",
  "translation": "Добро пожаловать, Иван!",
  "options": {
    "locale": "ru"
  }
}
```

#### 4. Добавление/обновление переводов

```
POST /api/i18n/translations/:locale
```

**Тело запроса:**

```json
{
  "newKey": "Новое значение",
  "nested": {
    "key": "Вложенное значение"
  }
}
```

**Ответ:**

```json
{
  "success": true,
  "locale": "ru"
}
```

#### 5. Удаление перевода

```
DELETE /api/i18n/translations/:locale/:key
```

**Ответ:**

```json
{
  "success": true,
  "locale": "ru",
  "key": "newKey"
}
```

#### 6. Загрузка локали из файла

```
POST /api/i18n/locales/:locale/load
```

**Ответ:**

```json
{
  "success": true,
  "locale": "fr",
  "message": "Locale 'fr' loaded successfully"
}
```

### Аутентификация для REST API

Если включена аутентификация, добавьте заголовок `x-api-key` к каждому запросу:

```
curl -H "x-api-key: your-secret-api-key" http://localhost:3000/api/i18n/locales
```

## Примеры использования

### Интеграция с Express

```typescript
import express from "express";
import { I18n } from "cat-i18n";

async function setupServer() {
  const app = express();

  // Инициализация i18n
  const i18n = new I18n({ loadPath: "locales" });
  await i18n.init();

  // Добавляем i18n в объект app
  app.locals.i18n = i18n;

  // Middleware для определения локали
  app.use((req, res, next) => {
    // Определение локали из query, cookie или заголовка
    const locale =
      (req.query.locale as string) ||
      req.cookies?.locale ||
      req.headers["accept-language"]?.split(",")[0].split("-")[0] ||
      "en";

    res.locals.locale = locale;
    next();
  });

  // Пример использования в маршруте
  app.get("/", (req, res) => {
    const locale = res.locals.locale;
    const i18n = req.app.locals.i18n;

    const greeting = i18n.t("greeting", { locale });
    const welcome = i18n.t("welcome", {
      locale,
      interpolation: { name: "Гость" },
    });

    res.send(`
      <h1>${greeting}</h1>
      <p>${welcome}</p>
      <p>${i18n.formatDate(new Date(), locale, { dateStyle: "full" })}</p>
    `);
  });

  app.listen(3000, () => {
    console.log("Server started on port 3000");
  });
}

setupServer();
```

### Использование с React (Frontend)

```typescript
// i18nClient.js - клиент для REST API
class I18nClient {
  constructor(baseUrl = "http://localhost:3000/api/i18n") {
    this.baseUrl = baseUrl;
    this.cache = {}; // Кэш переводов
  }

  async getLocales() {
    const response = await fetch(`${this.baseUrl}/locales`);
    const data = await response.json();
    return data.locales;
  }

  async getTranslations(locale) {
    if (this.cache[locale]) {
      return this.cache[locale];
    }

    const response = await fetch(`${this.baseUrl}/translations/${locale}`);
    const data = await response.json();

    this.cache[locale] = data.translations;
    return data.translations;
  }

  async translate(key, options = {}) {
    const locale = options.locale || "en";

    // Если есть в кэше, используем его
    if (this.cache[locale]) {
      // Простая функция для получения вложенных ключей
      const getProp = (obj, path) => {
        const keys = path.split(".");
        return keys.reduce(
          (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
          obj
        );
      };

      const translation = getProp(this.cache[locale], key);
      if (translation) {
        // Здесь можно добавить обработку интерполяции и множественных форм
        return translation;
      }
    }

    // Если нет в кэше или не нашли ключ, запрашиваем с сервера
    const params = new URLSearchParams();

    if (options.count !== undefined) {
      params.append("count", options.count);
    }

    if (options.defaultValue) {
      params.append("defaultValue", options.defaultValue);
    }

    if (options.interpolation) {
      for (const [key, value] of Object.entries(options.interpolation)) {
        params.append(key, value);
      }
    }

    const response = await fetch(
      `${this.baseUrl}/translate/${locale}/${key}?${params.toString()}`
    );

    const data = await response.json();
    return data.translation;
  }
}

// Пример использования в React компоненте
function App() {
  const [greeting, setGreeting] = useState("");
  const [locale, setLocale] = useState("ru");
  const i18nClient = useMemo(() => new I18nClient(), []);

  useEffect(() => {
    async function loadTranslations() {
      const text = await i18nClient.translate("greeting", { locale });
      setGreeting(text);
    }

    loadTranslations();
  }, [locale, i18nClient]);

  return (
    <div>
      <h1>{greeting}</h1>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
```

## Расширение функциональности

### Создание пользовательского загрузчика

Вы можете создать свой загрузчик, если хотите использовать другой формат или источник данных:

```typescript
import { I18nLoader, I18nOptions, TranslationMap } from 'cat-i18n';

// Пример загрузчика из базы данных
class DatabaseLoader implements I18nLoader {
  private db: any; // Ваше подключение к БД

  constructor(dbConnection: any) {
    this.db = dbConnection;
  }

  async load(locale: string, options: I18nOptions): Promise<TranslationMap> {
    // Загрузка переводов из базы данных
    const translations = await this.db.collection('translations')
      .findOne({ locale });

    return translations?.data || {};
  }

  async listAvailableLocales(options: I18nOptions): Promise<string[]> {
    // Получение списка локалей из базы данных
    const result = await this.db.collection('translations')
      .distinct('locale');

    return result || [];
  }
}

// Использование
const dbConnection = /* ... */;
const dbLoader = new DatabaseLoader(dbConnection);

class CustomI18n extends I18n {
  protected getLoader(): I18nLoader {
    return this.dbLoader;
  }

  constructor(options: I18nOptions, dbLoader: DatabaseLoader) {
    super(options);
    this.dbLoader = dbLoader;
  }
}

const i18n = new CustomI18n({}, dbLoader);
await i18n.init();
```

### Добавление поддержки новых форматов

Можно добавить поддержку других форматов файлов, создав новый загрузчик и зарегистрировав его:

```typescript
// Пример загрузчика для XML
class XmlLoader implements I18nLoader {
  async load(locale: string, options: I18nOptions): Promise<TranslationMap> {
    const loadPath = options.loadPath || "locales";
    const filePath = path.join(process.cwd(), loadPath, `${locale}.xml`);

    try {
      const data = await fs.readFile(filePath, "utf8");
      // Используйте библиотеку для парсинга XML
      const parser = new XMLParser();
      const result = parser.parse(data);
      return result.translations || {};
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(`Translation file not found for locale: ${locale}`);
        return {};
      }
      throw error;
    }
  }

  async listAvailableLocales(options: I18nOptions): Promise<string[]> {
    // Реализация схожа с другими загрузчиками
  }
}
```

### Добавление новых функций форматирования

```typescript
class CurrencyFormatter {
  format(value: number, locale: string, currency: string = "USD"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  }
}

// Расширение I18n
class ExtendedI18n extends I18n {
  private currencyFormatter: CurrencyFormatter;

  constructor(options: I18nOptions) {
    super(options);
    this.currencyFormatter = new CurrencyFormatter();
  }

  formatCurrency(value: number, locale: string, currency?: string): string {
    return this.currencyFormatter.format(value, locale, currency);
  }
}

// Использование
const i18n = new ExtendedI18n({ loadPath: "locales" });
await i18n.init();

console.log(i18n.formatCurrency(1234.56, "ru", "RUB")); // "1 234,56 ₽"
console.log(i18n.formatCurrency(1234.56, "en", "USD")); // "$1,234.56"
```

## Лицензия

MIT

# Система версионирования в cat-i18n

В библиотеку cat-i18n добавлена поддержка полноценного версионирования переводов. Эта функциональность позволяет отслеживать историю изменений для каждого ключа перевода, сравнивать версии и возвращаться к предыдущим версиям при необходимости.

## Содержание

- [Настройка версионирования](#настройка-версионирования)
- [Хранилища версий](#хранилища-версий)
- [API для работы с версиями](#api-для-работы-с-версиями)
- [REST API](#rest-api-для-версионирования)
- [Примеры использования](#примеры-использования)

## Настройка версионирования

Для включения версионирования добавьте раздел `versioning` в параметры при инициализации i18n:

```typescript
const i18n = new I18n({
  // Обычные настройки i18n
  loadPath: "locales",
  fileFormat: "json",

  // Настройки версионирования
  versioning: {
    enabled: true, // Включить версионирование
    storage: "file", // Тип хранилища: 'memory', 'file', или 'database'
    storageOptions: {
      path: "./versions", // Путь для файлового хранилища
    },
    autoSave: true, // Автоматически создавать версии при изменении переводов
    maxVersionsPerKey: 10, // Максимальное количество версий на один ключ
    diffAlgorithm: "simple", // Алгоритм сравнения версий
  },
});
```

### Параметры настройки

| Параметр              | Тип     | По умолчанию   | Описание                                                               |
| --------------------- | ------- | -------------- | ---------------------------------------------------------------------- |
| `enabled`             | boolean | `true`         | Включает или выключает систему версионирования                         |
| `storage`             | string  | `'memory'`     | Тип хранилища для версий: `'memory'`, `'file'`, или `'database'`       |
| `storageOptions`      | object  | `{}`           | Дополнительные настройки для хранилища                                 |
| `storageOptions.path` | string  | `'./versions'` | Путь для файлового хранилища                                           |
| `autoSave`            | boolean | `true`         | Автоматически создавать версии при изменении переводов                 |
| `maxVersionsPerKey`   | number  | `undefined`    | Максимальное количество версий для хранения для каждого ключа          |
| `diffAlgorithm`       | string  | `'simple'`     | Алгоритм сравнения версий: `'simple'`, `'levenshtein'`, или `'custom'` |

## Хранилища версий

Система версионирования поддерживает несколько типов хранилищ для сохранения истории версий:

### 1. Хранилище в памяти (`'memory'`)

Версии хранятся только в оперативной памяти и теряются при перезапуске приложения. Подходит для разработки и тестирования.

```typescript
versioning: {
  storage: "memory";
}
```

### 2. Файловое хранилище (`'file'`)

Версии сохраняются в JSON-файлы на диске, что обеспечивает постоянное хранение между запусками приложения.

```typescript
versioning: {
  storage: 'file',
  storageOptions: {
    path: './translation-versions' // Путь к директории для хранения
  }
}
```

### 3. Хранилище в базе данных (`'database'`)

(В текущей версии не реализовано полностью, возвращается к хранилищу в памяти)

## API для работы с версиями

После активации версионирования становятся доступны следующие методы для работы с версиями переводов:

### Получение истории версий

```typescript
// Получить историю версий для ключа и локали
const versions = await i18n.getVersionHistory("greeting", "ru", 5); // Последние 5 версий
```

### Восстановление к предыдущей версии

```typescript
// Восстановить перевод к указанной версии
await i18n.revertToVersion(versionId);
```

### Сравнение версий

```typescript
// Сравнить две версии
const diff = await i18n.compareVersions(versionId1, versionId2);
```

### Прямой доступ к менеджеру версий

```typescript
// Получить менеджер версий для более сложных операций
const versionManager = i18n.getVersionManager();

if (versionManager) {
  // Экспорт версий
  const exportedVersions = await versionManager.exportVersions({
    locale: "ru",
    fromDate: new Date("2023-01-01"),
  });

  // Импорт версий
  await versionManager.importVersions(importedVersions);
}
```

## REST API для версионирования

REST API библиотеки cat-i18n расширен для поддержки работы с версиями:

### Получение истории версий для ключа

```
GET /api/i18n/versions/:locale/:key?limit=10
```

**Ответ:**

```json
{
  "locale": "ru",
  "key": "greeting",
  "versions": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "key": "greeting",
      "locale": "ru",
      "value": "Здравствуй, мир!",
      "timestamp": 1632150029421,
      "author": "john.doe@example.com",
      "comment": "Изменен стиль приветствия"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "key": "greeting",
      "locale": "ru",
      "value": "Привет, мир!",
      "timestamp": 1632149029421
    }
  ]
}
```

### Создание новой версии

```
POST /api/i18n/versions/:locale/:key
```

**Тело запроса:**

```json
{
  "value": "Новый перевод",
  "comment": "Исправлена опечатка",
  "author": "jane.doe@example.com"
}
```

**Ответ:**

```json
{
  "success": true,
  "version": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "key": "greeting",
    "locale": "ru",
    "value": "Новый перевод",
    "timestamp": 1632151029421,
    "author": "jane.doe@example.com",
    "comment": "Исправлена опечатка"
  }
}
```

### Восстановление к предыдущей версии

```
POST /api/i18n/versions/:versionId/revert
```

**Ответ:**

```json
{
  "success": true,
  "versionId": "123e4567-e89b-12d3-a456-426614174001"
}
```

### Сравнение версий

```
GET /api/i18n/versions/compare?versionId1=123...&versionId2=456...
```

**Ответ:**

```json
{
  "previous": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "key": "greeting",
    "locale": "ru",
    "value": "Привет, мир!",
    "timestamp": 1632149029421
  },
  "current": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "key": "greeting",
    "locale": "ru",
    "value": "Здравствуй, мир!",
    "timestamp": 1632150029421
  },
  "changes": [
    {
      "type": "modification",
      "content": "Здравствуй, мир!"
    }
  ],
  "additions": ["Здравствуй"],
  "deletions": ["Привет"]
}
```

### Экспорт версий

```
GET /api/i18n/versions/export?locale=ru&fromDate=2023-01-01
```

**Ответ:**

```json
{
  "versions": [
    // массив версий
  ]
}
```

### Импорт версий

```
POST /api/i18n/versions/import
```

**Тело запроса:**

```json
{
  "versions": [
    // массив версий для импорта
  ]
}
```

**Ответ:**

```json
{
  "success": true,
  "count": 5
}
```

## Примеры использования

### Базовый пример с версионированием

```typescript
import { I18n } from "cat-i18n";

async function example() {
  // Инициализация с версионированием
  const i18n = new I18n({
    loadPath: "locales",
    versioning: {
      enabled: true,
      storage: "file",
    },
  });

  await i18n.init();

  // Добавление перевода (автоматически создается версия)
  i18n.addTranslations("en", {
    "welcome.title": "Welcome to our app",
  });

  // Позже обновляем перевод
  i18n.addTranslations("en", {
    "welcome.title": "Welcome to our application",
  });

  // Получаем историю версий
  const history = await i18n.getVersionHistory("welcome.title", "en");
  console.log("Version history:", history);

  // Возвращаемся к первой версии
  if (history && history.length > 1) {
    await i18n.revertToVersion(history[history.length - 1].id);
    console.log(
      "Reverted to original:",
      i18n.t("welcome.title", { locale: "en" })
    );
  }
}

example();
```

### Пример с REST API и версионированием

```typescript
import { I18n, I18nRestApi } from "cat-i18n";

async function setupServer() {
  // Инициализация i18n с версионированием
  const i18n = new I18n({
    versioning: {
      enabled: true,
      storage: "file",
    },
  });

  await i18n.init();

  // Запуск REST API
  const api = new I18nRestApi(i18n);
  await api.start();

  console.log("i18n API server with versioning support started on port 3000");
}

setupServer();
```

---

Система версионирования делает cat-i18n полноценным решением для управления переводами, обеспечивая прозрачность изменений, возможность отката к предыдущим версиям и аудит модификаций переводов.
