# 🌐 Configuração do Domínio zerosetebar.com.br

## 📌 Visão Geral

Este guia mostra como configurar o domínio **zerosetebar.com.br** para funcionar com o sistema de comandas hospedado na VPS `69.169.109.119`.

---

## 1️⃣ Configurar DNS no Registro.br

### Passo 1: Acessar o Painel do Registro.br

1. Acesse: https://registro.br/
2. Faça login com sua conta
3. Vá em **"Meus Domínios"**
4. Clique em **zerosetebar.com.br**

### Passo 2: Configurar os Registros DNS

> [!CAUTION]
> **Você está na tela errada se viu o erro "Endereços IP não podem ser usados como servidores DNS"!**
> 1. Clique em **CANCELAR** nessa tela.
> 2. Role a página até encontrar a seção **"DNS"**.
> 3. Clique em **"Configurar Zona DNS"** ou **"Editar Zona"**.
> 4. Se não aparecer, verifique se você está usando os **Servidores DNS do Registro.br** (pode haver um botão para "Utilizar DNS do Registro.br").

Uma vez na tela de **Edição de Zona** (onde você vê campos para adicionar registros), adicione:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | 69.169.109.119 | 3600 |
| A | www | 69.169.109.119 | 3600 |

> [!IMPORTANT]
> - O registro `@` aponta o domínio raiz (zerosetebar.com.br)
> - O registro `www` aponta o subdomínio (www.zerosetebar.com.br)
> - A propagação DNS pode levar de 5 minutos a 48 horas (geralmente 1-2 horas)

### Passo 3: Verificar Propagação DNS

Após configurar, aguarde alguns minutos e teste:

```bash
# No Windows (PowerShell):
nslookup zerosetebar.com.br
nslookup www.zerosetebar.com.br

# Deve retornar: 69.169.109.119
```

---

## 2️⃣ Configurar Nginx na VPS

### Conectar na VPS

```bash
ssh root@69.169.109.119
```

### Instalar Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/zerosetebar
```

Cole a seguinte configuração:

```nginx
# Redirecionar HTTP para HTTPS (será configurado depois)
server {
    listen 80;
    listen [::]:80;
    server_name zerosetebar.com.br www.zerosetebar.com.br;

    # Temporariamente servir a aplicação (antes do SSL)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io (se estiver usando)
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

> [!NOTE]
> Ajuste as portas `3000` (frontend) e `3001` (backend) conforme sua configuração atual.

### Ativar o Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/zerosetebar /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Verificar Status

```bash
sudo systemctl status nginx
```

---

## 3️⃣ Configurar SSL/HTTPS com Let's Encrypt

### Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obter Certificado SSL

```bash
sudo certbot --nginx -d zerosetebar.com.br -d www.zerosetebar.com.br
```

Siga as instruções:
1. Digite seu email
2. Aceite os termos de serviço (Y)
3. Escolha se quer compartilhar email (N ou Y)
4. Escolha opção **2** (Redirecionar HTTP para HTTPS)

> [!TIP]
> O Certbot irá automaticamente modificar a configuração do Nginx para adicionar SSL e redirecionar HTTP para HTTPS.

### Renovação Automática

O Certbot configura renovação automática. Teste com:

```bash
sudo certbot renew --dry-run
```

### Verificar Configuração Final

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4️⃣ Configurar a Aplicação

### Atualizar Variáveis de Ambiente no Backend

```bash
cd /root/sistema-comanda/Server
nano .env
```

Atualize as seguintes variáveis:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=26291103322-54ff6nkq2kb34evru9jp3uhur18nvv43.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://zerosetebar.com.br/auth/google/callback

# JWT Configuration
JWT_SECRET=barcomanda-jwt-secret-2026-change-in-production
JWT_EXPIRES_IN=30d

# Frontend URL
FRONTEND_URL=https://zerosetebar.com.br

# Database
DATABASE_URL="postgresql://postgres:admin@localhost:5433/sistema_comanda?schema=public"
```

> [!WARNING]
> Você também precisará atualizar a URL de callback no Google Cloud Console para usar o novo domínio!

### Atualizar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Vá em **APIs & Services** > **Credentials**
3. Clique no seu OAuth 2.0 Client ID
4. Em **Authorized redirect URIs**, adicione:
   - `https://zerosetebar.com.br/auth/google/callback`
5. Salve as alterações

### Reiniciar a Aplicação

```bash
# Se estiver usando PM2:
pm2 restart all

# Ou se estiver rodando manualmente:
# Pare o processo atual (Ctrl+C) e inicie novamente
cd /root/sistema-comanda/Server
npm start
```

---

## 5️⃣ Configurar Frontend (Local)

### Atualizar URL da API

Se você tiver um arquivo de configuração no frontend (como `.env` ou `config.js`), atualize para:

```env
VITE_API_URL=https://zerosetebar.com.br/api
```

### Rebuild e Deploy

```bash
# No Windows:
cd C:\Users\zeros\Documents\sistema-comanda
npm run build

# Transferir para VPS:
scp -r dist/* root@69.169.109.119:/var/www/zerosetebar/

# Ou fazer git push e pull na VPS:
git add .
git commit -m "Atualizar URLs para domínio próprio"
git push

# Na VPS:
cd /root/sistema-comanda
git pull
npm run build
```

---

## 6️⃣ Verificação Final

### Checklist de Testes

- [ ] DNS propagado (`nslookup zerosetebar.com.br`)
- [ ] Site acessível via HTTP (`http://zerosetebar.com.br`)
- [ ] Redirecionamento para HTTPS funcionando
- [ ] Site acessível via HTTPS (`https://zerosetebar.com.br`)
- [ ] Certificado SSL válido (cadeado verde no navegador)
- [ ] API respondendo (`https://zerosetebar.com.br/api/health` ou similar)
- [ ] Login com Google funcionando
- [ ] Socket.io conectando (se aplicável)

### Comandos de Diagnóstico

```bash
# Na VPS:

# 1. Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# 2. Verificar certificado SSL
sudo certbot certificates

# 3. Verificar processos da aplicação
pm2 list  # Se usando PM2
ps aux | grep node  # Processos Node.js

# 4. Verificar logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
pm2 logs  # Se usando PM2

# 5. Testar conexão local
curl http://localhost:3000
curl http://localhost:3001/api/health
```

---

## 🔥 Firewall (Importante!)

Certifique-se de que as portas estão abertas:

```bash
# Verificar status do firewall
sudo ufw status

# Se o firewall estiver ativo, abrir portas necessárias:
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw reload
```

---

## 🆘 Problemas Comuns

### DNS não propaga
- Aguarde até 48 horas
- Verifique se configurou corretamente no Registro.br
- Use ferramentas online: https://dnschecker.org/

### Nginx não inicia
```bash
# Ver logs de erro
sudo journalctl -u nginx -n 50

# Verificar configuração
sudo nginx -t
```

### Certificado SSL falha
```bash
# Verificar se DNS está propagado primeiro
nslookup zerosetebar.com.br

# Tentar novamente
sudo certbot --nginx -d zerosetebar.com.br -d www.zerosetebar.com.br
```

### Erro 502 Bad Gateway
- Verifique se a aplicação está rodando (`pm2 list` ou `ps aux | grep node`)
- Verifique as portas no Nginx (devem corresponder às portas da aplicação)
- Veja os logs: `pm2 logs` ou `sudo tail -f /var/log/nginx/error.log`

### Login Google não funciona
- Verifique se atualizou a URL no Google Cloud Console
- Verifique se o `.env` tem a URL correta
- Reinicie a aplicação após alterar `.env`

---

## 📊 Arquitetura Final

```
Internet
    ↓
zerosetebar.com.br (DNS → 69.169.109.119)
    ↓
Nginx (Porta 80/443)
    ↓
    ├─→ Frontend (localhost:3000) → /
    ├─→ Backend API (localhost:3001) → /api
    └─→ Socket.io (localhost:3001) → /socket.io
```

---

## 🎉 Próximos Passos

Após configurar o domínio:

1. **Monitoramento**: Configure alertas para certificado SSL expirando
2. **Backup**: Certifique-se de que os backups estão funcionando
3. **Performance**: Configure cache no Nginx se necessário
4. **Segurança**: 
   - Altere `JWT_SECRET` para um valor mais seguro
   - Configure rate limiting no Nginx
   - Mantenha o sistema atualizado

---

**Pronto! Seu domínio estará configurado! 🚀**
