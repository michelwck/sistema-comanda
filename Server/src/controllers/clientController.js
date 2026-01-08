import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/clients - Listar clientes
export const getAllClients = async (req, res, next) => {
    try {
        const { search } = req.query;

        const where = {};
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            };
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        res.json(clients);
    } catch (error) {
        next(error);
    }
};

// GET /api/clients/:id - Buscar cliente específico
export const getClientById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: {
                tabs: {
                    orderBy: { openedAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        res.json(client);
    } catch (error) {
        next(error);
    }
};

// POST /api/clients - Criar cliente
export const createClient = async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const client = await prisma.client.create({
            data: {
                name,
                email: email || null,
                phone: phone || null
            }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('client:created', client);

        res.status(201).json(client);
    } catch (error) {
        next(error);
    }
};

// PUT /api/clients/:id - Atualizar cliente
export const updateClient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email || null;
        if (phone !== undefined) updateData.phone = phone || null;

        const client = await prisma.client.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('client:updated', client);

        res.json(client);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/clients/:id - Deletar cliente
export const deleteClient = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.client.delete({
            where: { id: parseInt(id) }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('client:deleted', { id: parseInt(id) });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
