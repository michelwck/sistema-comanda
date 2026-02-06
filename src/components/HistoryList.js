
/**
 * Renders the History Screen
 * @param {Object} props
 * @param {Array} props.historyTabs - List of closed/deleted tabs
 * @param {Array} props.clients - List of clients for filter
 * @param {Object} props.filters - Current filters state
 * @returns {string} HTML string
 */
export function HistoryList({ historyTabs, clients, filters }) {

    const tabsHtml = historyTabs.length > 0 ? historyTabs.map(tab => {
        const isDeleted = tab.status === 'deleted' || (tab.deletedAt !== null && tab.deletedAt !== undefined);
        const statusColor = isDeleted ? 'var(--color-danger)' : 'var(--color-success)';
        const statusText = isDeleted ? 'Excluída' : 'Fechada';

        const date = new Date(tab.updatedAt || tab.createdAt);
        const dateStr = date.toLocaleDateString('pt-BR');
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Resolve client name from ID if available, otherwise fallback (though history usually has customer name string)
        const clientObj = tab.clientId ? clients.find(c => c.id === tab.clientId) : null;
        const registeredClientName = clientObj ? clientObj.name : '-';

        return `
        <div class="history-row" style="display: grid; grid-template-columns: 2fr 1.5fr 150px 100px 100px 120px; gap: 1rem; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; transition: background 0.2s;">
            <div style="font-weight: 500;">${tab.customer}</div>
            <div style="color: var(--color-text-muted);">${registeredClientName}</div>
            <div style="color: var(--color-text-muted); font-size: 0.9rem;">${dateStr} ${timeStr}</div>
            <div>
                <span style="background: ${isDeleted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; color: ${statusColor}; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.85rem; border: 1px solid ${isDeleted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'};">
                    ${statusText}
                </span>
            </div>
            <div style="font-weight: 600; text-align: right; color: var(--color-primary);">
                R$ ${parseFloat(tab.total || 0).toFixed(2)}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button class="history-reopen-btn" data-id="${tab.id}" title="Reabrir Comanda" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--color-warning); background: rgba(234, 179, 8, 0.1); color: var(--color-warning); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                    ↻
                </button>
                <button class="history-details-btn" data-id="${tab.id}" title="Ver Detalhes" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--color-primary); background: rgba(139, 92, 246, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-weight: bold; font-family: monospace;">
                    !
                </button>
            </div>
        </div>
        `;
    }).join('') : '<div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Nenhuma comanda encontrada neste período.</div>';

    const clientOptions = clients.map(client =>
        `<option value="${client.id}" ${filters.clientId == client.id ? 'selected' : ''}>${client.name}</option>`
    ).join('');

    return `
    <div class="container" style="height: calc(100vh - 4rem); display: flex; flex-direction: column;">
        <header style="margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Histórico de Comandas</h2>
            
            <div class="card" style="padding: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.9rem;">Data Início</label>
                    <input type="date" id="history-date-start" class="input" value="${filters.startDate || ''}" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.9rem;">Data Fim</label>
                    <input type="date" id="history-date-end" class="input" value="${filters.endDate || ''}" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.9rem;">Comanda</label>
                    <input type="text" id="history-search-name" class="input" placeholder="Buscar por identificação..." value="${filters.customer || ''}" style="width: 100%;" autocomplete="off">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted); font-size: 0.9rem;">Cliente</label>
                    <select id="history-client-select" class="input" style="width: 100%;">
                        <option value="">Todos</option>
                        ${clientOptions}
                    </select>
                </div>
                <div>
                    <button id="history-filter-btn" class="btn btn-primary" style="width: 100%;">Filtrar</button>
                </div>
            </div>
        </header>
        
        <div class="card" style="flex: 1; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 1rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); display: grid; grid-template-columns: 2fr 1.5fr 150px 100px 100px 120px; gap: 1rem; font-weight: 600; color: var(--color-text-muted); font-size: 0.9rem;">
                <div>Nome da Comanda</div>
                <div>Cliente</div>
                <div>Data/Hora</div>
                <div>Status</div>
                <div style="text-align: right;">Total</div>
                <div style="text-align: right;">Ações</div>
            </div>
            
            <div style="flex: 1; overflow-y: auto;">
                ${tabsHtml}
            </div>
        </div>
    </div>
    `;
}
