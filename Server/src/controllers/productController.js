import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/products - Listar produtos
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category } = req.query;

        const where = {};
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            };
        }
        if (category) {
            // Fix: Filter by category name in related model
            where.category = {
                name: category
            };
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { category: true }
        });

        res.json(products);
    } catch (error) {
        next(error);
    }
};

// GET /api/products/:id - Buscar produto específico
export const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
};

// POST /api/products - Criar produto
export const createProduct = async (req, res, next) => {
    try {
        const { name, price, category } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                error: 'name, price e category são obrigatórios'
            });
        }

        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                // Fix: Handle category relation
                category: {
                    connectOrCreate: {
                        where: { name: category },
                        create: { name: category }
                    }
                }
            },
            include: { category: true }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('product:created', product);

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// PUT /api/products/:id - Atualizar produto
export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, category } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (category !== undefined) {
            // Fix: Handle category update
            updateData.category = {
                connectOrCreate: {
                    where: { name: category },
                    create: { name: category }
                }
            };
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { category: true }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('product:updated', product);

        res.json(product);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/products/:id - Deletar produto
export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        // Emitir evento Socket.io
        const io = req.app.get('io');
        io.emit('product:deleted', { id: parseInt(id) });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
