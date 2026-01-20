import * as api from '../services/api.js';
import { normalizeString } from '../utils/helpers.js';

export function attachDetailEvents(state, render) {
    const backBtn = document.querySelector('#back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            state.selectedTabId = null;
            state.view = 'dashboard';
            render();
        });
    }

    const deleteDetailBtn = document.querySelector('#delete-tab-detail-btn');
    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', () => {
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            if (currentTab && confirm(`Deseja excluir a comanda #${currentTab.id} de ${currentTab.customer}?`)) {
                api.deleteTab(currentTab.id)
                    .then(() => {
                        state.selectedTabId = null;
                        state.view = 'dashboard';
                        state.tabs = state.tabs.filter(t => t.id !== currentTab.id);
                        render();
                    })
                    .catch(err => alert('Erro ao excluir comanda: ' + err.message));
            }
        });
    }

    // Fiado Logic (Modal trigger from Detail View)
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
            <div class="fiado-client-row" data-id="${client.id}" style="padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between;">
                <span style="font-weight: 500;">${client.name}</span>
                <span style="color: var(--color-text-muted); font-size: 0.9rem;">${client.phone || ''}</span>
            </div>
        `).join('');

        fiadoList.querySelectorAll('.fiado-client-row').forEach(row => {
            row.addEventListener('click', () => {
                const clientId = row.dataset.id;
                const client = state.clients.find(c => c.id == clientId);
                if (client && confirm(`Confirmar Fiado para ${client.name}?`)) {
                    api.updateTab(state.selectedTabId, { status: 'closed', paymentMethod: 'fiado', clientId: client.id })
                        .then(() => {
                            fiadoModal.classList.add('hidden');
                            const oldId = state.selectedTabId;
                            state.selectedTabId = null;
                            state.view = 'dashboard';
                            state.tabs = state.tabs.filter(t => t.id !== oldId);
                            // Refresh clients to update debt
                            api.getClients().then(clients => {
                                state.clients = clients;
                                render();
                            });
                        })
                        .catch(err => alert('Erro ao finalizar fiado: ' + err.message));
                }
            });
        });
    };

    if (fiadoBtn && fiadoModal) {
        fiadoBtn.addEventListener('click', () => {
            document.querySelector('#payment-modal').classList.add('hidden');
            fiadoModal.classList.remove('hidden');
            renderFiadoClients();
            setTimeout(() => fiadoSearch && fiadoSearch.focus(), 50);
        });
    }

    if (cancelFiadoBtn) {
        cancelFiadoBtn.addEventListener('click', () => {
            fiadoModal.classList.add('hidden');
            document.querySelector('#payment-modal').classList.remove('hidden');
        });
    }

    if (fiadoSearch) {
        fiadoSearch.addEventListener('input', renderFiadoClients);
    }

    if (openNewClientBtn && newClientModal) {
        openNewClientBtn.addEventListener('click', () => {
            fiadoModal.classList.add('hidden');
            newClientModal.classList.remove('hidden');
            if (newClientForm) newClientForm.reset();
            setTimeout(() => document.querySelector('#new-client-name').focus(), 50);
        });
    }

    if (cancelNewClientBtn) {
        cancelNewClientBtn.addEventListener('click', () => {
            newClientModal.classList.add('hidden');
            fiadoModal.classList.remove('hidden');
        });
    }

    if (newClientForm) {
        newClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.querySelector('#new-client-name').value;
            const phone = document.querySelector('#new-client-phone').value;

            api.createClient({ name, phone })
                .then(newClient => {
                    state.clients.push(newClient);
                    state.clients.sort((a, b) => a.name.localeCompare(b.name));
                    newClientModal.classList.add('hidden');
                    fiadoModal.classList.remove('hidden');
                    if (fiadoSearch) fiadoSearch.value = name;
                    renderFiadoClients();
                })
                .catch(err => alert('Erro ao criar cliente: ' + err.message));
        });
    }

    // Editable Customer Name Logic
    const editNameInput = document.querySelector('#edit-customer-name');
    if (editNameInput) {
        editNameInput.addEventListener('change', (e) => {
            const newName = e.target.value;
            if (newName && newName.trim() !== '') {
                api.updateTab(state.selectedTabId, { customer: newName.trim() })
                    .then(updatedTab => {
                        const idx = state.tabs.findIndex(t => t.id === state.selectedTabId);
                        if (idx > -1) {
                            state.tabs[idx] = updatedTab;
                            render(); // Update name in header
                        }
                    })
                    .catch(err => alert('Erro ao atualizar nome: ' + err.message));
            }
        });
        // Stop bubbling so global keys don't trigger while typing
        editNameInput.addEventListener('keydown', (e) => e.stopPropagation());
    }

    // Close Tab / Payment Logic
    const closeTabBtn = document.querySelector('#close-tab-btn');
    const paymentModal = document.querySelector('#payment-modal');
    const paymentForm = document.querySelector('#payment-form');
    const confirmPaymentBtn = document.querySelector('#confirm-payment-btn');

    const openPaymentModal = () => {
        if (paymentModal) {
            paymentModal.classList.remove('hidden');
            setTimeout(() => {
                const input = document.querySelector('#payment-value');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        }
    };

    if (closeTabBtn) {
        closeTabBtn.addEventListener('click', openPaymentModal);
    }

    // Handle Payment Submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const valueInput = document.querySelector('#payment-value');
            const value = valueInput ? parseFloat(valueInput.value) : 0;

            if (value > 0) {
                api.updateTab(state.selectedTabId, { status: 'paid', totalPaid: value, paymentMethod: 'cash' }) // simple cash close
                    .then(() => {
                        paymentModal.classList.add('hidden');
                        state.selectedTabId = null;
                        state.view = 'dashboard';
                        // Ideally we should move it to history, but for now just close/filter it
                        state.tabs = state.tabs.filter(t => t.id !== state.selectedTabId);
                        // Re-fetch to be sure or just render
                        return api.getTabs().then(tabs => {
                            state.tabs = tabs;
                            render();
                        });
                    })
                    .catch(err => alert('Erro ao fechar conta: ' + err.message));
            }
        });

        // F Key shortcut for Fiado
        paymentForm.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                const fiadoButton = document.querySelector('#fiado-btn');
                if (fiadoButton) fiadoButton.click();
            }
        });
    }

    // F5 Shortcut for this view
    // Better implementation for F5 (one-time or check view)
    // We'll stick to attaching it here but it's tricky with re-renders.
    // A safer way for this specific app structure might be adding a specific check in the existing global listener in main.js
    // OR just checking if the element exists and is visible here.

    // Let's modify the document listener to be cleaner or add a check
    // Actually, let's just add the logic to the button click and let the user press the button or we add a specific global listener in main.js for F5 that triggers the specific action based on view.
    // But since I can only edit this file easily now, let's add a named function causing less issues if replaced?
    // No, standard `addEventListener` duplicates. 

    // Let's just implement the button click here. And allow main.js to handle F5 if we add it there?
    // The user explicitely said "F5 closes", so it expects the shortcut.
    // The previous implementation likely had F5 as refresh or something?
    // I will add the F5 handler here but safeguard it.

    if (!window.detailF5Handler) {
        window.detailF5Handler = (e) => {
            if (e.key === 'F5' && state.view === 'detail') {
                e.preventDefault();
                const btn = document.querySelector('#close-tab-btn');
                if (btn) btn.click();
            } else if (e.key === 'f' && state.view === 'detail') {
                // Open Fiado directly? Or just focus modal button if open?
                // The requested shortcut was just closing.
            }
        };
        document.addEventListener('keydown', window.detailF5Handler);
    }

    // Quick Add Logic
    const quickAddSearch = document.querySelector('#quick-add-search');
    const dropdown = document.querySelector('#search-results-dropdown');

    if (quickAddSearch && dropdown) {
        // Auto-focus on load (only if no item selected)
        if (state.view === 'detail' && !state.quickAddSearch && state.detailItemIndex === -1) {
            quickAddSearch.focus();
        }

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

            // Click events for items
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectProduct(filteredProducts[parseInt(item.dataset.index)]);
                });
                // Add hover effect via JS since we're using inline styles heavily and need to track selection state
                item.addEventListener('mouseover', () => {
                    state.quickAddSelectedIndex = parseInt(item.dataset.index);
                    renderDropdown(); // Re-render to update selection style
                });
            });
        };

        const selectProduct = (product) => {
            state.quickAddSearch = '';
            dropdown.classList.add('hidden');

            // Open Add Modal populated
            const modal = document.querySelector('#add-item-modal');
            if (modal) {
                document.querySelector('#item-name').value = product.name;
                document.querySelector('#item-price').value = product.price;
                document.querySelector('#item-quantity').value = 1;

                modal.classList.remove('hidden');

                // Focus quantity for quick edit, or just hit enter again to submit
                setTimeout(() => {
                    const qtyInput = document.querySelector('#item-quantity');
                    if (qtyInput) {
                        qtyInput.focus();
                        qtyInput.select();
                    }
                }, 50);
            }
        };

        quickAddSearch.addEventListener('input', (e) => {
            state.quickAddSearch = e.target.value;
            state.quickAddSelectedIndex = 0;
            renderDropdown();
        });

        quickAddSearch.addEventListener('keydown', (e) => {
            const searchTerm = normalizeString(state.quickAddSearch);
            const filteredProducts = state.products.filter(p =>
                normalizeString(p.name).includes(searchTerm)
            );

            // Item Navigation (When search is empty)
            if (state.quickAddSearch === '' && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey))) {
                const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
                if (currentTab && currentTab.items && currentTab.items.length > 0) {
                    // Prevent default to avoid focus issues
                    // But if we preventDefault, we lose 'Tab' native behavior if we wanted it.
                    // Here we specifically want to move focus or logical selection
                    if (e.key === 'ArrowDown') e.preventDefault();
                    if (e.key === 'Tab') e.preventDefault();

                    e.stopPropagation(); // Prevent global listener from firing immediately

                    state.detailItemIndex = 0;
                    render();

                    const input = document.querySelector('#quick-add-search');
                    if (input) input.blur();
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
                    if (e.shiftKey) {
                        state.quickAddSelectedIndex = Math.max(state.quickAddSelectedIndex - 1, 0);
                    } else {
                        state.quickAddSelectedIndex = Math.min(state.quickAddSelectedIndex + 1, filteredProducts.length - 1);
                    }
                    renderDropdown();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredProducts.length > 0 && filteredProducts[state.quickAddSelectedIndex]) {
                    const product = filteredProducts[state.quickAddSelectedIndex];
                    // Save product metadata for modal population
                    state.selectedProduct = product;
                    selectProduct(product);
                }
            } else if (e.key === 'Escape') {
                state.quickAddSearch = '';
                renderDropdown();
                quickAddSearch.blur();
            }
        });
    }

    // Modal Logic
    const modal = document.querySelector('#add-item-modal');
    const addBtn = document.querySelector('#add-item-btn');
    const cancelBtn = document.querySelector('#cancel-modal-btn');
    const form = document.querySelector('#add-item-form');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            if (currentTab && state.selectedProduct) {
                const price = parseFloat(document.querySelector('#item-price').value);
                const quantity = parseInt(document.querySelector('#item-quantity').value);

                api.addTabItem(currentTab.id, {
                    productId: state.selectedProduct.id,
                    name: state.selectedProduct.name,
                    price,
                    quantity
                })
                    .then(() => {
                        // Refresh Tab
                        return api.getTabById(currentTab.id);
                    })
                    .then(updatedTab => {
                        const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                        if (idx > -1) state.tabs[idx] = updatedTab;

                        document.querySelector('#add-item-modal').classList.add('hidden');
                        state.selectedProduct = null;
                        render();
                    })
                    .catch(err => alert('Erro ao adicionar item: ' + err.message));
            }
        });
    }

    // Edit Item Modal Logic
    const editModal = document.querySelector('#edit-item-modal');
    const editForm = document.querySelector('#edit-item-form');
    const cancelEditBtn = document.querySelector('#cancel-edit-modal-btn');
    const itemOptionsBtns = document.querySelectorAll('.item-options-btn');

    if (itemOptionsBtns) {
        itemOptionsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
                if (currentTab && currentTab.items[index]) {
                    const item = currentTab.items[index];

                    document.querySelector('#edit-item-index').value = index;
                    document.querySelector('#edit-item-name').value = item.name;
                    document.querySelector('#edit-item-price').value = item.price;
                    document.querySelector('#edit-item-quantity').value = item.quantity;

                    editModal.classList.remove('hidden');
                    // Auto-focus quantity
                    setTimeout(() => {
                        const qty = document.querySelector('#edit-item-quantity');
                        if (qty) {
                            qty.focus();
                            qty.select();
                        }
                    }, 50);
                }
            });
        });
    }

    if (cancelEditBtn && editModal) {
        cancelEditBtn.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            const index = parseInt(document.querySelector('#edit-item-index').value);

            if (currentTab && currentTab.items[index]) {
                const item = currentTab.items[index];
                const price = parseFloat(document.querySelector('#edit-item-price').value);
                const quantity = parseInt(document.querySelector('#edit-item-quantity').value);

                api.updateTabItem(currentTab.id, item.id, { price, quantity })
                    .then(() => api.getTabById(currentTab.id))
                    .then(updatedTab => {
                        const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                        if (idx > -1) state.tabs[idx] = updatedTab;
                        document.querySelector('#edit-item-modal').classList.add('hidden');
                        render();
                    })
                    .catch(err => alert('Erro ao editar item: ' + err.message));
            }
        });
    }

    // Remove Item Logic
    const itemRemoveBtns = document.querySelectorAll('.item-remove-btn');
    if (itemRemoveBtns) {
        itemRemoveBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
                if (currentTab && currentTab.items[index]) {
                    if (confirm(`Remover ${currentTab.items[index].name}?`)) {
                        api.deleteTabItem(currentTab.id, currentTab.items[index].id)
                            .then(() => api.getTabById(currentTab.id))
                            .then(updatedTab => {
                                const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                                if (idx > -1) state.tabs[idx] = updatedTab;
                                render();
                            })
                            .catch(err => alert('Erro ao remover item: ' + err.message));
                    }
                }
            });
        });
    }

    // Row click selection
    const rows = document.querySelectorAll('.tab-item-row');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't select if clicking buttons
            if (e.target.closest('.btn-icon')) return;

            const index = parseInt(row.dataset.index);
            state.detailItemIndex = index;
            render();
        });
    });


}
