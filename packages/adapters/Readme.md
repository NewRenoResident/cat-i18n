# Получение списка доступных локалей

curl -X GET http://localhost:3000/api/translations/locales

# Получение всех переводов для локали 'ru'

curl -X GET http://localhost:3000/api/translations/translations/ru

# Получение конкретного перевода по ключу

curl -X GET "http://localhost:3000/api/translations/translation?key=common.button.submit&locale=ru"

# Получение перевода с тегами

curl -X GET "http://localhost:3000/api/translations/translation/tags?key=common.button.submit&locale=ru"

# Добавление нового перевода с тегами

curl -X POST http://localhost:3000/api/translations/translation \
 -H "Content-Type: application/json" \
 -d '{
"key": "common.button.submit",
"locale": "ru",
"value": "Отправить",
"userId": "user123",
"versionTag": "v1.0",
"tags": ["button", "form", "common"]
}'

# Обновление перевода

curl -X POST http://localhost:3000/api/translations/translation \
 -H "Content-Type: application/json" \
 -d '{
"key": "common.button.submit",
"locale": "ru",
"value": "Отправить форму",
"userId": "user123",
"versionTag": "v1.1"
}'

# Получение истории версий перевода

curl -X GET http://localhost:3000/api/translations/translation/versions/ru/common.button.submit

# Получение последней версии перевода

curl -X GET http://localhost:3000/api/translations/translation/latest/ru/common.button.submit

# Удаление перевода

curl -X DELETE "http://localhost:3000/api/translations/translation?key=common.button.submit&locale=ru"

# Получение всех доступных тегов

curl -X GET http://localhost:3000/api/translations/tags

# Получение тегов для конкретной локали

curl -X GET http://localhost:3000/api/translations/tags/ru

# Добавление тегов к переводу

curl -X POST http://localhost:3000/api/translations/tags \
 -H "Content-Type: application/json" \
 -d '{
"key": "common.button.cancel",
"locale": "ru",
"tags": ["button", "form", "cancel"]
}'

# Обновление (замена) тегов перевода

curl -X PUT http://localhost:3000/api/translations/tags \
 -H "Content-Type: application/json" \
 -d '{
"key": "common.button.cancel",
"locale": "ru",
"tags": ["button", "action"]
}'

# Удаление тегов из перевода

curl -X DELETE http://localhost:3000/api/translations/tags \
 -H "Content-Type: application/json" \
 -d '{
"key": "common.button.cancel",
"locale": "ru",
"tags": ["form"]
}'

# Поиск переводов по тегам (любой из тегов)

curl -X POST http://localhost:3000/api/translations/search/tags \
 -H "Content-Type: application/json" \
 -d '{
"locale": "ru",
"tags": ["button", "header"],
"matchAll": false
}'

# Поиск переводов по тегам (все теги должны присутствовать)

curl -X POST http://localhost:3000/api/translations/search/tags \
 -H "Content-Type: application/json" \
 -d '{
"locale": "ru",
"tags": ["button", "form"],
"matchAll": true
}'

# Подсчет количества переводов с указанными тегами

curl -X POST http://localhost:3000/api/translations/count/tags \
 -H "Content-Type: application/json" \
 -d '{
"locale": "ru",
"tags": ["button"],
"matchAll": false
}'
