#!/bin/bash

# --- Конфигурация ---
# Замените, если ваш хост, порт или базовый путь отличаются
BASE_URL="http://localhost:3000/api/translations"
# Имя файла для записи результатов
OUTPUT_FILE="api_test_output_$(date +%Y%m%d_%H%M%S).log"

# --- Начало скрипта ---
echo "Запуск теста API для $BASE_URL"
echo "Результаты будут записаны в файл: $OUTPUT_FILE"

# Очищаем/создаем файл для вывода перед началом
> "$OUTPUT_FILE"

# Функция для выполнения и логирования curl команды
run_curl() {
  local description="$1"
  shift # Убираем первый аргумент (описание)
  local command_str="curl $@" # Формируем строку команды для лога

  echo "--- COMMAND: $description ---" >> "$OUTPUT_FILE"
  echo ">>> Executing: $command_str" >> "$OUTPUT_FILE"
  echo "--- RESPONSE ---" >> "$OUTPUT_FILE"
  # Выполняем команду, перенаправляя stdout и stderr в файл
  curl "$@" >> "$OUTPUT_FILE" 2>&1
  # Добавляем пустые строки для читаемости
  echo -e "\n\n" >> "$OUTPUT_FILE"
}

# === Маршруты Локалей ===

run_curl "GET /locales - Получение списка доступных локалей" \
  -X GET "${BASE_URL}/locales"

run_curl "POST /locales - Добавление новой локали 'fr'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "code": "fr",
    "name": "French",
    "nativeName": "Français"
  }' \
  "${BASE_URL}/locales"

run_curl "POST /locales - Добавление новой локали 'es'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "code": "es",
    "name": "Spanish"
  }' \
  "${BASE_URL}/locales"

run_curl "PUT /locales/fr - Обновление данных локали 'fr'" \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "name": "French (Updated)",
    "nativeName": "Français (Mis à jour)"
  }' \
  "${BASE_URL}/locales/fr"


# === Маршруты Переводов ===

run_curl "POST /translations - Добавление переводов для 'en'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "translations": {
      "greeting": "Hello",
      "farewell": "Goodbye"
    },
    "userId": "user123",
    "versionTag": "v1.0",
    "tags": ["common", "basic"]
  }' \
  "${BASE_URL}/translations"

run_curl "POST /translations - Добавление переводов для 'fr'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "fr",
    "translations": {
      "greeting": "Bonjour",
      "farewell": "Au revoir"
    },
    "userId": "admin456",
    "tags": ["common"]
  }' \
  "${BASE_URL}/translations"

run_curl "GET /translations/en - Получение всех переводов для 'en'" \
  -X GET "${BASE_URL}/translations/en"

run_curl "GET /translation - Получение перевода 'greeting' для 'fr'" \
  -X GET "${BASE_URL}/translation?key=greeting&locale=fr"

run_curl "GET /translation/tags - Получение перевода с тегами 'farewell' для 'en'" \
  -X GET "${BASE_URL}/translation/tags?key=farewell&locale=en"

run_curl "POST /translation - Обновление перевода 'greeting' для 'en'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "key": "greeting",
    "value": "Hi there!",
    "userId": "user123",
    "versionTag": "v1.1",
    "tags": ["common", "informal"]
  }' \
  "${BASE_URL}/translation"


# === Маршруты Версий Переводов ===

run_curl "GET /translation/versions/en/greeting - Получение истории версий 'greeting' для 'en'" \
  -X GET "${BASE_URL}/translation/versions/en/greeting"

run_curl "GET /translation/latest/en/greeting - Получение последней версии 'greeting' для 'en'" \
  -X GET "${BASE_URL}/translation/latest/en/greeting"


# === Маршруты Тегов ===

run_curl "GET /tags - Получение всех тегов" \
  -X GET "${BASE_URL}/tags"

run_curl "GET /tags/en - Получение всех тегов для локали 'en'" \
  -X GET "${BASE_URL}/tags/en"

run_curl "POST /tags - Добавление тегов 'polite', 'formal' к 'fr/greeting'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "fr",
    "key": "greeting",
    "tags": ["polite", "formal"]
  }' \
  "${BASE_URL}/tags"

run_curl "PUT /tags - Обновление тегов для 'en/greeting' на 'casual', 'updated'" \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "key": "greeting",
    "tags": ["casual", "updated"]
  }' \
  "${BASE_URL}/tags"

run_curl "POST /search/tags - Поиск переводов по тегу 'common' в 'en'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "tags": ["common"]
  }' \
  "${BASE_URL}/search/tags"

run_curl "POST /search/tags - Поиск переводов по тегам 'common' И 'basic' в 'en'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "tags": ["common", "basic"],
    "matchAll": true
  }' \
  "${BASE_URL}/search/tags"

run_curl "POST /count/tags - Подсчет переводов по тегу 'common' в 'fr'" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "fr",
    "tags": ["common"]
  }' \
  "${BASE_URL}/count/tags"


# === Очистка (удаление созданных данных) ===
# Важно: Порядок удаления может иметь значение

run_curl "DELETE /tags - Удаление тега 'updated' из 'en/greeting'" \
  -X DELETE \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "key": "greeting",
    "tags": ["updated"]
  }' \
  "${BASE_URL}/tags" # Удаляем тег перед удалением перевода

run_curl "DELETE /translation - Удаление перевода 'farewell' для 'fr'" \
  -X DELETE "${BASE_URL}/translation?key=farewell&locale=fr" # Этот уже удалялся, но для полноты

run_curl "DELETE /translation - Удаление перевода 'greeting' для 'en'" \
  -X DELETE "${BASE_URL}/translation?key=greeting&locale=en"

run_curl "DELETE /translation - Удаление перевода 'farewell' для 'en'" \
  -X DELETE "${BASE_URL}/translation?key=farewell&locale=en"

run_curl "DELETE /translation - Удаление перевода 'greeting' для 'fr'" \
  -X DELETE "${BASE_URL}/translation?key=greeting&locale=fr"

run_curl "DELETE /locales/es - Удаление локали 'es'" \
  -X DELETE "${BASE_URL}/locales/es" # Этот уже удалялся, но для полноты

run_curl "DELETE /locales/fr - Удаление локали 'fr'" \
  -X DELETE "${BASE_URL}/locales/fr" # Удаляем локаль после удаления ее переводов

# --- Завершение скрипта ---
echo "Тест API завершен. Результаты записаны в файл: $OUTPUT_FILE"

# Можно добавить вывод содержимого файла в консоль, если нужно
# echo "--- Содержимое файла $OUTPUT_FILE ---"
# cat "$OUTPUT_FILE"