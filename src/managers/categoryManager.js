import * as api from '../services/api.js';

export function attachCategoryEvents(state, render) {
    // New Category Button
    const newCategoryBtn = document.querySelector('#new-category-btn');
    const newCategoryModal = document.querySelector('#new-category-modal');
    const cancelNewCategoryBtn = document.querySelector('#cancel-new-category-btn');
    const newCategoryForm = document.querySelector('#new-category-form');

    if (newCategoryBtn && newCategoryModal) {
        newCategoryBtn.addEventListener('click', () => {
            newCategoryModal.classList.remove('hidden');
            setTimeout(() => {
                const input = document.querySelector('#new-category-name');
                if (input) input.focus();
            }, 50);
        });
    }

    if (cancelNewCategoryBtn && newCategoryModal) {
        cancelNewCategoryBtn.addEventListener('click', () => {
            newCategoryModal.classList.add('hidden');
            if (newCategoryForm) newCategoryForm.reset();
        });
    }

    if (newCategoryForm) {
        newCategoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.querySelector('#new-category-name').value;

            api.createCategory({ name })
                .then(newCategory => {
                    state.categories.push(newCategory);
                    state.categories.sort((a, b) => a.name.localeCompare(b.name));
                    newCategoryModal.classList.add('hidden');
                    newCategoryForm.reset();
                    render();
                })
                .catch(err => alert('Erro ao criar categoria: ' + err.message));
        });
    }

    // Edit Category Buttons
    const editCategoryModal = document.querySelector('#edit-category-modal');
    const cancelEditCategoryBtn = document.querySelector('#cancel-edit-category-btn');
    const editCategoryForm = document.querySelector('#edit-category-form');

    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;

            document.querySelector('#edit-category-id').value = id;
            document.querySelector('#edit-category-name').value = name;

            editCategoryModal.classList.remove('hidden');
            setTimeout(() => {
                const input = document.querySelector('#edit-category-name');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        });
    });

    if (cancelEditCategoryBtn && editCategoryModal) {
        cancelEditCategoryBtn.addEventListener('click', () => {
            editCategoryModal.classList.add('hidden');
        });
    }

    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(document.querySelector('#edit-category-id').value);
            const name = document.querySelector('#edit-category-name').value;

            api.updateCategory(id, { name })
                .then(updatedCategory => {
                    const idx = state.categories.findIndex(c => c.id === id);
                    if (idx > -1) state.categories[idx] = updatedCategory;
                    editCategoryModal.classList.add('hidden');
                    render();
                })
                .catch(err => alert('Erro ao atualizar categoria: ' + err.message));
        });
    }

    // Delete Category Buttons
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const count = parseInt(btn.dataset.count);

            if (count > 0) {
                alert(`Não é possível excluir esta categoria pois existem ${count} produto(s) associado(s).`);
                return;
            }

            if (confirm('Deseja realmente excluir esta categoria?')) {
                api.deleteCategory(id)
                    .then(() => {
                        state.categories = state.categories.filter(c => c.id !== id);
                        render();
                    })
                    .catch(err => alert('Erro ao excluir categoria: ' + err.message));
            }
        });
    });
}
