#!/bin/bash

# ==========================================
# Configuração de Domínio e SSL - Sistema Comanda
# ==========================================

DOMAIN="zerosetebar.com.br"
EMAIL="admin@zerosetebar.com.br" # Email para renovação do SSL
APP_PORT=3000
API_PORT=3001
PROJECT_DIR="/root/sistema-comanda/Server"

echo "=========================================="
echo "Iniciando configuração para $DOMAIN"
echo "=========================================="

# 1. Atualizar Sistema
echo "[1/6] Atualizando pacotes do sistema..."
apt update > /dev/null 2>&1

# 2. Instalar Nginx e Certbot
echo "[2/6] Instalando Nginx e Certbot..."
apt install nginx certbot python3-certbot-nginx -y > /dev/null 2>&1
systemctl enable nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1

# 3. Criar Configuração do Nginx
echo "[3/6] Criando configuração do Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    server_name $DOMAIN www.$DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Ativar site e remover padrão
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar Nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "Nginx configurado com sucesso!"
else
    echo "ERRO: Configuração do Nginx inválida!"
    exit 1
fi

# 4. Obter Certificado SSL
echo "[4/6] Obtendo certificado SSL (Let's Encrypt)..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

# 5. Atualizar .env
echo "[5/6] Atualizando arquivo .env..."
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    # Backup do .env
    cp $ENV_FILE "$ENV_FILE.bak"
    
    # Atualizar URLs
    # Usando | como delimitador para evitar conflito com / nas URLs
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" $ENV_FILE
    sed -i "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=https://$DOMAIN/auth/google/callback|g" $ENV_FILE
    
    echo ".env atualizado com as novas URLs!"
else
    echo "AVISO: Arquivo .env não encontrado em $ENV_FILE"
fi

# 6. Finalização
echo "[6/6] Reiniciando aplicação (se usar PM2)..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "Aplicação reiniciada!"
else
    echo "PM2 não encontrado. Reinicie sua aplicação manualmente."
fi

echo "=========================================="
echo "CONCLUÍDO! Acesse: https://$DOMAIN"
echo "=========================================="
