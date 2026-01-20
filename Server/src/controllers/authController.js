import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        picture: user.picture,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

    return token;
};

export const getCurrentUser = async (req, res) => {
    try {
        // User is already attached by authMiddleware
        const { id, email, name, picture, role, isActive } = req.user;

        res.json({
            user: {
                id,
                email,
                name,
                picture,
                role,
                isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
};
