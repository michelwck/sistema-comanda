# ============================================
# Setup VPS - Sistema Comanda
# ============================================
# Este script configura a conexão SSH com a VPS para backups
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Setup VPS Backup - Sistema Comanda" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Carregar configurações
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Split-Path -Parent $ScriptDir
$EnvBackupFile = Join-Path $ServerDir ".env.backup"

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

$VpsHost = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_HOST"
$VpsUser = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_USER"
$VpsBackupPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_BACKUP_PATH"
$VpsSshKeyPath = Get-EnvVariable -FilePath $EnvBackupFile -Key "VPS_SSH_KEY_PATH"

if (-not $VpsHost -or -not $VpsUser) {
    Write-Host "Configurações da VPS não encontradas no arquivo .env.backup" -ForegroundColor Red
    Write-Host "Por favor, configure VPS_HOST e VPS_USER" -ForegroundColor Yellow
    exit 1
}

Write-Host "VPS Host: $VpsHost" -ForegroundColor Green
Write-Host "VPS User: $VpsUser" -ForegroundColor Green
Write-Host "Backup Path: $VpsBackupPath`n" -ForegroundColor Green

# Verificar se OpenSSH está instalado
$sshCheck = Get-Command ssh -ErrorAction SilentlyContinue
$scpCheck = Get-Command scp -ErrorAction SilentlyContinue

if (-not $sshCheck -or -not $scpCheck) {
    Write-Host "OpenSSH Client não encontrado!" -ForegroundColor Red
    Write-Host "`nPara instalar:" -ForegroundColor Yellow
    Write-Host "1. Abra Configurações > Aplicativos > Recursos Opcionais" -ForegroundColor White
    Write-Host "2. Clique em 'Adicionar um recurso'" -ForegroundColor White
    Write-Host "3. Procure por 'OpenSSH Client' e instale" -ForegroundColor White
    Write-Host "`nOu execute como Administrador:" -ForegroundColor Yellow
    Write-Host "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0`n" -ForegroundColor Cyan
    exit 1
}

Write-Host "OpenSSH Client encontrado!" -ForegroundColor Green

# Verificar/criar chave SSH
$SshDir = Join-Path $env:USERPROFILE ".ssh"
$DefaultKeyPath = Join-Path $SshDir "id_rsa"

if (-not (Test-Path $SshDir)) {
    Write-Host "`nCriando diretório .ssh..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SshDir -Force | Out-Null
}

if ($VpsSshKeyPath -and (Test-Path $VpsSshKeyPath)) {
    Write-Host "`nChave SSH encontrada: $VpsSshKeyPath" -ForegroundColor Green
    $KeyPath = $VpsSshKeyPath
} elseif (Test-Path $DefaultKeyPath) {
    Write-Host "`nChave SSH padrão encontrada: $DefaultKeyPath" -ForegroundColor Green
    $KeyPath = $DefaultKeyPath
} else {
    Write-Host "`nChave SSH não encontrada. Gerando nova chave..." -ForegroundColor Yellow
    
    $email = Read-Host "Digite seu email para a chave SSH"
    
    & ssh-keygen -t rsa -b 4096 -C $email -f $DefaultKeyPath -N '""'
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Chave SSH gerada com sucesso!" -ForegroundColor Green
        $KeyPath = $DefaultKeyPath
    } else {
        Write-Host "Erro ao gerar chave SSH" -ForegroundColor Red
        exit 1
    }
}

# Mostrar chave pública
$PubKeyPath = "$KeyPath.pub"
if (Test-Path $PubKeyPath) {
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "Chave Pública SSH" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    
    $pubKey = Get-Content $PubKeyPath
    Write-Host $pubKey -ForegroundColor Yellow
    
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "IMPORTANTE: Copie a chave acima!" -ForegroundColor Cyan
    Write-Host "============================================`n" -ForegroundColor Cyan
    
    Write-Host "Para adicionar a chave na VPS, execute:" -ForegroundColor Yellow
    Write-Host "ssh $VpsUser@$VpsHost" -ForegroundColor Cyan
    Write-Host "mkdir -p ~/.ssh" -ForegroundColor Cyan
    Write-Host "echo 'SUA_CHAVE_PUBLICA' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "chmod 700 ~/.ssh`n" -ForegroundColor Cyan
    
    # Copiar para clipboard
    try {
        $pubKey | Set-Clipboard
        Write-Host "Chave pública copiada para a área de transferência!" -ForegroundColor Green
    } catch {
        Write-Host "Não foi possível copiar automaticamente. Copie manualmente." -ForegroundColor Yellow
    }
    
    $response = Read-Host "`nPressione Enter após adicionar a chave na VPS (ou 's' para pular teste)"
}

# Testar conexão SSH
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Testando conexão SSH" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$sshArgs = @(
    "-i", $KeyPath,
    "-o", "StrictHostKeyChecking=no",
    "-o", "ConnectTimeout=10",
    "$VpsUser@$VpsHost",
    "echo 'Conexão SSH bem-sucedida!'"
)

try {
    $sshOutput = & ssh @sshArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $sshOutput -ForegroundColor Green
        
        # Criar diretório de backups na VPS
        Write-Host "`nCriando diretório de backups na VPS..." -ForegroundColor Yellow
        
        $createDirCmd = "mkdir -p $VpsBackupPath && chmod 700 $VpsBackupPath && echo 'Diretório criado com sucesso'"
        
        $sshArgs = @(
            "-i", $KeyPath,
            "-o", "StrictHostKeyChecking=no",
            "$VpsUser@$VpsHost",
            $createDirCmd
        )
        
        $dirOutput = & ssh @sshArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $dirOutput -ForegroundColor Green
            
            # Testar upload
            Write-Host "`nTestando upload de arquivo..." -ForegroundColor Yellow
            
            $testFile = Join-Path $env:TEMP "test_backup.txt"
            "Test backup file - $(Get-Date)" | Out-File $testFile
            
            $scpArgs = @(
                "-i", $KeyPath,
                "-o", "StrictHostKeyChecking=no",
                $testFile,
                "${VpsUser}@${VpsHost}:${VpsBackupPath}/"
            )
            
            $scpOutput = & scp @scpArgs 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Upload de teste bem-sucedido!" -ForegroundColor Green
                
                # Remover arquivo de teste
                $rmCmd = "rm -f ${VpsBackupPath}/test_backup.txt"
                & ssh -i $KeyPath -o StrictHostKeyChecking=no "$VpsUser@$VpsHost" $rmCmd 2>&1 | Out-Null
                Remove-Item $testFile -Force
                
            } else {
                Write-Host "Erro ao testar upload: $scpOutput" -ForegroundColor Red
            }
            
        } else {
            Write-Host "Erro ao criar diretório: $dirOutput" -ForegroundColor Red
        }
        
    } else {
        Write-Host "Erro ao conectar via SSH: $sshOutput" -ForegroundColor Red
        Write-Host "`nVerifique:" -ForegroundColor Yellow
        Write-Host "1. A chave pública foi adicionada em ~/.ssh/authorized_keys na VPS" -ForegroundColor White
        Write-Host "2. O firewall da VPS permite conexões SSH (porta 22)" -ForegroundColor White
        Write-Host "3. O IP da VPS está correto no arquivo .env.backup`n" -ForegroundColor White
        exit 1
    }
    
} catch {
    Write-Host "Erro ao testar conexão: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "Setup da VPS concluído!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: .\scripts\backup-incremental.ps1 -Full" -ForegroundColor White
Write-Host "2. Verifique o backup na VPS: ssh $VpsUser@$VpsHost 'ls -lh $VpsBackupPath'" -ForegroundColor White
Write-Host "3. Configure o agendamento automático com setup-backup-schedule.ps1`n" -ForegroundColor White
