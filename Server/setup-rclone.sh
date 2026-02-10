#!/bin/bash
# ============================================
# Setup rclone para Google Drive - Linux
# ============================================

set -e

echo "============================================"
echo "Setup rclone - Google Drive"
echo "============================================"
echo ""

# Verificar se rclone está instalado
if command -v rclone &> /dev/null; then
    echo "✓ rclone já está instalado: $(rclone version | head -1)"
else
    echo "Instalando rclone..."
    curl https://rclone.org/install.sh | sudo bash
    
    if [ $? -eq 0 ]; then
        echo "✓ rclone instalado com sucesso!"
    else
        echo "✗ Erro ao instalar rclone"
        exit 1
    fi
fi

echo ""
echo "============================================"
echo "Configurando Google Drive"
echo "============================================"
echo ""

# Verificar se já existe configuração
if rclone listremotes | grep -q "^gdrive:"; then
    echo "⚠ Remote 'gdrive' já configurado!"
    read -p "Deseja reconfigurar? (s/N): " response
    if [[ ! "$response" =~ ^[sS]$ ]]; then
        echo "Mantendo configuração existente."
        exit 0
    fi
fi

echo "Iniciando configuração do rclone..."
echo ""
echo "INSTRUÇÕES:"
echo "1. Digite: n (novo remote)"
echo "2. Nome: gdrive"
echo "3. Storage: escolha 'drive' (Google Drive)"
echo "4. Client ID: deixe em branco (pressione Enter)"
echo "5. Client Secret: deixe em branco (pressione Enter)"
echo "6. Scope: escolha 1 (acesso completo)"
echo "7. Root folder ID: deixe em branco"
echo "8. Service Account: deixe em branco"
echo "9. Edit advanced config: n"
echo "10. Use auto config: n (IMPORTANTE!)"
echo "11. Copie o link que aparecer"
echo "12. Abra o link no navegador do seu computador"
echo "13. Faça login e autorize"
echo "14. Copie o código de verificação"
echo "15. Cole o código no terminal"
echo "16. Configure como Team Drive: n"
echo "17. Confirme: y"
echo "18. Saia: q"
echo ""
read -p "Pressione Enter para continuar..."

rclone config

echo ""
echo "============================================"
echo "Testando conexão com Google Drive"
echo "============================================"
echo ""

if rclone lsd gdrive: &> /dev/null; then
    echo "✓ Conexão com Google Drive estabelecida!"
    
    # Criar pasta de backups
    echo "Criando pasta de backups..."
    rclone mkdir gdrive:Backups/SistemaComanda
    
    echo "✓ Pasta criada: gdrive:Backups/SistemaComanda"
    
    # Testar upload
    echo "Testando upload..."
    echo "Teste de backup - $(date)" > /tmp/test_backup.txt
    
    if rclone copy /tmp/test_backup.txt gdrive:Backups/SistemaComanda/; then
        echo "✓ Upload de teste bem-sucedido!"
        
        # Remover arquivo de teste
        rclone delete gdrive:Backups/SistemaComanda/test_backup.txt
        rm /tmp/test_backup.txt
    else
        echo "✗ Erro ao testar upload"
        exit 1
    fi
    
else
    echo "✗ Erro ao conectar com Google Drive"
    echo "Verifique a configuração e tente novamente"
    exit 1
fi

echo ""
echo "============================================"
echo "✓ Setup concluído com sucesso!"
echo "============================================"
echo ""
echo "Próximos passos:"
echo "1. Execute: ./backup.sh"
echo "2. Verifique os backups: rclone ls gdrive:Backups/SistemaComanda"
echo ""
