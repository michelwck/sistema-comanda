import * as api from '../services/api.js';
import socketService from '../services/socket.js';

let controller = null;

export function attachKeyboardEvents(state, render, getTabs) {
    // Mata listener anterior (se existir)
    if (controller) controller.abort();
    controller = new AbortController();

    // ✅ fallback defensivo (não deixa estourar "is not a function")
    const safeGetTabs = (typeof getTabs === 'function')
        ? getTabs
        : () => (state.tabs ?? []);

    document.addEventListener('keydown', (e) => {
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
            if (e.key !== 'Escape' && e.key !== 'Enter') return;
        }

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

        if (e.key.toLowerCase() === 'f') {
            const paymentModal = document.querySelector('#payment-modal:not(.hidden)');
            if (paymentModal) {
                e.preventDefault();
                const fiadoBtn = document.querySelector('#fiado-btn');
                if (fiadoBtn) fiadoBtn.click();
                return;
            }
        }

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
                render();
                return;
            }

            if (state.view === 'dashboard' && state.searchTerm) {
                state.searchTerm = '';
                state.selectedIndex = 0;
                render();
                return;
            }

            return;
        }

        // Dashboard Navigation
        if (state.view === 'dashboard') {
            if (document.querySelector('.modal-overlay:not(.hidden)')) return;

            const filteredTabs = safeGetTabs(); // ✅ sempre função
            const searchInput = document.querySelector('#search-comanda');
            const activeElement = document.activeElement;

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
                        state.selectedTabId = tab.id;
                        state.view = 'detail';
                        state.detailItemIndex = -1;
                        socketService.joinTab(tab.id);
                        render();
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