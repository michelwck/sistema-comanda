-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Insert default categories
INSERT INTO "Category" ("name", "updatedAt") VALUES
    ('Bebidas', CURRENT_TIMESTAMP),
    ('Comidas', CURRENT_TIMESTAMP),
    ('Porções', CURRENT_TIMESTAMP),
    ('Sobremesas', CURRENT_TIMESTAMP),
    ('Outros', CURRENT_TIMESTAMP);

-- Add categoryId column with default value (Outros category)
ALTER TABLE "Product" ADD COLUMN "categoryId" INTEGER;

-- Set categoryId to 'Outros' (ID 5) for all existing products
UPDATE "Product" SET "categoryId" = (SELECT id FROM "Category" WHERE name = 'Outros');

-- Make categoryId NOT NULL after setting values
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop old category column
ALTER TABLE "Product" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
