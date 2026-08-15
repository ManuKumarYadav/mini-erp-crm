import bcrypt from "bcrypt";
import dotenv from "dotenv";

import prisma from "../src/lib/prisma";

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function main() {
  console.log("🌱 Starting database seed...");

  // ==========================================
  // DELETE ALL OTHER USERS
  // ==========================================

  console.log("🧹 Removing other users...");

  const deletedUsers = await prisma.users.deleteMany({
    where: {
      email: {
        notIn: [
          "admin@gmail.com",
          "staff@gmail.com",
          "shop@gmail.com",
        ],
      },
    },
  });

  console.log(`Deleted ${deletedUsers.count} other user(s)`);

  // ==========================================
  // ADMIN
  // ==========================================

  const adminPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.users.upsert({
    where: {
      email: "admin@gmail.com",
    },

    update: {
      name: "Administrator",
      password: adminPassword,
      role: "ADMIN",
    },

    create: {
      name: "Administrator",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created/updated:", admin.email);

  // ==========================================
  // STAFF
  // ==========================================

  const staffPassword = await bcrypt.hash("Staff@123", 10);

  const staff = await prisma.users.upsert({
    where: {
      email: "staff@gmail.com",
    },

    update: {
      name: "Sales Staff",
      password: staffPassword,
      role: "SALES",
    },

    create: {
      name: "Sales Staff",
      email: "staff@gmail.com",
      password: staffPassword,
      role: "SALES",
    },
  });

  console.log("✅ Staff created/updated:", staff.email);

  // ==========================================
  // SHOP / WAREHOUSE
  // ==========================================

  const shopPassword = await bcrypt.hash("Shop@123", 10);

  const shop = await prisma.users.upsert({
    where: {
      email: "shop@gmail.com",
    },

    update: {
      name: "Warehouse Staff",
      password: shopPassword,
      role: "WAREHOUSE",
    },

    create: {
      name: "Warehouse Staff",
      email: "shop@gmail.com",
      password: shopPassword,
      role: "WAREHOUSE",
    },
  });

  console.log("✅ Shop user created/updated:", shop.email);

  // ==========================================
  // SEED COMPLETED
  // ==========================================

  console.log("");
  console.log("=================================");
  console.log("🎉 SEED COMPLETED");
  console.log("=================================");
  console.log("Admin : admin@gmail.com / Admin@123");
  console.log("Staff : staff@gmail.com / Staff@123");
  console.log("Shop  : shop@gmail.com / Shop@123");
  console.log("=================================");
}

// ==========================================
// RUN SEED
// ==========================================

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
