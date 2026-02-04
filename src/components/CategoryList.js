/**
 * Renders the Category List View
 * @param {Object} props - { categories: Array }
 * @returns {string} HTML string
 */
export function CategoryList(props = {}) {
    const { categories = [] } = props;

    const categoriesHtml = categories.length > 0 ? categories.map(category => `
        <div class="card" style="padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 600; font-size: 1.1rem;">${category.name}</div>
                <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                    ${category._count?.products || 0} produto(s)
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-icon edit-category-btn" data-id="${category.id}" data-name="${category.name}" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn-icon delete-category-btn" data-id="${category.id}" data-count="${category._count?.products || 0}" style="color: var(--color-danger);" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `).join('') : '<div class="card" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Nenhuma categoria cadastrada</div>';

    return `
        <main class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <h2 style="margin: 0;">Categorias de Produtos</h2>
                <button id="new-category-btn" class="btn btn-primary">+ Nova Categoria</button>
            </div>

            <div id="categories-container">
                ${categoriesHtml}
            </div>
        </main>

        <!-- New Category Modal -->
        <div id="new-category-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom: var(--spacing-md);">Nova Categoria</h3>
                <form id="new-category-form">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome da Categoria</label>
                        <input type="text" id="new-category-name" class="input" required placeholder="Ex: Bebidas" autocomplete="off" aria-label="Nome da Categoria">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <button type="button" id="cancel-new-category-btn" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Category Modal -->
        <div id="edit-category-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3 style="margin-bottom: var(--spacing-md);">Editar Categoria</h3>
                <form id="edit-category-form">
                    <input type="hidden" id="edit-category-id">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--color-text-muted);">Nome da Categoria</label>
                        <input type="text" id="edit-category-name" class="input" required autocomplete="off" aria-label="Nome da Categoria">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <button type="button" id="cancel-edit-category-btn" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
