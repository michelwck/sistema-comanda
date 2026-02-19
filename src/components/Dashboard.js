import { TabList } from './TabList';
import { Page } from './Layout';

export function Dashboard(props = {}) {
  const { tabs, searchTerm = '', selectedIndex = 0, currentUser = null } = props;

  const actions = `
    <button id="new-tab-btn" class="btn btn-primary">
      + Nova Comanda (F6)
    </button>
  `;

  const content = `
    <div style="margin-bottom: var(--spacing-md);">
      <input type="text" id="search-comanda" class="input" placeholder="Pesquisar por cliente..." value="${searchTerm}" style="width: 100%;" autocomplete="off" aria-label="Pesquisar comanda">
    </div>
    ${TabList(tabs, selectedIndex, currentUser)}

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

  return Page({
    title: 'Comandas Ativas',
    actions,
    content
  });
}

