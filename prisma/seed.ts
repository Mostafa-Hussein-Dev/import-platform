import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function main() {
  try {
    console.log("\n=== Seeding Database ===\n");

    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log(`Found ${existingUsers} existing users. Skipping.`);
    } else {
      const passwordHash = await hashPassword("mm042022");
      await prisma.user.create({
        data: {
          email: "admin@spilot.com",
          name: "Admin User",
          password: passwordHash,
        },
      });
      console.log("Created user: admin@spilot.com");
    }

    console.log("\n=== Seeding Complete ===\n");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
