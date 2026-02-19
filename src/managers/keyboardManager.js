import * as api from '../services/api.js';
import socketService from '../services/socket.js';

export function attachKeyboardEvents(state, render, getFilteredTabs) {
    document.addEventListener('keydown', (e) => {
        // Block global shortcuts if ANY modal is open
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');

        if (openModal) {
            // If it's Escape, we let it pass to the specific Escape handler below
            if (e.key !== 'Escape' && e.key !== 'Enter') return;
        }

        // F2: Focus Search
        if (e.key === 'F2') {
            e.preventDefault();
            if (state.view === 'dashboard') {
                const searchInput = document.querySelector('#search-comanda');
                if (searchInput) searchInput.focus();
            }
            return;
        }

        // F6: New Tab
        if (e.key === 'F6') {
            e.preventDefault();
            if (state.view === 'dashboard') {
                const btn = document.querySelector('#new-tab-btn');
                if (btn) btn.click();
            }
            return;
        }

        // F4: Payment (Detail View)
        if (e.key === 'F4') {
            if (state.view === 'detail') {
                e.preventDefault();
                const payBtn = document.querySelector('#open-payment-modal-btn');
                if (payBtn) payBtn.click();

                // Auto focus confirm button in modal (after short delay for render)
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
                const oldTabId = state.selectedTabId;

                socketService.leaveTab(oldTabId); // 🔥 sai da room

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

            if (state.view === 'history') {
                // Optional: clear filters
                return;
            }
        }

        // if (e.defaultPrevented && e.key !== 'Escape') return;

        // Detail View Item Navigation (When input not focused)
        if (state.view === 'detail' && state.detailItemIndex !== -1) {
            const quickAddSearch = document.querySelector('#quick-add-search');
            const openModal = document.querySelector('.modal-overlay:not(.hidden)');
            const activeElement = document.activeElement;

            // If not typing in search and no modal is open
            if (activeElement !== quickAddSearch && !openModal) {
                const currentTab = state.tabs.find(t => t.id === state.selectedTabId);

                if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                    e.preventDefault();
                    // Arrow Up = Previous Item (Index Decrease)
                    if (state.detailItemIndex === 0) {
                        state.detailItemIndex = -1;
                        scheduleRender();
                        if (quickAddSearch) quickAddSearch.focus();
                        return;
                    }
                    state.detailItemIndex = Math.max(state.detailItemIndex - 1, 0);
                    scheduleRender();
                    return;
                }

                if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                    e.preventDefault();
                    // Arrow Down = Next Item (Index Increase)
                    if (currentTab) {
                        const items = currentTab.items || [];
                        if (items.length === 0) return;

                        // Check if we are at the bottom (oldest item, max index)
                        state.detailItemIndex = Math.min(state.detailItemIndex + 1, items.length - 1);
                        scheduleRender();
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
                                .then(() => api.getTabById(currentTab.id))
                                .then(updatedTab => {
                                    const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                                    if (idx > -1) state.tabs[idx] = updatedTab;
                                    render();
                                })
                                .catch(err => alert('Erro ao remover item: ' + err.message));
                        }
                    }
                    return;
                }
            }
        }

        // Dashboard Navigation (Arrows / Enter / Tab)
        if (state.view === 'dashboard') {
            // Prevent dashboard navigation if a modal is open
            if (document.querySelector('.modal-overlay:not(.hidden)')) return;

            const filteredTabs = getFilteredTabs();
            const searchInput = document.querySelector('#search-comanda');
            const activeElement = document.activeElement;

            if (activeElement === searchInput && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey))) {
                e.preventDefault();
                searchInput.blur();
                state.selectedIndex = 0;
                scheduleRender();
                return;
            }

            if (activeElement !== searchInput) {
                if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
                    e.preventDefault();
                    if (state.selectedIndex < filteredTabs.length - 1) {
                        state.selectedIndex++;
                        scheduleRender();
                    }
                } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
                    e.preventDefault();
                    if (state.selectedIndex > 0) {
                        state.selectedIndex--;
                        scheduleRender();
                    } else {
                        // Back to search
                        state.selectedIndex = 0;
                        scheduleRender();
                        if (searchInput) searchInput.focus();
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    // Jump by row (approx 4? or just next)
                    if (state.selectedIndex + 4 < filteredTabs.length) {
                        state.selectedIndex += 4;
                        scheduleRender();
                    } else {
                        state.selectedIndex = filteredTabs.length - 1;
                        scheduleRender();

                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (state.selectedIndex - 4 >= 0) {
                        state.selectedIndex -= 4;
                        scheduleRender();
                    } else {
                        state.selectedIndex = 0;
                        scheduleRender();
                        if (searchInput) searchInput.focus();
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const tab = filteredTabs[state.selectedIndex];
                    if (tab) {
                        state.selectedTabId = tab.id;
                        state.view = 'detail';
                        state.detailItemIndex = -1;

                        socketService.joinTab(tab.id); // 🔥 entra na room

                        render();
                    }
                }
            }
        }
    });
}