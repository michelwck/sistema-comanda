import { Dashboard } from '../components/Dashboard.js'
import { TabDetail } from '../components/TabDetail.js'
import { ClientList } from '../components/ClientList.js'
import { ProductList } from '../components/ProductList.js'
import { FiadoControl } from '../components/FiadoControl.js'
import { HistoryList } from '../components/HistoryList.js'
import { UserList } from '../components/UserList.js'
import { CategoryList } from '../components/CategoryList.js'

import { attachDashboardEvents } from './dashboardManager.js'
import { attachDetailEvents } from './detailManager.js'
import { attachFiadoEvents, attachFiadoDetailEvents } from './fiadoManager.js'
import { attachHistoryEvents } from './historyManager.js'
import { attachProductEvents, attachClientEvents } from './adminManager.js'
import { attachUserEvents } from './userManager.js'
import { attachCategoryEvents } from './categoryManager.js'
import { normalizeString } from '../utils/helpers.js'

const viewRenderers = {
    dashboard: (state, getFilteredTabs) =>
        Dashboard({
            tabs: getFilteredTabs(),
            selectedIndex: state.selectedIndex,
            searchTerm: state.searchTerm,
            currentUser: state.currentUser,
            dashboardSection: state.dashboardSection,
        }),

    detail: (state) => {
        const tab = state.tabs.find(t => t.id === state.selectedTabId)
        return TabDetail({
            tab,
            itemIndex: state.detailItemIndex,
            quickAddSearch: state.quickAddSearch,
            quickAddSelectedIndex: state.quickAddSelectedIndex,
            showDropdown: !!state.quickAddSearch,
        })
    },

    clients: (state) => ClientList({ clients: state.clients }),

    products: (state) =>
        ProductList({ products: state.products, categories: state.categories }),

    fiado: (state) => {
        const term = normalizeString(state.fiadoSearchTerm || '')
        const displayClients = state.fiadoSearchTerm
            ? state.clients.filter(c => normalizeString(c.name).includes(term))
            : state.clients.filter(
                c => parseFloat(c.balance || 0) > 0.01 || c.id === state.fiadoSelectedClientId
            )

        return FiadoControl({
            clients: displayClients,
            selectedClientId: state.fiadoSelectedClientId,
            transactions: state.fiadoTransactions,
        })
    },

    'fiado-detail': (state) =>
        TabDetail({
            tab: state.tempTab,
            readOnly: true,
        }),

    history: (state) =>
        HistoryList({
            historyTabs: state.historyTabs,
            filters: state.historyFilters,
            clients: state.clients,
        }),

    users: (state) => UserList({ users: state.users }),

    categories: (state) => CategoryList({ categories: state.categories }),
}

const viewEventAttachers = {
    dashboard: attachDashboardEvents,
    detail: attachDetailEvents,
    fiado: attachFiadoEvents,
    'fiado-detail': attachFiadoDetailEvents,
    products: attachProductEvents,
    clients: attachClientEvents,
    history: attachHistoryEvents,
    users: attachUserEvents,
    categories: attachCategoryEvents,
}

export function renderView(state, getFilteredTabs) {
    const fn = viewRenderers[state.view]
    if (fn) return fn(state, getFilteredTabs)

    return `<div style="padding: 2rem; color: orange;">
    <h2>Debug: Content is Empty</h2>
    <p>View: ${state.view}</p>
  </div>`
}

export function attachViewEvents(state, render, getFilteredTabs) {
    const fn = viewEventAttachers[state.view]
    if (!fn) return
    // Alguns attachers aceitam (state, render, getFilteredTabs) e outros só (state, render)
    // Então passamos os 3 e quem não usa, ignora.
    fn(state, render, getFilteredTabs)
}