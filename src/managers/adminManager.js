import * as api from '../services/api.js';

export function attachProductEvents(state, render) {
    const modal = document.querySelector('#product-modal');
    const form = document.querySelector('#product-form');
    const newBtn = document.querySelector('#new-product-btn');
    const cancelBtn = document.querySelector('#cancel-product-modal');

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

    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const product = state.products.find(p => p.id === id);
            if (product) {
                document.querySelector('#product-modal-title').textContent = 'Editar Produto';
                document.querySelector('#product-id').value = product.id;
                document.querySelector('#product-name').value = product.name;
                document.querySelector('#product-category').value = product.category;
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
                        render();
                    })
                    .catch(err => alert('Erro ao excluir produto: ' + err.message));
            }
        });
    });

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
