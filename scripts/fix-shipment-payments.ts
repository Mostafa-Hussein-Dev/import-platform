const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixShipmentPayments() {
  try {
    // Update all shipments that have NULL payment status or paid amount
    const result = await prisma.$executeRaw`
      UPDATE shipments
      SET payment_status = 'pending',
          paid_amount = 0
      WHERE payment_status IS NULL
         OR paid_amount IS NULL
    `;

    console.log('Fixed shipment payment fields:', result);

    // Verify the update
    const shipments = await prisma.shipment.findMany();
    console.log(`Total shipments: ${shipments.length}`);
    console.log('Sample shipment:', {
      id: shipments[0]?.id,
      shipmentNumber: shipments[0]?.shipmentNumber,
      paymentStatus: shipments[0]?.paymentStatus,
      paidAmount: shipments[0]?.paidAmount?.toString(),
    });
  } catch (error) {
    console.error('Error fixing shipments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixShipmentPayments();
