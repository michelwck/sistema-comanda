// src/managers/globalEventsManager.js
import { logout } from '../services/auth.js';
import { fetchHistory } from './historyManager.js';

let isBound = false;

export function attachGlobalEvents(state, render) {
    if (isBound) return;
    isBound = true;

    document.addEventListener('click', (e) => {
        // Sidebar Toggle
        if (e.target.closest('#sidebar-toggle-btn')) {
            const sidebar = document.querySelector('#main-sidebar');
            if (!sidebar) return;

            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                state.isSidebarCollapsed = !state.isSidebarCollapsed;
                localStorage.setItem('sidebar_collapsed', state.isSidebarCollapsed);
                sidebar.classList.toggle('collapsed', state.isSidebarCollapsed);
            }
            return;
        }

        // Mobile Menu
        if (e.target.closest('#mobile-menu-btn')) {
            const sidebar = document.querySelector('#main-sidebar');
            if (sidebar) sidebar.classList.toggle('mobile-open');
            return;
        }

        // Logout
        if (e.target.closest('#logout-btn')) {
            if (confirm('Deseja realmente sair?')) logout();
            return;
        }

        // Sidebar Navigation
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            e.preventDefault();
            const view = navItem.dataset.view;
            if (!view) return;

            state.view = view;
            state.searchTerm = '';
            state.selectedIndex = 0;
            state.selectedTabId = null;
            state.fiadoSelectedClientId = null;
            state.fiadoTransactions = [];

            if (view === 'history') fetchHistory(state, render);

            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('#main-sidebar');
                if (sidebar) sidebar.classList.remove('mobile-open');
            }

            render();
            return;
        }

        // Collapsible Groups
        const groupTitle = e.target.closest('.nav-group-title');
        if (groupTitle) {
            const content = groupTitle.nextElementSibling;
            if (!content) return;

            content.classList.toggle('hidden');

            const arrow = groupTitle.querySelector('.arrow');
            if (arrow) {
                arrow.style.transform = content.classList.contains('hidden')
                    ? 'rotate(0deg)'
                    : 'rotate(180deg)';
            }
        }
    });
}
