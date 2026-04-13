import * as api from '../services/api.js';
import socketService from '../services/socket.js';
import { pushRoute } from './navigationManager.js';

let controller = null;

export function attachDashboardEvents(state, render, getFilteredTabs) {
    // mata listeners antigos (de render anterior)
    if (controller) controller.abort();
    controller = new AbortController();
    const { signal } = controller;

    const tabCards = document.querySelectorAll('.tab-card');

    tabCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // delete
            if (e.target.closest('.delete-tab-btn')) {
                e.stopPropagation();
                const id = parseInt(card.dataset.id);
                if (confirm(`Deseja excluir a comanda #${id}?`)) {
                    api.deleteTab(id)
                        .then(() => {
                            state.tabs = state.tabs.filter(t => t.id !== id);
                            render();
                        })
                        .catch(err => alert('Erro ao excluir comanda: ' + err.message));
                }
                return;
            }

            // open detail
            const id = parseInt(card.dataset.id);
            if (!isNaN(id)) {
                // clear old delay if navigating by mouse inside dashboardManager
                clearTimeout(searchTimeout);
                
                socketService.joinTab(id);
                state.selectedTabId = id;
                state.view = 'detail';
                state.searchTerm = ''; // Limpa filtro
                pushRoute('detail', id);
                state.detailItemIndex = -1;
                render();
            }
        }, { signal });

        // Hover to select
        card.addEventListener('mouseenter', () => {
            if (state.mouseNavEnabled === false) return;

            const filtered = getFilteredTabs();
            const index = filtered.findIndex(t => t.id === parseInt(card.dataset.id));

            if (index !== -1 && index !== state.selectedIndex) {
                state.selectedIndex = index;

                // update visuals without render
                document.querySelectorAll('.tab-card').forEach(c => {
                    c.style.border = '';
                    c.style.boxShadow = '';
                    c.style.transform = '';
                });

                card.style.border = '2px solid var(--color-primary)';
                card.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
                card.style.transform = 'translateY(-2px)';
            }
        }, { signal });
    });

    let searchTimeout = null;
    const searchInput = document.querySelector('#search-comanda');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            const val = e.target.value;
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Blindagem: se o timeout disparar mas o usuário já não estiver no dashboard, aborta.
                if (state.view !== 'dashboard') return;

                state.searchTerm = val;
                state.selectedIndex = 0;
                render();

                setTimeout(() => {
                    const newInput = document.querySelector('#search-comanda');
                    if (newInput) {
                        newInput.focus();
                        newInput.setSelectionRange(cursorPosition, cursorPosition);
                    }
                }, 0);
            }, 250);
        }, { signal });
    }

    const newTabBtn = document.querySelector('#new-tab-btn');
    const modal = document.querySelector('#new-tab-modal');
    const form = document.querySelector('#new-tab-form');
    const cancelBtn = document.querySelector('#cancel-new-tab-modal');

    if (newTabBtn && modal) {
        newTabBtn.addEventListener('click', () => {
            form?.reset?.();
            modal.classList.remove('hidden');
            const input = modal.querySelector('#new-tab-customer');
            if (input) setTimeout(() => input.focus(), 50);
        }, { signal });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        }, { signal });
    }

    let isCreatingTab = false;

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (isCreatingTab) return;

            const customerEl = document.querySelector('#new-tab-customer');
            const submitBtn = form.querySelector('button[type="submit"]');
            
            const customer = customerEl?.value;
            if (!customer) return;

            isCreatingTab = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Abrindo...';
            }

            api.createTab({ 
                customer, 
                section: state.dashboardSection
            })
                .then((newTab) => {
                    modal?.classList.add('hidden');

                    socketService.joinTab(newTab.id);
                    state.selectedTabId = newTab.id;
                    state.view = 'detail';
                    pushRoute('detail', newTab.id);
                    state.detailItemIndex = -1;

                    setTimeout(() => render(), 100);
                })
                .catch(err => alert('Erro ao criar comanda: ' + err.message))
                .finally(() => {
                    isCreatingTab = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Abrir Comanda';
                    }
                });
        }, { signal });
    }

    // Dashboard Section Tabs listener
    const sectionBtns = document.querySelectorAll('.dashboard-tab-btn');
    sectionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            if (section && state.dashboardSection !== section) {
                state.dashboardSection = section;
                state.selectedIndex = 0; // Reset selection index when changing tabs
                render();
            }
        }, { signal });
    });
}
