// src/state/store.js
export const state = {
    isAuthenticated: false,
    currentUser: null,
    view: 'dashboard',
    selectedTabId: null,
    searchTerm: '',
    selectedIndex: 0,
    quickAddSearch: '',
    quickAddSelectedIndex: 0,
    fiadoSelectedClientId: null,
    fiadoTransactions: [],
    fiadoSearchTerm: '',
    tempTab: null,
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
    },
    users: [],
    categories: [],
    isSidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true'
};