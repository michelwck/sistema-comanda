import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tabs - Listar todas as comandas
export const getAllTabs = async (req, res, next) => {
    try {
        const { status, customer } = req.query;

        const where = {};
        if (status) where.status = status;
        if (customer) {
            where.customer = {
                contains: customer,
                mode: 'insensitive'
            };
        }

        const tabs = await prisma.tab.findMany({
            where,
            include: {
                items: {
                    orderBy: { addedAt: 'desc' }
                },
                client: true
            },
            orderBy: { openedAt: 'desc' }
        });

        res.json(tabs);
    } catch (error) {
        next(error);
    }
};

// GET /api/tabs/:id - Buscar comanda específica
export const getTabById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const tab = await prisma.tab.findUnique({
            where: { id: parseInt(id) },
            include: {
                items: {
                    orderBy: { addedAt: 'desc' }
                },
                client: true
            }
        });

        if (!tab) {
            return res.status(404).json({ error: 'Comanda não encontrada' });
        }

        res.json(tab);
    } catch (error) {
        next(error);
    }
};

// POST /api/tabs - Criar nova comanda
export const createTab = async (req, res, next) => {
    try {
        const { customer, clientId } = req.body;

        if (!customer) {
            return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
        }

        const tab = await prisma.tab.create({
            data: {
                customer,
                clientId: clientId ? parseInt(clientId) : null,
                status: 'open',
                total: 0
            },
            include: {
                items: true,
                client: true
            }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('tab:created', tab);

        res.status(201).json(tab);
    } catch (error) {
        next(error);
    }
};

// PUT /api/tabs/:id - Atualizar comanda
export const updateTab = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { customer, status, clientId } = req.body;

        const updateData = {};
        if (customer !== undefined) updateData.customer = customer;
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'paid' || status === 'cancelled') {
                updateData.closedAt = new Date();
            }
        }
        if (clientId !== undefined) updateData.clientId = clientId ? parseInt(clientId) : null;

        const tab = await prisma.$transaction(async (tx) => {
            const updatedTab = await tx.tab.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: {
                    items: true,
                    client: true
                }
            });

            // Se for fechamento como Fiado, criar transação
            if (status === 'closed' && req.body.paymentMethod === 'fiado' && clientId) {
                await tx.clientTransaction.create({
                    data: {
                        clientId: parseInt(clientId),
                        tabId: parseInt(id),
                        amount: updatedTab.total, // Debt is positive
                        type: 'FIADO',
                        description: `Fiado - ${updatedTab.customer}`
                    }
                });
            }

            return updatedTab;
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('tab:updated', tab);

        res.json(tab);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/tabs/:id - Deletar comanda
export const deleteTab = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.tab.delete({
            where: { id: parseInt(id) }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('tab:deleted', { id: parseInt(id) });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// POST /api/tabs/:id/items - Adicionar item à comanda
export const addTabItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { productId, quantity, price, name } = req.body;

        if (!productId || !name || !price) {
            return res.status(400).json({
                error: 'productId, name e price são obrigatórios'
            });
        }

        // Criar o item
        const item = await prisma.tabItem.create({
            data: {
                tabId: parseInt(id),
                productId: parseInt(productId),
                name,
                price: parseFloat(price),
                quantity: quantity || 1
            }
        });

        // Atualizar total da comanda
        const tab = await prisma.tab.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });

        const newTotal = tab.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        const updatedTab = await prisma.tab.update({
            where: { id: parseInt(id) },
            data: { total: newTotal },
            include: {
                items: {
                    orderBy: { addedAt: 'desc' }
                },
                client: true
            }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('tab:item:added', { tabId: parseInt(id), item, tab: updatedTab });

        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

// PUT /api/tabs/:id/items/:itemId - Atualizar item
export const updateTabItem = async (req, res, next) => {
    try {
        const { id, itemId } = req.params;
        const { quantity, price } = req.body;

        const updateData = {};
        if (quantity !== undefined) updateData.quantity = parseInt(quantity);
        if (price !== undefined) updateData.price = parseFloat(price);

        const item = await prisma.tabItem.update({
            where: { id: parseInt(itemId) },
            data: updateData
        });

        // Atualizar total da comanda
        const tab = await prisma.tab.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });

        const newTotal = tab.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        const updatedTab = await prisma.tab.update({
            where: { id: parseInt(id) },
            data: { total: newTotal },
            include: {
                items: {
                    orderBy: { addedAt: 'desc' }
                },
                client: true
            }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('tab:item:updated', { tabId: parseInt(id), item, tab: updatedTab });

        res.json(item);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/tabs/:id/items/:itemId - Remover item
export const deleteTabItem = async (req, res, next) => {
    try {
        const { id, itemId } = req.params;

        await prisma.tabItem.delete({
            where: { id: parseInt(itemId) }
        });

        // Atualizar total da comanda
        const tab = await prisma.tab.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });

        const newTotal = tab.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        const updatedTab = await prisma.tab.update({
            where: { id: parseInt(id) },
            data: { total: newTotal },
            include: {
                items: {
                    orderBy: { addedAt: 'desc' }
                },
                client: true
            }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('tab:item:deleted', { tabId: parseInt(id), itemId: parseInt(itemId), tab: updatedTab });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
