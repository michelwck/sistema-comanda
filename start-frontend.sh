#!/bin/bash

# ==========================================
# INICIAR FRONTEND - Sistema Comanda
# ==========================================

echo "=========================================="
echo "    PREPARANDO FRONTEND (PORTA 3000)     "
echo "=========================================="

# 1. Instalar dependências
echo "[1/3] Instalando dependências..."
npm install

# 2. Build da Aplicação
echo "[2/3] Gerando Build de Produção..."
npm run build

# 3. Iniciar Servidor de Arquivos Estáticos com PM2
echo "[3/3] Iniciando Frontend no PM2 (Porta 3000)..."

# Remove processo antigo se existir
pm2 delete frontend 2>/dev/null || true

# Serve a pasta 'dist' na porta 3000 com suporte a SPA (Single Page App)
pm2 serve dist 3000 --name frontend --spa

echo "=========================================="
echo "✅ FRONTEND RODANDO NA PORTA 3000!"
echo "=========================================="
