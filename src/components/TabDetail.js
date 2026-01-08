import { Header } from './Header';

/**
 * Renders the Tab Detail View
 * @param {Object} tab - The tab object to display
 * @returns {string} HTML string
 */
export function TabDetail(tab, selectedIndex = -1) {
  const isReadOnly = tab.status !== 'open';
  const reversedItems = tab.items ? [...tab.items] : [];

  const itemsHtml = reversedItems.length > 0 ? reversedItems.map((item, displayIndex) => {
    // Backend returns items in desc order (addedAt), so reversedItems is already in display order.
    // index is used for selection mapping in main.js (state.detailItemIndex)
    const index = displayIndex;
    const isSelected = index === selectedIndex;

    const actionButtons = isReadOnly ? '' : `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="font-weight: 600; margin-right: 0.5rem;">R$ ${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</div>
        <button class="btn-icon item-options-btn" data-index="${index}" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: background 0.2s;" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
        <button class="btn-icon item-remove-btn" data-index="${index}" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: background 0.2s;" title="Remover">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    return `
    <div class="tab-item-row" data-index="${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); border-radius: 4px; ${isSelected ? 'background: rgba(139, 92, 246, 0.15); border-left: 2px solid var(--color-primary);' : ''}">
      <div style="flex: 1;">
        <div style="font-weight: 500;">${item.name}</div>
        <div style="font-size: 0.85rem; color: var(--color-text-muted);">
            x${item.quantity} un.
            <span style="font-size: 0.75rem; color: var(--color-text-muted); opacity: 0.7; margin-left: 0.5rem;">
              ${(() => {
        if (!item.addedAt) return '';
        const d = new Date(item.addedAt);
        const date = d.toLocaleDateString('pt-BR');
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${date} <b>${time}</b>`;
      })()}
            </span>
        </div>
      </div>
      ${isReadOnly ? `<div style="font-weight: 600;">R$ ${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</div>` : actionButtons}
    </div>
  `}).join('') : '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted);">Nenhum item adicionado</div>';

  const deleteButtonHtml = isReadOnly ? '' : `
            <button id="delete-tab-detail-btn" data-id="${tab.id}" class="btn-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.5rem; border-radius: 6px;" title="Excluir Comanda">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
  `;

  const quickAddSectionHtml = isReadOnly ? '' : `
          <div style="position: relative; margin-bottom: 1.5rem;">
            <input type="text" id="quick-add-search" class="input" placeholder="Pesquisar item para adicionar..." autocomplete="off" style="width: 100%;" aria-label="Pesquisar item">
            <div id="search-results-dropdown" class="hidden" style="position: absolute; top: 100%; left: 0; right: 0; background: var(--color-bg-surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 9999; max-height: 200px; overflow-y: auto;">
                <!-- Results will be injected here -->
            </div>
          </div>
  `;

  const footerActionsHtml = isReadOnly ? '' : `
        <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
          <button id="close-tab-btn" class="btn btn-primary" style="width: 100%; background: var(--color-danger); border: none; box-shadow: none;">
            Fechar Conta (F5)
          </button>
        </div>
  `;

  return `
    <main class="container">
      <button class="btn btn-secondary" id="back-btn" style="margin-bottom: var(--spacing-md); padding: 0.5rem 1rem;">
        ← Voltar
      </button>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md); padding-bottom: var(--spacing-md); border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div>
            <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                <input 
                    type="text" 
                    id="edit-customer-name" 
                    value="${tab.customer}" 
                    style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-main); background: transparent; border: 1px solid transparent; border-radius: 4px; padding: 0.25rem; width: 100%;"
                    ${isReadOnly ? 'disabled' : `
                    onfocus="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.05)';" 
                    onblur="this.style.borderColor='transparent'; this.style.background='transparent';"
                    `}
                    placeholder="Nome do Cliente"
                    autocomplete="off"
                    aria-label="Nome do Cliente"
                >
            </div>
            <span style="color: var(--color-text-muted);">Comanda #${tab.id} ${isReadOnly ? `(${tab.status === 'deleted' ? 'Excluída' : 'Fechada'})` : ''}</span>
          </div>
          <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
            <div>
              <div style="font-size: 0.9rem; color: var(--color-text-muted);">Total</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">R$ ${parseFloat(tab.total || 0).toFixed(2)}</div>
            </div>
            ${deleteButtonHtml}
          </div>
        </div>

        <div style="margin-bottom: var(--spacing-lg);">

          ${quickAddSectionHtml}

          <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">Itens do Pedido</h3>
          <div id="items-container">
            ${itemsHtml}
          </div>
        </div>

        ${footerActionsHtml}
      </div>
    </main>

    <!-- Modals are still here but won't be triggered if buttons are hidden. We can leave them. -->
    <!-- Add Item Modal -->
    <div id="add-item-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 style="margin-bottom: var(--spacing-md);">Adicionar Item</h3>
        <form id="add-item-form">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome do Produto</label>
            <input type="text" name="name" id="item-name" class="input" required placeholder="Ex: Cerveja" autocomplete="off" aria-label="Nome do Produto">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
             <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Preço (R$)</label>
                <input type="number" name="price" id="item-price" step="0.50" class="input" required placeholder="0.00">
             </div>
             <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Qtd</label>
                <input type="number" name="quantity" id="item-quantity" class="input" value="1" min="1" required>
             </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="cancel-modal-btn" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Adicionar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Item Modal -->
    <div id="edit-item-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 style="margin-bottom: var(--spacing-md);">Editar Item</h3>
        <form id="edit-item-form">
          <input type="hidden" id="edit-item-index">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome do Produto</label>
            <input type="text" id="edit-item-name" class="input" disabled style="background: rgba(255,255,255,0.05); color: var(--color-text-muted); cursor: not-allowed;">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
             <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Preço Unit. (R$)</label>
                <input type="number" name="price" id="edit-item-price" step="0.50" class="input" required>
             </div>
             <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Qtd</label>
                <input type="number" name="quantity" id="edit-item-quantity" class="input" min="1" required aria-label="Quantidade">
             </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="cancel-edit-modal-btn" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Payment Modal -->
    <div id="payment-modal" class="modal-overlay hidden">
      <div class="modal-content" style="max-width: 400px;">
        <h3 style="margin-bottom: var(--spacing-md); text-align: center;">Finalizar Comanda</h3>
        
        <div style="margin-bottom: 1.5rem; text-align: center;">
            <div style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Total a Pagar</div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--color-primary);">
                R$ <span id="payment-total-display">${parseFloat(tab.total || 0).toFixed(2)}</span>
            </div>
        </div>

        <form id="payment-form">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Valor Pago (R$)</label>
            <input type="number" id="payment-value" step="0.50" class="input" style="font-size: 1.2rem; text-align: center;" value="${parseFloat(tab.total || 0).toFixed(2)}" required aria-label="Valor Pago">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="fiado-btn" class="btn btn-secondary" title="Atalho: F">
                Fiado (F)
            </button>
            <button type="submit" id="confirm-payment-btn" class="btn btn-primary">
                Finalizar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Fiado Client Selection Modal -->
    <div id="fiado-modal" class="modal-overlay hidden">
      <div class="modal-content" style="max-width: 500px; max-height: 80vh; display: flex; flex-direction: column;">
        <h3 style="margin-bottom: var(--spacing-md);">Selecionar Cliente para Fiado</h3>
        <input type="text" id="fiado-search-input" class="input" placeholder="Buscar cliente..." style="margin-bottom: 1rem;" autocomplete="off" aria-label="Buscar cliente">
        
        <div id="fiado-client-list-container" style="flex: 1; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
            <!-- Clients injected here -->
        </div>
        
        <div style="margin-top: 1rem; display: flex; justify-content: space-between;">
            <button id="open-new-client-modal-btn" class="btn btn-outline-primary" style="font-size: 0.9rem; padding: 0.4rem 0.8rem;">
                + Novo Cliente
            </button>
            <button id="cancel-fiado-btn" class="btn btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
    
    <!-- Quick New Client Modal -->
    <div id="new-client-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 style="margin-bottom: var(--spacing-md);">Novo Cliente</h3>
        <form id="new-client-form">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome</label>
            <input type="text" id="new-client-name" class="input" required placeholder="Nome do Cliente" autocomplete="off" aria-label="Nome do Cliente">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Telefone</label>
            <input type="tel" id="new-client-phone" class="input" placeholder="(00) 00000-0000" autocomplete="off" aria-label="Telefone">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="cancel-new-client-btn" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
