import { prisma } from "../lib/prisma";
import { addDays, addWeeks, subDays, subMonths } from "date-fns";
import bcrypt from "bcryptjs";


// Helper to convert decimal to Prisma Decimal
function toDecimal(value: number): number {
  return value;
}

// Helper to hash password
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// ANSI color codes for console logging
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// 1. USERS
// ============================================
async function seedUsers() {
  log("\n=== Seeding Users ===", "cyan");

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    log(`Found ${existingUsers} existing users. Skipping user creation.`, "yellow");
    const users = await prisma.user.findMany();
    return users;
  }

  const passwordHash = await hashPassword("password123");

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@import-platform.com",
        name: "Admin User",
        password: passwordHash,
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        email: "manager@import-platform.com",
        name: "Manager User",
        password: passwordHash,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
    }),
  ]);

  log(`Created ${users.length} users`, "green");
  users.forEach((user) => log(`  - ${user.name} (${user.email})`, "blue"));

  return users;
}

// ============================================
// 2. SUPPLIERS
// ============================================
async function seedSuppliers(users: any[]) {
  log("\n=== Seeding Suppliers ===", "cyan");

  // Check if suppliers already exist
  const existingSuppliers = await prisma.supplier.count();
  if (existingSuppliers > 0) {
    log(`Found ${existingSuppliers} existing suppliers. Skipping supplier creation.`, "yellow");
    return await prisma.supplier.findMany();
  }

  const userId = users[0].id; // Use admin user

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        userId,
        companyName: "Shenzhen Electronics Co.",
        contactPerson: "Zhang Wei",
        country: "China",
        email: "zhang.wei@sz-electronics.com",
        phone: "+86 755 1234 5678",
        whatsapp: "+86 138 1234 5678",
        wechat: "zw_sz_elec",
        address: "123 Electronics Ave, Nanshan District, Shenzhen, Guangdong",
        website: "https://sz-electronics.example.com",
        paymentTerms: "30% deposit, 70% before shipping",
        leadTime: "15-20 days",
        rating: toDecimal(4.5),
        notes: "Reliable supplier for consumer electronics. Good communication.",
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        userId,
        companyName: "Hangzhou Textile Export Ltd.",
        contactPerson: "Li Ming",
        country: "China",
        email: "li.ming@hz-textile.com",
        phone: "+86 571 8765 4321",
        whatsapp: "+86 139 8765 4321",
        wechat: "lm_hz_textile",
        address: "456 Textile Street, Xiaoshan District, Hangzhou, Zhejiang",
        website: "https://hz-textile.example.com",
        paymentTerms: "40% deposit, 60% upon completion",
        leadTime: "20-25 days",
        rating: toDecimal(4.2),
        notes: "Specializes in fabrics and home textiles.",
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        userId,
        companyName: "Yiwu General Trading Corp.",
        contactPerson: "Wang Fang",
        country: "China",
        email: "wang.fang@yw-general.com",
        phone: "+86 579 5555 6666",
        whatsapp: "+86 137 5555 6666",
        wechat: "wf_yiwu",
        address: "789 Trade Center, Yiwu, Zhejiang",
        website: "https://yw-general.example.com",
        paymentTerms: "50% deposit, 50% before shipping",
        leadTime: "7-14 days",
        rating: toDecimal(4.0),
        notes: "Wide variety of general merchandise. Good for small orders.",
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        userId,
        companyName: "Ningbo Home & Kitchen Supplies",
        contactPerson: "Chen Qiang",
        country: "China",
        email: "chen.qiang@nb-homekitchen.com",
        phone: "+86 574 3333 2222",
        whatsapp: "+86 136 3333 2222",
        address: "101 Kitchenware Blvd, Ningbo, Zhejiang",
        website: "https://nb-homekitchen.example.com",
        paymentTerms: "30% deposit, 70% on delivery",
        leadTime: "12-18 days",
        rating: toDecimal(4.7),
        notes: "Excellent quality kitchen products. OEM available.",
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        userId,
        companyName: "Foshan Furniture Manufacturing",
        contactPerson: "Liu Hui",
        country: "China",
        email: "liu.hui@fs-furniture.com",
        phone: "+86 757 2222 1111",
        whatsapp: "+86 135 2222 1111",
        address: "202 Furniture Ave, Shunde District, Foshan, Guangdong",
        website: "https://fs-furniture.example.com",
        paymentTerms: "40% deposit, 60% before shipping",
        leadTime: "25-30 days",
        rating: toDecimal(4.3),
        notes: "Modern and classic furniture designs. Container loading optimized.",
        isActive: true,
      },
    }),
  ]);

  log(`Created ${suppliers.length} suppliers`, "green");
  suppliers.forEach((supplier) => log(`  - ${supplier.companyName} (${supplier.contactPerson})`, "blue"));

  return suppliers;
}

// ============================================
// 3. PRODUCTS
// ============================================
async function seedProducts(suppliers: any[]) {
  log("\n=== Seeding Products ===", "cyan");

  // Check if products already exist
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    log(`Found ${existingProducts} existing products. Skipping product creation.`, "yellow");
    return await prisma.product.findMany();
  }

  const electronicsSupplier = suppliers[0]; // Shenzhen Electronics Co.
  const textileSupplier = suppliers[1]; // Hangzhou Textile Export Ltd.
  const generalSupplier = suppliers[2]; // Yiwu General Trading Corp.
  const kitchenSupplier = suppliers[3]; // Ningbo Home & Kitchen Supplies
  const furnitureSupplier = suppliers[4]; // Foshan Furniture Manufacturing

  const products = [
    // Electronics from Shenzhen Electronics Co.
    {
      supplierId: electronicsSupplier.id,
      sku: "ELEC-001",
      name: "Wireless Bluetooth Earbuds",
      description: "True wireless earbuds with active noise cancellation, 24hr battery life, IPX5 water resistance.",
      supplierSku: "SZ-TWS-BT05",
      costPrice: toDecimal(8.50),
      wholesalePrice: toDecimal(15.00),
      retailPrice: toDecimal(29.99),
      currentStock: 150,
      reorderLevel: 50,
      moq: 100,
      category: "Audio",
      brand: "SoundMax",
      weightKg: toDecimal(0.05),
      lengthCm: toDecimal(12),
      widthCm: toDecimal(8),
      heightCm: toDecimal(4),
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "A-01-05",
      status: "ACTIVE",
    },
    {
      supplierId: electronicsSupplier.id,
      sku: "ELEC-002",
      name: "USB-C Charging Cable 2m",
      description: "Braided nylon USB-C charging cable with reinforced connector, supports fast charging up to 100W.",
      supplierSku: "SZ-USBC-2M",
      costPrice: toDecimal(1.80),
      wholesalePrice: toDecimal(4.50),
      retailPrice: toDecimal(9.99),
      currentStock: 500,
      reorderLevel: 200,
      moq: 500,
      category: "Accessories",
      brand: "ChargePro",
      weightKg: toDecimal(0.08),
      lengthCm: toDecimal(200),
      widthCm: toDecimal(2),
      heightCm: toDecimal(1),
      images: [
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "A-01-10",
      status: "ACTIVE",
    },
    {
      supplierId: electronicsSupplier.id,
      sku: "ELEC-003",
      name: "LED Desk Lamp with Wireless Charger",
      description: "Modern LED desk lamp with adjustable brightness, color temperature control, and 15W wireless charging base.",
      supplierSku: "SZ-LED-WC01",
      costPrice: toDecimal(12.00),
      wholesalePrice: toDecimal(25.00),
      retailPrice: toDecimal(49.99),
      currentStock: 75,
      reorderLevel: 25,
      moq: 50,
      category: "Lighting",
      brand: "Lumina",
      weightKg: toDecimal(0.8),
      lengthCm: toDecimal(25),
      widthCm: toDecimal(15),
      heightCm: toDecimal(40),
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "A-02-01",
      status: "ACTIVE",
    },
    {
      supplierId: electronicsSupplier.id,
      sku: "ELEC-004",
      name: "Portable Power Bank 20000mAh",
      description: "High capacity power bank with USB-C PD, QC 3.0, LED display, and 18W fast charging.",
      supplierSku: "SZ-PB-20K",
      costPrice: toDecimal(11.50),
      wholesalePrice: toDecimal(22.00),
      retailPrice: toDecimal(44.99),
      currentStock: 100,
      reorderLevel: 40,
      moq: 100,
      category: "Power",
      brand: "PowerMax",
      weightKg: toDecimal(0.45),
      lengthCm: toDecimal(15),
      widthCm: toDecimal(7),
      heightCm: toDecimal(2.5),
      images: [
        "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "A-02-05",
      status: "ACTIVE",
    },
    {
      supplierId: electronicsSupplier.id,
      sku: "ELEC-005",
      name: "Smart Watch Fitness Tracker",
      description: "Fitness tracker with heart rate monitor, sleep tracking, GPS, and 7-day battery life.",
      supplierSku: "SZ-SW-FIT08",
      costPrice: toDecimal(15.00),
      wholesalePrice: toDecimal(32.00),
      retailPrice: toDecimal(69.99),
      currentStock: 60,
      reorderLevel: 20,
      moq: 50,
      category: "Wearables",
      brand: "FitTrack",
      weightKg: toDecimal(0.1),
      lengthCm: toDecimal(10),
      widthCm: toDecimal(4),
      heightCm: toDecimal(1),
      images: [
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "A-02-10",
      status: "ACTIVE",
    },

    // Textiles from Hangzhou Textile Export Ltd.
    {
      supplierId: textileSupplier.id,
      sku: "TEXT-001",
      name: "100% Cotton Bed Sheet Set - Queen",
      description: "Premium 400-thread count 100% cotton bed sheet set. Includes 1 fitted sheet, 1 flat sheet, and 2 pillowcases.",
      supplierSku: "HZ-COT-QUEEN-400",
      costPrice: toDecimal(12.00),
      wholesalePrice: toDecimal(24.00),
      retailPrice: toDecimal(49.99),
      currentStock: 80,
      reorderLevel: 30,
      moq: 100,
      category: "Bedding",
      brand: "ComfortHome",
      weightKg: toDecimal(2.5),
      lengthCm: toDecimal(35),
      widthCm: toDecimal(28),
      heightCm: toDecimal(12),
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "B-01-01",
      status: "ACTIVE",
    },
    {
      supplierId: textileSupplier.id,
      sku: "TEXT-002",
      name: "Microfiber Bath Towel Set",
      description: "Set of 4 ultra-soft microfiber bath towels. Quick-drying and highly absorbent.",
      supplierSku: "HZ-MF-BATH-SET4",
      costPrice: toDecimal(8.00),
      wholesalePrice: toDecimal(16.00),
      retailPrice: toDecimal(34.99),
      currentStock: 120,
      reorderLevel: 40,
      moq: 100,
      category: "Bath",
      brand: "SoftTouch",
      weightKg: toDecimal(1.8),
      lengthCm: toDecimal(40),
      widthCm: toDecimal(30),
      heightCm: toDecimal(15),
      images: [
        "https://images.unsplash.com/photo-1583845112203-29329902332e?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "B-01-05",
      status: "ACTIVE",
    },
    {
      supplierId: textileSupplier.id,
      sku: "TEXT-003",
      name: "Curtain Panel - Grommet Top",
      description: "Solid color blackout curtain panel with grommet top. 52\" x 84\". Energy efficient.",
      supplierSku: "HZ-BLK-GRM-5284",
      costPrice: toDecimal(7.50),
      wholesalePrice: toDecimal(15.00),
      retailPrice: toDecimal(32.99),
      currentStock: 200,
      reorderLevel: 60,
      moq: 200,
      category: "Window Treatments",
      brand: "Elegance",
      weightKg: toDecimal(0.9),
      lengthCm: toDecimal(30),
      widthCm: toDecimal(20),
      heightCm: toDecimal(8),
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "B-01-10",
      status: "ACTIVE",
    },
    {
      supplierId: textileSupplier.id,
      sku: "TEXT-004",
      name: "Throw Blanket - Fleece",
      description: "Super soft fleece throw blanket. Perfect for sofa or bed. 50\" x 60\".",
      supplierSku: "HZ-FL-THROW-5060",
      costPrice: toDecimal(6.00),
      wholesalePrice: toDecimal(12.00),
      retailPrice: toDecimal(24.99),
      currentStock: 150,
      reorderLevel: 50,
      moq: 150,
      category: "Blankets",
      brand: "CozyLiving",
      weightKg: toDecimal(0.7),
      lengthCm: toDecimal(28),
      widthCm: toDecimal(22),
      heightCm: toDecimal(8),
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "B-02-01",
      status: "ACTIVE",
    },

    // General Goods from Yiwu General Trading Corp.
    {
      supplierId: generalSupplier.id,
      sku: "GEN-001",
      name: "Stainless Steel Water Bottle - 750ml",
      description: "Double-wall vacuum insulated stainless steel water bottle. Keeps drinks cold for 24hrs or hot for 12hrs.",
      supplierSku: "YW-SS-BTL-750",
      costPrice: toDecimal(3.50),
      wholesalePrice: toDecimal(8.00),
      retailPrice: toDecimal(18.99),
      currentStock: 300,
      reorderLevel: 100,
      moq: 200,
      category: "Drinkware",
      brand: "EcoBottle",
      weightKg: toDecimal(0.35),
      lengthCm: toDecimal(26),
      widthCm: toDecimal(7),
      heightCm: toDecimal(7),
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "C-01-01",
      status: "ACTIVE",
    },
    {
      supplierId: generalSupplier.id,
      sku: "GEN-002",
      name: "Reusable Grocery Bags - Set of 5",
      description: "Set of 5 foldable reusable shopping bags with pouch. Made from recycled materials.",
      supplierSku: "YW-RGB-SET5",
      costPrice: toDecimal(2.00),
      wholesalePrice: toDecimal(5.00),
      retailPrice: toDecimal(12.99),
      currentStock: 400,
      reorderLevel: 150,
      moq: 300,
      category: "Bags",
      brand: "GreenEarth",
      weightKg: toDecimal(0.5),
      lengthCm: toDecimal(20),
      widthCm: toDecimal(15),
      heightCm: toDecimal(5),
      images: [
        "https://images.unsplash.com/photo-1593659424369-1af21c9c99d6?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "C-01-05",
      status: "ACTIVE",
    },
    {
      supplierId: generalSupplier.id,
      sku: "GEN-003",
      name: "LED String Lights - 33ft 100 LEDs",
      description: "Battery operated copper wire LED string lights. 8 lighting modes with remote control.",
      supplierSku: "YW-LED-STR-100",
      costPrice: toDecimal(2.50),
      wholesalePrice: toDecimal(6.00),
      retailPrice: toDecimal(14.99),
      currentStock: 250,
      reorderLevel: 80,
      moq: 200,
      category: "Lighting",
      brand: "FestiveLights",
      weightKg: toDecimal(0.15),
      lengthCm: toDecimal(15),
      widthCm: toDecimal(10),
      heightCm: toDecimal(5),
      images: [
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "C-01-10",
      status: "ACTIVE",
    },
    {
      supplierId: generalSupplier.id,
      sku: "GEN-004",
      name: "Phone Stand Holder - Adjustable",
      description: "Universal adjustable phone stand holder. Compatible with all smartphones and tablets.",
      supplierSku: "YW-PS-ADJ01",
      costPrice: toDecimal(1.20),
      wholesalePrice: toDecimal(3.00),
      retailPrice: toDecimal(7.99),
      currentStock: 500,
      reorderLevel: 200,
      moq: 500,
      category: "Accessories",
      brand: "UniversalTech",
      weightKg: toDecimal(0.12),
      lengthCm: toDecimal(12),
      widthCm: toDecimal(10),
      heightCm: toDecimal(2),
      images: [
        "https://images.unsplash.com/photo-1580910051074-3eb694886f8d?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "C-02-01",
      status: "ACTIVE",
    },

    // Kitchen Products from Ningbo Home & Kitchen Supplies
    {
      supplierId: kitchenSupplier.id,
      sku: "KIT-001",
      name: "Chef Knife - 8 inch High Carbon Steel",
      description: "Professional 8-inch chef knife made from high carbon German stainless steel. Includes protective sheath.",
      supplierSku: "NB-CK-8IN-HC",
      costPrice: toDecimal(6.50),
      wholesalePrice: toDecimal(14.00),
      retailPrice: toDecimal(29.99),
      currentStock: 90,
      reorderLevel: 30,
      moq: 100,
      category: "Cutlery",
      brand: "ProChef",
      weightKg: toDecimal(0.25),
      lengthCm: toDecimal(35),
      widthCm: toDecimal(5),
      heightCm: toDecimal(2),
      images: [
        "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1574430127424-6a04ef9764fd?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "D-01-01",
      status: "ACTIVE",
    },
    {
      supplierId: kitchenSupplier.id,
      sku: "KIT-002",
      name: "Silicone Spatula Set - 5 Piece",
      description: "Set of 5 heat-resistant silicone spatulas. BPA free, non-stick safe, up to 600°F.",
      supplierSku: "NB-SS-SET5",
      costPrice: toDecimal(3.00),
      wholesalePrice: toDecimal(7.00),
      retailPrice: toDecimal(15.99),
      currentStock: 180,
      reorderLevel: 60,
      moq: 150,
      category: "Utensils",
      brand: "KitchenPro",
      weightKg: toDecimal(0.4),
      lengthCm: toDecimal(28),
      widthCm: toDecimal(15),
      heightCm: toDecimal(5),
      images: [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "D-01-05",
      status: "ACTIVE",
    },
    {
      supplierId: kitchenSupplier.id,
      sku: "KIT-003",
      name: "Cutting Board - Bamboo 14x10 inch",
      description: "Premium bamboo cutting board with juice groove and side handles. Organic, eco-friendly.",
      supplierSku: "NB-CB-BM-1410",
      costPrice: toDecimal(5.00),
      wholesalePrice: toDecimal(11.00),
      retailPrice: toDecimal(24.99),
      currentStock: 100,
      reorderLevel: 35,
      moq: 100,
      category: "Prep Tools",
      brand: "EcoChef",
      weightKg: toDecimal(1.2),
      lengthCm: toDecimal(36),
      widthCm: toDecimal(26),
      heightCm: toDecimal(2),
      images: [
        "https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1584811644165-33db3b146db5?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "D-01-10",
      status: "ACTIVE",
    },
    {
      supplierId: kitchenSupplier.id,
      sku: "KIT-004",
      name: "Stainless Steel Measuring Cups - Set of 6",
      description: "Set of 6 stainless steel measuring cups (1/8 cup to 1 cup). Stackable design with markings.",
      supplierSku: "NB-MC-SS-SET6",
      costPrice: toDecimal(2.80),
      wholesalePrice: toDecimal(6.50),
      retailPrice: toDecimal(14.99),
      currentStock: 150,
      reorderLevel: 50,
      moq: 150,
      category: "Measuring",
      brand: "PrecisionKitchen",
      weightKg: toDecimal(0.5),
      lengthCm: toDecimal(15),
      widthCm: toDecimal(10),
      heightCm: toDecimal(8),
      images: [
        "https://images.unsplash.com/photo-1584990347449-39b75e8bc7aa?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "D-02-01",
      status: "ACTIVE",
    },
    {
      supplierId: kitchenSupplier.id,
      sku: "KIT-005",
      name: "Coffee Mug Warmer with Temperature Control",
      description: "Electric coffee mug warmer with adjustable temperature settings and auto shut-off.",
      supplierSku: "NB-CMW-TC01",
      costPrice: toDecimal(4.50),
      wholesalePrice: toDecimal(10.00),
      retailPrice: toDecimal(22.99),
      currentStock: 85,
      reorderLevel: 30,
      moq: 100,
      category: "Small Appliances",
      brand: "WarmSip",
      weightKg: toDecimal(0.3),
      lengthCm: toDecimal(14),
      widthCm: toDecimal(12),
      heightCm: toDecimal(3),
      images: [
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "D-02-05",
      status: "ACTIVE",
    },

    // Furniture from Foshan Furniture Manufacturing
    {
      supplierId: furnitureSupplier.id,
      sku: "FUR-001",
      name: "Modern Accent Chair - Velvet",
      description: "Mid-century modern accent chair with velvet upholstery, gold metal legs, and foam cushion.",
      supplierSku: "FS-AC-VT-GD",
      costPrice: toDecimal(45.00),
      wholesalePrice: toDecimal(95.00),
      retailPrice: toDecimal(199.99),
      currentStock: 25,
      reorderLevel: 10,
      moq: 20,
      category: "Seating",
      brand: "ModernLiving",
      weightKg: toDecimal(15),
      lengthCm: toDecimal(70),
      widthCm: toDecimal(75),
      heightCm: toDecimal(85),
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "E-01-01",
      status: "ACTIVE",
    },
    {
      supplierId: furnitureSupplier.id,
      sku: "FUR-002",
      name: "End Table - 2 Tier Storage Shelf",
      description: "Modern 2-tier end table with storage shelf. Solid wood top with metal frame.",
      supplierSku: "FS-ET-2T-MF",
      costPrice: toDecimal(22.00),
      wholesalePrice: toDecimal(45.00),
      retailPrice: toDecimal(89.99),
      currentStock: 40,
      reorderLevel: 15,
      moq: 30,
      category: "Tables",
      brand: "UrbanHome",
      weightKg: toDecimal(8),
      lengthCm: toDecimal(50),
      widthCm: toDecimal(40),
      heightCm: toDecimal(55),
      images: [
        "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=600&h=600&fit=crop",
      ],
      warehouseLocation: "E-01-05",
      status: "ACTIVE",
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) =>
      prisma.product.create({
        data: product as any,
      })
    )
  );

  log(`Created ${createdProducts.length} products`, "green");
  createdProducts.forEach((product) => log(`  - ${product.sku}: ${product.name}`, "blue"));

  return createdProducts;
}

// ============================================
// 4. POTENTIAL PRODUCTS
// ============================================
async function seedPotentialProducts(suppliers: any[]) {
  log("\n=== Seeding Potential Products ===", "cyan");

  // Check if potential products already exist
  const constExisting = await prisma.potentialProduct.count();
  if (constExisting > 0) {
    log(`Found ${constExisting} existing potential products. Skipping potential product creation.`, "yellow");
    return await prisma.potentialProduct.findMany();
  }

  const electronicsSupplier = suppliers[0]; // Shenzhen Electronics Co.
  const textileSupplier = suppliers[1]; // Hangzhou Textile Export Ltd.
  const generalSupplier = suppliers[2]; // Yiwu General Trading Corp.

  const potentialProducts = [
    {
      name: "Wireless Gaming Mouse with RGB",
      description: "High-precision wireless gaming mouse with 16000 DPI sensor, 11 programmable buttons, customizable RGB lighting, and ergonomic design. Comes with Type-C charging cable and USB receiver.",
      supplierId: electronicsSupplier.id,
      supplierSku: "SZ-WGM-RGB-001",
      estimatedCost: toDecimal(9.50),
      estimatedPrice: toDecimal(35.00),
      moq: 200,
      category: "Gaming",
      brand: "GameMax",
      weightKg: toDecimal(0.12),
      sourceUrl: "https://alibaba.example.com/product/wireless-gaming-mouse",
      images: [
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop",
      ],
      notes: "Competitive pricing, excellent reviews on supplier platform. RGB lighting is customizable via software. Need to verify battery life claims.",
      status: "RESEARCHING",
    },
    {
      name: "Luxury Throw Pillow - Embroidered Floral",
      description: "Premium decorative throw pillow with embroidered floral design. Made from soft velvet fabric with hidden zipper. Includes premium pillow insert. 18\" x 18\".",
      supplierId: textileSupplier.id,
      supplierSku: "HZ-TP-FLR-1818",
      estimatedCost: toDecimal(5.50),
      estimatedPrice: toDecimal(18.00),
      moq: 100,
      category: "Decor",
      brand: "Elegance Home",
      weightKg: toDecimal(0.5),
      sourceUrl: "https://alibaba.example.com/product/embroidered-throw-pillow",
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=600&fit=crop",
      ],
      notes: "Sample received - quality approved. Colors are accurate to photos. Embroidery quality is excellent. Ready to place first order.",
      status: "APPROVED",
    },
    {
      name: "Plastic Organizer Bins - Set of 3",
      description: "Set of 3 plastic storage organizer bins with foldable design. Stackable, transparent, with reinforced frame. Sizes: Large, Medium, Small.",
      supplierId: generalSupplier.id,
      supplierSku: "YW-OB-SET3-TR",
      estimatedCost: toDecimal(2.80),
      estimatedPrice: toDecimal(9.00),
      moq: 500,
      category: "Storage",
      brand: null,
      weightKg: toDecimal(0.8),
      sourceUrl: "https://alibaba.example.com/product/foldable-organizer-bins",
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop",
      ],
      notes: "Sample quality was poor - plastic was too thin and frames broke easily. Supplier not willing to improve quality at this price point.",
      status: "REJECTED",
    },
  ];

  const createdPotentialProducts = await Promise.all(
    potentialProducts.map((pp) =>
      prisma.potentialProduct.create({
        data: pp as any,
      })
    )
  );

  log(`Created ${createdPotentialProducts.length} potential products`, "green");
  createdPotentialProducts.forEach((pp) => log(`  - ${pp.name} (${pp.status})`, "blue"));

  return createdPotentialProducts;
}

// ============================================
// 5. SHIPPING COMPANIES
// ============================================
async function seedShippingCompanies() {
  log("\n=== Seeding Shipping Companies ===", "cyan");

  // Check if shipping companies already exist
  const constExisting = await prisma.shippingCompany.count();
  if (constExisting > 0) {
    log(`Found ${constExisting} existing shipping companies. Skipping shipping company creation.`, "yellow");
    return await prisma.shippingCompany.findMany();
  }

  const shippingCompanies = [
    {
      name: "Pacific Ocean Freight Lines",
      type: "sea",
      contactPerson: "Captain James Morrison",
      email: "jmorrison@pacific-ocean.example.com",
      phone: "+1 555 123 4567",
      ratePerKg: toDecimal(0.50),
      ratePerCBM: toDecimal(150.00),
      minCharge: toDecimal(500.00),
      transitTime: "25-30 days",
      notes: "Reliable sea freight carrier. Best for large shipments. Weekly departures from major Chinese ports.",
      isActive: true,
    },
    {
      name: "SkyCargo International",
      type: "air",
      contactPerson: "Sarah Johnson",
      email: "s.johnson@skycargo.example.com",
      phone: "+1 555 234 5678",
      ratePerKg: toDecimal(5.50),
      ratePerCBM: null,
      minCharge: toDecimal(100.00),
      transitTime: "5-7 days",
      notes: "Premium air freight service. Fast delivery but higher cost. Best for urgent orders.",
      isActive: true,
    },
    {
      name: "Global Express Courier",
      type: "courier",
      contactPerson: "Mike Chen",
      email: "mchen@globalexpress.example.com",
      phone: "+1 555 345 6789",
      ratePerKg: toDecimal(8.00),
      ratePerCBM: null,
      minCharge: toDecimal(50.00),
      transitTime: "3-5 days",
      notes: "Door-to-door courier service. Includes customs clearance. Good for samples and small orders.",
      isActive: true,
    },
  ];

  const createdShippingCompanies = await Promise.all(
    shippingCompanies.map((sc) =>
      prisma.shippingCompany.create({
        data: sc,
      })
    )
  );

  log(`Created ${createdShippingCompanies.length} shipping companies`, "green");
  createdShippingCompanies.forEach((sc) => log(`  - ${sc.name} (${sc.type})`, "blue"));

  return createdShippingCompanies;
}

// ============================================
// 6. PURCHASE ORDERS
// ============================================
async function seedPurchaseOrders(suppliers: any[], products: any[]) {
  log("\n=== Seeding Purchase Orders ===", "cyan");

  // Check if purchase orders already exist
  const constExisting = await prisma.purchaseOrder.count();
  if (constExisting > 0) {
    log(`Found ${constExisting} existing purchase orders. Skipping purchase order creation.`, "yellow");
    return await prisma.purchaseOrder.findMany({ include: { items: true } });
  }

  const electronicsSupplier = suppliers[0]; // Shenzhen Electronics Co.
  const kitchenSupplier = suppliers[3]; // Ningbo Home & Kitchen Supplies
  const furnitureSupplier = suppliers[4]; // Foshan Furniture Manufacturing

  // Get products for each supplier
  const electronicsProducts = products.filter((p) => p.supplierId === electronicsSupplier.id);
  const kitchenProducts = products.filter((p) => p.supplierId === kitchenSupplier.id);
  const furnitureProducts = products.filter((p) => p.supplierId === furnitureSupplier.id);

  const now = new Date();
  const twoMonthsAgo = subMonths(now, 2);
  const oneMonthAgo = subMonths(now, 1);
  const threeWeeksFromNow = addWeeks(now, 3);

  // Purchase Order 1: RECEIVED (from 2 months ago)
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2024-001",
      supplierId: electronicsSupplier.id,
      orderDate: twoMonthsAgo,
      expectedDate: oneMonthAgo,
      status: "received",
      paymentStatus: "paid",
      paidAmount: toDecimal(6275.00),
      subtotal: toDecimal(6000.00),
      shippingEstimate: toDecimal(275.00),
      totalCost: toDecimal(6275.00),
      notes: "First order from this supplier. Products received in good condition.",
      items: {
        create: [
          {
            productId: electronicsProducts[0].id, // Wireless Bluetooth Earbuds
            quantity: 200,
            unitCost: electronicsProducts[0].costPrice,
            totalCost: toDecimal(1700.00),
            receivedQty: 200,
          },
          {
            productId: electronicsProducts[1].id, // USB-C Charging Cable
            quantity: 800,
            unitCost: electronicsProducts[1].costPrice,
            totalCost: toDecimal(1440.00),
            receivedQty: 800,
          },
          {
            productId: electronicsProducts[3].id, // Portable Power Bank
            quantity: 250,
            unitCost: electronicsProducts[3].costPrice,
            totalCost: toDecimal(2875.00),
            receivedQty: 250,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Purchase Order 2: PRODUCING
  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2024-002",
      supplierId: kitchenSupplier.id,
      orderDate: oneMonthAgo,
      expectedDate: threeWeeksFromNow,
      status: "producing",
      paymentStatus: "partial",
      paidAmount: toDecimal(1000.00),
      subtotal: toDecimal(4150.00),
      shippingEstimate: toDecimal(350.00),
      totalCost: toDecimal(4500.00),
      notes: "Production started. Expected to be ready for shipping in 2 weeks.",
      items: {
        create: [
          {
            productId: kitchenProducts[0].id, // Chef Knife
            quantity: 150,
            unitCost: kitchenProducts[0].costPrice,
            totalCost: toDecimal(975.00),
            receivedQty: 0,
          },
          {
            productId: kitchenProducts[1].id, // Silicone Spatula Set
            quantity: 300,
            unitCost: kitchenProducts[1].costPrice,
            totalCost: toDecimal(900.00),
            receivedQty: 0,
          },
          {
            productId: kitchenProducts[2].id, // Cutting Board
            quantity: 200,
            unitCost: kitchenProducts[2].costPrice,
            totalCost: toDecimal(1000.00),
            receivedQty: 0,
          },
          {
            productId: kitchenProducts[3].id, // Measuring Cups
            quantity: 250,
            unitCost: kitchenProducts[3].costPrice,
            totalCost: toDecimal(700.00),
            receivedQty: 0,
          },
          {
            productId: kitchenProducts[4].id, // Coffee Mug Warmer
            quantity: 200,
            unitCost: kitchenProducts[4].costPrice,
            totalCost: toDecimal(900.00),
            receivedQty: 0,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Purchase Order 3: DRAFT
  const po3 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2024-003",
      supplierId: furnitureSupplier.id,
      orderDate: now,
      expectedDate: addWeeks(now, 6),
      status: "draft",
      paymentStatus: "pending",
      paidAmount: toDecimal(0),
      subtotal: toDecimal(2610.00),
      shippingEstimate: toDecimal(450.00),
      totalCost: toDecimal(3060.00),
      notes: "Draft order - awaiting final approval from management.",
      items: {
        create: [
          {
            productId: furnitureProducts[0].id, // Modern Accent Chair
            quantity: 30,
            unitCost: furnitureProducts[0].costPrice,
            totalCost: toDecimal(1350.00),
            receivedQty: 0,
          },
          {
            productId: furnitureProducts[1].id, // End Table
            quantity: 60,
            unitCost: furnitureProducts[1].costPrice,
            totalCost: toDecimal(1320.00),
            receivedQty: 0,
          },
        ],
      },
    },
    include: { items: true },
  });

  const purchaseOrders = [po1, po2, po3];

  log(`Created ${purchaseOrders.length} purchase orders`, "green");
  purchaseOrders.forEach((po) => {
    const itemsTotal = po.items.reduce((sum, item) => sum + Number(item.totalCost), 0);
    log(`  - ${po.poNumber}: ${po.supplierId} (${po.status}) - ${po.items.length} items - $${itemsTotal.toFixed(2)}`, "blue");
  });

  return purchaseOrders;
}

// ============================================
// 7. SHIPMENTS & 8. STOCK MOVEMENTS
// ============================================
async function seedShipmentsAndStockMovements(
  purchaseOrders: any[],
  shippingCompanies: any[],
  products: any[]
) {
  log("\n=== Seeding Shipments ===", "cyan");

  // Check if shipments already exist
  const constExisting = await prisma.shipment.count();
  if (constExisting > 0) {
    log(`Found ${constExisting} existing shipments. Skipping shipment creation.`, "yellow");
    return await prisma.shipment.findMany();
  }

  const now = new Date();
  const twoMonthsAgo = subMonths(now, 2);
  const sevenWeeksAgo = subDays(addWeeks(twoMonthsAgo, 4), 2);
  const sixWeeksAgo = addWeeks(twoMonthsAgo, 6);
  const oneWeekAgo = subDays(now, 7);
  const twoWeeksFromNow = addWeeks(now, 2);

  const seaFreight = shippingCompanies[0]; // Pacific Ocean Freight Lines
  const airFreight = shippingCompanies[1]; // SkyCargo International

  const electronicsProducts = purchaseOrders[0].items.map((item: any) =>
    products.find((p) => p.id === item.productId)
  );

  // Shipment 1: DELIVERED
  const shipment1 = await prisma.shipment.create({
    data: {
      shipmentNumber: "SHIP-2024-001",
      purchaseOrderId: purchaseOrders[0].id, // PO-2024-001 (received)
      shippingCompanyId: seaFreight.id,
      method: "sea",
      departureDate: sevenWeeksAgo,
      estimatedArrival: sixWeeksAgo,
      actualArrival: sixWeeksAgo,
      trackingNumber: "POL-SF-2024-78542",
      status: "delivered",
      totalWeight: toDecimal(185.5),
      totalVolume: toDecimal(2.8),
      shippingCost: toDecimal(420.00),
      customsDuty: toDecimal(325.00),
      otherFees: toDecimal(85.00),
      totalCost: toDecimal(830.00),
      notes: "Shipment arrived in good condition. All items accounted for. Minor delay due to port congestion.",
    },
  });

  log(`Created shipment: ${shipment1.shipmentNumber} (${shipment1.status})`, "blue");

  // Create stock movements for delivered shipment
  log("\n=== Creating Stock Movements for Delivered Shipment ===", "cyan");

  const stockMovements = [];

  for (const item of purchaseOrders[0].items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    // Calculate landed cost per unit
    // Total additional costs = shipping + customs + other fees
    const totalAdditionalCosts = Number(shipment1.shippingCost) + Number(shipment1.customsDuty) + Number(shipment1.otherFees);
    const totalUnits = purchaseOrders[0].items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const additionalCostPerUnit = totalAdditionalCosts / totalUnits;
    const landedCost = Number(product.costPrice) + additionalCostPerUnit;

    const stockBefore = 0; // Before first shipment, stock was 0
    const stockAfter = item.quantity;

    const movement = await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: "in",
        reason: "shipment_received",
        quantity: item.quantity,
        referenceType: "Shipment",
        referenceId: shipment1.id,
        stockBefore,
        stockAfter,
        landedCost: toDecimal(landedCost),
        unitCost: item.unitCost,
        notes: `Received via ${shipment1.shipmentNumber}`,
        createdAt: shipment1.actualArrival || undefined,
      },
    });

    stockMovements.push(movement);
    log(`  - Stock movement created: ${product.sku} +${item.quantity} units (landed cost: $${landedCost.toFixed(2)})`, "blue");
  }

  // Update products with landed cost and current stock
  for (const item of purchaseOrders[0].items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    const totalAdditionalCosts = Number(shipment1.shippingCost) + Number(shipment1.customsDuty) + Number(shipment1.otherFees);
    const totalUnits = purchaseOrders[0].items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const additionalCostPerUnit = totalAdditionalCosts / totalUnits;
    const landedCost = Number(product.costPrice) + additionalCostPerUnit;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        landedCost: toDecimal(landedCost),
        currentStock: item.quantity, // Set initial stock
      },
    });
  }

  log(`Updated landed costs and stock for ${purchaseOrders[0].items.length} products`, "green");

  // Shipment 2: IN_TRANSIT
  const shipment2 = await prisma.shipment.create({
    data: {
      shipmentNumber: "SHIP-2024-002",
      purchaseOrderId: purchaseOrders[1].id, // PO-2024-002 (producing)
      shippingCompanyId: airFreight.id,
      method: "air",
      departureDate: oneWeekAgo,
      estimatedArrival: twoWeeksFromNow,
      trackingNumber: "SKY-INT-2024-45678",
      status: "in_transit",
      totalWeight: toDecimal(92.0),
      totalVolume: toDecimal(0.45),
      shippingCost: toDecimal(506.00),
      customsDuty: null, // Not yet assessed
      otherFees: toDecimal(45.00),
      totalCost: toDecimal(551.00),
      notes: "Air freight shipment. Package cleared customs in China, currently in transit to destination.",
    },
  });

  log(`Created shipment: ${shipment2.shipmentNumber} (${shipment2.status})`, "blue");

  log(`\nTotal stock movements created: ${stockMovements.length}`, "green");

  return [shipment1, shipment2];
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
  try {
    log("\n========================================", "cyan");
    log("   DATABASE SEEDING STARTED", "cyan");
    log("========================================", "cyan");

    // Seed in order of dependencies
    const users = await seedUsers();
    const suppliers = await seedSuppliers(users);
    const products = await seedProducts(suppliers);
    const potentialProducts = await seedPotentialProducts(suppliers);
    const shippingCompanies = await seedShippingCompanies();
    const purchaseOrders = await seedPurchaseOrders(suppliers, products);
    const shipments = await seedShipmentsAndStockMovements(purchaseOrders, shippingCompanies, products);

    log("\n========================================", "green");
    log("   DATABASE SEEDING COMPLETED SUCCESSFULLY", "green");
    log("========================================", "green");

    log("\nSummary:", "cyan");
    log(`  Users: ${users.length}`, "blue");
    log(`  Suppliers: ${suppliers.length}`, "blue");
    log(`  Products: ${products.length}`, "blue");
    log(`  Potential Products: ${potentialProducts.length}`, "blue");
    log(`  Shipping Companies: ${shippingCompanies.length}`, "blue");
    log(`  Purchase Orders: ${purchaseOrders.length}`, "blue");
    log(`  Shipments: ${shipments.length}`, "blue");

    log("\nTest credentials:", "yellow");
    log(`  Email: admin@import-platform.com`, "yellow");
    log(`  Password: password123`, "yellow");

  } catch (error) {
    log("\n========================================", "red");
    log("   ERROR DURING SEEDING", "red");
    log("========================================", "red");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
