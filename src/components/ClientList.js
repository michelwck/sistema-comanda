export function ClientList(props = {}) {
  const { clients = [] } = props;
  const rows = clients.map(client => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 1rem;">${client.name}</td>
        <td style="padding: 1rem; color: var(--color-text-muted);">${client.email || '-'}</td>
        <td style="padding: 1rem; color: var(--color-text-muted);">${client.phone || '-'}</td>
        <td style="padding: 1rem; text-align: right;">
            <button class="btn btn-secondary edit-client-btn" data-id="${client.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Editar</button>
            <button class="btn delete-client-btn" data-id="${client.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; margin-left: 0.5rem; background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); cursor: pointer;">Excluir</button>
        </td>
    </tr>
  `).join('');

  return `
    <main class="container">
      <div style="margin-bottom: var(--spacing-md); display: flex; justify-content: space-between; align-items: center;">
        <h2>Clientes</h2>
        <button id="new-client-btn" class="btn btn-primary">
          + Novo Cliente
        </button>
      </div>
      
      <div class="card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Nome</th>
                    <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Email</th>
                    <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Telefone</th>
                    <th style="padding: 1rem; text-align: right;">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
      </div>
    </main>

    <!-- Client Modal -->
    <div id="client-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 id="client-modal-title" style="margin-bottom: var(--spacing-md);">Novo Cliente</h3>
        <form id="client-form">
          <input type="hidden" id="client-id">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome</label>
            <input type="text" id="client-name" class="input" required>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Email</label>
            <input type="email" id="client-email" class="input">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Telefone</label>
            <input type="text" id="client-phone" class="input">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="cancel-client-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
