import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('📋 LISTA DE USUÁRIOS NO BANCO:');
    console.table(users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.isActive
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
