-- AlterTable
ALTER TABLE "potential_products" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "heightCm" DECIMAL(10,2),
ADD COLUMN     "lengthCm" DECIMAL(10,2),
ADD COLUMN     "weightKg" DECIMAL(10,2),
ADD COLUMN     "widthCm" DECIMAL(10,2);
