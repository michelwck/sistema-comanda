export const errorHandler = (err, req, res, next) => {
    console.error('Erro:', err);

    // Erro do Prisma
    if (err.code) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                error: 'Registro duplicado',
                message: 'Já existe um registro com esses dados'
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: 'Não encontrado',
                message: 'Registro não encontrado'
            });
        }
    }

    // Erro de validação
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Erro de validação',
            message: err.message
        });
    }

    // Erro genérico
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
