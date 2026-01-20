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
            orderBy: { name: 'asc' },
            include: { transactions: true }
        });

        // Calculate balance for each client
        const clientsWithBalance = clients.map(c => {
            const balance = c.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
            // We can strip transactions here if we want list to be light, or keep them.
            // Keeping them might be heavy if history is long. Let's strip them for list view.
            const { transactions, ...clientData } = c;
            return { ...clientData, balance };
        });

        res.json(clientsWithBalance);
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
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Limit history initially
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Calculate total balance
        const allTransactions = await prisma.clientTransaction.findMany({
            where: { clientId: parseInt(id) }
        });
        const balance = allTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

        res.json({ ...client, balance });
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

// GET /api/clients/:id/transactions
export const getClientTransactions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const transactions = await prisma.clientTransaction.findMany({
            where: { clientId: parseInt(id) },
            orderBy: { createdAt: 'asc' }, // Ascending for ledger
            include: { tab: true }
        });
        res.json(transactions);
    } catch (error) {
        next(error);
    }
};

// POST /api/clients/:id/transactions - Criar transação manual (Pagamento ou Dívida)
export const createClientTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, type, description } = req.body; // amount can be negative for payment

        const transaction = await prisma.clientTransaction.create({
            data: {
                clientId: parseInt(id),
                amount: parseFloat(amount),
                type,
                description
            }
        });

        // Get updated client balance
        const allTransactions = await prisma.clientTransaction.findMany({
            where: { clientId: parseInt(id) }
        });
        const balance = allTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

        // Emit update event
        const io = req.app.get('io');
        io.emit('client:balance:updated', { clientId: parseInt(id), balance });

        res.status(201).json(transaction);
    } catch (error) {
        next(error);
    }
};
