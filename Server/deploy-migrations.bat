@echo off
cd /d "%~dp0"

echo ==========================================
echo [1/3] Atualizando Node.js na VPS (Correcao do erro de sintaxe)...
echo ==========================================
ssh root@69.169.109.119 "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"

echo.
echo ==========================================
echo [2/3] Enviando Migrations para VPS...
echo ==========================================
scp -r prisma\migrations root@69.169.109.119:/home/sistema-comanda/Server/prisma/

echo.
echo ==========================================
echo [3/3] Atualizando Banco e Reiniciando...
echo ==========================================
ssh root@69.169.109.119 "cd /home/sistema-comanda/Server && npm install && npx prisma migrate deploy && pm2 restart backend"

echo.
echo ==========================================
echo PROCESSO FINALIZADO!
echo Aguarde 10 segundos e tente acessar o site.
echo ==========================================
pause
