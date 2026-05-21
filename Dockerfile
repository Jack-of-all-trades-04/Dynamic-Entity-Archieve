FROM node:20-alpine
WORKDIR /app

# Ambil konfigurasi package dulu
COPY package*.json ./
RUN npm install --production

# COPY TITIK TITIK (Artinya copy SEMUA yang ada di folder project ke /app)
COPY . . 

EXPOSE 5000
CMD ["node", "src/index.js"]