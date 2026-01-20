import { activeTabs } from '../data.js';
import { render } from '../utils/template.js';

const tabCardTemplate = `
<div class="card tab-card" data-id="{{id}}" style="{{selectedStyle}} transition: all 0.2s ease; cursor: pointer; display: flex; flex-direction: column; min-height: 140px; padding: 1.25rem 1.25rem 0.6rem 1.25rem; background: var(--color-bg-surface);">
    <div style="align-self: flex-end; font-size: 0.8rem; color: var(--color-text-muted); opacity: 0.8;">
        {{openedAt}}
    </div>
    
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; padding: 0.5rem 0;">
        <h3 class="tab-card-title">
            {{customer}}
        </h3>
    </div>

    <div style="align-self: flex-start;">
        <span style="font-weight: 700; font-size: 1.1rem; color: var(--color-primary);">
            R$ {{totalFormatted}}
        </span>
    </div>
</div>
`;

const tabListTemplate = `
<div class="dashboard-grid">
    {{items}}
</div>
`;

export function TabList(tabs = activeTabs, selectedIndex = 0) {
  if (!tabs || tabs.length === 0) {
    return `<div style="text-align: center; color: var(--color-text-muted); padding: 2rem;">Nenhuma comanda encontrada</div>`;
  }

  const itemsHtml = tabs.map((tab, index) => {
    const isSelected = index === selectedIndex;
    const selectedStyle = isSelected ? `
      border: 2px solid var(--color-primary);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
      transform: translateY(-2px);
    ` : '';

    // Status Logic
    const isOpen = tab.status === 'open';
    const statusBg = isOpen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    const statusColor = isOpen ? 'var(--color-success)' : 'var(--color-text-muted)';

    return render(tabCardTemplate, {
      id: tab.id,
      customer: tab.customer,
      selectedStyle,
      statusBg,
      statusColor,
      statusText: isOpen ? 'Aberta' : 'Fechada',
      openedAt: tab.openedAt ? new Date(tab.openedAt).toLocaleDateString('pt-BR') : '',
      totalFormatted: parseFloat(tab.total || 0).toFixed(2)
    });
  }).join('');

  return render(tabListTemplate, {
    items: itemsHtml
  });
}
