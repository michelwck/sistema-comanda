import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '/';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket?.connected) return this.socket;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.warn('Socket não conectou: token ausente');
            return null;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            auth: { token },
        });

        console.log('SOCKET_URL =>', SOCKET_URL);
        console.log('TOKEN =>', token);

        this.socket.on('connect', () => console.log('✅ Socket.io conectado'));
        this.socket.on('disconnect', () => console.log('❌ Socket.io desconectado'));
        this.socket.on('connect_error', (error) => console.error('Erro de conexão Socket.io:', error));

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, callback) {
        if (!this.socket) this.connect();
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) return;
        this.socket.off(event, callback);
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    }

    removeAllListeners(event) {
        if (!this.socket) return;
        this.socket.removeAllListeners(event);
        this.listeners.delete(event);
    }
}

export default new SocketService();
