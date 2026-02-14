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
RETENTION_DAYS=7
RETENTION_DAYS_REMOTE=30

# Google Drive
GDRIVE_REMOTE="gdrive"
GDRIVE_FOLDER="Backups/SistemaComanda"
ENABLE_GDRIVE_UPLOAD=true

# Criar diretórios
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

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

# Ler .env
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    log "ERROR" "Arquivo .env não encontrado: $ENV_FILE"
    exit 1
fi

# Extrair DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | sed 's/^DATABASE_URL=//' | tr -d '"' | tr -d "'" | sed 's/\r$//')

if [ -z "$DATABASE_URL" ]; then
    log "ERROR" "DATABASE_URL não encontrada no arquivo .env"
    exit 1
fi

log "INFO" "DATABASE_URL encontrada"

# Função para decodificar URL
urldecode() {
    python3 -c "import sys; from urllib.parse import unquote; print(unquote(sys.argv[1]))" "$1" 2>/dev/null || echo "$1"
}

# Parse usando sed e cut (mais robusto)
# Remover protocolo
DB_STRING="${DATABASE_URL#postgresql://}"
DB_STRING="${DB_STRING#postgres://}"

# Extrair user:password@host:port/database
if [[ $DB_STRING =~ ^([^:]+):([^@]+)@([^:]+):([0-9]+)/([^\?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD_RAW="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    # Decodificar senha
    DB_PASSWORD=$(urldecode "$DB_PASSWORD_RAW")
    
    log "INFO" "Configuração do banco:"
    log "INFO" "  Host: $DB_HOST"
    log "INFO" "  Port: $DB_PORT"
    log "INFO" "  Database: $DB_NAME"
    log "INFO" "  User: $DB_USER"
else
    log "ERROR" "Não foi possível fazer parse da DATABASE_URL"
    log "ERROR" "Formato esperado: postgresql://user:password@host:port/database"
    log "ERROR" "Recebido: $DATABASE_URL"
    exit 1
fi

# Nome do arquivo de backup
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"

# Configurar senha
export PGPASSWORD="$DB_PASSWORD"

# Executar backup
log "INFO" "Executando pg_dump..."

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists > "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    
    if [ ! -s "$BACKUP_FILE" ]; then
        log "ERROR" "Backup criado mas está vazio. Verifique as credenciais."
        unset PGPASSWORD
        exit 1
    fi
    
    # Comprimir
    log "INFO" "Comprimindo backup..."
    gzip "$BACKUP_FILE"
    
    FILE_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
    log "SUCCESS" "Backup criado: $(basename $BACKUP_COMPRESSED) ($FILE_SIZE)"
    
    # Upload Google Drive
    if [ "$ENABLE_GDRIVE_UPLOAD" = true ]; then
        if command -v rclone &> /dev/null; then
            log "INFO" "Enviando backup para Google Drive..."
            
            if rclone copy "$BACKUP_COMPRESSED" "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/" 2>&1 | tee -a "$LOG_FILE"; then
                log "SUCCESS" "Upload para Google Drive concluído"
                
                # Limpeza remota
                log "INFO" "Limpando backups antigos no Google Drive..."
                rclone delete "${GDRIVE_REMOTE}:${GDRIVE_FOLDER}/" \
                    --min-age ${RETENTION_DAYS_REMOTE}d \
                    --include "backup_*.sql.gz" 2>&1 | tee -a "$LOG_FILE" || true
            else
                log "WARN" "Erro ao enviar para Google Drive"
            fi
        else
            log "WARN" "rclone não encontrado"
        fi
    fi
    
    # Limpeza local
    log "INFO" "Limpando backups locais antigos..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
    log "INFO" "Total de backups locais: $BACKUP_COUNT"
    
else
    log "ERROR" "Erro ao executar pg_dump"
    log "ERROR" "Verifique:"
    log "ERROR" "  1. PostgreSQL está rodando: systemctl status postgresql"
    log "ERROR" "  2. Credenciais estão corretas no .env"
    log "ERROR" "  3. Porta $DB_PORT está acessível"
    unset PGPASSWORD
    exit 1
fi

unset PGPASSWORD

# Limpar logs antigos
find "$LOG_DIR" -name "backup_*.log" -type f -mtime +60 -delete

log "SUCCESS" "Backup concluído com sucesso!"
log "INFO" "=========================================="

exit 0
