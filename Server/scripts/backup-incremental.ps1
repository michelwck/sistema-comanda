# ============================================
# Script de Backup Incremental - Sistema Comanda
# ============================================
# Este script realiza backups incrementais do PostgreSQL
# e envia automaticamente para Google Drive e VPS
# ============================================

param(
    [switch]$Full,
    [switch]$SkipUpload,
    [switch]$Verbose
)

# Configurações
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $ServerDir "backups"
$LogDir = Join-Path $BackupDir "logs"
$EnvFile = Join-Path $ServerDir ".env"
$EnvBackupFile = Join-Path $ServerDir ".env.backup"

# Criar diretórios se não existirem
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Função para logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    # Console
    switch ($Level) {
        "ERROR" { Write-Host $LogMessage -ForegroundColor Red }
        "WARN"  { Write-Host $LogMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $LogMessage -ForegroundColor Green }
        default { Write-Host $LogMessage }
    }
    
    # Arquivo de log
    $LogFile = Join-Path $LogDir "backup_$(Get-Date -Format 'yyyy-MM').log"
    Add-Content -Path $LogFile -Value $LogMessage
}

# Função para ler arquivo .env
function Get-EnvVariable {
    param([string]$FilePath, [string]$Key)
    
    if (-not (Test-Path $FilePath)) {
        return $null
    }
    
    $content = Get-Content $FilePath
    foreach ($line in $content) {
        if ($line -match "^\s*$Key\s*=\s*(.+)$") {
            $value = $matches[1].Trim()
            # Remove aspas se existirem
            $value = $value -replace '^["'']|["'']$', ''
            return $value
        }
    }
    return $null
}

# Carregar configurações do banco de dados
Write-Log "Carregando configurações..."
$DatabaseUrl = Get-EnvVariable -FilePath $EnvFile -Key "DATABASE_URL"

if (-not $DatabaseUrl) {
    Write-Log "DATABASE_URL não encontrada no arquivo .env" -Level "ERROR"
    exit 1
}

# Parse DATABASE_URL (formato: postgresql://user:password@host:port/database)
if ($DatabaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)") {
    $DbUser = $matches[1]
    $DbPassword = $matches[2]
    $DbHost = $matches[3]
    $DbPort = $matches[4]
    $DbName = $matches[5]
} else {
    Write-Log "Formato inválido de DATABASE_URL" -Level "ERROR"
    exit 1
}

# Carregar configurações de backup
$RetentionDays = Get-EnvVariable -FilePath $EnvBackupFile -Key "BACKUP_RETENTION_DAYS"
$RetentionDaysRemote = Get-EnvVariable -FilePath $EnvBackupFile -Key "BACKUP_RETENTION_DAYS_REMOTE"
$VpsHost = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_HOST"
$VpsUser = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_USER"
$VpsBackupPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_BACKUP_PATH"
$VpsSshKeyPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_SSH_KEY_PATH"
$GdriveRemoteName = Get-EnvVariable -FilePath $EnvBackupFile -Key "GDRIVE_REMOTE_NAME"
$GdriveBackupFolder = Get-EnvVariable -FilePath $EnvBackupFile -Key "GDRIVE_BACKUP_FOLDER"

# Valores padrão
if (-not $RetentionDays) { $RetentionDays = 30 }
if (-not $RetentionDaysRemote) { $RetentionDaysRemote = 90 }

Write-Log "Configurações carregadas com sucesso"
Write-Log "Banco de dados: $DbName @ ${DbHost}:${DbPort}"

# Determinar tipo de backup
$BackupType = if ($Full) { "full" } else { "incremental" }
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFileName = "backup_${BackupType}_${Timestamp}.sql"
$BackupFilePath = Join-Path $BackupDir $BackupFileName

Write-Log "Iniciando backup $BackupType..."

# Configurar senha do PostgreSQL
$env:PGPASSWORD = $DbPassword

try {
    # Criar arquivo SQL de backup
    $SqlContent = @"
-- ============================================
-- Backup $BackupType - Sistema Comanda
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ============================================

"@

    if ($Full) {
        Write-Log "Executando backup completo..."
        
        # Backup completo usando pg_dump
        $pgDumpArgs = @(
            "-h", $DbHost,
            "-p", $DbPort,
            "-U", $DbUser,
            "-d", $DbName,
            "--no-owner",
            "--no-acl",
            "--clean",
            "--if-exists"
        )
        
        $dumpOutput = & pg_dump @pgDumpArgs 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Erro ao executar pg_dump: $dumpOutput" -Level "ERROR"
            exit 1
        }
        
        $SqlContent += $dumpOutput
        
    } else {
        Write-Log "Executando backup incremental (últimas 24 horas)..."
        
        # Data de corte (24 horas atrás)
        $CutoffDate = (Get-Date).AddHours(-24).ToString("yyyy-MM-dd HH:mm:ss")
        
        # Queries para backup incremental
        $tables = @(
            @{Name="Client"; DateFields=@("createdAt", "updatedAt")},
            @{Name="Category"; DateFields=@("createdAt", "updatedAt")},
            @{Name="Product"; DateFields=@("createdAt", "updatedAt")},
            @{Name="Tab"; DateFields=@("createdAt", "updatedAt", "closedAt")},
            @{Name="TabItem"; DateFields=@("createdAt", "updatedAt", "addedAt")},
            @{Name="ClientTransaction"; DateFields=@("createdAt")},
            @{Name="User"; DateFields=@("createdAt", "updatedAt")}
        )
        
        foreach ($table in $tables) {
            $tableName = $table.Name
            $conditions = @()
            
            foreach ($field in $table.DateFields) {
                $conditions += "`"$field`" >= '$CutoffDate'"
            }
            
            $whereClause = $conditions -join " OR "
            
            $query = "COPY (SELECT * FROM `"$tableName`" WHERE $whereClause) TO STDOUT WITH (FORMAT text, DELIMITER ',', QUOTE '`"', ESCAPE '\\', NULL '\\N')"
            
            Write-Log "Exportando tabela: $tableName" -Level "INFO"
            
            $psqlArgs = @(
                "-h", $DbHost,
                "-p", $DbPort,
                "-U", $DbUser,
                "-d", $DbName,
                "-t",
                "-c", $query
            )
            
            $tableData = & psql @psqlArgs 2>&1
            
            if ($LASTEXITCODE -eq 0 -and $tableData) {
                $SqlContent += "`n-- Tabela: $tableName`n"
                $SqlContent += "-- Registros modificados desde: $CutoffDate`n"
                $SqlContent += $tableData
                $SqlContent += "`n"
            }
        }
    }
    
    # Salvar arquivo de backup
    $SqlContent | Out-File -FilePath $BackupFilePath -Encoding UTF8
    
    $FileSize = (Get-Item $BackupFilePath).Length / 1KB
    Write-Log "Backup criado com sucesso: $BackupFileName ($([math]::Round($FileSize, 2)) KB)" -Level "SUCCESS"
    
    # Upload para destinos remotos
    if (-not $SkipUpload) {
        
        # Upload para Google Drive
        if ($GdriveRemoteName -and $GdriveBackupFolder) {
            Write-Log "Enviando backup para Google Drive..."
            
            $rcloneCheck = Get-Command rclone -ErrorAction SilentlyContinue
            if ($rcloneCheck) {
                $remotePath = "${GdriveRemoteName}:${GdriveBackupFolder}/${BackupFileName}"
                $rcloneOutput = & rclone copy $BackupFilePath $remotePath 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Upload para Google Drive concluído com sucesso" -Level "SUCCESS"
                } else {
                    Write-Log "Erro ao enviar para Google Drive: $rcloneOutput" -Level "WARN"
                }
            } else {
                Write-Log "rclone não encontrado. Execute setup-google-drive.ps1 primeiro" -Level "WARN"
            }
        }
        
        # Upload para VPS
        if ($VpsHost -and $VpsUser -and $VpsBackupPath) {
            Write-Log "Enviando backup para VPS ($VpsHost)..."
            
            $scpCheck = Get-Command scp -ErrorAction SilentlyContinue
            if ($scpCheck) {
                $scpArgs = @()
                
                if ($VpsSshKeyPath -and (Test-Path $VpsSshKeyPath)) {
                    $scpArgs += @("-i", $VpsSshKeyPath)
                }
                
                $scpArgs += @(
                    $BackupFilePath,
                    "${VpsUser}@${VpsHost}:${VpsBackupPath}/${BackupFileName}"
                )
                
                $scpOutput = & scp @scpArgs 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Upload para VPS concluído com sucesso" -Level "SUCCESS"
                } else {
                    Write-Log "Erro ao enviar para VPS: $scpOutput" -Level "WARN"
                }
            } else {
                Write-Log "scp não encontrado. Instale OpenSSH Client" -Level "WARN"
            }
        }
    }
    
    # Limpeza de backups antigos (local)
    Write-Log "Limpando backups antigos (>${RetentionDays} dias)..."
    $CutoffDateLocal = (Get-Date).AddDays(-$RetentionDays)
    
    Get-ChildItem -Path $BackupDir -Filter "backup_*.sql" | 
        Where-Object { $_.LastWriteTime -lt $CutoffDateLocal } |
        ForEach-Object {
            Remove-Item $_.FullName -Force
            Write-Log "Removido: $($_.Name)"
        }
    
    Write-Log "Backup concluído com sucesso!" -Level "SUCCESS"
    
} catch {
    Write-Log "Erro durante o backup: $_" -Level "ERROR"
    exit 1
} finally {
    # Limpar variável de senha
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
