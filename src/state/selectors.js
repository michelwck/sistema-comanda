import { normalizeString } from '../utils/helpers.js';

export function getFilteredTabs(state) {
    const openTabs = state.tabs.filter(t => t.status === 'open');
    if (!state.searchTerm) return openTabs;

    const term = normalizeString(state.searchTerm);
    return openTabs.filter(t =>
        normalizeString(t.customer).includes(term) ||
        t.id.toString().includes(term)
    );
}