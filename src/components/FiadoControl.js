
/**
 * Renders the Fiado Control Screen
 * @param {Object} props
 * @param {Array} props.clients - List of clients
 * @param {Array} props.activeTabs - List of active tabs
 * @param {number|null} props.selectedClientId - ID of the selected client
 * @returns {string} HTML string
 */
export function FiadoControl({ clients, activeTabs, selectedClientId }) {

    // Calculate debts
    const clientDebts = clients.map(client => {
        const debt = activeTabs
            .filter(tab => tab.customer === client.name && tab.status === 'open')
            .reduce((acc, tab) => acc + tab.total, 0);
        return { ...client, debt };
    });

    // List only clients with debt > 0
    const clientsListHtml = clientDebts
        .filter(c => c.debt > 0.01) // Use small epsilon for float comparison safety
        .map(client => `
        <div class="fiado-client-item ${client.id === selectedClientId ? 'active' : ''}" 
             data-id="${client.id}"
             style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center; ${client.id === selectedClientId ? 'background: rgba(139, 92, 246, 0.1); border-left: 2px solid var(--color-primary);' : 'transition: background 0.2s;'}">
            <div>
                <div style="font-weight: 500;">${client.name}</div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${client.phone}</div>
            </div>
            <div style="font-weight: 600; ${client.debt > 0 ? 'color: var(--color-danger);' : 'color: var(--color-success);'}">
                R$ ${parseFloat(client.debt || 0).toFixed(2)}
            </div>
        </div>
    `).join('');

    // Generate Right Details
    let detailsHtml = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted);">Selecione um cliente para ver os detalhes</div>';

    if (selectedClientId) {
        const selectedClient = clientDebts.find(c => c.id === selectedClientId);
        if (selectedClient) {
            const clientTabs = activeTabs.filter(tab => tab.customer === selectedClient.name && tab.status === 'open');

            const tabsHtml = clientTabs.length > 0 ? clientTabs.map(tab => `
                <div style="background: var(--color-bg-elevated); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--color-text-muted);">Comanda #${tab.id}</span>
                        <span style="color: var(--color-text-muted);">${tab.openedAt}</span>
                    </div>
                    
                    <div style="margin-bottom: 0.5rem;">
                        ${tab.items ? tab.items.map(item => `
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.25rem 0;">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>R$ ${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</span>
                            </div>
                        `).join('') : ''}
                    </div>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 600;">
                        <span>Total</span>
                        <span style="color: var(--color-primary);">R$ ${parseFloat(tab.total || 0).toFixed(2)}</span>
                    </div>
                </div>
            `).join('') : '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted);">Nenhuma comanda em aberto</div>';

            detailsHtml = `
                <div style="height: 100%; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${selectedClient.name}</h2>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--color-text-muted);">Total em Aberto</span>
                            <span style="font-size: 1.25rem; font-weight: 700; color: var(--color-danger);">R$ ${parseFloat(selectedClient.debt || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style="flex: 1; overflow-y: auto;">
                        <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Comandas em Aberto</h3>
                        ${tabsHtml}
                    </div>
                </div>
            `;
        }
    }

    return `
        <div class="container" style="height: calc(100vh - 4rem);">
            <header style="margin-bottom: 1rem;">
                <h2 style="font-size: 1.5rem;">Controle de Fiado</h2>
            </header>
            
            <div class="card" style="display: grid; grid-template-columns: 350px 1fr; gap: 0; padding: 0; height: 100%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                <!-- Left Column: Client List -->
                <div style="border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; background: rgba(0,0,0,0.2);">
                    <div style="padding: 1rem; position: sticky; top: 0; background: inherit; backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <input type="text" placeholder="Buscar cliente..." class="input" style="font-size: 0.9rem; padding: 0.5rem;">
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
        </div>
    `;
}
