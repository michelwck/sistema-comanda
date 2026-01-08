import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes
    await prisma.tabItem.deleteMany();
    await prisma.tab.deleteMany();
    await prisma.product.deleteMany();
    await prisma.client.deleteMany();

    // Criar clientes
    const clients = await Promise.all([
        prisma.client.create({
            data: { name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999' }
        }),
        prisma.client.create({
            data: { name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98888-8888' }
        }),
        prisma.client.create({
            data: { name: 'Carlos Oliveira', email: 'carlos@email.com', phone: '(11) 97777-7777' }
        }),
        prisma.client.create({
            data: { name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 96666-6666' }
        })
    ]);
    console.log(`✅ ${clients.length} clientes criados`);

    // Criar produtos
    const products = await Promise.all([
        prisma.product.create({
            data: { name: 'Cerveja Long Neck', price: 12.00, category: 'Cervejas' }
        }),
        prisma.product.create({
            data: { name: 'Cerveja Long Neck Corona', price: 15.00, category: 'Cervejas' }
        }),
        prisma.product.create({
            data: { name: 'Cerveja Artesanal', price: 45.00, category: 'Cervejas' }
        }),
        prisma.product.create({
            data: { name: 'Vodka Dose', price: 25.00, category: 'Destilados' }
        }),
        prisma.product.create({
            data: { name: 'Gin Tônica', price: 35.00, category: 'Drinks' }
        }),
        prisma.product.create({
            data: { name: 'Combo Vodka', price: 300.00, category: 'Combos' }
        }),
        prisma.product.create({
            data: { name: 'Energético', price: 20.00, category: 'Não Alcoólicos' }
        }),
        prisma.product.create({
            data: { name: 'Água', price: 10.00, category: 'Não Alcoólicos' }
        })
    ]);
    console.log(`✅ ${products.length} produtos criados`);

    // Criar comandas com itens
    const tab1 = await prisma.tab.create({
        data: {
            customer: 'João Silva',
            clientId: clients[0].id,
            status: 'open',
            total: 0,
            openedAt: new Date('2026-01-03T22:30:00')
        }
    });

    await prisma.tabItem.createMany({
        data: [
            {
                tabId: tab1.id,
                productId: products[0].id,
                name: 'Cerveja Long Neck',
                price: 15.00,
                quantity: 2,
                addedAt: new Date('2026-01-03T22:35:00')
            },
            {
                tabId: tab1.id,
                productId: products[3].id,
                name: 'Vodka Dose',
                price: 25.00,
                quantity: 1,
                addedAt: new Date('2026-01-03T22:40:00')
            },
            {
                tabId: tab1.id,
                productId: products[6].id,
                name: 'Energético',
                price: 20.00,
                quantity: 1,
                addedAt: new Date('2026-01-03T22:40:00')
            }
        ]
    });

    await prisma.tab.update({
        where: { id: tab1.id },
        data: { total: 75.00 }
    });

    const tab2 = await prisma.tab.create({
        data: {
            customer: 'Maria Santos',
            clientId: clients[1].id,
            status: 'open',
            total: 0,
            openedAt: new Date('2026-01-03T22:45:00')
        }
    });

    await prisma.tabItem.createMany({
        data: [
            {
                tabId: tab2.id,
                productId: products[4].id,
                name: 'Gin Tônica',
                price: 35.00,
                quantity: 2,
                addedAt: new Date('2026-01-03T22:50:00')
            },
            {
                tabId: tab2.id,
                productId: products[7].id,
                name: 'Água',
                price: 15.00,
                quantity: 1,
                addedAt: new Date('2026-01-03T22:55:00')
            }
        ]
    });

    await prisma.tab.update({
        where: { id: tab2.id },
        data: { total: 85.00 }
    });

    const tab3 = await prisma.tab.create({
        data: {
            customer: 'Carlos Oliveira',
            clientId: clients[2].id,
            status: 'open',
            total: 0,
            openedAt: new Date('2026-01-03T23:10:00')
        }
    });

    await prisma.tabItem.createMany({
        data: [
            {
                tabId: tab3.id,
                productId: products[5].id,
                name: 'Combo Vodka',
                price: 300.00,
                quantity: 1,
                addedAt: new Date('2026-01-03T23:15:00')
            },
            {
                tabId: tab3.id,
                productId: products[6].id,
                name: 'Energético',
                price: 20.00,
                quantity: 2,
                addedAt: new Date('2026-01-03T23:15:00')
            }
        ]
    });

    await prisma.tab.update({
        where: { id: tab3.id },
        data: { total: 340.00 }
    });

    const tab4 = await prisma.tab.create({
        data: {
            customer: 'Ana Costa',
            clientId: clients[3].id,
            status: 'paid',
            total: 45.00,
            openedAt: new Date('2026-01-03T23:15:00'),
            closedAt: new Date('2026-01-03T23:45:00')
        }
    });

    await prisma.tabItem.create({
        data: {
            tabId: tab4.id,
            productId: products[2].id,
            name: 'Cerveja Artesanal',
            price: 45.00,
            quantity: 1,
            addedAt: new Date('2026-01-03T23:20:00')
        }
    });

    console.log('✅ 4 comandas criadas com itens');
    console.log('🎉 Seed concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
