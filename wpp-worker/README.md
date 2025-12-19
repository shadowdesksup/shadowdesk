# ShadowDesk WhatsApp Worker

Worker independente em Node.js/TypeScript para envio de lembretes do ShadowDesk via WhatsApp.

## 📋 Pré-requisitos

1.  **Node.js LTS** (v18 ou superior recomendado)
2.  **Conta Oracle Cloud** com VM Ubuntu configurada.
3.  **Arquivo `serviceAccountKey.json`** do Firebase.

## 🚀 Instalação e Configuração

### 1. Transferir Arquivos
Transfira a pasta `wpp-worker` para a VM. Certifique-se de incluir o `serviceAccountKey.json` na raiz da pasta `wpp-worker`.

```bash
# Exemplo via SCP (executar da sua máquina local)
scp -i "sua-chave-ssh.key" -r ./wpp-worker ubuntu@seu-ip:/home/ubuntu/
scp -i "sua-chave-ssh.key" serviceAccountKey.json ubuntu@seu-ip:/home/ubuntu/wpp-worker/
```

### 2. Instalar Dependências
Na VM, acesse a pasta e instale as dependências:

```bash
cd wpp-worker
npm install
```

> **Nota:** O Puppeteer instalará um Chromium local. Se houver problemas de dependências do sistema no Ubuntu, instale as libs necessárias:
> `sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils`

### 3. Build do TypeScript
Compile o código para JavaScript:

```bash
npm run build
```
Isso criará a pasta `dist/`.

## 🏃‍♂️ Execução

### Primeira Execução (Autenticação)
Execute manualmente para escanear o QR Code:

```bash
npm start
```
1.  Aguarde o QR Code aparecer no terminal.
2.  Escaneie com o app do WhatsApp (Dispositivos Conectados).
3.  Após ver "WhatsApp Client is ready!", pode parar com `Ctrl+C`. A sessão ficará salva em `.wwebjs_auth`.

### Execução em Background (Produção)
Use o PM2 para manter o worker rodando:

```bash
# Instalar PM2 globalmente (se não tiver)
sudo npm install -g pm2

# Iniciar o worker
pm2 start dist/index.js --name "shadow-wpp-worker"

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

## 🛠️ Estrutura de Arquivos

- `src/index.ts`: Ponto de entrada.
- `src/scheduler.ts`: Cron job que roda a cada minuto.
- `src/firebase.ts`: Conexão com Firestore.
- `src/whatsapp.ts`: Cliente WhatsApp (wwebjs).
- `.wwebjs_auth/`: Pasta onde a sessão do WhatsApp é persistida (não apague!).

## ⚠️ Limitações e Riscos

- **Dependência de Celular:** O WhatsApp Web requer um celular conectado ocasionalmente.
- **Bloqueio de Número:** O uso de automação pode levar ao banimento do número se houver envio em massa ou spam. **Use com moderação.**
- **Headless Mode:** O Puppeteer roda sem interface gráfica. Se o WhatsApp Web mudar a estrutura da página, a lib `whatsapp-web.js` pode quebrar e precisará ser atualizada.
