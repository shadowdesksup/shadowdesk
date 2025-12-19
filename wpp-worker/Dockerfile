FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package.json ./
RUN npm install

# Copiar código fonte
COPY worker.js ./

# O arquivo chave-firebase.json deve ser montado via volume, mas copiamos um dummy se existir para build
# COPY chave-firebase.json ./chave-firebase.json

CMD ["npm", "start"]
