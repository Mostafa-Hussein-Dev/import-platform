-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "potential_products_createdBy_idx" ON "potential_products"("createdBy");

-- CreateIndex
CREATE INDEX "potential_products_createdBy_status_idx" ON "potential_products"("createdBy", "status");

-- CreateIndex
CREATE INDEX "products_currentStock_idx" ON "products"("currentStock");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "products_status_currentStock_idx" ON "products"("status", "currentStock");

-- CreateIndex
CREATE INDEX "shipments_shippingCompanyId_idx" ON "shipments"("shippingCompanyId");

-- CreateIndex
CREATE INDEX "suppliers_createdAt_idx" ON "suppliers"("createdAt");
