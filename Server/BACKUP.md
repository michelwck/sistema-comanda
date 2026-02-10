# 📦 Sistema de Backup - Sistema Comanda

Sistema de backup incremental automático com armazenamento em múltiplos destinos (local, Google Drive e VPS).

## 🎯 Características

- ✅ **Backup Incremental**: Captura apenas dados novos/modificados nas últimas 24 horas
- ✅ **Backup Completo**: Opção para backup completo do banco de dados
- ✅ **Múltiplos Destinos**: Upload automático para Google Drive e VPS
- ✅ **Agendamento Automático**: Execução diária via Task Scheduler
- ✅ **Restauração Flexível**: Restaure de qualquer fonte (local, Drive ou VPS)
- ✅ **Logs Detalhados**: Registro completo de todas as operações
- ✅ **Retenção Configurável**: Limpeza automática de backups antigos

## 📋 Pré-requisitos

### Software Necessário

1. **PostgreSQL Client Tools** (pg_dump, psql)
   - Geralmente instalado junto com o PostgreSQL
   - Verifique: `pg_dump --version`

2. **OpenSSH Client** (para VPS)
   - Windows 10/11: Instale via Configurações > Aplicativos > Recursos Opcionais
   - Ou execute como Administrador:
     ```powershell
     Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
     ```

3. **rclone** (para Google Drive)
   - Será instalado automaticamente pelo script `setup-google-drive.ps1`

### Configuração

1. **Arquivo `.env.backup`**: Já criado em `Server/.env.backup`
   - Configure as credenciais da VPS se necessário
   - Ajuste períodos de retenção se desejar

## 🚀 Configuração Inicial

### 1. Configurar Google Drive

```powershell
cd Server
.\scripts\setup-google-drive.ps1
```

Este script irá:
- Instalar o rclone (se necessário)
- Guiá-lo pela configuração do Google Drive
- Criar a pasta de backups no Drive
- Testar a conexão e upload

### 2. Configurar VPS

```powershell
cd Server
.\scripts\setup-vps.ps1
```

Este script irá:
- Verificar/gerar chave SSH
- Copiar a chave pública para a área de transferência
- Instruir como adicionar a chave na VPS
- Testar a conexão SSH
- Criar diretório de backups na VPS
- Testar upload

> [!IMPORTANT]
> Você precisará adicionar a chave SSH pública na VPS manualmente. O script fornecerá instruções detalhadas.

### 3. Configurar Agendamento Automático

```powershell
cd Server
# Execute como Administrador
.\scripts\setup-backup-schedule.ps1
```

Este script irá:
- Criar tarefa no Task Scheduler
- Configurar horário de execução (padrão: 02:00)
- Permitir teste imediato

## 💾 Uso Manual

### Backup Completo

```powershell
cd Server
.\scripts\backup-incremental.ps1 -Full
```

### Backup Incremental

```powershell
cd Server
.\scripts\backup-incremental.ps1
```

### Backup sem Upload (apenas local)

```powershell
cd Server
.\scripts\backup-incremental.ps1 -SkipUpload
```

### Listar Backups Disponíveis

```powershell
cd Server
.\scripts\restore-backup.ps1 -List
```

### Restaurar Backup Local

```powershell
cd Server
.\scripts\restore-backup.ps1 -BackupFile "backup_full_2026-02-09_18-00-00.sql"
```

### Restaurar do Google Drive

```powershell
cd Server
.\scripts\restore-backup.ps1 -BackupFile "backup_full_2026-02-09_18-00-00.sql" -FromGoogleDrive
```

### Restaurar da VPS

```powershell
cd Server
.\scripts\restore-backup.ps1 -BackupFile "backup_full_2026-02-09_18-00-00.sql" -FromVPS
```

> [!CAUTION]
> A restauração irá **SUBSTITUIR** todos os dados do banco de dados atual. Um backup de segurança será criado automaticamente antes da restauração.

## 📁 Estrutura de Arquivos

```
Server/
├── scripts/
│   ├── backup-incremental.ps1      # Script principal de backup
│   ├── restore-backup.ps1           # Script de restauração
│   ├── setup-google-drive.ps1       # Configuração do Google Drive
│   ├── setup-vps.ps1                # Configuração da VPS
│   └── setup-backup-schedule.ps1    # Configuração do agendamento
├── backups/
│   ├── backup_full_*.sql            # Backups completos
│   ├── backup_incremental_*.sql     # Backups incrementais
│   ├── safety_backup_*.sql          # Backups de segurança (antes de restaurar)
│   └── logs/
│       ├── backup_*.log             # Logs de backup
│       └── restore_*.log            # Logs de restauração
├── .env                             # Configurações do banco de dados
└── .env.backup                      # Configurações de backup
```

## ⚙️ Configurações

### `.env.backup`

```env
# Retenção de Backups (em dias)
BACKUP_RETENTION_DAYS=30              # Local
BACKUP_RETENTION_DAYS_REMOTE=90       # Google Drive e VPS

# VPS Configuration
VPS_HOST=69.169.109.119
VPS_USER=root
VPS_BACKUP_PATH=/root/backups/sistema-comanda
VPS_SSH_KEY_PATH=C:\Users\zeros\.ssh\id_rsa

# Google Drive (via rclone)
GDRIVE_REMOTE_NAME=gdrive
GDRIVE_BACKUP_FOLDER=Backups/SistemaComanda
```

## 🔄 Como Funciona o Backup Incremental

O backup incremental utiliza os campos de timestamp do Prisma para identificar dados novos ou modificados:

- `createdAt`: Registros criados nas últimas 24h
- `updatedAt`: Registros modificados nas últimas 24h
- Campos específicos: `closedAt`, `addedAt`, etc.

### Tabelas Incluídas

- ✅ Client
- ✅ Category
- ✅ Product
- ✅ Tab (Comandas)
- ✅ TabItem
- ✅ ClientTransaction
- ✅ User

## 📊 Monitoramento

### Verificar Logs

```powershell
# Logs de backup
Get-Content Server\backups\logs\backup_2026-02.log -Tail 50

# Logs de restauração
Get-Content Server\backups\logs\restore_2026-02.log -Tail 50
```

### Verificar Tarefa Agendada

```powershell
Get-ScheduledTask -TaskName "SistemaComanda-BackupDiario"
```

### Executar Tarefa Manualmente

```powershell
Start-ScheduledTask -TaskName "SistemaComanda-BackupDiario"
```

## 🛠️ Troubleshooting

### Erro: "pg_dump não encontrado"

**Solução**: Adicione o PostgreSQL ao PATH do Windows
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### Erro: "rclone não encontrado"

**Solução**: Execute novamente o setup do Google Drive
```powershell
.\scripts\setup-google-drive.ps1
```

### Erro: "Conexão SSH falhou"

**Soluções**:
1. Verifique se a chave pública foi adicionada na VPS em `~/.ssh/authorized_keys`
2. Teste a conexão manualmente:
   ```powershell
   ssh root@69.169.109.119
   ```
3. Verifique o firewall da VPS (porta 22)

### Erro: "Permissão negada" ao agendar

**Solução**: Execute o PowerShell como Administrador
```powershell
Start-Process powershell -Verb RunAs
```

## 🔐 Segurança

- ✅ Senhas do banco de dados são lidas do `.env` (não hardcoded)
- ✅ Autenticação SSH via chave pública (sem senha)
- ✅ Backups de segurança automáticos antes de restaurar
- ✅ Logs detalhados de todas as operações
- ⚠️ **IMPORTANTE**: Adicione `Server/backups/*.sql` ao `.gitignore`

## 📝 Manutenção

### Limpeza Manual de Backups Antigos

```powershell
# Remover backups locais com mais de 30 dias
Get-ChildItem Server\backups\backup_*.sql | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item
```

### Desabilitar Agendamento

```powershell
Disable-ScheduledTask -TaskName "SistemaComanda-BackupDiario"
```

### Remover Agendamento

```powershell
Unregister-ScheduledTask -TaskName "SistemaComanda-BackupDiario" -Confirm:$false
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em `Server/backups/logs/`
2. Execute os scripts com `-Verbose` para mais detalhes
3. Consulte a documentação do PostgreSQL, rclone ou OpenSSH

---

**Criado para Sistema Comanda** | Backup Incremental Automático v1.0
