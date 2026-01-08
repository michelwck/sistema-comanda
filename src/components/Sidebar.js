/**
 * Renders the Sidebar Navigation
 * @returns {string} HTML string
 */
export function Sidebar() {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="app-logo">BarComanda</div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active" data-nav="dashboard">
          <span class="nav-icon">📊</span>
          Comandas
        </a>
        
        <div class="nav-group collapsible">
          <div class="nav-group-title" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding-right: 1rem;">
            <span>Cadastro</span>
            <span class="arrow" style="transition: transform 0.3s ease;">▼</span>
          </div>
          <div class="nav-group-content hidden">
            <a href="#" class="nav-item" data-nav="clients">
              <span class="nav-icon">👥</span>
              Clientes
            </a>
            <a href="#" class="nav-item" data-nav="products">
              <span class="nav-icon">🍺</span>
              Produtos
            </a>
          </div>
        </div>
        <div class="nav-group collapsible">
          <div class="nav-group-title" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding-right: 1rem;">
            <span>Financeiro</span>
            <span class="arrow" style="transition: transform 0.3s ease;">▼</span>
          </div>
          <div class="nav-group-content hidden">
            <a href="#" class="nav-item" data-nav="fiado">
              <span class="nav-icon">📝</span>
              Fiado
            </a>
            <a href="#" class="nav-item" data-nav="history">
              <span class="nav-icon">📜</span>
              Histórico
            </a>
          </div>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">AD</div>
          <div class="user-info">
            <div class="user-name">Admin</div>
            <div class="user-role">Gerente</div>
          </div>
        </div>
      </div>
    </aside>
  `;
}
