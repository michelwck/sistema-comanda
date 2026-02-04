import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCategories() {
    try {
        console.log('🔄 Starting category migration...');

        // Step 1: Create default categories
        const defaultCategories = [
            'Bebidas',
            'Comidas',
            'Porções',
            'Sobremesas',
            'Outros'
        ];

        console.log('📦 Creating default categories...');
        const createdCategories = [];
        for (const categoryName of defaultCategories) {
            const category = await prisma.category.upsert({
                where: { name: categoryName },
                update: {},
                create: { name: categoryName }
            });
            createdCategories.push(category);
            console.log(`  ✅ Created: ${category.name} (ID: ${category.id})`);
        }

        // Step 2: Get all existing products
        const products = await prisma.$queryRaw`
            SELECT id, name, category FROM "Product"
        `;

        if (products.length === 0) {
            console.log('ℹ️  No existing products to migrate.');
            console.log('✅ Migration completed successfully!');
            return;
        }

        console.log(`\n📝 Found ${products.length} products to migrate...`);

        // Step 3: Migrate each product
        let migrated = 0;
        const defaultCategory = createdCategories.find(c => c.name === 'Outros');

        for (const product of products) {
            // Try to match existing category string to new categories
            let categoryId = defaultCategory.id;

            const matchedCategory = createdCategories.find(c =>
                c.name.toLowerCase() === (product.category || '').toLowerCase()
            );

            if (matchedCategory) {
                categoryId = matchedCategory.id;
            }

            // Update product with categoryId
            await prisma.$executeRaw`
                UPDATE "Product" 
                SET "categoryId" = ${categoryId}
                WHERE id = ${product.id}
            `;

            migrated++;
            console.log(`  ✅ Migrated: ${product.name} → ${createdCategories.find(c => c.id === categoryId).name}`);
        }

        console.log(`\n✅ Migration completed successfully!`);
        console.log(`   - Created ${createdCategories.length} categories`);
        console.log(`   - Migrated ${migrated} products`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateCategories();
