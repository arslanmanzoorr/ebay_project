async function main() {
  // Override host for local testing
  process.env.POSTGRES_HOST = 'localhost';

  console.log('🔍 Testing Prisma connection...');

  // Dynamically import prisma to ensure env var override takes effect
  const { prisma } = await import('../services/prisma');

  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Successfully connected! Found ${userCount} users.`);

    // Optional: Fetch one user to verify data mapping
    const user = await prisma.user.findFirst();
    if (user) {
        console.log('👤 Sample user:', user.name, user.email);
    }

  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
