import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'michel.wck@gmail.com'; // SEU EMAIL AQUI
    console.log(`🔍 Procurando usuário: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('❌ Usuário não encontrado! Logue uma vez com o Google primeiro.');
        return;
    }

    console.log(`👤 Usuário encontrado: ${user.name} (${user.role})`);

    // Force Update to Admin
    const updated = await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
    });

    console.log(`✅ SUCESSO! Papel atualizado para: ${updated.role}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
