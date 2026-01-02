
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Verifying System Settings...')

  try {
    const settings = await prisma.creditSetting.findMany()
    console.log('Found Settings:', settings)

    const user = await prisma.user.findUnique({ where: { id: 'super-admin-001' } })
    console.log('Super Admin User:', user)

  } catch (e) {
    console.error('Error querying database:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
