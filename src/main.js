import './style.css'
import { Sidebar } from './components/Sidebar'
import { AppShell } from './components/Layout.js'
import { Login } from './components/Login'
import * as api from './services/api'
import { isAuthenticated, fetchCurrentUser } from './services/auth'
import { handleCallback } from './core/handleCallback.js'
import { normalizeString } from './utils/helpers.js'
import { fetchHistory } from './managers/historyManager.js'
import { renderView, attachViewEvents } from './managers/routeManager.js'
import socketService from './services/socket.js'
import { attachKeyboardEvents } from './managers/keyboardManager.js'
import { attachGlobalEvents } from './managers/globalEventsManager.js';

const app = document.querySelector('#app');

// State Management
let state = {
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
    tempTab: null, // For viewing details of closed/fiado tabs
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

// Helper: Get filtered tabs based on search term
function getFilteredTabs() {
    // Only show open tabs in dashboard
    const openTabs = state.tabs.filter(t => t.status === 'open');
    if (!state.searchTerm) return openTabs;
    const term = normalizeString(state.searchTerm);
    return openTabs.filter(t =>
        normalizeString(t.customer).includes(term) ||
        t.id.toString().includes(term)
    );
}

// Render Function
function render() {
    // Check authentication first
    if (!state.isAuthenticated) {
        app.innerHTML = Login();
        attachLoginEvents();
        return;
    }

    // 1. Sidebar
    console.log('Rendering view:', state.view);

    // 2. Main Content
    let contentHtml = '';

    try {
        contentHtml = renderView(state, getFilteredTabs);
    } catch (error) {
        console.error('Render Error:', error);
        contentHtml = `<div style="padding: 2rem; color: red;"><h2>Erro ao renderizar tela</h2><pre>${error.message}\n${error.stack}</pre></div>`;
    }

    // 4. Update DOM (Sidebar logic...)

    // 4. Update DOM
    const sidebarHtml = Sidebar(state.view, state.currentUser);

    // Initial App Shell Render
    if (!document.querySelector('.app-container')) {
        app.innerHTML = AppShell(sidebarHtml);
    } else {
        // Update Sidebar only if exists
        const existingSidebar = document.querySelector('#main-sidebar');
        if (existingSidebar) {
            existingSidebar.outerHTML = sidebarHtml;
        }
    }

    // Sidebar Collapsed State
    const currentSidebar = document.querySelector('#main-sidebar');
    if (state.isSidebarCollapsed && currentSidebar) {
        currentSidebar.classList.add('collapsed');
    }

    // Fallback if still empty
    if (!contentHtml) {
        contentHtml = `<div style="padding: 2rem; color: orange;"><h2>Debug: Content is Empty</h2><p>View: ${state.view}</p></div>`;
    }

    // Render Main Content
    // AppShell creates #main-content-area
    const mainContent = document.querySelector('#main-content-area');
    if (mainContent) {
        mainContent.innerHTML = contentHtml;
    }

    attachEvents();
}

function attachEvents() {
    attachViewEvents(state, render, getFilteredTabs);
}

// Initialize Global Events
attachGlobalEvents(state, render);

// Initialize Keyboard Manager
attachKeyboardEvents(state, render, getFilteredTabs);

// Render "controlado" para evitar render em rajada
let renderQueued = false;
function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;

    // 1 render por ciclo
    queueMicrotask(() => {
        renderQueued = false;
        render();
    });
}

// Setup Socket Listeners
function setupSocketListeners() {
    // Evita listeners duplicados caso initApp rode mais de uma vez
    const events = [
        'tab:created',
        'tab:updated',
        'tab:deleted',
        'tab:item:added',
        'tab:item:updated',
        'tab:item:deleted',
    ];
    events.forEach(ev => socketService.removeAllListeners(ev));

    // 1. Tab Created
    socketService.on('tab:created', (newTab) => {
        if (!state.tabs.find(t => t.id === newTab.id)) {
            state.tabs.unshift(newTab);

            if (state.view === 'dashboard') {
                scheduleRender();
            }
        }
    });

    // 2. Tab Updated
    socketService.on('tab:updated', (updatedTab) => {
        const index = state.tabs.findIndex(t => t.id === updatedTab.id);

        if (index > -1) {
            state.tabs[index] = updatedTab;

            if (state.view === 'dashboard') {
                scheduleRender();
            } else if (state.view === 'detail' && state.selectedTabId === updatedTab.id) {
                scheduleRender();
            }
        } else if (updatedTab.status === 'open') {
            state.tabs.unshift(updatedTab);
            if (state.view === 'dashboard') scheduleRender();
        }

        if (state.view === 'history') {
            // History é fetch, não render direto
            fetchHistory(state, render);
        }
    });

    // 3. Tab Deleted
    socketService.on('tab:deleted', ({ id }) => {
        state.tabs = state.tabs.filter(t => t.id !== id);

        if (state.view === 'dashboard') {
            scheduleRender();
        } else if (state.view === 'detail' && state.selectedTabId === id) {
            alert('Esta comanda foi excluída por outro usuário.');
            state.view = 'dashboard';
            state.selectedTabId = null;
            scheduleRender();
        }

        if (state.view === 'history') {
            fetchHistory(state, render);
        }
    });

    // 4. Item Added/Updated/Deleted
    const handleItemUpdate = ({ tabId, tab }) => {
        const index = state.tabs.findIndex(t => t.id === tabId);
        if (index > -1) {
            state.tabs[index] = tab;

            if (state.view === 'detail' && state.selectedTabId === tabId) {
                scheduleRender();
            } else if (state.view === 'dashboard') {
                scheduleRender();
            }
        }
    };

    socketService.on('tab:item:added', handleItemUpdate);
    socketService.on('tab:item:updated', handleItemUpdate);
    socketService.on('tab:item:deleted', handleItemUpdate);
}


// Attach Login Events
function attachLoginEvents() {
    const loginBtn = document.querySelector('#google-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    }
}

// Initialize Application
async function initApp() {
    try {
        // Check authentication
        if (!isAuthenticated()) {
            state.isAuthenticated = false;
            render();
            return;
        }

        state.isAuthenticated = true;

        // Fetch current user
        const user = await fetchCurrentUser();
        if (!user) {
            state.isAuthenticated = false;
            render();
            return;
        }
        state.currentUser = user;

        // Initialize Socket
        socketService.connect();
        setupSocketListeners();

        // Fetch Initial Data
        const [tabs, products, clients, categories] = await Promise.all([
            api.getTabs({ status: 'open' }),
            api.getProducts(),
            api.getClients(),
            api.getCategories()
        ]);

        state.tabs = tabs;
        state.products = products;
        state.clients = clients;
        state.categories = categories;

        // Fetch Users if Admin
        if (state.currentUser && state.currentUser.role === 'admin') {
            api.getUsers().then(users => {
                state.users = users;
                render(); // Re-render to show users link/data
            }).catch(console.error);
        }

        render();
    } catch (error) {
        console.error('Erro ao inicializar:', error);
        // If error is auth-related, show login
        if (error.message.includes('autenticado')) {
            state.isAuthenticated = false;
            render();
        } else {
            alert('Erro ao carregar dados: ' + error.message);
        }
    } finally {
        console.log('App Initialized. State:', state);
    }
}

// Trata callback antes de iniciar o app
if (!handleCallback()) {
    initApp();
}

