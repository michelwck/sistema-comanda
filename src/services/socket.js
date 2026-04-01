import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '/'

class SocketService {
    constructor() {
        this.socket = null
        this.listeners = new Map()
    }

    ensureConnected() {
        if (this.socket?.connected) return this.socket
        return this.connect()
    }

    joinTab(tabId) {
        const normalizedTabId = Number(tabId)
        if (!Number.isInteger(normalizedTabId)) return

        const s = this.ensureConnected()
        if (!s) return
        s.emit('tab:join', { tabId: normalizedTabId })
    }

    leaveTab(tabId) {
        const normalizedTabId = Number(tabId)
        if (!Number.isInteger(normalizedTabId)) return
        if (!this.socket) return
        this.socket.emit('tab:leave', { tabId: normalizedTabId })
    }

    connect() {
        if (this.socket?.connected) return this.socket

        const token = localStorage.getItem('auth_token')
        if (!token) {
            console.warn('Socket não conectou: token ausente')
            this.socket = null
            return null
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            auth: { token },
        })

        this.socket.on('connect', () => console.log('✅ Socket.io conectado'))
        this.socket.on('disconnect', () => console.log('❌ Socket.io desconectado'))
        this.socket.on('connect_error', (error) =>
            console.error('Erro de conexão Socket.io:', error)
        )

        return this.socket
    }

    disconnect() {
        if (!this.socket) return
        this.socket.disconnect()
        this.socket = null
        this.listeners.clear()
    }

    on(event, callback) {
        const s = this.ensureConnected()
        if (!s) return

        if (!this.listeners.has(event)) this.listeners.set(event, [])
        this.listeners.get(event).push(callback)

        s.on(event, callback)
    }

    off(event, callback) {
        if (!this.socket) return
        this.socket.off(event, callback)

        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event)
            const index = callbacks.indexOf(callback)
            if (index > -1) callbacks.splice(index, 1)
            if (callbacks.length === 0) this.listeners.delete(event)
        }
    }

    removeAllListeners(event) {
        if (!this.socket) return
        this.socket.removeAllListeners(event)
        this.listeners.delete(event)
    }
}

export default new SocketService()
