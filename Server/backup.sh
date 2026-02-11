#!/bin/bash
# ============================================
# Script de Backup Automático - Sistema Comanda
# ============================================
# Backup completo do PostgreSQL com upload para Google Drive
# ============================================

set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_DIR="$BACKUP_DIR/logs"
RETENTION_DAYS=7  # Manter backups locais por 7 dias
RETENTION_DAYS_REMOTE=30  # Manter backups no Google Drive por 30 dias

# Google Drive (via rclone)
GDRIVE_REMOTE="gdrive"
GDRIVE_FOLDER="Backups/SistemaComanda"
ENABLE_GDRIVE_UPLOAD=true  # Mude para false para desabilitar upload

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

log "INFO" "=========================================="
log "INFO" "Iniciando rotina de backup"
log "INFO" "=========================================="

# Configurações do banco de dados
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    log "ERROR" "Arquivo .env não encontrado: $ENV_FILE"
    exit 1
fi

# Extrair DATABASE_URL do .env
DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/\r$//')

if [ -z "$DATABASE_URL" ]; then
    log "ERROR" "DATABASE_URL não encontrada no arquivo .env"
    exit 1
fi

# Função para decodificar URL encoding
urldecode() {
    local url_encoded="${1//+/ }"
    printf '%b' "${url_encoded//%/\\x}"
}

# Parse DATABASE_URL (formato: postgresql://user:password@host:port/database)
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^\?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD_ENCODED="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    # Decodificar senha (se tiver caracteres especiais codificados)
    DB_PASSWORD=$(urldecode "$DB_PASSWORD_ENCODED")
else
    log "ERROR" "Formato inválido de DATABASE_URL: $DATABASE_URL"
    exit 1
fi

log "INFO" "Banco de dados: $DB_NAME @ $DB_HOST:$DB_PORT (usuário: $DB_USER)"

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
    log "SUCCESS" "Backup criado: $(basename $BACKUP_COMPRESSED) ($FILE_SIZE)"
    
    # Upload para Google Drive
    if [ "$ENABLE_GDRIVE_UPLOAD" = true ]; then
        if command -v rclone &> /dev/null; then
            log "INFO" "Enviando backup para Google Drive..."
            
            if rclone copy "$BACKUP_COMPRESSED" "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/" >> "$LOG_FILE" 2>&1; then
                log "SUCCESS" "Upload para Google Drive concluído"
                
                # Limpeza de backups antigos no Google Drive
                log "INFO" "Limpando backups antigos no Google Drive (>$RETENTION_DAYS_REMOTE dias)..."
                rclone delete "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/" \
                    --min-age ${RETENTION_DAYS_REMOTE}d \
                    --include "backup_*.sql.gz" >> "$LOG_FILE" 2>&1 || true
            else
                log "WARN" "Erro ao enviar para Google Drive"
            fi
        else
            log "WARN" "rclone não encontrado. Execute setup-rclone.sh primeiro"
        fi
    fi
    
    # Limpeza de backups locais antigos
    log "INFO" "Limpando backups locais (>$RETENTION_DAYS dias)..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Contar backups restantes
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
    log "INFO" "Total de backups locais: $BACKUP_COUNT"
    
else
    log "ERROR" "Erro ao executar pg_dump. Verifique as credenciais e conexão com o banco."
    unset PGPASSWORD
    exit 1
fi

# Limpar variável de senha
unset PGPASSWORD

# Limpar logs antigos (manter últimos 2 meses)
find "$LOG_DIR" -name "backup_*.log" -type f -mtime +60 -delete

log "SUCCESS" "Backup concluído com sucesso!"
log "INFO" "=========================================="

exit 0
