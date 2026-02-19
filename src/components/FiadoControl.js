import { Page } from './Layout.js';

export function FiadoControl({ clients, selectedClientId, transactions }) {
    // transactions: passed from main state

    // Use clients passed from parent (already filtered)
    const clientsWithDebt = [...clients]; // Create copy to sort

    // Sort by name
    clientsWithDebt.sort((a, b) => a.name.localeCompare(b.name));

    const clientsListHtml = clientsWithDebt.map(client => `
        <div class="fiado-client-item ${client.id == selectedClientId ? 'active' : ''}" 
             data-id="${client.id}"
             style="padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center; ${client.id == selectedClientId ? 'background: rgba(139, 92, 246, 0.1); border-left: 2px solid var(--color-primary);' : 'transition: background 0.2s;'}">
            <div>
                <div style="font-weight: 500;">${client.name}</div>
            </div>
            <div style="font-weight: 600; color: var(--color-danger);">
                R$ ${parseFloat(client.balance || 0).toFixed(2)}
            </div>
        </div>
    `).join('');

    // --- Detail View (Extrato) ---
    let detailsHtml = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted);">Selecione um cliente para ver o extrato</div>';

    if (selectedClientId && transactions) {
        const selectedClient = clients.find(c => c.id == selectedClientId);

        if (selectedClient) {
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const d = new Date(dateString);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            };

            let runningBalance = 0;
            const transactionsHtml = transactions.map(t => {
                const amount = parseFloat(t.amount);
                runningBalance += amount;

                const color = amount > 0 ? 'var(--color-danger)' : 'var(--color-success)';
                // Running balance color
                const balanceColor = runningBalance > 0.01 ? 'var(--color-danger)' : (runningBalance < -0.01 ? 'var(--color-success)' : 'var(--color-text-muted)');

                return `
                <div style="display: grid; grid-template-columns: 140px 1fr 100px 120px 50px; padding: 0.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;">
                    <div style="font-size: 0.85rem; color: var(--color-text-muted);">${formatDate(t.createdAt)}</div>
                    <div>
                        <div style="font-weight: 500;">${t.type === 'FIADO' ? 'Fiado' : (t.type === 'MANUAL_DEBT' ? 'Dívida Lançada' : 'Pagamento')}</div>
                        ${t.description ? `<div style="font-size: 0.85rem; color: var(--color-text-muted);">${t.description}</div>` : ''}
                    </div>
                    <div style="text-align: right; font-weight: 600; color: ${color};">
                        ${amount > 0 ? '+' : ''}${amount.toFixed(2)}
                    </div>
                    <div style="text-align: right; font-weight: 600; color: ${balanceColor};">
                        R$ ${runningBalance.toFixed(2)}
                    </div>
                    <div style="text-align: right;">
                        ${t.tabId ? `
                        <button class="btn-icon view-fiado-tab-btn" data-tab-id="${t.tabId}" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0.25rem;" title="Ver Detalhes">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('');

            detailsHtml = `
                <div style="height: 100%; display: flex; flex-direction: column;">
                    <!-- Header -->
                    <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">Extrato | ${selectedClient.name.toUpperCase()}</h2>
                             <div style="font-size: 1.25rem; font-weight: 700; display:flex; gap: 0.5rem; align-items:center;">
                                <span style="font-size: 0.9rem; color: var(--color-text-muted); font-weight: 400;">Saldo Devedor:</span>
                                <span style="color: var(--color-danger);">R$ ${parseFloat(selectedClient.balance || 0).toFixed(2)}</span>
                             </div>
                        </div>
                        <button id="open-payment-modal-btn" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.2rem;">+</span> Lançar Pagamento
                        </button>
                    </div>
                    
                    <!-- Transactions List -->
                    <div id="fiado-transaction-list" style="flex: 1; overflow-y: auto; background: var(--color-bg-elevated); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                         <div style="display: grid; grid-template-columns: 140px 1fr 100px 120px 50px; padding: 0.75rem 1rem; background: rgba(0,0,0,0.2); font-weight: 600; font-size: 0.9rem; color: var(--color-text-muted);">
                            <div>Data</div>
                            <div>Histórico</div>
                            <div style="text-align: right;">Valor</div>
                            <div style="text-align: right;">Saldo</div>
                            <div></div>
                        </div>
                        ${transactionsHtml || '<div style="padding:2rem; text-align:center;">Nenhum registro encontrado.</div>'}
                    </div>

                    <!-- Footer Action -->
                    <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                         <button id="open-debt-modal-btn" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--color-danger); color: var(--color-danger); background: transparent;">
                            <span style="border: 1px solid currentColor; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 14px;">-</span> Registrar Dívida
                        </button>
                    </div>
                </div>
            `;
        }
    }

    const content = `
            <div class="card" style="display: grid; grid-template-columns: 350px 1fr; gap: 0; padding: 0; height: calc(100vh - 140px); overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                <!-- Left Column: Client List -->
                <div style="border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; background: rgba(0,0,0,0.2);">
                    <div style="padding: 1rem; position: sticky; top: 0; background: inherit; backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <input type="text" id="fiado-search-filter" placeholder="Buscar cliente..." class="input" style="font-size: 0.9rem; padding: 0.5rem;">
                    </div>
                    <div id="fiado-client-list">
                        ${clientsListHtml}
                    </div>
                </div>
                
                <!-- Right Column: Details -->
                <div style="padding: 2rem; overflow-y: auto; background: var(--color-bg-surface);">
                    ${detailsHtml}
                </div>
            </div>

        <!-- Payment Modal -->
        <div id="fiado-payment-modal" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3>Lançar Pagamento</h3>
                    <button class="close-modal" id="cancel-payment-web-btn">&times;</button>
                </div>
                <form id="fiado-payment-form">
                    <div class="form-group">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" id="payment-amount" class="input" required placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Observação</label>
                        <input type="text" id="payment-desc" class="input" placeholder="Pagamento parcial/total">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-payment-web-btn-2">Voltar</button>
                        <button type="submit" class="btn btn-primary">Confirmar Pagamento</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Debt Modal -->
        <div id="fiado-debt-modal" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3>Registrar Dívida</h3>
                    <button class="close-modal" id="cancel-debt-web-btn">&times;</button>
                </div>
                 <form id="fiado-debt-form">
                    <div class="form-group">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" id="debt-amount" class="input" required placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Observação</label>
                        <input type="text" id="debt-desc" class="input" placeholder="Consumo no balcão" required>
                    </div>
                    <div class="modal-actions">
                         <button type="button" class="btn btn-secondary" id="cancel-debt-web-btn-2">Voltar</button>
                        <button type="submit" class="btn btn-primary">Salvar (F2)</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    return Page({
        title: 'Controle de Fiado',
        content
    });
}
