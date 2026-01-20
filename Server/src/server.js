import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import tabRoutes from './routes/tabs.js';
import productRoutes from './routes/products.js';
import clientRoutes from './routes/clients.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import './config/passport.js'; // Initialize Passport config

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://69.169.109.119:5173'
        ].filter(Boolean),
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Disponibilizar io para as rotas
app.set('io', io);

// Public routes
app.use('/auth', authRoutes);

// Protected API routes (require authentication)
app.use('/api/tabs', authMiddleware, tabRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/users', userRoutes); // Already has auth middleware inside

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Socket.io habilitado`);
});
