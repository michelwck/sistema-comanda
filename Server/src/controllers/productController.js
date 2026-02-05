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
        if (category) where.category = category;

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
                // Se category (string) for enviado, precisamos buscar ou criar a categoria
                // Mas o frontend agora deve enviar categoryId se selecionado, ou o nome se novo?
                // Vamos assumir que o frontend envia categoryId se for select, ou o nome se for texto (legacy)
                // O schema pede categoryId Int.
                // Ajuste rápido: Se o frontend envia string em 'category', precisamos converter
                // Mas vamos checar se é número
                categoryId: isNaN(parseInt(category)) ? undefined : parseInt(category)
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
             const catId = parseInt(category);
             if (!isNaN(catId)) updateData.categoryId = catId;
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
