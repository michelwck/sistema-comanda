export function Sidebar(currentView, currentUser) {
  // Safe check for current user
  console.log('Sidebar currentUser:', currentUser); // DEBUG USER NAME
  const user = currentUser || { name: 'Usuário', role: 'operator' };
  let safeName = user.name || 'Usuário';
  if (safeName === 'undefined') safeName = 'Usuário';

  let safeRole = user.role || 'operator';
  if (safeRole === 'undefined') safeRole = 'operator';

  const initials = safeName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Helper to check if view is active
  const isActive = (view) => currentView === view ? 'active' : '';

  // Safe check for collapsed state (passed or handled globally, but for now we rely on CSS class added by main)
  // We'll add a toggle button that Main.js will listen to
  // Count active orders for badge
  // Note: This would ideally come from state, passing as prop or simplified
  const count = 0; // Simplified for now

  return `
    <aside class="sidebar" id="main-sidebar">
      <div id="sidebar-toggle-btn" class="sidebar-toggle">
        <span style="font-size: 12px;">◀</span>
      </div>
      <div class="app-header">
        <div class="app-logo">
          🍺 BarComanda
        </div>
      </div>

      <nav class="nav-menu">
        <a href="#" class="nav-item ${isActive('dashboard')}" data-view="dashboard">
          <span class="nav-icon">📊</span>
          <span class="nav-text">Comandas</span>
          ${count > 0 ? `<span class="badge">${count}</span>` : ''}
        </a>
        
        <div class="nav-group collapsible">
          <div class="nav-group-title">
            <span class="nav-text">Cadastro</span>
            <span class="arrow">▼</span>
          </div>
          <div class="nav-group-content" id="cadastro-menu">
            <a href="#" class="nav-item ${isActive('clients')}" data-view="clients">
              <span class="nav-icon">👥</span> <span class="nav-text">Clientes</span>
            </a>
            <a href="#" class="nav-item ${isActive('products')}" data-view="products">
              <span class="nav-icon">📦</span> <span class="nav-text">Produtos</span>
            </a>
            <!-- Link visible only for admins or all (logic handled in main render if needed, but safe here) -->

        </div >
        </div >

  <div class="nav-group collapsible">
    <div class="nav-group-title">
      <span class="nav-text">Financeiro</span>
      <span class="arrow">▼</span>
    </div>
    <div class="nav-group-content hidden">
      <a href="#" class="nav-item ${isActive('fiado')}" data-view="fiado">
        <span class="nav-icon">📝</span>
        <span class="nav-text">Fiado</span>
      </a>
      <a href="#" class="nav-item ${isActive('history')}" data-view="history">
        <span class="nav-icon">📜</span>
        <span class="nav-text">Histórico</span>
      </a>
    </div>
  </div>

        ${user.role === 'admin' ? `
        <div class="nav-group">
          <div class="nav-group-title"><span class="nav-text">Administração</span></div>
          <div class="nav-group-content">
            <a href="#" class="nav-item ${isActive('users')}" data-view="users">
              <span class="nav-icon">👤</span>
              <span class="nav-text">Usuários</span>
            </a>
          </div>
        </div>
        ` : ''
    }
      </nav >

  <div style="margin-top: auto;">
    <div style="
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
        ">
      <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
          ">${initials}</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeName}</div>
        <div style="font-size: 0.75rem; color: #a0aec0; text-transform: capitalize;">${safeRole === 'operator' ? 'Operador' : 'Administrador'}</div>
      </div>
      <button id="logout-btn" style="
            background: none;
            border: none;
            color: #ef4444;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          " title="Sair">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  </div>
    </aside >
  `;
}
