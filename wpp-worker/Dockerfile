FROM node:18-slim

# Instalar dependências para Chromium (necessário para whatsapp-web.js)
RUN apt-get update && apt-get install -y \
    chromium \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libnss3 \
    libxss1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código compilado e chave Firebase
COPY dist/ ./dist/
COPY serviceAccountKey.json ./serviceAccountKey.json

# Criar diretório para sessão WhatsApp
RUN mkdir -p /app/.wwebjs_auth

# Definir variável de ambiente para Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "dist/index.js"]
