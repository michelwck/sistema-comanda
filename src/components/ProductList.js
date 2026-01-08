export function ProductList(props = {}) {
  const { products = [] } = props;
  const rows = products.map(product => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 1rem;">${product.name}</td>
            <td style="padding: 1rem; color: var(--color-text-muted);">${product.category}</td>
            <td style="padding: 1rem; font-weight: 600; color: var(--color-primary);">R$ ${parseFloat(product.price || 0).toFixed(2)}</td>
            <td style="padding: 1rem; text-align: right;">
                <button class="btn btn-secondary edit-product-btn" data-id="${product.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Editar</button>
            </td>
        </tr>
      `).join('');

  return `
        <main class="container">
          <div style="margin-bottom: var(--spacing-md); display: flex; justify-content: space-between; align-items: center;">
            <h2>Produtos</h2>
            <button id="new-product-btn" class="btn btn-primary">
              + Novo Produto
            </button>
          </div>
          
          <div class="card" style="padding: 0; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Nome</th>
                        <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Categoria</th>
                        <th style="padding: 1rem; font-weight: 600; color: var(--color-text-muted);">Preço</th>
                        <th style="padding: 1rem; text-align: right;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
          </div>
        </main>

        <!-- Product Modal -->
        <div id="product-modal" class="modal-overlay hidden">
          <div class="modal-content">
            <h3 id="product-modal-title" style="margin-bottom: var(--spacing-md);">Novo Produto</h3>
            <form id="product-form">
              <input type="hidden" id="product-id">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome</label>
                <input type="text" id="product-name" class="input" required>
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Categoria</label>
                <input type="text" id="product-category" class="input" required>
              </div>
              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Preço (R$)</label>
                <input type="number" id="product-price" step="0.50" class="input" required>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <button type="button" id="cancel-product-modal" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      `;
}
