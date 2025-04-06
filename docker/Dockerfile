FROM mongo:latest

COPY init-mongo.js /docker-entrypoint-initdb.d/

# Настройка переменных окружения
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=password
ENV MONGO_INITDB_DATABASE=translations

EXPOSE 27017

CMD ["mongod", "--auth"]
