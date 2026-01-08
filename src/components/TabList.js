import { activeTabs } from '../data.js';
import tabListTemplate from '../templates/TabList.html?raw';
import tabCardTemplate from '../templates/TabCard.html?raw';
import { render } from '../utils/template.js';

export function TabList(tabs = activeTabs, selectedIndex = 0) {
  if (tabs.length === 0) {
    return `<div class="text-center text-muted">Nenhuma comanda encontrada</div>`;
  }

  const itemsHtml = tabs.map((tab, index) => {
    const isSelected = index === selectedIndex;
    const selectedStyle = isSelected ? `
      border: 2px solid var(--color-primary);
      box-shadow: 0 0 15px rgba(var(--color-primary-rgb), 0.3);
      transform: translateY(-2px);
    ` : '';

    // Status Logic
    const isOpen = tab.status === 'open';
    const statusParams = {
      bg: isOpen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      color: isOpen ? 'var(--color-success)' : 'var(--color-text-muted)'
    };

    return render(tabCardTemplate, {
      id: tab.id,
      customer: tab.customer,
      selectedStyle,
      statusParams: {
        bg: statusParams.bg,
        color: statusParams.color
      }, // Note: Our simple render doesn't support nested objects cleanly without modifying render, 
      // but for now I'll flatten it in the logic or update render.
      // Actually, let's pre-process the values for the simple replacer.
      "statusParams.bg": statusParams.bg,
      "statusParams.color": statusParams.color,
      statusText: isOpen ? 'Aberta' : 'Fechada',
      openedAt: tab.openedAt ? new Date(tab.openedAt).toLocaleDateString('pt-BR') : '',
      totalFormatted: parseFloat(tab.total || 0).toFixed(2)
    });
  }).join('');

  return render(tabListTemplate, {
    items: itemsHtml
  });
}
