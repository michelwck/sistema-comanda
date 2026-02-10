# ============================================
# Script de Restauração - Sistema Comanda
# ============================================
# Este script restaura backups do PostgreSQL
# ============================================

param(
    [string]$BackupFile,
    [switch]$FromGoogleDrive,
    [switch]$FromVPS,
    [switch]$List
)

$ErrorActionPreference = "Stop"

# Configurações
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $ServerDir "backups"
$LogDir = Join-Path $BackupDir "logs"
$EnvFile = Join-Path $ServerDir ".env"
$EnvBackupFile = Join-Path $ServerDir ".env.backup"

# Função para logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $LogMessage -ForegroundColor Red }
        "WARN"  { Write-Host $LogMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $LogMessage -ForegroundColor Green }
        default { Write-Host $LogMessage }
    }
    
    $LogFile = Join-Path $LogDir "restore_$(Get-Date -Format 'yyyy-MM').log"
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
            $value = $value -replace '^["'']|["'']$', ''
            return $value
        }
    }
    return $null
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Restauração de Backup - Sistema Comanda" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Listar backups disponíveis
if ($List) {
    Write-Host "Backups Locais:" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Cyan
    
    $localBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($localBackups.Count -eq 0) {
        Write-Host "Nenhum backup local encontrado." -ForegroundColor Yellow
    } else {
        foreach ($backup in $localBackups) {
            $size = [math]::Round($backup.Length / 1KB, 2)
            Write-Host "$($backup.Name) - $size KB - $($backup.LastWriteTime)" -ForegroundColor White
        }
    }
    
    # Listar do Google Drive
    $GdriveRemoteName = Get-EnvVariable -FilePath $EnvBackupFile -Key "GDRIVE_REMOTE_NAME"
    $GdriveBackupFolder = Get-EnvVariable -FilePath $EnvBackupFile -Key "GDRIVE_BACKUP_FOLDER"
    
    if ($GdriveRemoteName -and $GdriveBackupFolder) {
        Write-Host "`nBackups no Google Drive:" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Cyan
        
        $rcloneCheck = Get-Command rclone -ErrorAction SilentlyContinue
        if ($rcloneCheck) {
            $gdriveBackups = & rclone ls "${GdriveRemoteName}:${GdriveBackupFolder}" 2>&1
            if ($LASTEXITCODE -eq 0 -and $gdriveBackups) {
                Write-Host $gdriveBackups -ForegroundColor White
            } else {
                Write-Host "Nenhum backup encontrado no Google Drive." -ForegroundColor Yellow
            }
        }
    }
    
    # Listar da VPS
    $VpsHost = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_HOST"
    $VpsUser = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_USER"
    $VpsBackupPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_BACKUP_PATH"
    $VpsSshKeyPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_SSH_KEY_PATH"
    
    if ($VpsHost -and $VpsUser -and $VpsBackupPath) {
        Write-Host "`nBackups na VPS:" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Cyan
        
        $sshCheck = Get-Command ssh -ErrorAction SilentlyContinue
        if ($sshCheck) {
            $sshArgs = @(
                "-o", "StrictHostKeyChecking=no",
                "$VpsUser@$VpsHost",
                "ls -lh $VpsBackupPath"
            )
            
            if ($VpsSshKeyPath -and (Test-Path $VpsSshKeyPath)) {
                $sshArgs = @("-i", $VpsSshKeyPath) + $sshArgs
            }
            
            $vpsBackups = & ssh @sshArgs 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host $vpsBackups -ForegroundColor White
            } else {
                Write-Host "Erro ao listar backups da VPS." -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n"
    exit 0
}

# Carregar configurações do banco de dados
$DatabaseUrl = Get-EnvVariable -FilePath $EnvFile -Key "DATABASE_URL"

if (-not $DatabaseUrl) {
    Write-Log "DATABASE_URL não encontrada no arquivo .env" -Level "ERROR"
    exit 1
}

# Parse DATABASE_URL
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

# Baixar backup se necessário
$RestoreFilePath = $BackupFile

if ($FromGoogleDrive) {
    Write-Log "Baixando backup do Google Drive..."
    
    $GdriveRemoteName = Get-EnvVariable -FilePath $EnvBackupFile -Key "GDRIVE_REMOTE_NAME"
    $GdriveBackupFolder = Get-EnvVariable -FilePath $EnvBackupFile -Key "GDRIVE_BACKUP_FOLDER"
    
    $remotePath = "${GdriveRemoteName}:${GdriveBackupFolder}/$BackupFile"
    $RestoreFilePath = Join-Path $BackupDir $BackupFile
    
    & rclone copy $remotePath $BackupDir 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erro ao baixar do Google Drive" -Level "ERROR"
        exit 1
    }
    
    Write-Log "Download concluído" -Level "SUCCESS"
}

if ($FromVPS) {
    Write-Log "Baixando backup da VPS..."
    
    $VpsHost = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_HOST"
    $VpsUser = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_USER"
    $VpsBackupPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_BACKUP_PATH"
    $VpsSshKeyPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_SSH_KEY_PATH"
    
    $RestoreFilePath = Join-Path $BackupDir $BackupFile
    
    $scpArgs = @()
    if ($VpsSshKeyPath -and (Test-Path $VpsSshKeyPath)) {
        $scpArgs += @("-i", $VpsSshKeyPath)
    }
    
    $scpArgs += @(
        "-o", "StrictHostKeyChecking=no",
        "${VpsUser}@${VpsHost}:${VpsBackupPath}/$BackupFile",
        $RestoreFilePath
    )
    
    & scp @scpArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erro ao baixar da VPS" -Level "ERROR"
        exit 1
    }
    
    Write-Log "Download concluído" -Level "SUCCESS"
}

# Verificar se arquivo existe
if (-not (Test-Path $RestoreFilePath)) {
    Write-Log "Arquivo de backup não encontrado: $RestoreFilePath" -Level "ERROR"
    Write-Log "Use -List para ver backups disponíveis" -Level "INFO"
    exit 1
}

# Confirmação
Write-Host "`n⚠️  ATENÇÃO ⚠️" -ForegroundColor Red
Write-Host "Esta operação irá SUBSTITUIR todos os dados do banco de dados!" -ForegroundColor Red
Write-Host "Banco de dados: $DbName @ $DbHost:$DbPort" -ForegroundColor Yellow
Write-Host "Arquivo de backup: $RestoreFilePath`n" -ForegroundColor Yellow

$confirmation = Read-Host "Digite 'CONFIRMAR' para prosseguir"

if ($confirmation -ne "CONFIRMAR") {
    Write-Log "Restauração cancelada pelo usuário" -Level "WARN"
    exit 0
}

# Criar backup de segurança antes de restaurar
Write-Log "Criando backup de segurança..."
$SafetyBackupFile = Join-Path $BackupDir "safety_backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql"

$env:PGPASSWORD = $DbPassword

try {
    $pgDumpArgs = @(
        "-h", $DbHost,
        "-p", $DbPort,
        "-U", $DbUser,
        "-d", $DbName,
        "--no-owner",
        "--no-acl",
        "-f", $SafetyBackupFile
    )
    
    & pg_dump @pgDumpArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Backup de segurança criado: $SafetyBackupFile" -Level "SUCCESS"
    } else {
        Write-Log "Erro ao criar backup de segurança" -Level "WARN"
    }
    
} catch {
    Write-Log "Erro ao criar backup de segurança: $_" -Level "WARN"
}

# Restaurar backup
Write-Log "Iniciando restauração..."

try {
    $psqlArgs = @(
        "-h", $DbHost,
        "-p", $DbPort,
        "-U", $DbUser,
        "-d", $DbName,
        "-f", $RestoreFilePath
    )
    
    $restoreOutput = & psql @psqlArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Restauração concluída com sucesso!" -Level "SUCCESS"
    } else {
        Write-Log "Erro durante a restauração: $restoreOutput" -Level "ERROR"
        Write-Log "Backup de segurança disponível em: $SafetyBackupFile" -Level "INFO"
        exit 1
    }
    
} catch {
    Write-Log "Erro durante a restauração: $_" -Level "ERROR"
    Write-Log "Backup de segurança disponível em: $SafetyBackupFile" -Level "INFO"
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "Restauração concluída!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green
