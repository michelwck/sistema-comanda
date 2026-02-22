import { Dashboard } from '../components/Dashboard.js';
import { TabDetail } from '../components/TabDetail.js';
import { ClientList } from '../components/ClientList.js';
import { ProductList } from '../components/ProductList.js';
import { FiadoControl } from '../components/FiadoControl.js';
import { HistoryList } from '../components/HistoryList.js';
import { UserList } from '../components/UserList.js';
import { CategoryList } from '../components/CategoryList.js';

import { attachDashboardEvents } from './dashboardManager.js';
import { attachDetailEvents } from './detailManager.js';
import { attachFiadoEvents, attachFiadoDetailEvents } from './fiadoManager.js';
import { attachHistoryEvents } from './historyManager.js';
import { attachProductEvents, attachClientEvents } from './adminManager.js';
import { attachUserEvents } from './userManager.js';
import { attachCategoryEvents } from './categoryManager.js';
import { normalizeString } from '../utils/helpers.js';

export function renderView(state, getFilteredTabs) {
    if (state.view === 'dashboard') {
        return Dashboard({
            tabs: getFilteredTabs(),
            selectedIndex: state.selectedIndex,
            searchTerm: state.searchTerm,
            currentUser: state.currentUser
        });
    } else if (state.view === 'detail') {
        const tab = state.tabs.find(t => t.id === state.selectedTabId);
        return TabDetail({
            tab,
            itemIndex: state.detailItemIndex,
            quickAddSearch: state.quickAddSearch,
            quickAddSelectedIndex: state.quickAddSelectedIndex,
            showDropdown: !!state.quickAddSearch
        });
    } else if (state.view === 'clients') {
        return ClientList({ clients: state.clients });
    } else if (state.view === 'products') {
        return ProductList({ products: state.products, categories: state.categories });
    } else if (state.view === 'fiado') {
        const term = normalizeString(state.fiadoSearchTerm || '');
        const displayClients = state.fiadoSearchTerm
            ? state.clients.filter(c => normalizeString(c.name).includes(term))
            : state.clients.filter(c => parseFloat(c.balance || 0) > 0.01 || c.id === state.fiadoSelectedClientId);

        return FiadoControl({
            clients: displayClients,
            selectedClientId: state.fiadoSelectedClientId,
            transactions: state.fiadoTransactions
        });
    } else if (state.view === 'fiado-detail') {
        return TabDetail({
            tab: state.tempTab,
            readOnly: true
        });
    } else if (state.view === 'history') {
        return HistoryList({
            historyTabs: state.historyTabs,
            filters: state.historyFilters,
            clients: state.clients
        });
    } else if (state.view === 'users') {
        return UserList({ users: state.users });
    } else if (state.view === 'categories') {
        return CategoryList({ categories: state.categories });
    }
    return `<div style="padding: 2rem; color: orange;"><h2>Debug: Content is Empty</h2><p>View: ${state.view}</p></div>`;
}

export function attachViewEvents(state, render, getFilteredTabs) {
    if (state.view === 'dashboard') {
        attachDashboardEvents(state, render, getFilteredTabs);
    } else if (state.view === 'detail') {
        attachDetailEvents(state, render);
    } else if (state.view === 'fiado') {
        attachFiadoEvents(state, render);
    } else if (state.view === 'fiado-detail') {
        attachFiadoDetailEvents(state, render);
    } else if (state.view === 'products') {
        attachProductEvents(state, render);
    } else if (state.view === 'clients') {
        attachClientEvents(state, render);
    } else if (state.view === 'history') {
        attachHistoryEvents(state, render);
    } else if (state.view === 'users') {
        attachUserEvents(state, render);
    } else if (state.view === 'categories') {
        attachCategoryEvents(state, render);
    }
}
