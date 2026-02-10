# ============================================
# Setup Google Drive - Sistema Comanda
# ============================================
# Este script configura o rclone para backup no Google Drive
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Setup Google Drive Backup - Sistema Comanda" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Verificar se rclone está instalado
$rclone = Get-Command rclone -ErrorAction SilentlyContinue

if (-not $rclone) {
    Write-Host "rclone não encontrado. Instalando..." -ForegroundColor Yellow
    
    # Baixar rclone
    $rcloneUrl = "https://downloads.rclone.org/rclone-current-windows-amd64.zip"
    $tempZip = Join-Path $env:TEMP "rclone.zip"
    $tempDir = Join-Path $env:TEMP "rclone"
    
    Write-Host "Baixando rclone..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $rcloneUrl -OutFile $tempZip
    
    Write-Host "Extraindo..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
    
    # Encontrar executável
    $rcloneExe = Get-ChildItem -Path $tempDir -Filter "rclone.exe" -Recurse | Select-Object -First 1
    
    if ($rcloneExe) {
        # Copiar para System32 ou criar diretório local
        $installPath = "C:\Program Files\rclone"
        
        try {
            New-Item -ItemType Directory -Force -Path $installPath | Out-Null
            Copy-Item $rcloneExe.FullName -Destination $installPath -Force
            
            # Adicionar ao PATH
            $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
            if ($currentPath -notlike "*$installPath*") {
                [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "Machine")
                $env:Path += ";$installPath"
            }
            
            Write-Host "rclone instalado com sucesso em: $installPath" -ForegroundColor Green
        } catch {
            Write-Host "Erro ao instalar rclone: $_" -ForegroundColor Red
            Write-Host "Por favor, instale manualmente de: https://rclone.org/downloads/" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Limpar arquivos temporários
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`nrclone encontrado: $((Get-Command rclone).Source)" -ForegroundColor Green

# Configurar Google Drive
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Configurando Google Drive Remote" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Verificando configuração existente..." -ForegroundColor Yellow
$existingRemotes = & rclone listremotes

if ($existingRemotes -like "*gdrive:*") {
    Write-Host "Remote 'gdrive' já configurado!" -ForegroundColor Green
    
    $response = Read-Host "Deseja reconfigurar? (s/N)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "Mantendo configuração existente." -ForegroundColor Yellow
    } else {
        Write-Host "`nIniciando configuração do rclone..." -ForegroundColor Yellow
        Write-Host "Siga as instruções abaixo:" -ForegroundColor Cyan
        Write-Host "1. Escolha 'n' para novo remote" -ForegroundColor White
        Write-Host "2. Digite 'gdrive' como nome" -ForegroundColor White
        Write-Host "3. Escolha 'Google Drive' (geralmente opção 15)" -ForegroundColor White
        Write-Host "4. Deixe client_id e client_secret em branco (pressione Enter)" -ForegroundColor White
        Write-Host "5. Escolha '1' para acesso completo" -ForegroundColor White
        Write-Host "6. Deixe root_folder_id em branco" -ForegroundColor White
        Write-Host "7. Escolha 'n' para não editar configuração avançada" -ForegroundColor White
        Write-Host "8. Escolha 'y' para auto config (abrirá navegador)" -ForegroundColor White
        Write-Host "9. Faça login na sua conta Google" -ForegroundColor White
        Write-Host "10. Escolha 'y' para confirmar" -ForegroundColor White
        Write-Host "11. Escolha 'q' para sair`n" -ForegroundColor White
        
        & rclone config
    }
} else {
    Write-Host "`nIniciando configuração do rclone..." -ForegroundColor Yellow
    Write-Host "Siga as instruções abaixo:" -ForegroundColor Cyan
    Write-Host "1. Escolha 'n' para novo remote" -ForegroundColor White
    Write-Host "2. Digite 'gdrive' como nome" -ForegroundColor White
    Write-Host "3. Escolha 'Google Drive' (geralmente opção 15)" -ForegroundColor White
    Write-Host "4. Deixe client_id e client_secret em branco (pressione Enter)" -ForegroundColor White
    Write-Host "5. Escolha '1' para acesso completo" -ForegroundColor White
    Write-Host "6. Deixe root_folder_id em branco" -ForegroundColor White
    Write-Host "7. Escolha 'n' para não editar configuração avançada" -ForegroundColor White
    Write-Host "8. Escolha 'y' para auto config (abrirá navegador)" -ForegroundColor White
    Write-Host "9. Faça login na sua conta Google" -ForegroundColor White
    Write-Host "10. Escolha 'y' para confirmar" -ForegroundColor White
    Write-Host "11. Escolha 'q' para sair`n" -ForegroundColor White
    
    & rclone config
}

# Testar conexão
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Testando conexão com Google Drive" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

try {
    $testOutput = & rclone lsd gdrive: 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Conexão com Google Drive estabelecida com sucesso!" -ForegroundColor Green
        
        # Criar pasta de backups
        Write-Host "`nCriando pasta de backups..." -ForegroundColor Yellow
        & rclone mkdir "gdrive:Backups/SistemaComanda" 2>&1 | Out-Null
        
        Write-Host "Pasta criada: gdrive:Backups/SistemaComanda" -ForegroundColor Green
        
        # Testar upload
        Write-Host "`nTestando upload..." -ForegroundColor Yellow
        $testFile = Join-Path $env:TEMP "test_backup.txt"
        "Test backup file - $(Get-Date)" | Out-File $testFile
        
        & rclone copy $testFile "gdrive:Backups/SistemaComanda/" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Upload de teste bem-sucedido!" -ForegroundColor Green
            
            # Remover arquivo de teste
            & rclone delete "gdrive:Backups/SistemaComanda/test_backup.txt" 2>&1 | Out-Null
            Remove-Item $testFile -Force
        } else {
            Write-Host "Erro ao testar upload" -ForegroundColor Red
        }
        
    } else {
        Write-Host "Erro ao conectar com Google Drive: $testOutput" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "Erro ao testar conexão: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "Setup do Google Drive concluído!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: .\scripts\backup-incremental.ps1 -Full" -ForegroundColor White
Write-Host "2. Verifique o backup no Google Drive" -ForegroundColor White
Write-Host "3. Configure o agendamento automático com setup-backup-schedule.ps1`n" -ForegroundColor White
