import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all categories
export async function getCategories(req, res) {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
}

// Create category
export async function createCategory(req, res) {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }

        const category = await prisma.category.create({
            data: { name: name.trim() }
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Categoria com este nome já existe' });
        }
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
}

// Update category
export async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name: name.trim() }
        });

        res.json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Categoria com este nome já existe' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
}

// Delete category
export async function deleteCategory(req, res) {
    try {
        const { id } = req.params;

        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId: parseInt(id) }
        });

        if (productsCount > 0) {
            return res.status(400).json({ 
                error: `Não é possível excluir esta categoria pois existem ${productsCount} produto(s) associado(s)` 
            });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
}
