import * as api from '../services/api.js';

export function attachProductEvents(state, render) {
    const modal = document.querySelector('#product-modal');
    const form = document.querySelector('#product-form');
    const newBtn = document.querySelector('#new-product-btn');
    const cancelBtn = document.querySelector('#cancel-product-modal');
    const filterNameInput = document.querySelector('#product-filter-name');
    const filterCategorySelect = document.querySelector('#product-filter-category');
    const tbody = document.querySelector('#product-list-body');

    // Populate categories
    // Populate categories
    if (filterCategorySelect && state.categories) {
        filterCategorySelect.innerHTML = '<option value="">Todas</option>';
        state.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            filterCategorySelect.appendChild(option);
        });
    }

    const renderRows = (products) => {
        tbody.innerHTML = products.map(product => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 1rem;">${product.name}</td>
                <td style="padding: 1rem; color: var(--color-text-muted);">${product.category}</td>
                <td style="padding: 1rem; font-weight: 600; color: var(--color-primary);">R$ ${parseFloat(product.price || 0).toFixed(2)}</td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn btn-secondary edit-product-btn" data-id="${product.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Editar</button>
                    <button class="btn delete-product-btn" data-id="${product.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; margin-left: 0.5rem; background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); cursor: pointer;">Excluir</button>
                </td>
            </tr>
        `).join('');
        attachRowListeners();
    };

    const filterProducts = () => {
        const nameTerm = filterNameInput ? filterNameInput.value.toLowerCase() : '';
        const categoryTerm = filterCategorySelect ? filterCategorySelect.value : '';

        const filtered = state.products.filter(p => {
            const matchesName = p.name.toLowerCase().includes(nameTerm);
            const matchesCategory = categoryTerm ? (p.categoryId === parseInt(categoryTerm)) : true;
            return matchesName && matchesCategory;
        });

        renderRows(filtered);
    };

    if (filterNameInput) filterNameInput.addEventListener('input', filterProducts);
    if (filterCategorySelect) filterCategorySelect.addEventListener('change', filterProducts);

    function attachRowListeners() {
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const product = state.products.find(p => p.id === id);
                if (product) {
                    document.querySelector('#product-modal-title').textContent = 'Editar Produto';
                    document.querySelector('#product-id').value = product.id;
                    document.querySelector('#product-name').value = product.name;
                    document.querySelector('#product-category').value = product.categoryId || '';
                    document.querySelector('#product-price').value = product.price;
                    modal.classList.remove('hidden');
                }
            });
        });

        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const product = state.products.find(p => p.id === id);
                if (product && confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
                    api.deleteProduct(id)
                        .then(() => api.getProducts())
                        .then(products => {
                            state.products = products;
                            render(); // Here we re-render full list to ensure state sync, resetting filters is expected or we could update state and re-filter
                        })
                        .catch(err => alert('Erro ao excluir produto: ' + err.message));
                }
            });
        });
    }

    // Initial attachment
    attachRowListeners();

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            document.querySelector('#product-modal-title').textContent = 'Novo Produto';
            form.reset();
            document.querySelector('#product-id').value = '';
            modal.classList.remove('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.querySelector('#product-id').value;
            const data = {
                name: document.querySelector('#product-name').value,
                category: document.querySelector('#product-category').value,
                price: parseFloat(document.querySelector('#product-price').value)
            };

            const action = id ? api.updateProduct(id, data) : api.createProduct(data);
            action
                .then((savedProduct) => {
                    api.getProducts().then(products => {
                        state.products = products;
                        modal.classList.add('hidden');
                        form.reset();
                        render();
                    });
                })
                .catch(err => alert('Erro ao salvar produto: ' + err.message));
        });
    }
}

export function attachClientEvents(state, render) {
    const modal = document.querySelector('#client-modal');
    const form = document.querySelector('#client-form');
    const newBtn = document.querySelector('#new-client-btn');
    const cancelBtn = document.querySelector('#cancel-client-modal');
    const filterNameInput = document.querySelector('#client-filter-name');
    const tbody = document.querySelector('#client-list-body');

    const renderRows = (clients) => {
        tbody.innerHTML = clients.map(client => `
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
        attachRowListeners();
    };

    const filterClients = () => {
        const nameTerm = filterNameInput ? filterNameInput.value.toLowerCase() : '';
        const filtered = state.clients.filter(c => c.name.toLowerCase().includes(nameTerm));
        renderRows(filtered);
    };

    if (filterNameInput) filterNameInput.addEventListener('input', filterClients);

    function attachRowListeners() {
        document.querySelectorAll('.edit-client-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const client = state.clients.find(c => c.id === id);
                if (client) {
                    document.querySelector('#client-modal-title').textContent = 'Editar Cliente';
                    document.querySelector('#client-id').value = client.id;
                    document.querySelector('#client-name').value = client.name;
                    document.querySelector('#client-email').value = client.email || '';
                    document.querySelector('#client-phone').value = client.phone || '';
                    modal.classList.remove('hidden');
                }
            });
        });

        document.querySelectorAll('.delete-client-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const client = state.clients.find(c => c.id === id);
                if (client && confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
                    api.deleteClient(id)
                        .then(() => api.getClients())
                        .then(clients => {
                            state.clients = clients;
                            render();
                        })
                        .catch(err => alert('Erro ao excluir cliente: ' + err.message));
                }
            });
        });
    }

    // Initial attachment
    attachRowListeners();

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            document.querySelector('#client-modal-title').textContent = 'Novo Cliente';
            form.reset();
            document.querySelector('#client-id').value = '';
            modal.classList.remove('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.querySelector('#client-id').value;
            const data = {
                name: document.querySelector('#client-name').value,
                email: document.querySelector('#client-email').value,
                phone: document.querySelector('#client-phone').value
            };

            const action = id ? api.updateClient(id, data) : api.createClient(data);
            action
                .then(() => {
                    api.getClients().then(clients => {
                        state.clients = clients;
                        modal.classList.add('hidden');
                        form.reset();
                        render();
                    });
                })
                .catch(err => alert('Erro ao salvar cliente: ' + err.message));
        });
    }
}
