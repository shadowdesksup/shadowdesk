$ErrorActionPreference = "Stop"

$KEY_PATH = "C:/Users/Administrator/Downloads/ssh-key-shadowdesk.key"
$VPS_USER = "ubuntu"
$VPS_IP = "132.226.253.207"
$LOCAL_ZIP = "C:/Users/Administrator/Documents/shadowdesk/wpp-worker.zip"
$REMOTE_DIR = "/home/ubuntu/shadow-bot"
$REMOTE_ZIP = "$REMOTE_DIR/wpp-worker.zip"

Write-Host "🚀 Iniciando Deploy para VPS ($VPS_IP)..."

# 1. Enviar arquivo ZIP
Write-Host "📦 Enviando arquivos (SCP)..."
# Usando path absoluto e forward slashes
scp -o "StrictHostKeyChecking=no" -i "$KEY_PATH" "$LOCAL_ZIP" "${VPS_USER}@${VPS_IP}:${REMOTE_ZIP}"

# 2. Executar comandos remotos
Write-Host "🔧 Configurando e rodando Docker na VPS..."
$commands = "mkdir -p $REMOTE_DIR/wpp-worker && " +
            "unzip -o $REMOTE_ZIP -d $REMOTE_DIR/wpp-worker && " +
            "cd $REMOTE_DIR/wpp-worker && " +
            "docker-compose down && " +
            "docker-compose up -d --build"

ssh -o StrictHostKeyChecking=no -i $KEY_PATH "$VPS_USER@$VPS_IP" $commands

Write-Host "✅ Deploy Finalizado! Verifique os logs com:"
Write-Host "ssh -i $KEY_PATH $VPS_USER@$VPS_IP 'docker logs -f shadow-worker'"
