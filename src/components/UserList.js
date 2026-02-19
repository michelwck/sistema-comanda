import { Page } from './Layout.js';

export function UserList(props = {}) {
  const { users = [] } = props;

  const rows = users.map(user => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                ${user.picture ? `<img src="${user.picture}" style="width: 32px; height: 32px; border-radius: 50%;">` :
      `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">${user.name.charAt(0)}</div>`}
                <div>
                    <div style="font-weight: 500;">${user.name}</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-muted);">${user.email}</div>
                </div>
            </div>
        </td>
        <td style="padding: 1rem;">
            <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: ${user.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'}; color: ${user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)'}; text-transform: capitalize;">
                ${user.role === 'admin' ? 'Administrador' : 'Operador'}
            </span>
        </td>
        <td style="padding: 1rem;">
            <span style="color: ${user.isActive ? 'var(--color-success)' : 'var(--color-danger)'}; font-size: 0.85rem;">
                ${user.isActive ? 'Ativo' : 'Inativo'}
            </span>
        </td>
        <td style="padding: 1rem; text-align: right;">
            <button class="btn btn-secondary edit-user-btn" data-id="${user.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Editar</button>
            <button class="btn delete-user-btn" data-id="${user.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; margin-left: 0.5rem; background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); cursor: pointer;">Excluir</button>
        </td>
    </tr>
  `).join('');

  const actions = `
        <button id="new-user-btn" class="btn btn-primary">
          <span style="margin-right: 8px;">+</span> Novo Usuário
        </button>
    `;

  const content = `
      <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Gerencie quem tem acesso ao sistema (Login Google)</p>
      
      <div class="card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Usuário</th>
                    <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Função</th>
                    <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Status</th>
                    <th style="padding: 1rem; text-align: right;">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${rows.length ? rows : '<tr><td colspan="4" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Nenhum usuário encontrado</td></tr>'}
            </tbody>
        </table>
      </div>

    <!-- User Modal -->
    <div id="user-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 id="user-modal-title" style="margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: 0.5rem;">
            Novo Usuário
        </h3>
        <p style="margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.4;">
            Adicione o email da Conta Google que terá permissão para acessar o sistema. O nome e a foto serão carregados automaticamente no primeiro login.
        </p>

        <form id="user-form">
          <input type="hidden" id="user-id">
          
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Email do Google</label>
            <input type="email" id="user-email" class="input" required placeholder="exemplo@gmail.com">
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome (Identificação)</label>
            <input type="text" id="user-name" class="input" required placeholder="Ex: João (Garçom)">
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Função</label>
            <select id="user-role" class="input" style="width: 100%;">
                <option value="operator">Operador (Acesso Básico)</option>
                <option value="admin">Administrador (Acesso Total)</option>
            </select>
          </div>

          <div id="user-status-container" style="margin-bottom: 1.5rem; display: none;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="user-active">
                <span style="color: var(--color-text-main);">Usuário Ativo</span>
            </label>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" id="cancel-user-modal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Permissão</button>
          </div>
        </form>
      </div>
    </div>
    `;

  return Page({
    title: 'Usuários do Sistema',
    actions,
    content
  });
}
