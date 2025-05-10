# Dockerfile для Express.js сервера
FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm  install

# Копируем исходный код
COPY . .

# Expose порт, указанный в .env
EXPOSE 9999

# Создаем директории для загрузки файлов
RUN rm -rf /app/uploads || true && \
    mkdir -p /app/uploads/files
# Запускаем приложение
CMD ["npm", "start"]