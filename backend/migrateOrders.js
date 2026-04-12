import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Updating Order statuses...");
        // Execute raw SQL because Prisma Client might not have the compiled Enums if generation failed
        await prisma.$executeRawUnsafe(`UPDATE "Order" SET status = 'UNPAID' WHERE status IN ('PENDING', 'EXPIRED', 'CANCELLED');`);
        console.log("Orders successfully migrated to UNPAID.");
    } catch(err) {
        console.error("Migration failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
