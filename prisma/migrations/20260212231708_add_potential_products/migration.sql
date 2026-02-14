/*
  Warnings:

  - You are about to drop the column `dimensions` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `moq` on the `suppliers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PotentialProductStatus" AS ENUM ('RESEARCHING', 'APPROVED', 'REJECTED', 'CONVERTED');

-- AlterTable
ALTER TABLE "products" DROP COLUMN "dimensions",
ADD COLUMN     "heightCm" DECIMAL(10,2),
ADD COLUMN     "lengthCm" DECIMAL(10,2),
ADD COLUMN     "moq" INTEGER,
ADD COLUMN     "widthCm" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "moq";

-- CreateTable
CREATE TABLE "potential_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "supplierId" TEXT,
    "supplierSku" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "estimatedPrice" DECIMAL(10,2),
    "moq" INTEGER,
    "sourceUrl" TEXT,
    "images" TEXT[],
    "notes" TEXT,
    "status" "PotentialProductStatus" NOT NULL DEFAULT 'RESEARCHING',
    "productId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "potential_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "potential_products_productId_key" ON "potential_products"("productId");

-- CreateIndex
CREATE INDEX "potential_products_supplierId_idx" ON "potential_products"("supplierId");

-- CreateIndex
CREATE INDEX "potential_products_status_idx" ON "potential_products"("status");

-- CreateIndex
CREATE INDEX "potential_products_createdAt_idx" ON "potential_products"("createdAt");

-- AddForeignKey
ALTER TABLE "potential_products" ADD CONSTRAINT "potential_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potential_products" ADD CONSTRAINT "potential_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
