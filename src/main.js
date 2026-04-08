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
import { restoreStateFromUrl, attachNavigationEvents } from './managers/navigationManager.js'
import { handleClientSocketEvent } from './managers/fiadoManager.js'

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
    console.log('[detail] refreshDetailTab start')
    if (!state.selectedTabId) {
        console.log('[detail] refreshDetailTab end (no tab selected)')
        return Promise.resolve()
    }
    return api.getTabById(state.selectedTabId)
        .then(updatedTab => {
            console.log(`[api] fetched tab ${updatedTab.id} successfully`)
            const idx = state.tabs.findIndex(t => t.id === updatedTab.id)
            let hasChanges = false
            
            if (idx > -1) {
                if (JSON.stringify(state.tabs[idx]) !== JSON.stringify(updatedTab)) {
                    state.tabs[idx] = updatedTab
                    hasChanges = true
                }
            } else if (updatedTab.status === 'open') {
                state.tabs.unshift(updatedTab)
                hasChanges = true
            }

            if (hasChanges && state.view === 'detail') {
                console.log(`[render] scheduled rerender for detail tab ${updatedTab.id}`)
                scheduleRender()
            }
            console.log('[detail] refreshDetailTab end')
        })
        .catch(err => console.error('[detail] Erro ao refetch detail:', err))
}

function refreshDashboardTabs() {
    console.log('[dashboard] refreshDashboardTabs start')
    return api.getTabs({ status: 'open' })
        .then(tabs => {
            console.log(`[api] fetched ${tabs.length} tabs for dashboard successfully`)
            const hasChanges = JSON.stringify(state.tabs) !== JSON.stringify(tabs)
            
            state.tabs = tabs
            if (hasChanges && state.view === 'dashboard') {
                console.log('[render] scheduled rerender for dashboard')
                scheduleRender()
            }
            console.log('[dashboard] refreshDashboardTabs end')
        })
        .catch(err => console.error('[dashboard] Erro ao refetch dashboard tabs:', err))
}

// A sincronização fina manual foi abandonada em favor da restauração de sessão em recargas offline

function handleWindowFocus() {
    if (state.selectedTabId) {
        socketService.joinTab(state.selectedTabId)
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
    
    // Eventos de Cliente (Fiado/Realtime)
    const clientEvents = ['client:created', 'client:updated', 'client:deleted', 'client:balance:updated'];
    clientEvents.forEach(ev => {
        socketService.removeAllListeners(ev);
        socketService.on(ev, (data) => handleClientSocketEvent(state, scheduleRender, ev, data));
    });

    socketService.on('tab:created', (newTab) => {
        if (!state.tabs.find(t => t.id === newTab.id)) {
            state.tabs.unshift(newTab)
            if (state.view === 'dashboard') scheduleRender()
        }
    })

    socketService.on('tab:updated', (updatedTab) => {
        console.log(`[socket] tab:updated recebido para aba ${updatedTab.id}`, updatedTab.status)
        const index = state.tabs.findIndex(t => t.id === updatedTab.id)

        // Objective 2 - UX da comanda finalizada
        if (state.view === 'detail' && state.selectedTabId === updatedTab.id) {
            if (updatedTab.status !== 'open') {
                // Comanda não está mais aberta, expular usuário
                alert(`Esta comanda foi finalizada (${updatedTab.status}) em outro dispositivo.`)
                socketService.leaveTab(updatedTab.id)
                state.view = 'dashboard'
                state.selectedTabId = null
                scheduleRender()
                return // pára o fluxo atual aqui
            }
        }

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

    // Gatilhos de transição de tela: antes de exibir a versão final preenchida, mandamos buscar a nova versão
    if (state.view !== prevView) {
        if (prevView !== null) { // Evita double fetch no primeiro load
            if (state.view === 'dashboard') {
                refreshDashboardTabs()
                focusDashboardSearch(true)
            } else if (state.view === 'detail') {
                refreshDetailTab()
            }
        }
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
            setupSocketListeners()

        await loadInitialData()
        await loadAdminDataIfNeeded()

        // Restaura contexto caso a página venha de um auto-reload de rede
        let restoredFromReload = false;
        if (sessionStorage.getItem('needs_reload') === 'true') {
            sessionStorage.removeItem('needs_reload')
            restoredFromReload = true;
        }

        // Lê nativamente o estado a partir da Rota URL /dashboard ou /tabs/id (Fallback nativo ou F5)
        restoreStateFromUrl(state);

        // Se era tela de detail, recarrega com segurança se as comandas permitirem
        if (state.view === 'detail' && state.selectedTabId) {
            const tabExists = state.tabs.find(t => String(t.id) === String(state.selectedTabId))
            if (tabExists) {
                // Manter context, a socket vai reconectar organicamente 
            } else {
                state.view = 'dashboard';
                state.selectedTabId = null;
                history.replaceState({ view: 'dashboard' }, '', '/dashboard');

                // Exibe alerta só se veio de um blackout real
                if (restoredFromReload) {
                    alert('Conexão restabelecida.\nA comanda que você visualizava foi finalizada, paga ou removida em outro terminal.');
                }
            }
        }

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
attachNavigationEvents(state, scheduleRender)

window.addEventListener('focus', () => {
    console.log('[network] window focus fired')
    handleWindowFocus()
})
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('[network] visibilitychange (visible) fired')
        handleWindowFocus()
    }
})

let offlineTimeout = null;

window.addEventListener('offline', () => {
    console.log('[network] offline event fired. Iniciando contador de tolerância...')
    offlineTimeout = setTimeout(() => {
        console.log('[network] offline restrito (> 4s). Preparando contexto para reload.')
        sessionStorage.setItem('needs_reload', 'true')
    }, 4000) // 4s timeout blocks fast Wi-Fi/4G drops
})

window.addEventListener('online', () => {
    console.log('[network] online event fired')
    if (offlineTimeout) {
        clearTimeout(offlineTimeout)
        offlineTimeout = null
    }

    if (sessionStorage.getItem('needs_reload') === 'true') {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:600;';
        toast.textContent = 'Conexão restabelecida. Atualizando sistema...';
        document.body.appendChild(toast);

        // Retardar reload marginalmente para o toast surgir na UI antes do blank.
        setTimeout(() => window.location.reload(), 1500);
    }
})

// Trata callback antes de iniciar o app
if (!handleCallback()) {
    initApp()
}

