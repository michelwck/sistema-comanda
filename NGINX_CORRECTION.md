# Correção Crítica do Nginx (Autenticação)

O problema é que o Nginx está enviando a rota de login (`/auth`) para o **Frontend** (porta 3000), mas quem lida com isso é o **Backend** (porta 3001).

Você precisa editar o arquivo de configuração do Nginx na sua VPS.

### 1. Abra a configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/default
# OU (se você criou um arquivo específico)
sudo nano /etc/nginx/sites-available/zerosetebar.com.br
```

### 2. Adicione (ou corrija) o bloco `/auth`

Dentro do bloco `server { ... }`, certifique-se de que você tem estes blocos configurados EXATAMENTE assim:

```nginx
    # Backend API (Porta 3001)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Autenticação Google (CRÍTICO - Adicione isto!)
    # Isso manda tudo que começa com /auth direto pro backend
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (Porta 3000) - Fica por último ou nolocation /
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```

### 3. Teste e Reinicie o Nginx

```bash
# Verifica se a configuração está válida
sudo nginx -t

# Se der "syntax is ok", reinicie:
sudo service nginx restart
```

Agora o Nginx vai saber que quando você clica em "Entrar com Google" (`/auth/google`), ele deve mandar o pedido para o Backend (3001), e não para o Frontend.
