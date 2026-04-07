import * as api from '../services/api.js';
import socketService from '../services/socket.js';
import { pushRoute } from './navigationManager.js';

let controller = null;

export function attachKeyboardEvents(state, render, getTabs) {
    // Mata listener anterior (se existir)
    if (controller) controller.abort();
    controller = new AbortController();

    // Fallback defensivo
    const safeGetTabs = (typeof getTabs === 'function')
        ? getTabs
        : () => (state.tabs ?? []);

    document.addEventListener('keydown', (e) => {
        // Block global shortcuts if ANY modal is open
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
            // quando modal está aberto: só permitir Escape/Enter, e NÃO executar atalhos globais/navegação
            if (e.key !== 'Escape' && e.key !== 'Enter') return;

            // deixa o modal lidar com Enter (botão focado / submit etc.)
            // e ESC vai ser tratado abaixo (fechar modal)
            if (e.key === 'Enter') return;
        }

        // --------------------------
        // Global Shortcuts
        // --------------------------
        if (e.key === 'F2') {
            e.preventDefault();
            if (state.view === 'dashboard') {
                const searchInput = document.querySelector('#search-comanda');
                if (searchInput) searchInput.focus();
            }
            return;
        }

        if (e.key === 'F6') {
            e.preventDefault();
            if (state.view === 'dashboard') {
                const btn = document.querySelector('#new-tab-btn');
                if (btn) btn.click();
            }
            return;
        }

        if (e.key === 'F4') {
            if (state.view === 'detail') {
                e.preventDefault();
                const payBtn = document.querySelector('#open-payment-modal-btn');
                if (payBtn) payBtn.click();

                const paymentModal = document.querySelector('#payment-modal');
                if (paymentModal) {
                    paymentModal.classList.remove('hidden');
                    setTimeout(() => {
                        const confirmBtn = document.querySelector('#confirm-payment-btn');
                        if (confirmBtn) confirmBtn.focus();
                    }, 50);
                }
            }
            return;
        }

        // F para Fiado quando payment modal aberto
        if (e.key.toLowerCase() === 'f') {
            const paymentModal = document.querySelector('#payment-modal:not(.hidden)');
            if (paymentModal) {
                e.preventDefault();
                const fiadoBtn = document.querySelector('#fiado-btn');
                if (fiadoBtn) fiadoBtn.click();
                return;
            }
        }

        // --------------------------
        // ESC: Back / Close Modal
        // --------------------------
        if (e.key === 'Escape') {
            e.preventDefault();

            const openModal = document.querySelector('.modal-overlay:not(.hidden)');
            if (openModal) {
                openModal.classList.add('hidden');
                return;
            }

            if (state.view === 'detail') {
                const oldTabId = state.selectedTabId;
                socketService.leaveTab(oldTabId);

                state.selectedTabId = null;
                state.view = 'dashboard';
                pushRoute('dashboard');
                scheduleKeyboardRender(render);

                // foca busca depois do DOM atualizar
                queueMicrotask(() => {
                    const searchInput = document.querySelector('#search-comanda');
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                    }
                });

                return;
            }

            if (state.view === 'dashboard' && state.searchTerm) {
                state.searchTerm = '';
                state.selectedIndex = 0;
                scheduleKeyboardRender(render);
                return;
            }

            return;
        }
        // ==========================================================
        // DETAIL VIEW NAVIGATION (↑ ↓ Enter Delete)
        // ==========================================================
        if (state.view === 'detail') {
            // Se algum modal estiver aberto, não navega itens
            if (document.querySelector('.modal-overlay:not(.hidden)')) return;

            // Só captura as teclas que nos interessam, senão deixa seguir
            const keys = ['ArrowDown', 'ArrowUp', 'Enter', 'Delete'];
            if (!keys.includes(e.key)) return;

            // ✅ impede scroll / comportamento padrão do browser
            e.preventDefault();

            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);
            const items = currentTab?.items || [];
            if (items.length === 0) return;

            // ↓ desce (se estiver -1, começa no 0)
            if (e.key === 'ArrowDown') {
                if (state.detailItemIndex === -1) state.detailItemIndex = 0;
                else state.detailItemIndex = Math.min(state.detailItemIndex + 1, items.length - 1);

                setTimeout(() => {
                    const el = document.querySelector(`.tab-item-row[data-index="${state.detailItemIndex}"]`);
                    if (el) el.scrollIntoView({ block: 'end', behavior: 'auto' });
                }, 0);

                scheduleKeyboardRender(render);

                return;
            }

            // ↑ sobe (se chegar no topo, volta pro quick search)
            if (e.key === 'ArrowUp') {
                if (state.detailItemIndex <= 0) {
                    state.detailItemIndex = -1;
                    scheduleKeyboardRender(render);

                    const quickAddSearch = document.querySelector('#quick-add-search');
                    if (quickAddSearch) quickAddSearch.focus();

                    // Scroll page on itens
                    setTimeout(() => {
                        const el = document.querySelector(`.tab-item-row[data-index="${state.detailItemIndex}"]`);
                        if (el) el.scrollIntoView({ block: 'nearest' });
                    }, 0);

                    return;
                }

                state.detailItemIndex = Math.max(state.detailItemIndex - 1, 0);
                scheduleKeyboardRender(render);
                return;
            }

            // Enter: abre modal de editar item selecionado
            if (e.key === 'Enter') {
                if (state.detailItemIndex === -1) return;

                const item = items[state.detailItemIndex];
                if (!item) return;

                const editModal = document.querySelector('#edit-item-modal');
                if (!editModal) return;

                const idxInput = document.querySelector('#edit-item-index');
                const nameInput = document.querySelector('#edit-item-name');
                const priceInput = document.querySelector('#edit-item-price');
                const qtyInput = document.querySelector('#edit-item-quantity');

                if (idxInput) idxInput.value = state.detailItemIndex;
                if (nameInput) nameInput.value = item.name ?? '';
                if (priceInput) priceInput.value = item.price ?? '';
                if (qtyInput) qtyInput.value = item.quantity ?? 1;

                editModal.classList.remove('hidden');

                setTimeout(() => {
                    if (qtyInput) {
                        qtyInput.focus();
                        qtyInput.select?.();
                    }
                }, 50);

                return;
            }

            // Delete: remove item selecionado
            if (e.key === 'Delete') {
                if (state.detailItemIndex === -1) return;

                const item = items[state.detailItemIndex];
                if (!item) return;

                if (!confirm(`Remover ${item.name}?`)) return;

                api.deleteTabItem(currentTab.id, item.id)
                    .then(() => api.getTabById(currentTab.id))
                    .then(updatedTab => {
                        const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                        if (idx > -1) state.tabs[idx] = updatedTab;

                        // Ajusta índice se apagou o último
                        const newLen = (state.tabs[idx]?.items || []).length;
                        if (newLen === 0) state.detailItemIndex = -1;
                        else if (state.detailItemIndex >= newLen) state.detailItemIndex = newLen - 1;

                        scheduleKeyboardRender(render);
                    })
                    .catch(err => alert('Erro ao remover item: ' + err.message));

                return;
            }

            return; // não deixa cair no dashboard
        }

        // ==========================================================
        // DASHBOARD NAVIGATION (Arrows / Tab / Enter)
        // ==========================================================
        if (state.view === 'dashboard') {
            if (document.querySelector('.modal-overlay:not(.hidden)')) return;

            const filteredTabs = safeGetTabs();
            const searchInput = document.querySelector('#search-comanda');
            const activeElement = document.activeElement;

            // Sempre que usa teclado no dashboard, desliga hover do mouse por um tempo
            state.mouseNavEnabled = false;
            state.lastKeyboardAt = Date.now();

            // reabilita depois de 600ms sem teclado
            clearTimeout(window.__mouseNavTimer);
            window.__mouseNavTimer = setTimeout(() => {
                // só reabilita se não teve teclado de novo
                if (Date.now() - state.lastKeyboardAt >= 600) {
                    state.mouseNavEnabled = true;
                }
            }, 650);

            // Enter no campo de busca: abrir a comanda selecionada (geralmente a 1ª)
            if (activeElement === searchInput && e.key === 'Enter') {
                e.preventDefault();

                const tab = filteredTabs[state.selectedIndex] || filteredTabs[0];
                if (tab) {
                    console.log('[DEBUG-FLOW] KEYBOARD ENTER na BUSCA. ID:', tab.id);
                    state.selectedTabId = tab.id;
                    state.view = 'detail';
                    console.log('[DEBUG-FLOW] Calling pushRoute...', tab.id);
                    pushRoute('detail', tab.id);
                    console.log('[DEBUG-FLOW] pathname:', window.location.pathname);
                    state.detailItemIndex = -1;

                    socketService.joinTab(tab.id);

                    scheduleKeyboardRender(render);
                }
                return;
            }

            if (activeElement === searchInput && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey))) {
                e.preventDefault();
                searchInput.blur();
                state.selectedIndex = 0;
                scheduleKeyboardRender(render);
                return;
            }

            if (activeElement !== searchInput) {
                if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
                    e.preventDefault();
                    if (state.selectedIndex < filteredTabs.length - 1) {
                        state.selectedIndex++;
                        scheduleKeyboardRender(render);
                    }
                } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
                    e.preventDefault();
                    if (state.selectedIndex > 0) {
                        state.selectedIndex--;
                        scheduleKeyboardRender(render);
                    } else {
                        state.selectedIndex = 0;
                        scheduleKeyboardRender(render);
                        if (searchInput) searchInput.focus();
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (state.selectedIndex + 4 < filteredTabs.length) {
                        state.selectedIndex += 4;
                        scheduleKeyboardRender(render);
                    } else {
                        state.selectedIndex = Math.max(filteredTabs.length - 1, 0);
                        scheduleKeyboardRender(render);
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (state.selectedIndex - 4 >= 0) {
                        state.selectedIndex -= 4;
                        scheduleKeyboardRender(render);
                    } else {
                        state.selectedIndex = 0;
                        scheduleKeyboardRender(render);
                        if (searchInput) searchInput.focus();
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const tab = filteredTabs[state.selectedIndex];
                    if (tab) {
                        console.log('[DEBUG-FLOW] KEYBOARD ENTER no GRID. ID:', tab.id);
                        state.selectedTabId = tab.id;
                        state.view = 'detail';
                        console.log('[DEBUG-FLOW] Calling pushRoute...', tab.id);
                        pushRoute('detail', tab.id);
                        console.log('[DEBUG-FLOW] pathname:', window.location.pathname);
                        state.detailItemIndex = -1;
                        socketService.joinTab(tab.id);
                        scheduleKeyboardRender(render);
                    }
                }
            }
        }
    }, { signal: controller.signal });
}

let keyboardRenderQueued = false;
function scheduleKeyboardRender(render) {
    if (keyboardRenderQueued) return;
    keyboardRenderQueued = true;

    requestAnimationFrame(() => {
        keyboardRenderQueued = false;
        render();
    });
}