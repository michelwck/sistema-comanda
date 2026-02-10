#!/bin/bash
# ============================================
# Script de Backup Automático - Sistema Comanda
# ============================================
# Backup completo do PostgreSQL executado de hora em hora
# ============================================

set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_DIR="$BACKUP_DIR/logs"
RETENTION_DAYS=7  # Manter backups por 7 dias

# Criar diretórios se não existirem
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Arquivo de log
LOG_FILE="$LOG_DIR/backup_$(date +%Y-%m).log"

# Função de logging
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Configurações do banco de dados
# Lê do arquivo .env na pasta Server
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    log "ERROR" "Arquivo .env não encontrado: $ENV_FILE"
    exit 1
fi

# Extrair DATABASE_URL do .env
DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    log "ERROR" "DATABASE_URL não encontrada no arquivo .env"
    exit 1
fi

# Parse DATABASE_URL (formato: postgresql://user:password@host:port/database)
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^\?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    log "ERROR" "Formato inválido de DATABASE_URL"
    exit 1
fi

log "INFO" "Iniciando backup do banco de dados: $DB_NAME"

# Nome do arquivo de backup
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"

# Configurar senha do PostgreSQL
export PGPASSWORD="$DB_PASSWORD"

# Executar backup
log "INFO" "Executando pg_dump..."

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    
    # Comprimir backup
    log "INFO" "Comprimindo backup..."
    gzip "$BACKUP_FILE"
    
    # Verificar tamanho
    FILE_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
    log "SUCCESS" "Backup criado com sucesso: backup_${DB_NAME}_${TIMESTAMP}.sql.gz ($FILE_SIZE)"
    
    # Limpeza de backups antigos
    log "INFO" "Limpando backups com mais de $RETENTION_DAYS dias..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Contar backups restantes
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
    log "INFO" "Total de backups armazenados: $BACKUP_COUNT"
    
else
    log "ERROR" "Erro ao executar pg_dump"
    exit 1
fi

# Limpar variável de senha
unset PGPASSWORD

log "SUCCESS" "Backup concluído com sucesso!"

# Limpar logs antigos (manter últimos 2 meses)
find "$LOG_DIR" -name "backup_*.log" -type f -mtime +60 -delete

exit 0
