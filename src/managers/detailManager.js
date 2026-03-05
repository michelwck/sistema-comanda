import * as api from '../services/api.js';
import { normalizeString } from '../utils/helpers.js';

let controller = null;

export function attachDetailEvents(state, render) {
    // mata listeners antigos (de render anterior)
    if (controller) controller.abort();
    controller = new AbortController();
    const { signal } = controller;

    const backBtn = document.querySelector('#back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            state.selectedTabId = null;
            state.view = 'dashboard';
            render();

            queueMicrotask(() => {
                const searchInput = document.querySelector('#search-comanda');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            });
        }, { signal });
    }

    const deleteDetailBtn = document.querySelector('#delete-tab-detail-btn');
    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', () => {
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            if (!currentTab) return;

            if (confirm(`Deseja excluir a comanda #${currentTab.id} de ${currentTab.customer}?`)) {
                api.deleteTab(currentTab.id)
                    .then(() => {
                        state.tabs = state.tabs.filter(t => t.id !== currentTab.id);
                        state.selectedTabId = null;
                        state.view = 'dashboard';
                        render();
                    })
                    .catch(err => alert('Erro ao excluir comanda: ' + err.message));
            }
        }, { signal });
    }

    // ----------------------------
    // Fiado (modal)
    // ----------------------------
    const fiadoBtn = document.querySelector('#fiado-btn');
    const fiadoModal = document.querySelector('#fiado-modal');
    const cancelFiadoBtn = document.querySelector('#cancel-fiado-btn');
    const fiadoSearch = document.querySelector('#fiado-search-input');
    const fiadoList = document.querySelector('#fiado-client-list-container');
    const openNewClientBtn = document.querySelector('#open-new-client-modal-btn');
    const newClientModal = document.querySelector('#new-client-modal');
    const cancelNewClientBtn = document.querySelector('#cancel-new-client-btn');
    const newClientForm = document.querySelector('#new-client-form');

    const renderFiadoClients = () => {
        if (!fiadoList) return;

        const term = normalizeString(fiadoSearch ? fiadoSearch.value : '');
        const filtered = state.clients.filter(c => normalizeString(c.name).includes(term));

        fiadoList.innerHTML = filtered.map(client => `
      <div class="fiado-client-row" data-id="${client.id}"
           style="padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between;">
        <span style="font-weight: 500;">${client.name}</span>
        <span style="color: var(--color-text-muted); font-size: 0.9rem;">${client.phone || ''}</span>
      </div>
    `).join('');

        fiadoList.querySelectorAll('.fiado-client-row').forEach(row => {
            row.addEventListener('click', () => {
                const clientId = row.dataset.id;
                const client = state.clients.find(c => c.id == clientId);
                if (!client) return;

                if (confirm(`Confirmar Fiado para ${client.name}?`)) {
                    const oldId = state.selectedTabId;

                    api.updateTab(oldId, { status: 'closed', paymentMethod: 'fiado', clientId: client.id })
                        .then(() => {
                            fiadoModal?.classList.add('hidden');
                            const paymentModal = document.querySelector('#payment-modal');
                            paymentModal?.classList.add('hidden');

                            state.tabs = state.tabs.filter(t => t.id !== oldId);
                            state.selectedTabId = null;
                            state.view = 'dashboard';

                            return api.getClients().then(clients => {
                                state.clients = clients;
                                render();
                            });
                        })
                        .catch(err => alert('Erro ao finalizar fiado: ' + err.message));
                }
            }, { signal });
        });
    };

    if (fiadoBtn && fiadoModal) {
        fiadoBtn.addEventListener('click', () => {
            document.querySelector('#payment-modal')?.classList.add('hidden');
            fiadoModal.classList.remove('hidden');
            renderFiadoClients();
            setTimeout(() => fiadoSearch && fiadoSearch.focus(), 50);
        }, { signal });
    }

    if (cancelFiadoBtn) {
        cancelFiadoBtn.addEventListener('click', () => {
            fiadoModal?.classList.add('hidden');
            document.querySelector('#payment-modal')?.classList.remove('hidden');
        }, { signal });
    }

    if (fiadoSearch) {
        fiadoSearch.addEventListener('input', renderFiadoClients, { signal });
    }

    if (openNewClientBtn && newClientModal) {
        openNewClientBtn.addEventListener('click', () => {
            fiadoModal?.classList.add('hidden');
            newClientModal.classList.remove('hidden');
            newClientForm?.reset?.();
            setTimeout(() => document.querySelector('#new-client-name')?.focus(), 50);
        }, { signal });
    }

    if (cancelNewClientBtn) {
        cancelNewClientBtn.addEventListener('click', () => {
            newClientModal?.classList.add('hidden');
            fiadoModal?.classList.remove('hidden');
        }, { signal });
    }

    if (newClientForm) {
        newClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.querySelector('#new-client-name')?.value;
            const phone = document.querySelector('#new-client-phone')?.value;

            api.createClient({ name, phone })
                .then(newClient => {
                    state.clients.push(newClient);
                    state.clients.sort((a, b) => a.name.localeCompare(b.name));

                    newClientModal?.classList.add('hidden');
                    fiadoModal?.classList.remove('hidden');

                    if (fiadoSearch) fiadoSearch.value = name;
                    renderFiadoClients();
                })
                .catch(err => alert('Erro ao criar cliente: ' + err.message));
        }, { signal });
    }

    // ----------------------------
    // Edit customer name
    // ----------------------------
    const editNameInput = document.querySelector('#edit-customer-name');
    if (editNameInput) {
        editNameInput.addEventListener('change', (e) => {
            const newName = e.target.value;
            if (!newName || newName.trim() === '') return;

            api.updateTab(state.selectedTabId, { customer: newName.trim() })
                .then(updatedTab => {
                    const idx = state.tabs.findIndex(t => t.id === state.selectedTabId);
                    if (idx > -1) {
                        state.tabs[idx] = updatedTab;
                        render();
                    }
                })
                .catch(err => alert('Erro ao atualizar nome: ' + err.message));
        }, { signal });

        editNameInput.addEventListener('keydown', (e) => e.stopPropagation(), { signal });
    }

    // ----------------------------
    // Payment
    // ----------------------------
    const closeTabBtn = document.querySelector('#close-tab-btn');
    const paymentModal = document.querySelector('#payment-modal');
    const paymentForm = document.querySelector('#payment-form');

    const openPaymentModal = () => {
        if (!paymentModal) return;
        paymentModal.classList.remove('hidden');
        setTimeout(() => {
            const input = document.querySelector('#payment-value');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    };

    if (closeTabBtn) {
        closeTabBtn.addEventListener('click', openPaymentModal, { signal });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const valueInput = document.querySelector('#payment-value');
            const value = valueInput ? parseFloat(valueInput.value) : 0;
            if (!(value > 0)) return;

            const oldId = state.selectedTabId;

            api.updateTab(oldId, { status: 'paid', totalPaid: value, paymentMethod: 'cash' })
                .then(() => {
                    paymentModal?.classList.add('hidden');

                    // remove da lista “open”
                    state.tabs = state.tabs.filter(t => t.id !== oldId);

                    state.selectedTabId = null;
                    state.view = 'dashboard';

                    // garante lista correta
                    return api.getTabs().then(tabs => {
                        state.tabs = tabs;
                        render();
                    });
                })
                .catch(err => alert('Erro ao fechar conta: ' + err.message));
        }, { signal });

        paymentForm.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                document.querySelector('#fiado-btn')?.click();
            }
        }, { signal });
    }

    // F5 shortcut (agora sem window global)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F5' && state.view === 'detail') {
            e.preventDefault();
            document.querySelector('#close-tab-btn')?.click();
        }
    }, { signal });

    // ----------------------------
    // Quick add
    // ----------------------------
    const quickAddSearch = document.querySelector('#quick-add-search');
    const dropdown = document.querySelector('#search-results-dropdown');

    if (quickAddSearch && dropdown) {
        if (state.view === 'detail' && !state.quickAddSearch && state.detailItemIndex === -1) {
            quickAddSearch.focus();
        }

        const selectProduct = (product) => {
            state.selectedProduct = product;
            state.quickAddSearch = '';
            dropdown.classList.add('hidden');

            const modal = document.querySelector('#add-item-modal');
            if (modal) {
                document.querySelector('#item-name').value = product.name;
                document.querySelector('#item-price').value = product.price;
                document.querySelector('#item-quantity').value = 1;

                modal.classList.remove('hidden');

                setTimeout(() => {
                    const qtyInput = document.querySelector('#item-quantity');
                    if (qtyInput) {
                        qtyInput.focus();
                        qtyInput.select();
                    }
                }, 50);
            }
        };

        const renderDropdown = () => {
            if (!state.quickAddSearch) {
                dropdown.classList.add('hidden');
                return;
            }

            const searchTerm = normalizeString(state.quickAddSearch);
            const filteredProducts = state.products.filter(p =>
                normalizeString(p.name).includes(searchTerm)
            );

            if (filteredProducts.length === 0) {
                dropdown.innerHTML = '<div style="padding: 0.75rem; color: var(--color-text-muted);">Nenhum produto encontrado</div>';
                dropdown.classList.remove('hidden');
                return;
            }

            dropdown.innerHTML = filteredProducts.map((product, index) => `
        <div class="search-result-item ${index === state.quickAddSelectedIndex ? 'selected' : ''}"
             data-index="${index}"
             style="padding: 0.75rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; ${index === state.quickAddSelectedIndex ? 'background: rgba(255,255,255,0.05);' : ''}">
          <span>${product.name}</span>
          <span style="font-size: 0.9rem; color: var(--color-primary);">R$ ${parseFloat(product.price || 0).toFixed(2)}</span>
        </div>
      `).join('');

            dropdown.classList.remove('hidden');

            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectProduct(filteredProducts[parseInt(item.dataset.index)]);
                }, { signal });

                item.addEventListener('mouseover', () => {
                    state.quickAddSelectedIndex = parseInt(item.dataset.index);

                    document.querySelectorAll('.search-result-item').forEach((row, idx) => {
                        if (idx === state.quickAddSelectedIndex) {
                            row.classList.add('selected');
                            row.style.background = 'rgba(255,255,255,0.05)';
                        } else {
                            row.classList.remove('selected');
                            row.style.background = '';
                        }
                    });
                }, { signal });
            });
        };

        quickAddSearch.addEventListener('input', (e) => {
            state.quickAddSearch = e.target.value;
            state.quickAddSelectedIndex = 0;
            renderDropdown();
        }, { signal });

        quickAddSearch.addEventListener('keydown', (e) => {
            const searchTerm = normalizeString(state.quickAddSearch);
            const filteredProducts = state.products.filter(p =>
                normalizeString(p.name).includes(searchTerm)
            );

            // mover para itens quando busca vazia
            if (state.quickAddSearch === '' && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey))) {
                const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
                if (currentTab?.items?.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();

                    state.detailItemIndex = 0;
                    render();

                    document.querySelector('#quick-add-search')?.blur();
                    return;
                }
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                state.quickAddSelectedIndex = Math.min(state.quickAddSelectedIndex + 1, filteredProducts.length - 1);
                renderDropdown();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                state.quickAddSelectedIndex = Math.max(state.quickAddSelectedIndex - 1, 0);
                renderDropdown();
            } else if (e.key === 'Tab') {
                if (filteredProducts.length > 0) {
                    e.preventDefault();
                    state.quickAddSelectedIndex = e.shiftKey
                        ? Math.max(state.quickAddSelectedIndex - 1, 0)
                        : Math.min(state.quickAddSelectedIndex + 1, filteredProducts.length - 1);
                    renderDropdown();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const product = filteredProducts[state.quickAddSelectedIndex];
                if (product) selectProduct(product);
            } else if (e.key === 'Escape') {
                state.quickAddSearch = '';
                renderDropdown();
                quickAddSearch.blur();
            }
        }, { signal });
    }

    // ----------------------------
    // Add item modal
    // ----------------------------
    const modal = document.querySelector('#add-item-modal');
    const addBtn = document.querySelector('#add-item-btn');
    const cancelBtn = document.querySelector('#cancel-modal-btn');
    const form = document.querySelector('#add-item-form');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => modal.classList.remove('hidden'), { signal });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => modal.classList.add('hidden'), { signal });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            if (!currentTab || !state.selectedProduct) return;

            const price = parseFloat(document.querySelector('#item-price').value);
            const quantity = parseInt(document.querySelector('#item-quantity').value);

            api.addTabItem(currentTab.id, {
                productId: state.selectedProduct.id,
                name: state.selectedProduct.name,
                price,
                quantity
            })
                .then(() => api.getTabById(currentTab.id))
                .then(updatedTab => {
                    const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                    if (idx > -1) state.tabs[idx] = updatedTab;

                    document.querySelector('#add-item-modal')?.classList.add('hidden');
                    state.selectedProduct = null;
                    render();
                })
                .catch(err => alert('Erro ao adicionar item: ' + err.message));
        }, { signal });
    }

    // ----------------------------
    // Edit item modal
    // ----------------------------
    const editModal = document.querySelector('#edit-item-modal');
    const editForm = document.querySelector('#edit-item-form');
    const cancelEditBtn = document.querySelector('#cancel-edit-modal-btn');
    const itemOptionsBtns = document.querySelectorAll('.item-options-btn');

    itemOptionsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            const item = currentTab?.items?.[index];
            if (!item) return;

            document.querySelector('#edit-item-index').value = index;
            document.querySelector('#edit-item-name').value = item.name;
            document.querySelector('#edit-item-price').value = item.price;
            document.querySelector('#edit-item-quantity').value = item.quantity;

            editModal?.classList.remove('hidden');

            setTimeout(() => {
                const qty = document.querySelector('#edit-item-quantity');
                if (qty) {
                    qty.focus();
                    qty.select();
                }
            }, 50);
        }, { signal });
    });

    if (cancelEditBtn && editModal) {
        cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'), { signal });
    }

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            const index = parseInt(document.querySelector('#edit-item-index').value);
            const item = currentTab?.items?.[index];
            if (!currentTab || !item) return;

            const price = parseFloat(document.querySelector('#edit-item-price').value);
            const quantity = parseInt(document.querySelector('#edit-item-quantity').value);

            api.updateTabItem(currentTab.id, item.id, { price, quantity })
                .then(() => api.getTabById(currentTab.id))
                .then(updatedTab => {
                    const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                    if (idx > -1) state.tabs[idx] = updatedTab;
                    document.querySelector('#edit-item-modal')?.classList.add('hidden');
                    render();
                })
                .catch(err => alert('Erro ao editar item: ' + err.message));
        }, { signal });
    }

    // ----------------------------
    // Remove item buttons
    // ----------------------------
    const itemRemoveBtns = document.querySelectorAll('.item-remove-btn');
    itemRemoveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            const item = currentTab?.items?.[index];
            if (!currentTab || !item) return;

            if (!confirm(`Remover ${item.name}?`)) return;

            api.deleteTabItem(currentTab.id, item.id)
                .then(() => api.getTabById(currentTab.id))
                .then(updatedTab => {
                    const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                    if (idx > -1) state.tabs[idx] = updatedTab;
                    render();
                })
                .catch(err => alert('Erro ao remover item: ' + err.message));
        }, { signal });
    });

    // ----------------------------
    // Row click selection
    // ----------------------------
    const rows = document.querySelectorAll('.tab-item-row');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon')) return;
            const index = parseInt(row.dataset.index);
            state.detailItemIndex = index;
            render();
        }, { signal });
    });
}