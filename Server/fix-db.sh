#!/bin/bash

# ==========================================
# Correção de Banco de Dados e Porta - Sistema Comanda
# ==========================================

PROJECT_DIR=$(pwd)
ENV_FILE="$PROJECT_DIR/.env"

echo "=========================================="
echo "Iniciando Correção do Banco e Porta"
echo "=========================================="

# 1. Garantir que PORT=3001 no .env
echo "[1/3] Configurando Porta 3001..."
if grep -q "PORT=" "$ENV_FILE"; then
    sed -i "s/PORT=.*/PORT=3001/" "$ENV_FILE"
else
    echo "PORT=3001" >> "$ENV_FILE"
fi
echo "Porta configurada para 3001."

# 2. Rodar Migrations do Prisma
echo "[2/3] Atualizando Banco de Dados (Migrations)..."
# Forçar instalação das dependências caso falte algo
npm install > /dev/null 2>&1
npx prisma generate
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "Banco de dados atualizado com sucesso!"
else
    echo "ERRO ao atualizar banco de dados!"
    exit 1
fi

# 3. Reiniciar Backend
echo "[3/3] Reiniciando Backend..."
pm2 delete frontend 2>/dev/null || true # Garantir que frontend morra
pm2 restart backend || pm2 start src/server.js --name backend

echo "=========================================="
echo "SISTEMA CORRIGIDO!"
echo "Aguarde 10 segundos e tente acessar o site."
echo "=========================================="
