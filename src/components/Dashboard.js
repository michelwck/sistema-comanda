import { TabList } from './TabList';
import { Page } from './Layout';

export function Dashboard(props = {}) {
  const { tabs, searchTerm = '', selectedIndex = 0, currentUser = null, dashboardSection = 'general' } = props;

  // Filtro local por section — ausência de campo tratada como 'general'
  const filteredBySection = tabs.filter(t => (t.section || 'general') === dashboardSection);

  const s = dashboardSection;
  const tabsHtml = `
    <div id="dashboard-section-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <button
        class="dashboard-tab-btn${s === 'general' ? ' active' : ''}"
        data-section="general"
        style="flex: 1; padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: ${s === 'general' ? 'var(--color-primary)' : 'transparent'}; color: ${s === 'general' ? '#fff' : 'var(--color-text-muted)'}; cursor: pointer; font-size: 0.875rem; font-weight: ${s === 'general' ? '600' : '400'}; transition: all 0.15s;">
        Geral
      </button>
      <button
        class="dashboard-tab-btn${s === 'football' ? ' active' : ''}"
        data-section="football"
        style="flex: 1; padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: ${s === 'football' ? 'var(--color-primary)' : 'transparent'}; color: ${s === 'football' ? '#fff' : 'var(--color-text-muted)'}; cursor: pointer; font-size: 0.875rem; font-weight: ${s === 'football' ? '600' : '400'}; transition: all 0.15s;">
        Futebol
      </button>
    </div>
  `;

  const actions = `
    <button id="new-tab-btn" class="btn btn-primary">
      + Nova Comanda (F6)
    </button>
  `;

  const content = `
    <div style="margin-bottom: var(--spacing-md);">
      <input type="text" id="search-comanda" class="input" placeholder="Pesquisar por cliente..." value="${searchTerm}" style="width: 100%;" autocomplete="off" aria-label="Pesquisar comanda">
    </div>
    ${tabsHtml}
    ${TabList(filteredBySection, selectedIndex, currentUser)}

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

