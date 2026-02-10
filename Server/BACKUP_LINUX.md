# 🔧 Troubleshooting e Setup Google Drive - Linux

## 🚨 Problemas Comuns e Soluções

### 1. Erro: "pg_dump: command not found"

**Solução:**
```bash
# Atualizar repositórios
sudo apt update

# Instalar PostgreSQL client
sudo apt install postgresql-client -y

# Verificar instalação
pg_dump --version
```

### 2. Erro: "Connection refused" ao conectar no banco

**Possíveis causas:**
- PostgreSQL não está rodando
- Porta incorreta
- Host incorreto

**Soluções:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Habilitar para iniciar automaticamente
sudo systemctl enable postgresql

# Testar conexão manualmente
psql -h localhost -p 5433 -U postgres -d sistema_comanda -c "SELECT 1;"
```

### 3. Erro: "Permission denied" ao executar script

**Solução:**
```bash
# Dar permissão de execução
chmod +x backup.sh
chmod +x setup-rclone.sh

# Verificar permissões
ls -l *.sh
```

### 4. Script não executa no crontab

**Soluções:**
```bash
# 1. Verificar se o cron está rodando
sudo systemctl status cron

# 2. Iniciar o cron
sudo systemctl start cron

# 3. Ver logs do cron
grep CRON /var/log/syslog | tail -20

# 4. Usar caminhos absolutos no crontab
# ERRADO: ./backup.sh
# CERTO: /root/sistema-comanda/Server/backup.sh
```

### 5. Erro ao fazer parse do DATABASE_URL

**Solução:**
```bash
# Verificar se o arquivo .env existe
cat .env | grep DATABASE_URL

# Remover espaços e caracteres especiais
# O arquivo .env deve ter exatamente:
DATABASE_URL="postgresql://postgres:senha@localhost:5433/sistema_comanda?schema=public"

# Sem espaços antes ou depois do =
```

---

## 📦 Setup Google Drive com rclone

### Passo 1: Executar script de setup

```bash
# Dar permissão
chmod +x setup-rclone.sh

# Executar
./setup-rclone.sh
```

### Passo 2: Configuração Manual (se preferir)

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Configurar
rclone config

# Seguir as instruções:
# n (novo)
# gdrive (nome)
# drive (tipo)
# Enter (client ID vazio)
# Enter (client secret vazio)
# 1 (scope - acesso completo)
# Enter (root folder vazio)
# Enter (service account vazio)
# n (não editar avançado)
# n (NÃO usar auto config - importante!)
# [Copiar link e abrir no navegador]
# [Fazer login e autorizar]
# [Colar código de verificação]
# n (não é team drive)
# y (confirmar)
# q (sair)
```

### Passo 3: Testar rclone

```bash
# Listar pastas do Google Drive
rclone lsd gdrive:

# Criar pasta de backups
rclone mkdir gdrive:Backups/SistemaComanda

# Testar upload
echo "teste" > teste.txt
rclone copy teste.txt gdrive:Backups/SistemaComanda/
rm teste.txt

# Listar arquivos
rclone ls gdrive:Backups/SistemaComanda
```

### Passo 4: Atualizar backup.sh

O script já está configurado! Apenas certifique-se que:
```bash
ENABLE_GDRIVE_UPLOAD=true  # Está como true
```

---

## 🔍 Comandos de Diagnóstico

### Verificar ambiente

```bash
# Ver caminho atual
pwd

# Ver conteúdo do diretório
ls -la

# Ver se .env existe
cat .env

# Ver se backup.sh existe e tem permissão
ls -l backup.sh

# Testar script manualmente
./backup.sh
```

### Verificar logs

```bash
# Log de backup mais recente
tail -50 backups/logs/backup_$(date +%Y-%m).log

# Log do cron
tail -50 backups/logs/cron.log

# Acompanhar em tempo real
tail -f backups/logs/backup_$(date +%Y-%m).log
```

### Verificar backups

```bash
# Backups locais
ls -lh backups/*.gz

# Backups no Google Drive
rclone ls gdrive:Backups/SistemaComanda

# Espaço usado
du -sh backups/
```

---

## 📝 Comandos Completos para Copiar e Colar

### Setup Inicial Completo

```bash
# 1. Conectar na VPS
ssh root@69.169.109.119

# 2. Navegar para o diretório (ajuste o caminho!)
cd /root/sistema-comanda/Server

# 3. Instalar PostgreSQL client (se necessário)
sudo apt update && sudo apt install postgresql-client -y

# 4. Criar backup.sh
nano backup.sh
# Cole o conteúdo do arquivo backup.sh atualizado
# Ctrl+O, Enter, Ctrl+X

# 5. Criar setup-rclone.sh
nano setup-rclone.sh
# Cole o conteúdo do arquivo setup-rclone.sh
# Ctrl+O, Enter, Ctrl+X

# 6. Dar permissões
chmod +x backup.sh setup-rclone.sh

# 7. Configurar Google Drive
./setup-rclone.sh

# 8. Testar backup
./backup.sh

# 9. Verificar se funcionou
ls -lh backups/
rclone ls gdrive:Backups/SistemaComanda

# 10. Configurar crontab
crontab -e
```

### Linhas do Crontab (ajuste o caminho!)

```cron
# Backup Sistema Comanda - De hora em hora das 14h às 02h
0 14-23 * * * /root/sistema-comanda/Server/backup.sh >> /root/sistema-comanda/Server/backups/logs/cron.log 2>&1
0 0-2 * * * /root/sistema-comanda/Server/backup.sh >> /root/sistema-comanda/Server/backups/logs/cron.log 2>&1
```

---

## ✅ Checklist de Verificação

Antes de configurar o cron, certifique-se:

- [ ] PostgreSQL está instalado e rodando
- [ ] `pg_dump` está disponível (`pg_dump --version`)
- [ ] Arquivo `.env` existe e está correto
- [ ] `backup.sh` tem permissão de execução (`chmod +x`)
- [ ] `backup.sh` roda manualmente sem erros (`./backup.sh`)
- [ ] rclone está instalado (`rclone version`)
- [ ] rclone está configurado (`rclone listremotes`)
- [ ] Upload para Google Drive funciona (`rclone ls gdrive:`)
- [ ] Caminhos no crontab são absolutos

---

## 🆘 Ainda com problemas?

Execute este comando e me envie a saída:

```bash
echo "=== Diagnóstico Completo ==="
echo "Diretório atual: $(pwd)"
echo ""
echo "Arquivos:"
ls -la *.sh .env 2>&1
echo ""
echo "PostgreSQL Client:"
which pg_dump
pg_dump --version 2>&1
echo ""
echo "rclone:"
which rclone
rclone version 2>&1
echo ""
echo "DATABASE_URL:"
grep DATABASE_URL .env 2>&1
echo ""
echo "Teste de backup:"
./backup.sh 2>&1 | head -20
```

Copie toda a saída e me envie para eu ajudar!
