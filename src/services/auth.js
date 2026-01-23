// Token management
export const getToken = () => {
    return localStorage.getItem('auth_token');
};

export const setToken = (token) => {
    localStorage.setItem('auth_token', token);
};

export const clearToken = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds

        if (Date.now() >= exp) {
            clearToken();
            return false;
        }

        return true;
    } catch (error) {
        clearToken();
        return false;
    }
};

// Get current user from token
export const getCurrentUser = () => {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            name: payload.name,
            picture: payload.picture,
        };
    } catch (error) {
        return null;
    }
};

// Fetch full user details from API
export const fetchCurrentUser = async () => {
    // Disable caching to ensure role updates are reflected immediately
    // const cached = localStorage.getItem('current_user');
    // if (cached) {
    //     return JSON.parse(cached);
    // }

    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const BASE_URL = API_URL.replace(/\/api$/, '');

        const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        localStorage.setItem('current_user', JSON.stringify(data.user));
        return data.user;
    } catch (error) {
        console.error('Error fetching user:', error);
        // DEBUG: Alert user if fetch fails
        alert('Erro ao buscar perfil do usuário: ' + error.message);
        return null;
    }
};

// Logout
export const logout = () => {
    clearToken();
    window.location.href = '/';
};
