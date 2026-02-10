# ============================================
# Configuração de Backup Automático na VPS Linux
# ============================================

## 📋 Passo a Passo

### 1. Conectar na VPS

```bash
ssh root@69.169.109.119
```

### 2. Navegar até o diretório do projeto

```bash
cd /caminho/do/seu/projeto/Server
# Exemplo: cd /root/sistema-comanda/Server
```

### 3. Criar o script de backup

```bash
# Criar o arquivo
nano backup.sh

# Cole o conteúdo do script backup.sh
# Salve com Ctrl+O, Enter, Ctrl+X
```

### 4. Dar permissão de execução

```bash
chmod +x backup.sh
```

### 5. Testar o script manualmente

```bash
./backup.sh
```

Você deverá ver mensagens de sucesso e o backup será criado em `backups/`.

### 6. Verificar se o backup foi criado

```bash
ls -lh backups/
```

### 7. Configurar o crontab

```bash
crontab -e
```

Se perguntar qual editor usar, escolha `nano` (geralmente opção 1).

### 8. Adicionar as linhas do crontab

Cole as seguintes linhas no final do arquivo:

```cron
# Backup Sistema Comanda - De hora em hora das 14h às 02h
# Formato: minuto hora dia mês dia-da-semana comando

# Das 14h às 23h (todos os dias)
0 14-23 * * * /root/sistema-comanda/Server/backup.sh >> /root/sistema-comanda/Server/backups/logs/cron.log 2>&1

# Das 00h às 02h (todos os dias)
0 0-2 * * * /root/sistema-comanda/Server/backup.sh >> /root/sistema-comanda/Server/backups/logs/cron.log 2>&1
```

**IMPORTANTE:** Ajuste o caminho `/root/sistema-comanda/Server/backup.sh` para o caminho real do seu projeto!

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

### 9. Verificar se o crontab foi configurado

```bash
crontab -l
```

Você deverá ver as linhas que acabou de adicionar.

### 10. Verificar logs do cron (opcional)

```bash
# Ver últimas 50 linhas do log
tail -f /root/sistema-comanda/Server/backups/logs/cron.log

# Pressione Ctrl+C para sair
```

## 📅 Horários de Execução

O backup será executado:
- **14:00** (2 da tarde)
- **15:00**
- **16:00**
- **17:00**
- **18:00**
- **19:00**
- **20:00**
- **21:00**
- **22:00**
- **23:00**
- **00:00** (meia-noite)
- **01:00**
- **02:00** (2 da manhã)

**Total:** 13 backups por dia

## 📦 Retenção de Backups

- Backups são mantidos por **7 dias**
- Backups são comprimidos com gzip (economiza espaço)
- Limpeza automática de backups antigos

## 🔍 Comandos Úteis

### Ver todos os backups

```bash
ls -lh /root/sistema-comanda/Server/backups/
```

### Ver logs de backup

```bash
# Log do mês atual
tail -50 /root/sistema-comanda/Server/backups/logs/backup_$(date +%Y-%m).log

# Acompanhar em tempo real
tail -f /root/sistema-comanda/Server/backups/logs/backup_$(date +%Y-%m).log
```

### Restaurar um backup

```bash
# Descompactar
gunzip -k backups/backup_sistema_comanda_2026-02-09_14-00-00.sql.gz

# Restaurar
psql -h localhost -p 5433 -U postgres -d sistema_comanda < backups/backup_sistema_comanda_2026-02-09_14-00-00.sql
```

### Parar os backups automáticos

```bash
# Editar crontab
crontab -e

# Comente as linhas adicionando # no início:
# 0 14-23 * * * /root/sistema-comanda/Server/backup.sh >> ...
# 0 0-2 * * * /root/sistema-comanda/Server/backup.sh >> ...

# Ou remova completamente
crontab -r  # Remove TODOS os cron jobs
```

### Espaço em disco

```bash
# Ver espaço usado pelos backups
du -sh /root/sistema-comanda/Server/backups/

# Ver espaço disponível no disco
df -h
```

## 🛠️ Troubleshooting

### Erro: "pg_dump: command not found"

```bash
# Instalar PostgreSQL client tools
apt update
apt install postgresql-client
```

### Erro: "Permission denied"

```bash
# Dar permissão de execução
chmod +x /root/sistema-comanda/Server/backup.sh
```

### Backups não estão sendo criados

```bash
# Verificar se o cron está rodando
systemctl status cron

# Iniciar o cron se necessário
systemctl start cron
systemctl enable cron

# Ver logs do sistema
grep CRON /var/log/syslog | tail -20
```

### Testar conexão com o banco

```bash
psql -h localhost -p 5433 -U postgres -d sistema_comanda -c "SELECT COUNT(*) FROM \"Tab\";"
```

## 📝 Exemplo de Uso Completo

```bash
# 1. Conectar na VPS
ssh root@69.169.109.119

# 2. Ir para o diretório do projeto
cd /root/sistema-comanda/Server

# 3. Criar o script (copie o conteúdo de backup.sh)
nano backup.sh

# 4. Dar permissão
chmod +x backup.sh

# 5. Testar
./backup.sh

# 6. Configurar crontab
crontab -e
# Adicione as linhas do cron

# 7. Verificar
crontab -l

# 8. Acompanhar logs
tail -f backups/logs/cron.log
```

## ✅ Pronto!

Seu sistema de backup está configurado e rodará automaticamente de hora em hora das 14h às 02h!
