import './style.css'
import { Sidebar } from './components/Sidebar'
import { AppShell } from './components/Layout.js'
import { Login } from './components/Login'
import * as api from './services/api'
import { isAuthenticated, fetchCurrentUser } from './services/auth'
import { handleCallback } from './core/handleCallback.js'
import { fetchHistory } from './managers/historyManager.js'
import { renderView, attachViewEvents } from './managers/routeManager.js'
import socketService from './services/socket.js'
import { attachKeyboardEvents } from './managers/keyboardManager.js'
import { attachGlobalEvents } from './managers/globalEventsManager.js'
import { state } from './state/store.js'
import { getFilteredTabs } from './state/selectors.js'

const app = document.querySelector('#app')
const getTabs = () => getFilteredTabs(state)

let prevView = null

// -----------------------------
// Render scheduling (1 por ciclo)
// -----------------------------
let renderQueued = false
function scheduleRender() {
    if (renderQueued) return
    renderQueued = true

    queueMicrotask(() => {
        renderQueued = false
        render()
    })
}

// -----------------------------
// Helpers
// -----------------------------
function focusDashboardSearch(selectAll = true) {
    queueMicrotask(() => {
        const el = document.querySelector('#search-comanda')
        if (!el) return
        el.focus()
        if (selectAll) el.select?.()
    })
}

function refreshDetailTab() {
    if (!state.selectedTabId) return Promise.resolve()
    return api.getTabById(state.selectedTabId)
        .then(updatedTab => {
            const idx = state.tabs.findIndex(t => t.id === updatedTab.id)
            if (idx > -1) {
                state.tabs[idx] = updatedTab
            } else if (updatedTab.status === 'open') {
                state.tabs.unshift(updatedTab)
            }
            if (state.view === 'detail') scheduleRender()
        })
        .catch(err => console.error('Erro ao refetch detail:', err))
}

function refreshDashboardTabs() {
    return api.getTabs({ status: 'open' })
        .then(tabs => {
            state.tabs = tabs
            if (state.view === 'dashboard') scheduleRender()
        })
        .catch(err => console.error('Erro ao refetch dashboard tabs:', err))
}

function handleRecoveryFetch() {
    if (state.view === 'detail' && state.selectedTabId) {
        return refreshDetailTab()
    }
    return refreshDashboardTabs()
}

function handleWindowFocus() {
    if (state.selectedTabId) {
        socketService.joinTab(state.selectedTabId)
        if (state.view === 'detail') {
            refreshDetailTab()
        }
    } else if (state.view === 'dashboard') {
        refreshDashboardTabs()
    }
}

function attachLoginEvents() {
    const loginBtn = document.querySelector('#google-login-btn')
    if (!loginBtn) return

    // garante que não duplica listener
    loginBtn.onclick = () => {
        window.location.href = '/auth/google'
    }
}


// -----------------------------
// Socket listeners (idempotente)
// -----------------------------
let socketListenersReady = false
function setupSocketListeners() {
    if (socketListenersReady) return
    socketListenersReady = true

    const events = [
        'tab:created',
        'tab:updated',
        'tab:deleted',
        'tab:item:added',
        'tab:item:updated',
        'tab:item:deleted',
    ]

    // segurança extra: remove qualquer listener antigo (caso reload/hot, etc.)
    events.forEach(ev => socketService.removeAllListeners(ev))

    socketService.on('tab:created', (newTab) => {
        if (!state.tabs.find(t => t.id === newTab.id)) {
            state.tabs.unshift(newTab)
            if (state.view === 'dashboard') scheduleRender()
        }
    })

    socketService.on('tab:updated', (updatedTab) => {
        const index = state.tabs.findIndex(t => t.id === updatedTab.id)

        if (index > -1) {
            state.tabs[index] = updatedTab
            if (state.view === 'dashboard') scheduleRender()
            else if (state.view === 'detail' && state.selectedTabId === updatedTab.id) scheduleRender()
        } else if (updatedTab.status === 'open') {
            state.tabs.unshift(updatedTab)
            if (state.view === 'dashboard') scheduleRender()
        }

        if (state.view === 'history') {
            fetchHistory(state, scheduleRender)
        }
    })

    socketService.on('tab:deleted', ({ id }) => {
        state.tabs = state.tabs.filter(t => t.id !== id)

        if (state.view === 'dashboard') {
            scheduleRender()
        } else if (state.view === 'detail' && state.selectedTabId === id) {
            socketService.leaveTab(id)
            alert('Esta comanda foi excluída por outro usuário.')
            state.view = 'dashboard'
            state.selectedTabId = null
            scheduleRender()
        }

        if (state.view === 'history') {
            fetchHistory(state, scheduleRender)
        }
    })

    const handleItemUpdate = ({ tabId, tab }) => {
        const index = state.tabs.findIndex(t => t.id === tabId)
        if (index > -1) {
            state.tabs[index] = tab

            if (state.view === 'detail' && state.selectedTabId === tabId) scheduleRender()
            else if (state.view === 'dashboard') scheduleRender()
        }
    }

    socketService.on('tab:item:added', handleItemUpdate)
    socketService.on('tab:item:updated', handleItemUpdate)
    socketService.on('tab:item:deleted', handleItemUpdate)
}

// -----------------------------
// Render
// -----------------------------
function render() {
    if (!state.isAuthenticated) {
        app.innerHTML = Login()
        attachLoginEvents()
        return
    }

    let contentHtml = ''

    try {
        contentHtml = renderView(state, getTabs)
    } catch (error) {
        console.error('Render Error:', error)
        contentHtml = `
      <div style="padding: 2rem; color: red;">
        <h2>Erro ao renderizar tela</h2>
        <pre>${error.message}\n${error.stack}</pre>
      </div>
    `
    }

    const sidebarHtml = Sidebar(state.view, state.currentUser)

    if (!document.querySelector('.app-container')) {
        app.innerHTML = AppShell(sidebarHtml)
    } else {
        const existingSidebar = document.querySelector('#main-sidebar')
        if (existingSidebar) existingSidebar.outerHTML = sidebarHtml
    }

    const currentSidebar = document.querySelector('#main-sidebar')
    if (state.isSidebarCollapsed && currentSidebar) {
        currentSidebar.classList.add('collapsed')
    }

    if (!contentHtml) {
        contentHtml = `
      <div style="padding: 2rem; color: orange;">
        <h2>Debug: Content is Empty</h2>
        <p>View: ${state.view}</p>
      </div>
    `
    }

    const mainContent = document.querySelector('#main-content-area')
    if (mainContent) mainContent.innerHTML = contentHtml

    // attach view events de forma controlada (evita duplicar handlers)
    attachViewEvents(state, scheduleRender, getTabs);

    // Auto-foco ao ENTRAR no dashboard (não rouba foco em renders por socket)
    if (state.view === 'dashboard' && prevView && prevView !== 'dashboard') {
        focusDashboardSearch(true)
    }
    prevView = state.view
}

// -----------------------------
// Init
// -----------------------------
async function loadInitialData() {
    const [tabs, products, clients, categories] = await Promise.all([
        api.getTabs({ status: 'open' }),
        api.getProducts(),
        api.getClients(),
        api.getCategories()
    ])

    state.tabs = tabs
    state.products = products
    state.clients = clients
    state.categories = categories
}

async function loadAdminDataIfNeeded() {
    if (state.currentUser?.role !== 'admin') return
    try {
        state.users = await api.getUsers()
        scheduleRender()
    } catch (err) {
        console.error(err)
    }
}

    async function initApp() {
        try {
            if (!isAuthenticated()) {
                state.isAuthenticated = false
                render()
                return
            }

            state.isAuthenticated = true

            const user = await fetchCurrentUser()
            if (!user) {
                state.isAuthenticated = false
                render()
                return
            }

            state.currentUser = user

            socketService.connect()
            socketService.setRecoveryCallback(handleRecoveryFetch)
            setupSocketListeners()

        await loadInitialData()
        await loadAdminDataIfNeeded()

        render()
    } catch (error) {
        console.error('Erro ao inicializar:', error)

        if (String(error?.message || '').includes('autenticado')) {
            state.isAuthenticated = false
            render()
            return
        }

        alert('Erro ao carregar dados: ' + error.message)
    } finally {
        console.log('App Initialized. State:', state)
    }
}

// -----------------------------
// Global hooks (1x)
// -----------------------------
attachGlobalEvents(state, scheduleRender)
attachKeyboardEvents(state, scheduleRender, getTabs)

window.addEventListener('focus', handleWindowFocus)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        handleWindowFocus()
    }
})
window.addEventListener('online', () => {
    console.log('🌐 Navegador detectou volta da internet (online event). Forçando sync imediato.')
    handleRecoveryFetch()
})

// Trata callback antes de iniciar o app
if (!handleCallback()) {
    initApp()
}

