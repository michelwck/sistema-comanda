import * as api from '../services/api.js';

let controller = null;

export function attachDashboardEvents(state, render, getFilteredTabs) {
    // mata listeners antigos (de render anterior)
    if (controller) controller.abort();
    controller = new AbortController();
    const { signal } = controller;

    const tabCards = document.querySelectorAll('.tab-card');

    tabCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // delete
            if (e.target.closest('.delete-tab-btn')) {
                e.stopPropagation();
                const id = parseInt(card.dataset.id);
                if (confirm(`Deseja excluir a comanda #${id}?`)) {
                    api.deleteTab(id)
                        .then(() => {
                            state.tabs = state.tabs.filter(t => t.id !== id);
                            render();
                        })
                        .catch(err => alert('Erro ao excluir comanda: ' + err.message));
                }
                return;
            }

            // open detail
            const id = parseInt(card.dataset.id);
            if (!isNaN(id)) {
                state.selectedTabId = id;
                state.view = 'detail';
                state.detailItemIndex = -1;
                render();
            }
        }, { signal });

        // Hover to select
        card.addEventListener('mouseenter', () => {
            if (state.mouseNavEnabled === false) return;

            const filtered = getFilteredTabs();
            const index = filtered.findIndex(t => t.id === parseInt(card.dataset.id));

            if (index !== -1 && index !== state.selectedIndex) {
                state.selectedIndex = index;

                // update visuals without render
                document.querySelectorAll('.tab-card').forEach(c => {
                    c.style.border = '';
                    c.style.boxShadow = '';
                    c.style.transform = '';
                });

                card.style.border = '2px solid var(--color-primary)';
                card.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
                card.style.transform = 'translateY(-2px)';
            }
        }, { signal });
    });

    const searchInput = document.querySelector('#search-comanda');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            state.searchTerm = e.target.value;
            state.selectedIndex = 0;
            render();

            // restaura foco/cursor após o render assíncrono
            setTimeout(() => {
                const newInput = document.querySelector('#search-comanda');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            }, 0);
        }, { signal });
    }

    const newTabBtn = document.querySelector('#new-tab-btn');
    const modal = document.querySelector('#new-tab-modal');
    const form = document.querySelector('#new-tab-form');
    const cancelBtn = document.querySelector('#cancel-new-tab-modal');

    if (newTabBtn && modal) {
        newTabBtn.addEventListener('click', () => {
            form?.reset?.();
            modal.classList.remove('hidden');
            const input = modal.querySelector('#new-tab-customer');
            if (input) setTimeout(() => input.focus(), 50);
        }, { signal });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        }, { signal });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const customerEl = document.querySelector('#new-tab-customer');
            const customer = customerEl?.value;

            if (!customer) return;

            api.createTab({ customer })
                .then((newTab) => {
                    modal?.classList.add('hidden');

                    // deixa socket evitar duplicar na lista
                    state.selectedTabId = newTab.id;
                    state.view = 'detail';
                    state.detailItemIndex = -1;

                    // pequeno delay ok, mas render já está seguro
                    setTimeout(() => render(), 100);
                })
                .catch(err => alert('Erro ao criar comanda: ' + err.message));
        }, { signal });
    }
}