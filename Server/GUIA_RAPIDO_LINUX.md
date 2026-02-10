# 🚀 Guia Rápido - Backup Linux com Google Drive

## ⚡ Comandos Rápidos (Copie e Cole)

### 1️⃣ Conectar na VPS e Preparar

```bash
ssh root@69.169.109.119
cd /root/sistema-comanda/Server  # Ajuste se necessário
```

### 2️⃣ Instalar PostgreSQL Client (se necessário)

```bash
sudo apt update && sudo apt install postgresql-client -y
```

### 3️⃣ Criar os Scripts

**Opção A: Transferir do Windows para Linux**
```bash
# No Windows (PowerShell):
scp C:\Users\zeros\Documents\sistema-comanda\Server\backup.sh root@69.169.109.119:/root/sistema-comanda/Server/
scp C:\Users\zeros\Documents\sistema-comanda\Server\setup-rclone.sh root@69.169.109.119:/root/sistema-comanda/Server/

# Na VPS:
chmod +x backup.sh setup-rclone.sh
```

**Opção B: Criar Manualmente na VPS**
```bash
# backup.sh
nano backup.sh
# Cole o conteúdo, Ctrl+O, Enter, Ctrl+X

# setup-rclone.sh
nano setup-rclone.sh
# Cole o conteúdo, Ctrl+O, Enter, Ctrl+X

chmod +x backup.sh setup-rclone.sh
```

### 4️⃣ Configurar Google Drive

```bash
./setup-rclone.sh
```

**IMPORTANTE:** Quando pedir "Use auto config?", responda **n** (não)!
- Copie o link que aparecer
- Abra no navegador do seu PC
- Faça login e autorize
- Copie o código
- Cole no terminal da VPS

### 5️⃣ Testar Backup

```bash
./backup.sh
```

Você deve ver:
```
[2026-02-09 21:30:00] [INFO] ==========================================
[2026-02-09 21:30:00] [INFO] Iniciando rotina de backup
[2026-02-09 21:30:00] [SUCCESS] Backup criado: backup_sistema_comanda_2026-02-09_21-30-00.sql.gz (15K)
[2026-02-09 21:30:05] [SUCCESS] Upload para Google Drive concluído
[2026-02-09 21:30:05] [SUCCESS] Backup concluído com sucesso!
```

### 6️⃣ Verificar Backups

```bash
# Local
ls -lh backups/

# Google Drive
rclone ls gdrive:Backups/SistemaComanda
```

### 7️⃣ Configurar Crontab

```bash
crontab -e
```

Cole estas linhas (ajuste o caminho!):
```cron
# Backup Sistema Comanda - De hora em hora das 14h às 02h
0 14-23 * * * /root/sistema-comanda/Server/backup.sh >> /root/sistema-comanda/Server/backups/logs/cron.log 2>&1
0 0-2 * * * /root/sistema-comanda/Server/backup.sh >> /root/sistema-comanda/Server/backups/logs/cron.log 2>&1
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### 8️⃣ Verificar Crontab

```bash
crontab -l
```

---

## 🔧 Problemas? Execute o Diagnóstico

```bash
cd /root/sistema-comanda/Server

echo "=== Diagnóstico ==="
echo "1. PostgreSQL Client:"
which pg_dump && pg_dump --version

echo -e "\n2. rclone:"
which rclone && rclone version | head -1

echo -e "\n3. Arquivos:"
ls -l backup.sh setup-rclone.sh .env

echo -e "\n4. Teste de backup:"
./backup.sh

echo -e "\n5. Backups criados:"
ls -lh backups/*.gz 2>/dev/null || echo "Nenhum backup encontrado"

echo -e "\n6. Google Drive:"
rclone ls gdrive:Backups/SistemaComanda 2>/dev/null || echo "Erro ao acessar Google Drive"
```

---

## 📊 Comandos Úteis

```bash
# Ver logs em tempo real
tail -f backups/logs/backup_$(date +%Y-%m).log

# Ver últimos backups
ls -lht backups/*.gz | head -5

# Ver backups no Google Drive
rclone ls gdrive:Backups/SistemaComanda

# Baixar backup do Google Drive
rclone copy gdrive:Backups/SistemaComanda/backup_sistema_comanda_2026-02-09_14-00-00.sql.gz ./

# Restaurar backup
gunzip -k backup_sistema_comanda_2026-02-09_14-00-00.sql.gz
psql -h localhost -p 5433 -U postgres -d sistema_comanda < backup_sistema_comanda_2026-02-09_14-00-00.sql

# Ver espaço usado
du -sh backups/

# Parar backups automáticos
crontab -e  # Comente as linhas com #
```

---

## ✅ Checklist Final

- [ ] PostgreSQL client instalado (`pg_dump --version`)
- [ ] Scripts criados e com permissão (`ls -l *.sh`)
- [ ] rclone instalado (`rclone version`)
- [ ] Google Drive configurado (`rclone listremotes`)
- [ ] Backup manual funciona (`./backup.sh`)
- [ ] Backup aparece localmente (`ls backups/`)
- [ ] Backup aparece no Google Drive (`rclone ls gdrive:Backups/SistemaComanda`)
- [ ] Crontab configurado (`crontab -l`)

---

## 🆘 Erros Comuns

### "pg_dump: command not found"
```bash
sudo apt install postgresql-client -y
```

### "Permission denied"
```bash
chmod +x backup.sh setup-rclone.sh
```

### "rclone: command not found"
```bash
curl https://rclone.org/install.sh | sudo bash
```

### "Failed to configure token"
- Certifique-se de responder **n** para "Use auto config"
- Abra o link no navegador do seu PC (não da VPS)
- Copie o código corretamente

### Cron não executa
```bash
# Verificar se cron está rodando
sudo systemctl status cron

# Usar caminhos absolutos no crontab
# CERTO: /root/sistema-comanda/Server/backup.sh
# ERRADO: ./backup.sh
```

---

**Pronto! Seu sistema de backup está configurado! 🎉**
