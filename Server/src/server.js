import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import tabRoutes from './routes/tabs.js';
import productRoutes from './routes/products.js';
import clientRoutes from './routes/clients.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import './config/passport.js'; // Initialize Passport config

dotenv.config();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://zerosetebar.com.br',
    'https://www.zerosetebar.com.br',
];

const corsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
        return callback(null, true);
    }
    return callback(new Error('Bloqueado pelo CORS'), false);
};

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
});

io.use((socket, next) => {
    console.log('SOCKET HEADERS AUTH:', socket.handshake.headers?.authorization);
    console.log('SOCKET AUTH OBJ:', socket.handshake.auth);


    try {
        const authToken = socket.handshake.auth?.token;

        // fallback: Authorization header
        const header = socket.handshake.headers?.authorization;
        const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;

        const token = authToken || headerToken;

        if (!token) return next(new Error('unauthorized'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        return next();
    } catch {
        return next(new Error('unauthorized'));
    }
});


// Middleware
app.use(cors({
    origin: corsOrigin,
    credentials: true,
}));
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
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/users', userRoutes); // Already has auth middleware inside

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Socket.io connection
io.on('connection', (socket) => {
    socket.join('tabs:open');

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Socket.io habilitado`);
});
