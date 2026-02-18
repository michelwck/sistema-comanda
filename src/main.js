import './style.css'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { TabDetail } from './components/TabDetail'
import { ClientList } from './components/ClientList'
import { ProductList } from './components/ProductList'
import { FiadoControl } from './components/FiadoControl'
import { HistoryList } from './components/HistoryList'
import { UserList } from './components/UserList'
import { CategoryList } from './components/CategoryList'
import { Login } from './components/Login'
import * as api from './services/api'
import { isAuthenticated, logout, fetchCurrentUser, setToken } from './services/auth'

// Handle Callback (Token parsing from URL)
if (window.location.pathname === '/callback') {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const error = url.searchParams.get('error');

    if (token) {
        setToken(token);

        // Remove token da URL (histórico)
        url.searchParams.delete('token');
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname);

        // Vai pra home e inicia app do zero já autenticado
        window.location.href = '/';
    } else if (error) {
        alert('Erro no login: ' + error);
        window.history.replaceState({}, document.title, '/');
        window.location.href = '/';
    }
}

import { normalizeString } from './utils/helpers.js'
import { attachDashboardEvents } from './managers/dashboardManager.js'
import { attachDetailEvents } from './managers/detailManager.js'
import { attachFiadoEvents, attachFiadoDetailEvents } from './managers/fiadoManager.js'
import { fetchHistory, attachHistoryEvents } from './managers/historyManager.js'
import { attachProductEvents, attachClientEvents } from './managers/adminManager.js'
import { attachUserEvents } from './managers/userManager.js'
import { attachCategoryEvents } from './managers/categoryManager.js'
import socketService from './services/socket.js'

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
        if (state.view === 'dashboard') {
            contentHtml = Dashboard({
                tabs: getFilteredTabs(),
                selectedIndex: state.selectedIndex,
                searchTerm: state.searchTerm,
                currentUser: state.currentUser
            });
        } else if (state.view === 'detail') {
            const tab = state.tabs.find(t => t.id === state.selectedTabId);
            contentHtml = TabDetail({
                tab,
                itemIndex: state.detailItemIndex,
                quickAddSearch: state.quickAddSearch,
                quickAddSelectedIndex: state.quickAddSelectedIndex,
                showDropdown: !!state.quickAddSearch
            });
        } else if (state.view === 'clients') {
            contentHtml = ClientList({ clients: state.clients });
        } else if (state.view === 'products') {
            contentHtml = ProductList({ products: state.products, categories: state.categories });
        } else if (state.view === 'fiado') {
            const term = normalizeString(state.fiadoSearchTerm);
            const displayClients = state.fiadoSearchTerm
                ? state.clients.filter(c => normalizeString(c.name).includes(term))
                : state.clients.filter(c => parseFloat(c.balance || 0) > 0.01 || c.id === state.fiadoSelectedClientId);

            contentHtml = FiadoControl({
                clients: displayClients,
                selectedClientId: state.fiadoSelectedClientId,
                transactions: state.fiadoTransactions
            });
        } else if (state.view === 'fiado-detail') {
            contentHtml = TabDetail({
                tab: state.tempTab,
                readOnly: true
            });
        } else if (state.view === 'history') {
            contentHtml = HistoryList({
                historyTabs: state.historyTabs,
                filters: state.historyFilters,
                clients: state.clients
            });
        } else if (state.view === 'users') {
            contentHtml = UserList({ users: state.users });
        } else if (state.view === 'categories') {
            contentHtml = CategoryList({ categories: state.categories });
        }
    } catch (error) {
        console.error('Render Error:', error);
        contentHtml = `<div style="padding: 2rem; color: red;"><h2>Erro ao renderizar tela</h2><pre>${error.message}\n${error.stack}</pre></div>`;
    }

    // 4. Update DOM (Sidebar logic...)

    // 4. Update DOM
    // Ensure App Shell exists
    if (!document.querySelector('.app-container')) {
        app.innerHTML = `
            <div class="app-container">
                <main class="main-content"></main>
                <button id="mobile-menu-btn" class="mobile-menu-btn">
                    <span>☰</span>
                </button>
            </div>
        `;
    }

    const sidebarHtml = Sidebar(state.view, state.currentUser);
    const existingSidebar = document.querySelector('.sidebar');

    if (existingSidebar) {
        existingSidebar.outerHTML = sidebarHtml;
        const newSidebar = document.querySelector('#main-sidebar');
        if (state.isSidebarCollapsed) {
            newSidebar.classList.add('collapsed');
        }
    } else {
        document.querySelector('.app-container').insertAdjacentHTML('afterbegin', sidebarHtml);
        const newSidebar = document.querySelector('#main-sidebar');
        if (state.isSidebarCollapsed) {
            newSidebar.classList.add('collapsed');
        }
    }
    // Fallback if still empty
    if (!contentHtml) {
        contentHtml = `<div style="padding: 2rem; color: orange;"><h2>Debug: Content is Empty</h2><p>View: ${state.view}</p></div>`;
    }

    document.querySelector('.main-content').innerHTML = contentHtml;


    attachEvents();
    attachGlobalEvents();
}

function attachGlobalEvents() {
    // Sidebar Toggle
    const toggleBtn = document.querySelector('#sidebar-toggle-btn');
    if (toggleBtn) {
        // Clone to remove old listeners
        const newBtn = toggleBtn.cloneNode(true);
        if (toggleBtn.parentNode) {
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

            newBtn.addEventListener('click', () => {
                const sidebar = document.querySelector('#main-sidebar');
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                } else {
                    state.isSidebarCollapsed = !state.isSidebarCollapsed;
                    localStorage.setItem('sidebar_collapsed', state.isSidebarCollapsed);
                    if (sidebar) {
                        sidebar.classList.toggle('collapsed', state.isSidebarCollapsed);
                    }
                }
            });
        }
    }

    // Mobile Menu Button (Hamburger)
    const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
    if (mobileMenuBtn) {
        const newMobileBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newMobileBtn, mobileMenuBtn);

        newMobileBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('#main-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }

    // Sidebar Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            console.log('Navigating to:', view);
            if (view) {
                state.view = view;
                // Reset states
                state.searchTerm = '';
                state.selectedIndex = 0;
                state.selectedTabId = null;
                state.fiadoSelectedClientId = null;
                state.fiadoTransactions = null;
                if (view === 'history') fetchHistory(state, render);
                if (window.innerWidth <= 768) {
                    const sidebar = document.querySelector('#main-sidebar');
                    if (sidebar) sidebar.classList.remove('mobile-open');
                }
                render();
            }
        });
    });

    // Sidebar Collapsibles
    document.querySelectorAll('.nav-group-title').forEach(title => {
        title.addEventListener('click', () => {
            const content = title.nextElementSibling;
            if (content) {
                content.classList.toggle('hidden');
                const arrow = title.querySelector('.arrow');
                if (arrow) {
                    arrow.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            }
        });
    });

    // Logout Button
    const logoutBtn = document.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Deseja realmente sair?')) {
                logout();
            }
        });
    }
}

function attachEvents() {
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

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Block global shortcuts if ANY modal is open
    const openModal = document.querySelector('.modal-overlay:not(.hidden)');
    if (openModal) {
        // If it's Escape, we let it pass to the specific Escape handler below
        if (e.key !== 'Escape' && e.key !== 'Enter') return;

        // Actually, we should allow default behavior (typing in inputs) but block dashboard navigation
        // If Enter is pressed inside a form, let it bubble securely, but don't trigger dashboard actions.
        // The dashboard actions are inside the `if (state.view === 'dashboard')` block below.
        // So checking openModal inside specific blocks or at top level is key.
    }
    // F2: Focus Search
    if (e.key === 'F2') {
        e.preventDefault();
        if (state.view === 'dashboard') {
            const searchInput = document.querySelector('#search-comanda');
            if (searchInput) searchInput.focus();
        }
        return;
    }

    // F6: New Tab
    if (e.key === 'F6') {
        e.preventDefault();
        if (state.view === 'dashboard') {
            const btn = document.querySelector('#new-tab-btn');
            if (btn) btn.click();
        }
        return;
    }

    // F4: Payment (Detail View)
    if (e.key === 'F4') {
        if (state.view === 'detail') {
            e.preventDefault();
            const payBtn = document.querySelector('#open-payment-modal-btn');
            if (payBtn) payBtn.click();

            // Auto focus confirm button in modal (after short delay for render)
            const paymentModal = document.querySelector('#payment-modal');
            if (paymentModal) {
                paymentModal.classList.remove('hidden');
                // Focus on Confirm button for quick Enter
                setTimeout(() => {
                    document.querySelector('#confirm-payment-btn').focus();
                }, 50);
            }
        }
        return;
    }

    // F key for Fiado (only when payment modal is open)
    if (e.key.toLowerCase() === 'f') {
        const paymentModal = document.querySelector('#payment-modal:not(.hidden)');
        if (paymentModal) {
            e.preventDefault();
            document.querySelector('#fiado-btn').click();
            return;
        }
    }

    // ESC: Back / Close Modal
    if (e.key === 'Escape') {
        e.preventDefault();

        // Check for modals first
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
            openModal.classList.add('hidden');
            return;
        }

        if (state.view === 'detail') {
            const oldTabId = state.selectedTabId;

            socketService.leaveTab(oldTabId); // 🔥 sai da room

            state.selectedTabId = null;
            state.view = 'dashboard';
            render();
            return;
        }


        if (state.view === 'dashboard' && state.searchTerm) {
            state.searchTerm = '';
            state.selectedIndex = 0;
            render();
            return;
        }

        if (state.view === 'history') {
            // Optional: clear filters
            return;
        }
    }

    if (e.defaultPrevented && e.key !== 'Escape') return;

    // Detail View Item Navigation (When input not focused)
    if (state.view === 'detail' && state.detailItemIndex !== -1) {
        const quickAddSearch = document.querySelector('#quick-add-search');
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        const activeElement = document.activeElement;

        // If not typing in search and no modal is open
        if (activeElement !== quickAddSearch && !openModal) {
            const currentTab = state.tabs.find(t => t.id === state.selectedTabId);

            if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                // Arrow Up = Previous Item (Index Decrease)
                if (state.detailItemIndex === 0) {
                    state.detailItemIndex = -1;
                    render();
                    if (quickAddSearch) quickAddSearch.focus();
                    return;
                }
                state.detailItemIndex = Math.max(state.detailItemIndex - 1, 0);
                render();
                return;
            }

            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                // Arrow Down = Next Item (Index Increase)
                if (currentTab) {
                    const items = currentTab.items || [];
                    if (items.length === 0) return;

                    // Check if we are at the bottom (oldest item, max index)
                    state.detailItemIndex = Math.min(state.detailItemIndex + 1, items.length - 1);
                    render();
                }
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentTab) {
                    const item = (currentTab.items || [])[state.detailItemIndex];
                    if (item) {
                        const editModal = document.querySelector('#edit-item-modal');
                        if (editModal) {
                            document.querySelector('#edit-item-index').value = state.detailItemIndex;
                            document.querySelector('#edit-item-name').value = item.name;
                            document.querySelector('#edit-item-price').value = item.price;
                            document.querySelector('#edit-item-quantity').value = item.quantity;

                            editModal.classList.remove('hidden');
                            setTimeout(() => {
                                const qty = document.querySelector('#edit-item-quantity');
                                if (qty) {
                                    qty.focus();
                                    qty.select();
                                }
                            }, 50);
                        }
                    }
                }
                return;
            }

            if (e.key === 'Delete') {
                e.preventDefault();
                // Trigger removal
                if (currentTab) {
                    const item = currentTab.items[state.detailItemIndex];
                    if (item && confirm(`Remover ${item.name}?`)) {
                        api.deleteTabItem(currentTab.id, item.id)
                            .then(() => api.getTabById(currentTab.id))
                            .then(updatedTab => {
                                const idx = state.tabs.findIndex(t => t.id === updatedTab.id);
                                if (idx > -1) state.tabs[idx] = updatedTab;
                                render();
                            })
                            .catch(err => alert('Erro ao remover item: ' + err.message));
                    }
                }
                return;
            }
        }
    }

    // Dashboard Navigation (Arrows / Enter / Tab)
    if (state.view === 'dashboard') {
        // Prevent dashboard navigation if a modal is open
        if (document.querySelector('.modal-overlay:not(.hidden)')) return;

        const filteredTabs = getFilteredTabs();
        const searchInput = document.querySelector('#search-comanda');
        const activeElement = document.activeElement;

        if (activeElement === searchInput && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey))) {
            e.preventDefault();
            searchInput.blur();
            state.selectedIndex = 0;
            render();
            return;
        }

        if (activeElement !== searchInput) {
            if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                if (state.selectedIndex < filteredTabs.length - 1) {
                    state.selectedIndex++;
                    render();
                }
            } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                if (state.selectedIndex > 0) {
                    state.selectedIndex--;
                    render();
                } else {
                    // Back to search
                    state.selectedIndex = 0;
                    render();
                    if (searchInput) searchInput.focus();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                // Jump by row (approx 4? or just next)
                if (state.selectedIndex + 4 < filteredTabs.length) {
                    state.selectedIndex += 4;
                    render();
                } else {
                    state.selectedIndex = filteredTabs.length - 1;
                    render();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (state.selectedIndex - 4 >= 0) {
                    state.selectedIndex -= 4;
                    render();
                } else {
                    state.selectedIndex = 0;
                    render();
                    if (searchInput) searchInput.focus();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const tab = filteredTabs[state.selectedIndex];
                if (tab) {
                    state.selectedTabId = tab.id;
                    state.view = 'detail';
                    state.detailItemIndex = -1;

                    socketService.joinTab(tab.id); // 🔥 entra na room

                    render();
                }
            }
        }
    }
});

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

// Initial Render
initApp();
