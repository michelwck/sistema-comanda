import * as api from '../services/api.js';

export function attachDashboardEvents(state, render, getFilteredTabs) {
    const tabCards = document.querySelectorAll('.tab-card');

    tabCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Check if clicking delete button
            if (e.target.closest('.delete-tab-btn')) {
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
                state.selectedTabId = id;
                state.view = 'detail';
                state.detailItemIndex = -1; // Reset item selection
                render();
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
                card.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
                card.style.transform = 'translateY(-2px)';
            }
        });
    });

    const searchInput = document.querySelector('#search-comanda');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            state.searchTerm = e.target.value;
            state.selectedIndex = 0; // Reset selection on search
            render();

            // Restore focus and cursor position
            const newInput = document.querySelector('#search-comanda');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
    }

    const newTabBtn = document.querySelector('#new-tab-btn');
    const modal = document.querySelector('#new-tab-modal');
    const form = document.querySelector('#new-tab-form');
    const cancelBtn = document.querySelector('#cancel-new-tab-modal');

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
