import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient | null = null;

try {
  const dbUrl = process.env.DATABASE_URL || '';

  if (dbUrl && (dbUrl.startsWith('prisma+postgres') || dbUrl.startsWith('postgres'))) {
    // Standard initialization with adapter
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    // Fallback to default client
    prisma = new PrismaClient();
  }

  // Handle global instance for dev hot-reloading
  if (process.env.NODE_ENV !== 'production') {
    const globalAny: any = globalThis;
    if (!globalAny.prisma) {
      globalAny.prisma = prisma;
    } else {
      prisma = globalAny.prisma;
    }
  }
} catch (err) {
  console.warn('[prisma] Initialization failed:', (err as Error).message);
  prisma = null;
}

export default prisma as PrismaClient; // Cast to avoid null issues in consumers, we handle null-like behavior via catch
