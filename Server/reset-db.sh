#!/bin/bash

# ==========================================
# RESET TOTAL DO BANCO DE DADOS - Sistema Comanda
# ==========================================
# ATENÇÃO: ESTE SCRIPT APAGA TODOS OS DADOS DO BANCO!
# ==========================================

PROJECT_DIR=$(pwd)
ENV_FILE="$PROJECT_DIR/.env"

echo "=========================================="
echo "    INICIANDO RESET DO BANCO DE DADOS     "
echo "=========================================="
echo "⚠️  Todos os dados serão perdidos em 5 segundos..."
sleep 5

# 1. Instalar dependências (caso falte)
echo "[1/4] Instalando dependências..."
npm install > /dev/null 2>&1

# 2. Resetar Banco de Dados (usando db push para garantir schema atualizado)
echo "[2/4] Resetando Banco de Dados e Sincronizando Schema..."

# Remove migrações antigas que podem estar desatualizadas
rm -rf prisma/migrations

# Empurra o schema atual para o banco (cria tabelas conforme schema.prisma)
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados resetado e estrutura sincronizada!"
else
    echo "❌ ERRO ao sincronizar banco de dados!"
    exit 1
fi

# 2.1 Rodar Seed
echo "[2.1/4] Populando Banco de Dados (Seed)..."
npx prisma db seed

# 3. Regenerar Prisma Client
echo "[3/4] Regenerando Prisma Client..."
npx prisma generate

# 4. Reiniciar Backend
echo "[4/4] Reiniciando Backend no PM2..."
# Tenta reiniciar, se não existir, inicia
pm2 restart backend || pm2 start src/server.js --name backend

echo "=========================================="
echo "✅ SISTEMA RESETADO E REINICIADO!"
echo "Aguarde alguns segundos e acesse o site."
echo "=========================================="
