import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '/'

class SocketService {
    constructor() {
        this.socket = null
        this.listeners = new Map()
        this.currentTabId = null
        this.recoveryCallback = null
        this.wasConnected = false
    }

    ensureConnected() {
        if (this.socket?.connected) return this.socket
        return this.connect()
    }

    joinTab(tabId) {
        const normalizedTabId = Number(tabId)
        if (!Number.isInteger(normalizedTabId)) return

        this.currentTabId = normalizedTabId

        const s = this.ensureConnected()
        if (!s) return
        s.emit('tab:join', { tabId: normalizedTabId })
    }

    leaveTab(tabId) {
        const normalizedTabId = Number(tabId)
        if (!Number.isInteger(normalizedTabId)) return
        if (!this.socket) return
        this.socket.emit('tab:leave', { tabId: normalizedTabId })
        if (this.currentTabId === normalizedTabId) {
            this.currentTabId = null
        }
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
            reconnectionAttempts: Infinity,
            auth: { token },
        })

        this.socket.on('connect', () => {
             console.log('🟢 Socket.io conectado')
             if (this.wasConnected) {
                 // Fallback: se o evento 'reconnect' do manager falhar, chamamos por precaução
                 setTimeout(() => this.handleReconnect(), 500)
             }
             this.wasConnected = true
        })

        this.socket.io.on('reconnect', (attempt) => {
             console.log(`🔄 Socket.io reconectado via manager após ${attempt} tentativas`)
             setTimeout(() => this.handleReconnect(), 500)
        })

        this.socket.on('disconnect', () => console.log('🔴 Socket.io desconectado'))
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
        this.wasConnected = false
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

    handleReconnect() {
        if (!this.socket) return
        this.restoreRooms()
        // No mobile, sempre que reconectar, vamos refazer fetch do estado atual,
        // garantindo que itens adicionados offline por outros devices apareçam
        if (typeof this.recoveryCallback === 'function') {
            this.recoveryCallback()
        }
    }

    restoreRooms() {
        if (!this.currentTabId) return
        if (!this.socket) return
        this.socket.emit('tab:join', { tabId: this.currentTabId })
    }

    setRecoveryCallback(callback) {
        this.recoveryCallback = callback
    }
}

export default new SocketService()


