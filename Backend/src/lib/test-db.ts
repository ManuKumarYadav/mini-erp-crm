import prisma, { getResolvedDbConfig } from "./prisma";

async function testConnection() {
  const config = getResolvedDbConfig();
  console.log("=========================================");
  console.log("🔍 Testing MySQL Database Connection");
  console.log("=========================================");
  console.log(`Source    : ${config.source}`);
  console.log(`Host      : ${config.host}`);
  console.log(`Port      : ${config.port}`);
  console.log(`User      : ${config.user}`);
  console.log(`Database  : ${config.database}`);
  console.log("=========================================");

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const elapsed = Date.now() - start;
    console.log(`✅ Success! Database connected in ${elapsed}ms.`);
  } catch (error: any) {
    console.error("❌ Connection failed!");
    console.error("Error details:", error?.message || error);
    
    if (error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
      console.log("\n💡 Hint: MySQL is not running on localhost:3306.");
      console.log("   👉 Start the MySQL Windows Service: Open services.msc and start 'MYSQL80'");
      console.log("   👉 Or in Admin PowerShell run: Start-Service MYSQL80");
    } else if (error?.code === "ER_BAD_DB_ERROR" || error?.message?.includes("Unknown database")) {
      console.log(`\n💡 Hint: Database '${config.database}' does not exist yet.`);
      console.log(`   👉 Run: npx prisma db push`);
    } else if (error?.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Hint: Access denied for user. Please check password in .env");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
