// src/core/handleCallback.js
import { setToken } from '../services/auth.js';

export function handleCallback() {
    // Só roda se estiver na rota /callback
    if (window.location.pathname !== '/callback') return false;

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
        return true; // (só por padrão; aqui já redirecionou)
    }

    if (error) {
        alert('Erro no login: ' + error);
        window.history.replaceState({}, document.title, '/');
        window.location.href = '/';
        return true;
    }

    // Se caiu aqui, era /callback mas sem token e sem error
    window.location.href = '/';
    return true;
}
