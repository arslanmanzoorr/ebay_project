import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@bidsquire.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin@bids25'
  const name = process.env.ADMIN_NAME || 'Bidsquire Admin'
  const role = 'admin'

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  const user = await prisma.user.upsert({
    where: { id: 'admin-001' },
    update: {},
    create: {
      id: 'admin-001',
      email,
      name,
      password: passwordHash, // Using the new 'password' column which stores the hash
      role,
      isActive: true,
    },
  })

  console.log({ admin: user })

  // Super Admin
  const superEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@bidsquire.com'
  const superPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@bids25'
  const superName = process.env.SUPER_ADMIN_NAME || 'Bidsquire Super Admin'
  const superRole = 'super_admin'

  const superSalt = await bcrypt.genSalt(10)
  const superPasswordHash = await bcrypt.hash(superPassword, superSalt)

  const superUser = await prisma.user.upsert({
    where: { id: 'super-admin-001' },
    update: {},
    create: {
      id: 'super-admin-001',
      email: superEmail,
      name: superName,
      password: superPasswordHash,
      role: superRole,
      isActive: true, // Super admin should always be active
    },
  })

  console.log({ superAdmin: superUser })

  // System Settings
  console.log('Seeding System Settings...')

  const itemFetchCost = await prisma.creditSetting.upsert({
    where: { settingName: 'item_fetch_cost' },
    update: {},
    create: {
      id: 'setting-item-fetch-cost',
      settingName: 'item_fetch_cost',
      settingValue: 1,
      description: 'Credits deducted per item fetched',
      updatedBy: 'super-admin-001',
    },
  })
  console.log({ itemFetchCost })

  const research2StageCost = await prisma.creditSetting.upsert({
    where: { settingName: 'research2_stage_cost' },
    update: {},
    create: {
      id: 'setting-research2-stage-cost',
      settingName: 'research2_stage_cost',
      settingValue: 2,
      description: 'Credits deducted when item reaches research2 stage',
      updatedBy: 'super-admin-001',
    },
  })
  console.log({ research2StageCost })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
