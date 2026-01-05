import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

export async function GET() {
  try {
    // Execute a simple query to verify the connection
    await prisma.$queryRaw`SELECT 1`;
    // throw new Error('Simulated Failure');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Service Unavailable' },
      { status: 503 }
    );
  }
}
