import './style.css'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { TabDetail } from './components/TabDetail'
import { ClientList } from './components/ClientList'
import { ProductList } from './components/ProductList'
import { FiadoControl } from './components/FiadoControl'
import { HistoryList } from './components/HistoryList'
import * as api from './services/api'
// import socketService from './services/socket' // Removed socket service

const app = document.querySelector('#app');

// State Management
let state = {
    view: 'dashboard',
    selectedTabId: null,
    searchTerm: '',
    selectedIndex: 0,
    quickAddSearch: '',
    quickAddSelectedIndex: 0,
    fiadoSelectedClientId: null,
    detailItemIndex: -1,
    tabs: [],
    products: [],
    clients: [],
    historyTabs: [],
    historyFilters: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        customer: '',
        clientId: ''
    }
};

// Helper: Normalize string (remove accents)
function normalizeString(str) {
    if (!str) return '';
    return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Helper: Get filtered tabs based on search term
function getFilteredTabs() {
    // Only show open tabs in dashboard
    const openTabs = state.tabs.filter(t => t.status === 'open');
    if (!state.searchTerm) return openTabs;
    const term = normalizeString(state.searchTerm);
    return openTabs.filter(tab =>
        normalizeString(tab.customer).includes(term) ||
        tab.id.toString().includes(state.searchTerm)
    );
}

// Main Render Function
function render() {
    const sidebarHtml = Sidebar();
    let contentHtml = '';

    if (state.view === 'dashboard') {
        const filteredTabs = getFilteredTabs();
        contentHtml = Dashboard({ tabs: filteredTabs, searchTerm: state.searchTerm, selectedIndex: state.selectedIndex });
    } else if (state.view === 'detail') {
        const tab = state.tabs.find(t => t.id === state.selectedTabId) || state.historyTabs.find(t => t.id === state.selectedTabId);
        if (tab) {
            contentHtml = TabDetail(tab, state.detailItemIndex);
        } else {
            state.view = 'dashboard';
            const filteredTabs = getFilteredTabs();
            contentHtml = Dashboard({ tabs: filteredTabs, searchTerm: state.searchTerm, selectedIndex: state.selectedIndex });
        }
    } else if (state.view === 'clients') {
        contentHtml = ClientList({ clients: state.clients });
    } else if (state.view === 'products') {
        contentHtml = ProductList({ products: state.products });
    } else if (state.view === 'fiado') {
        contentHtml = FiadoControl({ clients: state.clients, activeTabs: state.tabs, selectedClientId: state.fiadoSelectedClientId });
    } else if (state.view === 'history') {
        contentHtml = HistoryList({ historyTabs: state.historyTabs, clients: state.clients, filters: state.historyFilters });
    }

    // Combine Layout
    app.innerHTML = `
    ${sidebarHtml}
    <div id="main-content">
      ${contentHtml}
    </div>
  `;

    // Attach Events
    attachSidebarEvents();
    if (state.view === 'dashboard') attachDashboardEvents();
    if (state.view === 'detail') attachDetailEvents();
    if (state.view === 'products') attachProductEvents();
    if (state.view === 'clients') attachClientEvents();
    if (state.view === 'fiado') attachFiadoEvents();
    if (state.view === 'history') attachHistoryEvents();

    // Maintain focus on search input if it exists
    if (state.view === 'dashboard') {
        const searchInput = document.querySelector('#search-comanda');
        if (searchInput) {
            // Restore cursor position if needed (simple focus for now)
            searchInput.focus();
            // Move cursor to end
            const value = searchInput.value;
            searchInput.value = '';
            searchInput.value = value;
        }
    }
}

// Global Keyboard Listener
document.addEventListener('keydown', (e) => {
    // F6: New Comanda
    if (e.key === 'F6') {
        e.preventDefault();
        const newTabModal = document.querySelector('#new-tab-modal');
        if (newTabModal) {
            newTabModal.classList.remove('hidden');
            const input = newTabModal.querySelector('#new-tab-customer');
            if (input) {
                input.focus();
            }
        }
        return;
    }

    // F5: Finalizar Comanda
    if (e.key === 'F5') {
        e.preventDefault();
        if (state.view === 'detail') {
            const paymentModal = document.querySelector('#payment-modal');
            if (paymentModal) {
                paymentModal.classList.remove('hidden');
                // Focus on Confirm button for quick Enter
                setTimeout(() => {
                    document.querySelector('#confirm-payment-btn').focus();
                }, 50);
            }
        }
        return;
    }

    // F key for Fiado (only when payment modal is open)
    if (e.key.toLowerCase() === 'f') {
        const paymentModal = document.querySelector('#payment-modal:not(.hidden)');
        if (paymentModal) {
            e.preventDefault();
            document.querySelector('#fiado-btn').click();
            return;
        }
    }

    // ESC: Back / Close Modal
    if (e.key === 'Escape') {
        e.preventDefault();

        // Check for modals first
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
            openModal.classList.add('hidden');
            return;
        }

        if (state.view === 'detail') {
            state.selectedTabId = null;
            state.view = 'dashboard';
            render();
            return;
        }

        if (state.view === 'dashboard' && state.searchTerm) {
            state.searchTerm = '';
            state.selectedIndex = 0;
            render();
            return;
        }
    }

    // History Escape
    if (state.view === 'history') {
        // Optional: clear filters or go back to dashboard?
        // state.view = 'dashboard';
        // render();
        return;
    }

    if (e.defaultPrevented && e.key !== 'Escape') return;

    // Detail View Item Navigation (When input not focused)
    if (state.view === 'detail' && state.detailItemIndex !== -1) {
        const quickAddSearch = document.querySelector('#quick-add-search');
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        const activeElement = document.activeElement;

        if (activeElement !== quickAddSearch && !openModal) {
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);

            if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                // Arrow Up = Previous Item (Index Decrease)
                if (state.detailItemIndex === 0) {
                    state.detailItemIndex = -1;
                    render();
                    if (quickAddSearch) quickAddSearch.focus();
                    return;
                }
                state.detailItemIndex = Math.max(state.detailItemIndex - 1, 0);
                render();
                return;
            }

            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                // Arrow Down = Next Item (Index Increase)
                if (currentTab) {
                    const items = currentTab.items || [];
                    if (items.length === 0) return;

                    // Check if we are at the bottom (oldest item, max index)
                    if (state.detailItemIndex >= items.length - 1) {
                        // Loop to top or stop? Usually stop or go to input?
                        state.detailItemIndex = Math.min(state.detailItemIndex + 1, items.length - 1);
                    } else {
                        state.detailItemIndex = Math.min(state.detailItemIndex + 1, items.length - 1);
                    }
                    render();
                }
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentTab) {
                    const item = (currentTab.items || [])[state.detailItemIndex];
                    if (item) {
                        const editModal = document.querySelector('#edit-item-modal');
                        if (editModal) {
                            document.querySelector('#edit-item-index').value = state.detailItemIndex;
                            document.querySelector('#edit-item-name').value = item.name;
                            document.querySelector('#edit-item-price').value = item.price;
                            document.querySelector('#edit-item-quantity').value = item.quantity;

                            editModal.classList.remove('hidden');
                            setTimeout(() => {
                                const qty = document.querySelector('#edit-item-quantity');
                                if (qty) {
                                    qty.focus();
                                    qty.select();
                                }
                            }, 50);
                        }
                    }
                }
                return;
            }

            if (e.key === 'Delete') {
                e.preventDefault();
                // Trigger removal
                if (currentTab) {
                    const item = currentTab.items[state.detailItemIndex];
                    if (item && confirm(`Remover ${item.name}?`)) {
                        api.deleteTabItem(currentTab.id, item.id)
                            .catch(err => alert('Erro ao remover item: ' + err.message));
                        // Local update will happen via Socket.io
                    }
                }
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                state.detailItemIndex = -1;
                render();
                if (quickAddSearch) quickAddSearch.focus();
                return;
            }
        }
    }

    // Dashboard Navigation (Arrows / Enter / Tab)
    if (state.view === 'dashboard') {
        const searchInput = document.querySelector('#search-comanda');
        const activeElement = document.activeElement;

        // Auto-focus Search Logic
        // Auto-focus Search Logic
        if (searchInput && activeElement !== searchInput &&
            !document.querySelector('.modal-overlay:not(.hidden)') &&
            !e.ctrlKey && !e.altKey && !e.metaKey &&
            e.key.length === 1) { // Single char keys
            searchInput.focus();
            // Note: Preventing default here might stop the char from being typed if we focused late,
            // but usually valid for typing. We let it pass through.
            return;
        }

        const filteredTabs = getFilteredTabs();

        const maxIndex = filteredTabs.length - 1;

        // Shortcuts (F2, F5) - handled before navigation processing to ensure priority
        if (maxIndex >= 0) {
            if (e.key === 'F2') {
                e.preventDefault();
                const selectedTab = filteredTabs[state.selectedIndex];
                if (selectedTab) {
                    const newName = prompt('Renomear cliente:', selectedTab.customer);
                    if (newName && newName.trim() !== '') {
                        api.updateTab(selectedTab.id, { customer: newName.trim() })
                            .then(() => {
                                // Optimistic update
                                // render triggered by socket or re-fetch loop usually
                            })
                            .catch(err => alert('Erro ao renomear: ' + err.message));
                    }
                }
                return;
            }
            if (e.key === 'F5') {
                e.preventDefault();
                const selectedTab = filteredTabs[state.selectedIndex];
                if (selectedTab) {
                    if (confirm(`Fechar conta de ${selectedTab.customer}? Total: R$ ${parseFloat(selectedTab.total || 0).toFixed(2)}`)) {
                        api.updateTab(selectedTab.id, { status: 'closed' })
                            .then(() => {
                                state.tabs = state.tabs.filter(t => t.id !== selectedTab.id);
                                render();
                            })
                            .catch(err => alert('Erro ao fechar comanda: ' + err.message));
                    }
                }
                return;
            }

            if (document.querySelector('.modal-overlay:not(.hidden)')) return;

            if (e.key === 'ArrowDown' || e.key === 'Tab') {
                e.preventDefault(); // Prevent tab from leaving the area if we want to trap selection
                state.selectedIndex = Math.min(state.selectedIndex + 1, maxIndex);
                render();
            } else if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
                e.preventDefault();
                state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
                render();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedTab = filteredTabs[state.selectedIndex];
                if (selectedTab) {
                    state.selectedTabId = selectedTab.id;
                    state.selectedTabId = selectedTab.id;
                    state.view = 'detail';
                    state.detailItemIndex = -1;
                    render();
                }
            }
        } else {
            // If maxIndex < 0 (no tabs), F5 might still be pressed? No, we need a selection.
        }
    }
});

// Event Attachment Functions
function attachSidebarEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        // Set active state styling
        if (item.dataset.nav === state.view || (state.view === 'detail' && item.dataset.nav === 'dashboard')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }

        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.nav;
            if (view) {
                state.view = view;
                state.selectedTabId = null; // Clear detail selection on nav switch
                if (view !== 'dashboard') state.searchTerm = ''; // Create clean slate when leaving dashboard? Optional.
                if (view !== 'dashboard') state.searchTerm = '';

                // Load history if switched to history
                if (view === 'history') {
                    fetchHistory();
                } else {
                    render();
                }
            }
        });
    });

    // Collapsible Logic
    const collapsibleTitles = document.querySelectorAll('.nav-group.collapsible .nav-group-title');
    collapsibleTitles.forEach(title => {
        title.addEventListener('click', (e) => {
            e.preventDefault();
            const group = title.closest('.nav-group');
            const content = group.querySelector('.nav-group-content');
            const arrow = title.querySelector('.arrow');

            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });
}


function attachDashboardEvents() {
    const tabCards = document.querySelectorAll('.tab-card');
    console.log('attachDashboardEvents called. Found cards:', tabCards.length); // Debug

    tabCards.forEach(card => {
        card.addEventListener('click', (e) => {
            console.log('Click detected on card. Raw ID:', card.dataset.id); // Debug

            // Check if clicking delete button
            if (e.target.closest('.delete-tab-btn')) {
                console.log('Clicked delete button'); // Debug
                e.stopPropagation();
                const id = parseInt(card.dataset.id);
                if (confirm(`Deseja excluir a comanda #${id}?`)) {
                    api.deleteTab(id)
                        .then(() => {
                            // Optimistic update
                            state.tabs = state.tabs.filter(t => t.id !== id);
                            render();
                        })
                        .catch(err => alert('Erro ao excluir comanda: ' + err.message));
                }
                return;
            }

            const id = parseInt(card.dataset.id);
            if (!isNaN(id)) {
                console.log('Opening comanda:', id); // Verification log
                state.selectedTabId = id;
                state.view = 'detail';
                state.detailItemIndex = -1; // Reset item selection
                render();
            } else {
                console.error('Invalid ID parsed:', id); // Debug
            }
        });

        // Hover to select (improves F2/F5 usability)
        card.addEventListener('mouseenter', () => {
            // Find index of this card in filtered list
            const filtered = getFilteredTabs();
            const index = filtered.findIndex(t => t.id === parseInt(card.dataset.id));
            if (index !== -1 && index !== state.selectedIndex) {
                state.selectedIndex = index;

                // Manually update visuals to avoid re-render (which breaks click events)
                document.querySelectorAll('.tab-card').forEach(c => {
                    c.style.border = ''; // Reset to CSS default
                    c.style.boxShadow = '';
                    c.style.transform = '';
                });

                // Apply active style
                card.style.border = '2px solid var(--color-primary)';
                card.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)'; // Assuming primary-rgb match or close enough
                card.style.transform = 'translateY(-2px)';
            }
        });
    });

    const searchInput = document.querySelector('#search-comanda');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value;
            state.selectedIndex = 0; // Reset selection on search
            render();
        });
    }

    const newTabBtn = document.querySelector('#new-tab-btn');
    const modal = document.querySelector('#new-tab-modal');
    const form = document.querySelector('#new-tab-form');
    const cancelBtn = document.querySelector('#cancel-new-tab-modal');

    // Cleaned up misplaced code

    if (newTabBtn && modal) {
        newTabBtn.addEventListener('click', () => {
            form.reset();
            modal.classList.remove('hidden');
            const input = modal.querySelector('#new-tab-customer');
            if (input) setTimeout(() => input.focus(), 50);
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
            const customer = document.querySelector('#new-tab-customer').value;
            if (customer) {
                api.createTab({ customer })
                    .then(newTab => {
                        modal.classList.add('hidden');
                        state.tabs.unshift(newTab); // Add to local state
                        state.selectedTabId = newTab.id;
                        state.view = 'detail';
                        state.detailItemIndex = -1;
                        render();
                    })
                    .catch(err => alert('Erro ao criar comanda: ' + err.message));
            }
        });
    }
}

function attachDetailEvents() {
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
                        // Remove from local state
                        state.tabs = state.tabs.filter(t => t.id !== currentTab.id);
                        // Fiado/New Client Logic (Moved to correct scope)
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
                                                render();
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
                        render();
                    })
                    .catch(err => alert('Erro ao excluir comanda: ' + err.message));
            }
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
        editNameInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
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
            if (state.quickAddSearch === '' && (e.key === 'ArrowDown' || e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                e.stopPropagation(); // Prevent global listener from firing immediately
                const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
                if (currentTab && currentTab.items && currentTab.items.length > 0) {
                    // Select newest item (first in array since we order by addedAt desc in backend)
                    state.detailItemIndex = 0;
                    render();
                    // quickAddSearch.blur(); // No longer needed if we stop prop, but good for safety. 
                    // Actually, if we keep focus, global listener won't fire next time (because of activeElement check).
                    // So we MUST blur to transfer control to global listener.
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
                    e.preventDefault(); // Only prevent default if we have items to navigate
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
                const currentTab = activeTabs.find(t => t.id === state.selectedTabId);
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

    const closeBtn = document.querySelector('#close-tab-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            if (currentTab && confirm(`Deseja fechar a conta de ${currentTab.customer}? Total: R$ ${parseFloat(currentTab.total).toFixed(2)}`)) {
                api.updateTab(currentTab.id, { status: 'paid' })
                    .then(() => {
                        alert('Conta fechada com sucesso!');
                        const oldId = state.selectedTabId;
                        state.selectedTabId = null;
                        state.view = 'dashboard';
                        state.tabs = state.tabs.filter(t => t.id !== oldId);
                        render();
                    })
                    .catch(err => alert('Erro ao fechar conta: ' + err.message));
            }
        });
    }
    // Payment & Fiado Model Events
    const paymentForm = document.querySelector('#payment-form');
    const fiadoBtn = document.querySelector('#fiado-btn');
    const fiadoModal = document.querySelector('#fiado-modal');
    const paymentModal = document.querySelector('#payment-modal');

    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            if (currentTab) {
                api.updateTab(currentTab.id, { status: 'paid' })
                    .then(() => {
                        alert(`Pagamento realizado com sucesso! Comanda #${currentTab.id} fechada.`);
                        const oldId = state.selectedTabId;
                        state.selectedTabId = null;
                        state.view = 'dashboard';
                        state.tabs = state.tabs.filter(t => t.id !== oldId);
                        render();
                    })
                    .catch(err => alert('Erro ao processar pagamento: ' + err.message));
            }
        });
    }

    if (fiadoBtn && fiadoModal && paymentModal) {
        fiadoBtn.addEventListener('click', () => {
            paymentModal.classList.add('hidden');
            fiadoModal.classList.remove('hidden');

            // Render Clients
            const container = document.querySelector('#fiado-client-list-container');
            const searchInput = document.querySelector('#fiado-search-input');

            const renderClientsForFiado = (filter = '') => {
                const filtered = state.clients.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

                container.innerHTML = filtered.map(client => `
                    <div class="fiado-selection-item" data-id="${client.id}" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 500;">${client.name}</span>
                        <span style="font-size: 0.85rem; color: var(--color-text-muted);">${client.phone}</span>
                    </div>
                `).join('');

                container.querySelectorAll('.fiado-selection-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const client = state.clients.find(c => c.id === parseInt(item.dataset.id));
                        const currentTab = state.tabs.find(t => t.id === state.selectedTabId);

                        if (client && currentTab) {
                            if (confirm(`Passar comanda #${currentTab.id} para ${client.name}?`)) {
                                api.updateTab(currentTab.id, {
                                    customer: client.name,
                                    clientId: client.id
                                })
                                    .then(() => {
                                        alert(`Comanda transferida para ${client.name} (Fiado)`);
                                        fiadoModal.classList.add('hidden');
                                        const oldId = state.selectedTabId;
                                        // If we are in detail view, close it
                                        state.selectedTabId = null;
                                        state.view = 'dashboard';
                                        state.tabs = state.tabs.filter(t => t.id !== oldId);
                                        render();
                                    })
                                    .catch(err => alert('Erro ao transferir comanda: ' + err.message));
                            }
                        }
                    });
                });
            };

            renderClientsForFiado();

            if (searchInput) {
                searchInput.focus();
                searchInput.addEventListener('input', (e) => renderClientsForFiado(e.target.value));
            }
        });
    }

    const cancelFiadoBtn = document.querySelector('#cancel-fiado-btn');
    if (cancelFiadoBtn) {
        cancelFiadoBtn.addEventListener('click', () => {
            fiadoModal.classList.add('hidden');
        });
    }
}

function attachFiadoEvents() {
    const clientItems = document.querySelectorAll('.fiado-client-item');
    clientItems.forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            state.fiadoSelectedClientId = id;
            render();
        });
    });
}

function attachProductEvents() {
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
                .then((savedProduct) => { // Assuming returns product
                    api.getProducts().then(products => { // safely refetch or push
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

function attachClientEvents() {
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



function fetchHistory() {
    const { startDate, endDate, customer, clientId } = state.historyFilters;

    // Build query params
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    // Fetch all (or filtered by date) and filter in memory since API status support is unsure
    api.getTabs(filters)
        .then(tabs => {
            let relevant = tabs.filter(t =>
                (t.status === 'closed' || t.status === 'deleted' || t.deletedAt !== null)
            );

            // Apply Date Filter Client Side (safe fallback)
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                relevant = relevant.filter(t => new Date(t.updatedAt || t.createdAt) >= start);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                relevant = relevant.filter(t => new Date(t.updatedAt || t.createdAt) <= end);
            }

            // Apply Text Filters
            if (customer) {
                relevant = relevant.filter(t => normalizeString(t.customer).includes(normalizeString(customer)));
            }
            if (clientId) {
                relevant = relevant.filter(t => t.clientId == clientId);
            }

            // Sort by date desc
            relevant.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

            state.historyTabs = relevant;
            render();
        })
        .catch(err => {
            console.error('History fetch error:', err);
            state.historyTabs = [];
            render();
        });
}

function attachHistoryEvents() {
    const dateStart = document.querySelector('#history-date-start');
    const dateEnd = document.querySelector('#history-date-end');
    const searchName = document.querySelector('#history-search-name');
    const clientSelect = document.querySelector('#history-client-select');
    const filterBtn = document.querySelector('#history-filter-btn');

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            state.historyFilters = {
                startDate: dateStart.value,
                endDate: dateEnd.value,
                customer: searchName.value,
                clientId: clientSelect.value
            };
            fetchHistory();
        });
    }

    if (searchName) {
        searchName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                filterBtn.click();
            }
        });
    }

    // History Details Buttons
    document.querySelectorAll('.history-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            state.selectedTabId = id;
            // We might switch view to 'detail' safely now because we will update render to find it
            state.view = 'detail';
            state.detailItemIndex = -1;
            render();
        });
    });
}

// Initialize Application
async function initApp() {
    try {
        // Fetch Initial Data
        const [tabs, products, clients] = await Promise.all([
            api.getTabs({ status: 'open' }),
            api.getProducts(),
            api.getClients()
        ]);

        state.tabs = tabs;
        state.products = products;
        state.clients = clients;

        // Setup Socket Listeners - REMOVED

        render();
    } catch (error) {
        console.error('Falha ao inicializar app:', error);
        alert('Erro ao carregar dados do servidor. Verifique se o backend está rodando.');
    }
}


// Initial Render
initApp();
