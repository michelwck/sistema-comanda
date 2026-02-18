import socketService from './socket';

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

export const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) return null;

    try {
        // Agora que o Nginx encaminha /auth, use caminho relativo
        const response = await fetch('/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Token inválido/expirado/sem permissão
        if (response.status === 401 || response.status === 403) {
            clearToken();
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch user (${response.status})`);
        }

        const data = await response.json();
        localStorage.setItem('current_user', JSON.stringify(data.user));
        return data.user;
    } catch (error) {
        console.error('Error fetching user:', error);
        // Sem alert — só retorna null e a tela de login aparece
        return null;
    }
};


// Logout
export const logout = () => {
    socketService.disconnect();
    clearToken();
    window.location.href = '/';
};
