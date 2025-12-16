# 🤖 Setup do ShadowDesk Bot (Correção de Sincronização)

Este pacote contém a correção para o problema de sincronização de lembretes e instruções para reinstalação limpa.

## 🛠️ O que foi corrigido?
- **Lógica de Tempo:** O bot agora compara timestamps (`Date` objects) ao invés de strings, evitando erros de fuso horário.
- **Logs Melhorados:** Logs mais detalhados (`console.log`) foram adicionados para mostrar exatamente *por que* um lembrete foi ou não disparado (diferença de tempo em minutos).
- **Scripts:** Adicionado comando `npm run dev` para facilitar testes.

---

## 📋 Pré-requisitos
1. **Node.js 18+** instalado (se rodar local).
2. **Conta Firebase** com o projeto `shadowdesk`.
3. **Arquivo de Chave:** Você PRECISA do arquivo `serviceAccountKey.json` do Firebase.

---

## 🚀 Passo a Passo: Instalação Limpa (Recomendado)

### 1. Preparação
1. Pare qualquer instância antiga do bot rodando.
2. Baixe e extraia este arquivo ZIP no servidor (ou localmente para testar).
3. **IMPORTANTÍSSIMO:** Copie seu arquivo `serviceAccountKey.json` para dentro da pasta `shadow-bot`.

### 2. Rodando com Docker (Servidor Oracle)
Se você usa Docker, siga estes passos no servidor:

```bash
# Entre na pasta
cd shadow-bot

# Construa a imagem novamente (para garantir que pegou o código novo)
docker build -t shadow-bot .

# Pare container antigo (se houver)
docker stop shadow-bot-container
docker rm shadow-bot-container

# Rode o novo container (com fuso horário de SP para garantir logs corretos)
docker run -d --name shadow-bot-container \
  -e TZ="America/Sao_Paulo" \
  --restart unless-stopped \
  shadow-bot
```

> **Dica:** Para ver o QR Code, monitore os logs:
> `docker logs -f shadow-bot-container`

### 3. Rodando Manualmente (Sem Docker)
Se preferir rodar direto no Node:

```bash
cd shadow-bot
npm install
npm run dev
```

---

## 🔍 Como verificar se está funcionando?
Acompanhe os logs. O novo sistema de log vai mostrar mensagens assim:

- `👀 Monitorando lembretes pendentes...` (Bot iniciou)
- `ℹ️ Lembrete "Teste" detectado, mas fora do horário de disparo. Diff: 55.20 min` (Bot viu o lembrete, mas ainda não é a hora)
- `⏰ Hora do lembrete! (Diff: 0.10 min)` (Bot está enviando!)
- `📞 Enviando para: 551499...` (Bot conectou no Whats e enviou)

### Teste Rápido
1. Crie um lembrete no site para **daqui a 2 minutos**.
2. Olhe o log do bot.
3. Se ele disser "fora do horário" com uma diferença negativa (ex: -180 min), significa que o fuso horário do servidor está muito errado em relação ao horário do lembrete gravado. A nova correção tenta mitigar isso, mas o ideal é que servidor e lembrete estejam alinhados.

---

## 🆘 Solução de Problemas

**Erro: "serviceAccountKey.json não encontrado"**
- Certifique-se de que o arquivo está na MESMA pasta que o `bot.js` ou na pasta pai.

**Erro: Falha no Puppeteer/Chrome**
- No Docker, o `Dockerfile` já instala o Chrome necessário. Localmente, certifique-se de ter o Chrome instalado ou deixe o Puppeteer baixar o Chromium (pode demorar na primeira vez).

**Lembretes não chegam**
- Verifique se o número no cadastro tem DDI (55) e DDD. O bot tenta corrigir, mas números muito errados falham.
- Verifique se o status do lembrete no Firebase está como `pendente`.

**Bot envia mensagem repetida?**
- O sistema tem uma trava (`processandoBot: true`) para evitar isso. Se o bot travar no meio do envio, o lembrete pode ficar preso. A correção atual tenta liberar lembretes presos após um tempo.
