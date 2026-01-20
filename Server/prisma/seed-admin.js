import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Criando usuário admin inicial...');

    const adminEmail = 'michel.wck@gmail.com';

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existing) {
        console.log('✅ Usuário admin já existe:', adminEmail);
        return;
    }

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            email: adminEmail,
            name: 'Michel', // Will be updated from Google on first login
            role: 'admin',
            isActive: true,
        },
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Nome:', admin.name);
    console.log('🔑 Role:', admin.role);
    console.log('\n🚀 Agora você pode fazer login com sua conta Google!');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao criar admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
