import { TabList } from './TabList';

export function Dashboard(props = {}) {
  const { tabs, searchTerm = '', selectedIndex = 0 } = props;

  return `
    <main class="container">
      <div style="margin-bottom: var(--spacing-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2>Comandas Ativas</h2>
          <button id="new-tab-btn" class="btn btn-primary">
            + Nova Comanda (F6)
          </button>
        </div>
        <input type="text" id="search-comanda" class="input" placeholder="Pesquisar por cliente..." value="${searchTerm}" style="width: 100%;" autocomplete="off" aria-label="Pesquisar comanda">
      </div>
      ${TabList(tabs, selectedIndex)}
    </main>

    <!-- New Tab Modal -->
    <div id="new-tab-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 style="margin-bottom: var(--spacing-md);">Nova Comanda</h3>
        <form id="new-tab-form">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome do Cliente</label>
            <input type="text" id="new-tab-customer" class="input" required placeholder="Ex: João Silva" autocomplete="off" aria-label="Nome do Cliente">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="cancel-new-tab-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Abrir Comanda</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
