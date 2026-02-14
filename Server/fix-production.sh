#!/bin/bash

# ==========================================
# Correção de Deploy - Sistema Comanda
# ==========================================

DOMAIN="zerosetebar.com.br"
PROJECT_DIR=$(pwd)
FRONTEND_DIR="/var/www/zerosetebar/dist"
BACKEND_PORT=3001

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "ERRO: Execute este script de DENTRO da pasta Server do projeto!"
    echo "Exemplo: cd /home/usuario/sistema-comanda/Server && ./fix-production.sh"
    exit 1
fi

echo "=========================================="
echo "Corrigindo configuração para $DOMAIN"
echo "=========================================="

# 1. Criar diretório para o Frontend
echo "[1/4] Preparando diretório do Frontend..."
mkdir -p $FRONTEND_DIR
chown -R $USER:$USER /var/www/zerosetebar

# 2. Atualizar Nginx para servir arquivos estáticos
echo "[2/4] Atualizando configuração do Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    server_name $DOMAIN www.$DOMAIN;

    root $FRONTEND_DIR;
    index index.html;

    # Frontend (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    # SSL Config (Gerado pelo Certbot)
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if (\$host = www.$DOMAIN) {
        return 301 https://$DOMAIN\$request_uri;
    } # managed by Certbot

    if (\$host = $DOMAIN) {
        return 301 https://$DOMAIN\$request_uri;
    } # managed by Certbot

    server_name $DOMAIN www.$DOMAIN;
    listen 80;
    return 404; # managed by Certbot
}
EOF

# 3. Atualizar Porta do Backend
echo "[3/4] Configurando Backend na porta $BACKEND_PORT..."
ENV_FILE="$PROJECT_DIR/.env"
if grep -q "PORT=" "$ENV_FILE"; then
    sed -i "s/PORT=.*/PORT=$BACKEND_PORT/" "$ENV_FILE"
else
    echo "PORT=$BACKEND_PORT" >> "$ENV_FILE"
fi

# 4. Reiniciar Serviços
echo "[4/4] Reiniciando serviços..."
nginx -t && systemctl reload nginx
if command -v pm2 &> /dev/null; then
    pm2 restart all
fi

echo "=========================================="
echo "Servidor corrigido!"
echo "Agora você precisa fazer o upload do BUILD do frontend para:"
echo "$FRONTEND_DIR"
echo "=========================================="
