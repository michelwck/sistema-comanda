import * as api from '../services/api.js';
import { normalizeString } from '../utils/helpers.js';

export function fetchHistory(state, render) {
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

export function attachHistoryEvents(state, render) {
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
            fetchHistory(state, render);
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
            // Check if tab is already in current list to get quick access, or fetch it
            // Since we clicked on it, we probably want to load it fully?
            // The existing logic just set selection and changed view.
            state.selectedTabId = id;
            state.view = 'detail';
            state.detailItemIndex = -1;
            state.detailItemIndex = -1;
            render();
        });
    });

    // Reopen Tab Buttons
    document.querySelectorAll('.history-reopen-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Tem certeza que deseja reabrir esta comanda? Ela voltará para a tela inicial.')) return;

            const id = parseInt(btn.dataset.id);
            try {
                await api.updateTab(id, { status: 'open' });
                // Refresh history (it should disappear from list)
                fetchHistory(state, render);
                alert('Comanda reaberta com sucesso!');
            } catch (error) {
                console.error('Erro ao reabrir comanda:', error);
                alert('Erro ao reabrir comanda: ' + error.message);
            }
        });
    });
}
