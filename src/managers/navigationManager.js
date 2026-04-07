export function pushRoute(view, id = null) {
    let path = '/dashboard';
    if (view === 'detail' && id) {
        path = `/tabs/${id}`;
    } else if (view && view !== 'dashboard') {
        // Fallbacks para outras views se existirem rotas diretas futuramente
        path = `/${view}`;
    }

    if (window.location.pathname !== path) {
        history.pushState({ view, id }, '', path);
    }
}

export function replaceRoute(view, id = null) {
    let path = '/dashboard';
    if (view === 'detail' && id) {
        path = `/tabs/${id}`;
    } else if (view && view !== 'dashboard') {
        path = `/${view}`;
    }

    if (window.location.pathname !== path) {
        history.replaceState({ view, id }, '', path);
    }
}

export function restoreStateFromUrl(state) {
    const path = window.location.pathname;

    // 1. Limpa contaminações cruzadas antes de injetar roteamento (Ex: Fiado vs Comandas)
    state.selectedTabId = null;
    state.selectedClientId = null;

    if (path.startsWith('/tabs/')) {
        const id = Number(path.split('/')[2]);
        if (id) {
            state.view = 'detail';
            state.selectedTabId = id;
            return true;
        }
    } else if (path === '/history') {
        state.view = 'history';
        return true;
    } else if (path === '/fiado') {
        state.view = 'fiado';
        return true;
    } else if (path.startsWith('/fiado/')) {
        const id = Number(path.split('/')[2]);
        if (id) {
            state.view = 'fiado-detail';
            state.selectedClientId = id;
            return true;
        }
    }

    // 4. Default estrito e Normalização de Rota Fantasma
    state.view = 'dashboard';
    if (path !== '/dashboard' && path !== '/') {
        history.replaceState({ view: 'dashboard' }, '', '/dashboard');
    }
    
    return true;
}

export function attachNavigationEvents(state, render) {
    window.addEventListener('popstate', () => {
        restoreStateFromUrl(state);
        render();
    });
}
