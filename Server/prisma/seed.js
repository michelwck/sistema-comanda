import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 0) Criar usuário admin inicial (email precisa ser o mesmo do Google)
    const ADMIN_EMAIL = 'michel.wck@gmail.com';

    await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: { isActive: true, role: 'admin' },
        create: {
            email: ADMIN_EMAIL,
            name: 'Admin',
            role: 'admin',
            isActive: true,
        },
    });

    // 1. Clean up existing data (optional, be careful in prod)
    // await prisma.tabItem.deleteMany({});
    // await prisma.clientTransaction.deleteMany({});
    // await prisma.tab.deleteMany({});
    // await prisma.product.deleteMany({});
    // await prisma.client.deleteMany({});

    // 2. Create Products
    const productsData = [
        // Beers
        { name: 'Cerveja Heineken 600ml', price: 18.00, category: 'Cervejas' },
        { name: 'Cerveja Original 600ml', price: 16.00, category: 'Cervejas' },
        { name: 'Cerveja Spaten 600ml', price: 16.00, category: 'Cervejas' },
        { name: 'Cerveja Budweiser 330ml', price: 10.00, category: 'Cervejas' },
        { name: 'Cerveja Corona 330ml', price: 12.00, category: 'Cervejas' },

        // Drinks
        { name: 'Caipirinha Limão', price: 25.00, category: 'Drinks' },
        { name: 'Caipiroska Vodka', price: 28.00, category: 'Drinks' },
        { name: 'Gin Tônica', price: 30.00, category: 'Drinks' },
        { name: 'Moscow Mule', price: 32.00, category: 'Drinks' },
        { name: 'Whisky Red Label Dose', price: 22.00, category: 'Drinks' },
        { name: 'Campari Dose', price: 18.00, category: 'Drinks' },

        // Non-Alcoholic
        { name: 'Água sem Gás', price: 5.00, category: 'Bebidas' },
        { name: 'Água com Gás', price: 6.00, category: 'Bebidas' },
        { name: 'Coca Cola Lata', price: 7.00, category: 'Bebidas' },
        { name: 'Guaraná Antarctica', price: 7.00, category: 'Bebidas' },
        { name: 'Red Bull', price: 15.00, category: 'Bebidas' },

        // Food
        { name: 'Porção Batata Frita', price: 35.00, category: 'Petiscos' },
        { name: 'Porção Isca de Frango', price: 42.00, category: 'Petiscos' },
        { name: 'Porção Calabresa Acebolada', price: 38.00, category: 'Petiscos' },
        { name: 'Amendoim', price: 10.00, category: 'Petiscos' }
    ];

    const products = [];
    for (const p of productsData) {
        const product = await prisma.product.create({
            data: {
                name: p.name,
                price: p.price,
                category: {
                    connectOrCreate: {
                        where: { name: p.category },
                        create: { name: p.category }
                    }
                }
            }
        });
        products.push(product);
    }

    // 3. Create Clients
    const clientsData = [
        { name: 'João Silva', phone: '(11) 99999-1111' },
        { name: 'Maria Oliveira', phone: '(11) 98888-2222' },
        { name: 'Carlos Pereira', phone: '(11) 97777-3333' },
        { name: 'Ana Souza', phone: '(11) 96666-4444' },
        { name: 'Pedro Santos', phone: '(11) 95555-5555' },
        { name: 'Fernanda Lima', phone: '(11) 94444-6666' },
        { name: 'Roberto Costa', phone: '(11) 93333-7777' },
        { name: 'Juliana Almeida', phone: '(11) 92222-8888' },
        { name: 'Lucas Ferreira', phone: '(11) 91111-9999' },
        { name: 'Patrícia Rocha' }
    ];

    const clients = [];
    for (const c of clientsData) {
        const client = await prisma.client.create({ data: c });
        clients.push(client);
    }

    // 4. Create Historical Data (Closed Tabs & Fiado)

    // Helper to add items to tab
    const addRandomItems = async (tabId, count = 3) => {
        let total = 0;
        for (let i = 0; i < count; i++) {
            const prod = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            await prisma.tabItem.create({
                data: {
                    tabId,
                    productId: prod.id,
                    name: prod.name,
                    price: prod.price,
                    quantity: qty
                }
            });
            total += Number(prod.price) * qty;
        }
        return total;
    };

    // Create Fiado Debts for some clients
    const debtorClients = clients.slice(0, 5); // First 5 clients have debts
    for (const client of debtorClients) {
        // Create past tab converted to Fiado
        const pastTab = await prisma.tab.create({
            data: {
                clientId: client.id,
                customer: client.name,
                status: 'closed',
                paymentMethod: 'fiado',
                total: 0, // calculated below
                openedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 10)), // random days ago
            }
        });
        const total = await addRandomItems(pastTab.id, 4);
        await prisma.tab.update({ where: { id: pastTab.id }, data: { total: total } });

        // Register Transaction
        await prisma.clientTransaction.create({
            data: {
                clientId: client.id,
                tabId: pastTab.id,
                amount: total,
                type: 'FIADO',
                description: `Comanda #${pastTab.id} (Fiado)`
            }
        });

        // Partial Payment
        if (Math.random() > 0.5) {
            const payAmount = Math.floor(total / 2);
            await prisma.clientTransaction.create({
                data: {
                    clientId: client.id,
                    amount: -payAmount,
                    type: 'PAYMENT',
                    description: 'Pagamento Parcial'
                }
            });
        }
    }

    // 5. Create Active Tabs (Dashboard)
    const activeCustomers = ['Mesa 01', 'Mesa 02 VIP', 'Balcão - Felipe', 'Mesa 05', 'Mesa 10 Externo'];
    for (const customer of activeCustomers) {
        const tab = await prisma.tab.create({
            data: {
                customer: customer,
                status: 'open',
                total: 0
            }
        });
        const total = await addRandomItems(tab.id, Math.floor(Math.random() * 5) + 1);
        await prisma.tab.update({ where: { id: tab.id }, data: { total: total } });
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
