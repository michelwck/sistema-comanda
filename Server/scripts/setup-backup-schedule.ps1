# ============================================
# Setup Agendamento Automático - Sistema Comanda
# ============================================
# Este script configura o Task Scheduler para backups automáticos
# ============================================

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Setup Agendamento de Backup - Sistema Comanda" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Configurações
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupScriptPath = Join-Path $ScriptDir "backup-incremental.ps1"

if (-not (Test-Path $BackupScriptPath)) {
    Write-Host "Script de backup não encontrado: $BackupScriptPath" -ForegroundColor Red
    exit 1
}

# Configurar horário
Write-Host "Configuração do agendamento:" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

$defaultHour = 2
$defaultMinute = 0

$hourInput = Read-Host "Hora para executar o backup diário (0-23) [padrão: $defaultHour]"
$minuteInput = Read-Host "Minuto (0-59) [padrão: $defaultMinute]"

$hour = if ($hourInput) { [int]$hourInput } else { $defaultHour }
$minute = if ($minuteInput) { [int]$minuteInput } else { $defaultMinute }

if ($hour -lt 0 -or $hour -gt 23 -or $minute -lt 0 -or $minute -gt 59) {
    Write-Host "Horário inválido!" -ForegroundColor Red
    exit 1
}

Write-Host "`nBackup será executado diariamente às $($hour.ToString('00')):$($minute.ToString('00'))" -ForegroundColor Green

# Nome da tarefa
$TaskName = "SistemaComanda-BackupDiario"

# Verificar se tarefa já existe
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "`nTarefa '$TaskName' já existe!" -ForegroundColor Yellow
    $response = Read-Host "Deseja recriar? (s/N)"
    
    if ($response -eq "s" -or $response -eq "S") {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Tarefa removida." -ForegroundColor Yellow
    } else {
        Write-Host "Mantendo tarefa existente." -ForegroundColor Yellow
        exit 0
    }
}

# Criar ação
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScriptPath`""

# Criar trigger (diário)
$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At "$($hour.ToString('00')):$($minute.ToString('00'))"

# Configurações adicionais
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Criar principal (executar com usuário atual)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Highest

# Registrar tarefa
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Backup diário incremental do Sistema Comanda com upload para Google Drive e VPS" | Out-Null
    
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "Tarefa agendada criada com sucesso!" -ForegroundColor Green
    Write-Host "============================================`n" -ForegroundColor Green
    
    Write-Host "Detalhes:" -ForegroundColor Cyan
    Write-Host "Nome da tarefa: $TaskName" -ForegroundColor White
    Write-Host "Horário: $($hour.ToString('00')):$($minute.ToString('00')) (diariamente)" -ForegroundColor White
    Write-Host "Script: $BackupScriptPath" -ForegroundColor White
    
    Write-Host "`nPara gerenciar a tarefa:" -ForegroundColor Yellow
    Write-Host "- Abra o 'Agendador de Tarefas' (Task Scheduler)" -ForegroundColor White
    Write-Host "- Procure por '$TaskName'" -ForegroundColor White
    
    Write-Host "`nPara testar agora:" -ForegroundColor Yellow
    Write-Host "Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
    
    Write-Host "`nPara desabilitar:" -ForegroundColor Yellow
    Write-Host "Disable-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
    
    Write-Host "`nPara remover:" -ForegroundColor Yellow
    Write-Host "Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Cyan
    
    Write-Host "`n"
    
    # Perguntar se quer executar teste
    $testResponse = Read-Host "Deseja executar um backup de teste agora? (s/N)"
    
    if ($testResponse -eq "s" -or $testResponse -eq "S") {
        Write-Host "`nExecutando backup de teste..." -ForegroundColor Yellow
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "Tarefa iniciada! Verifique os logs em Server\backups\logs\" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Erro ao criar tarefa agendada: $_" -ForegroundColor Red
    exit 1
}
