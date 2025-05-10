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
RUN ls -la /app && \
    # If uploads exists, show what it is
    (if [ -e /app/uploads ]; then ls -la /app/uploads; stat /app/uploads; fi) && \
    # Try to remove it if it's a file and create directories
    (if [ -f /app/uploads ]; then rm /app/uploads; fi) && \
    mkdir -p /app/uploads/files

# Set proper permissions
RUN chown -R node:node /app/uploads

# Запускаем приложение
CMD ["npm", "start"]