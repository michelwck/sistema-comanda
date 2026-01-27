import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        allowedHosts: true,
        host: true, // Listen on all addresses, including LAN and public IP
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
            '/auth': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    }
});
