import { getToken, clearToken } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Função auxiliar para fazer requisições
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    // Get auth token
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
            clearToken();
            window.location.href = '/';
            throw new Error('Não autenticado');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        // Para DELETE que retorna 204
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// ============================================
// TABS (Comandas)
// ============================================

export async function getTabs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.customer) params.append('customer', filters.customer);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/tabs${query}`);
}

export async function getTabById(id) {
    return fetchAPI(`/tabs/${id}`);
}

export async function createTab(data) {
    return fetchAPI('/tabs', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateTab(id, data) {
    return fetchAPI(`/tabs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteTab(id) {
    return fetchAPI(`/tabs/${id}`, {
        method: 'DELETE'
    });
}

export async function addTabItem(tabId, itemData) {
    return fetchAPI(`/tabs/${tabId}/items`, {
        method: 'POST',
        body: JSON.stringify(itemData)
    });
}

export async function updateTabItem(tabId, itemId, data) {
    return fetchAPI(`/tabs/${tabId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteTabItem(tabId, itemId) {
    return fetchAPI(`/tabs/${tabId}/items/${itemId}`, {
        method: 'DELETE'
    });
}

// ============================================
// PRODUCTS (Produtos)
// ============================================

export async function getProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/products${query}`);
}

export async function getProductById(id) {
    return fetchAPI(`/products/${id}`);
}

export async function createProduct(data) {
    return fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateProduct(id, data) {
    return fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteProduct(id) {
    return fetchAPI(`/products/${id}`, {
        method: 'DELETE'
    });
}

// ============================================
// CLIENTS (Clientes)
// ============================================

export async function getClients(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/clients${query}`);
}

export async function getClientById(id) {
    return fetchAPI(`/clients/${id}`);
}

export async function createClient(data) {
    return fetchAPI('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateClient(id, data) {
    return fetchAPI(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteClient(id) {
    return fetchAPI(`/clients/${id}`, {
        method: 'DELETE'
    });
}

export async function getClientTransactions(clientId) {
    return fetchAPI(`/clients/${clientId}/transactions`);
}

export async function createClientTransaction(clientId, data) {
    return fetchAPI(`/clients/${clientId}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ============================================
// USERS (Usuários do Sistema)
// ============================================

export async function getUsers() {
    return fetchAPI('/users');
}

export async function createUser(data) {
    return fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateUser(id, data) {
    return fetchAPI(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteUser(id) {
    return fetchAPI(`/users/${id}`, {
        method: 'DELETE'
    });
}
