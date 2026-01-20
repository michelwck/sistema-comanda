import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};

// Create new user (admin only)
export const createUser = async (req, res) => {
    try {
        const { email, name, role = 'operator' } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email e nome são obrigatórios' });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        const user = await prisma.user.create({
            data: {
                email,
                name,
                role,
                isActive: true,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, isActive } = req.body;

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(role && { role }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json(user);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
        }

        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
};
