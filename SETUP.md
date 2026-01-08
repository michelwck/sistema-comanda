# 🚀 Guia de Setup - Sistema de Comandas

## ⚠️ Problema Detectado: PowerShell Execution Policy

Seu sistema está bloqueando a execução de scripts npm. Você precisa liberar isso primeiro.

### Solução Rápida (Recomendado):

Abra o PowerShell **como Administrador** e execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois feche e abra um novo terminal normal.

---

## 📋 Passos de Instalação

### 1️⃣ Instalar Dependências do Frontend

```bash
cd c:\Users\zeros\Documents\sistema-comanda
npm install
```

### 2️⃣ Instalar Dependências do Backend

```bash
cd Server
npm install
```

### 3️⃣ Configurar PostgreSQL

**Você já tem PostgreSQL instalado?**

- ✅ **SIM** → Pule para o passo 4
- ❌ **NÃO** → Instale primeiro:
  - Download: https://www.postgresql.org/download/windows/
  - Durante a instalação, anote a senha do usuário `postgres`

**Criar o banco de dados:**

Abra o terminal e execute:

```bash
psql -U postgres
```

Digite a senha e depois execute:

```sql
CREATE DATABASE sistema_comanda;
\q
```

### 4️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `Server\.env` e ajuste a senha do PostgreSQL:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/sistema_comanda"
PORT=3000
NODE_ENV=development
```

### 5️⃣ Executar Migração do Prisma

```bash
cd Server
npx prisma generate
npx prisma migrate dev --name init
```

### 6️⃣ Popular o Banco com Dados Iniciais (Seed)

```bash
npx prisma db seed
```

### 7️⃣ Iniciar o Backend

```bash
npm run dev
```

Você deve ver:
```
🚀 Servidor rodando na porta 3000
📡 Socket.io habilitado
```

### 8️⃣ Iniciar o Frontend (em outro terminal)

```bash
cd c:\Users\zeros\Documents\sistema-comanda
npm run dev
```

---

## ✅ Verificação

1. Backend rodando em: http://localhost:3000
2. Frontend rodando em: http://localhost:5173
3. Teste criar uma nova comanda
4. Verifique que os dados persistem após refresh da página

---

## 🔧 Comandos Úteis

### Ver dados no banco (Prisma Studio):
```bash
cd Server
npx prisma studio
```

### Resetar banco de dados:
```bash
cd Server
npx prisma migrate reset
```

### Ver logs do backend:
O terminal onde você executou `npm run dev` no Server mostrará todos os logs.

---

## 🐛 Problemas Comuns

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Verifique a senha no arquivo `.env`
- Verifique se o banco `sistema_comanda` foi criado

### Erro: "Port 3000 already in use"
- Algum processo já está usando a porta 3000
- Mude a porta no arquivo `Server\.env`: `PORT=3001`

### Erro: "CORS"
- Verifique se o backend está rodando
- Verifique o arquivo `.env.development` no frontend

---

## 📝 Próximos Passos

Após tudo funcionando, você pode:

1. Testar em múltiplos dispositivos na mesma rede
2. Abrir a aplicação em 2 navegadores e ver a sincronização em tempo real
3. Adicionar novos produtos e clientes
4. Customizar a aplicação conforme necessário

---

**Precisa de ajuda?** Me avise em qual passo você está tendo dificuldade!
