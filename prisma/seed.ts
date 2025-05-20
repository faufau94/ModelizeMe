import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // 1) Créer / mettre à jour un super-admin par défaut
  const admin = {
    name: 'Faudel Admin',
    defaultEmail: 'faufau@modelizeme.app',
    defaultPassword: 'faufauPassword123',
  }
  const hashedPassword = await bcrypt.hash(admin.defaultPassword, 10)

  await prisma.user.upsert({
    where: { email: admin.defaultEmail },
    update: {
      password: hashedPassword,
      name: admin.name,
    },
    create: {
      email: admin.defaultEmail,
      password: hashedPassword,
      name: admin.name,
    },
  })

  // // 2) Créer un workspace “Default Workspace” si nécessaire
  // let workspace = await prisma.workspace.findFirst({
  //   where: {
  //     ownerId: faufau.id,
  //     name: 'Default Workspace',
  //   },
  // })
  // if (!workspace) {
  //   workspace = await prisma.workspace.create({
  //     data: {
  //       name: 'Default Workspace',
  //       owner: { connect: { id: faufau.id } },
  //     },
  //   })
  // }

  // // 3) Assigner FauFau comme OWNER de ce workspace
  // await prisma.workspaceMember.upsert({
  //   where: {
  //     userId_workspaceId: {
  //       userId: faufau.id,
  //       workspaceId: workspace.id,
  //     },
  //   },
  //   update: {
  //     role: 'OWNER',
  //     canViewAllTeams: true,
  //   },
  //   create: {
  //     user:      { connect: { id: faufau.id } },
  //     workspace: { connect: { id: workspace.id } },
  //     role: 'OWNER',
  //     canViewAllTeams: true,
  //   },
  // })

  // // 4) (Optionnel) Créer quelques catégories de galerie par défaut
  // const defaultCategories = ['Default']
  // for (const name of defaultCategories) {
  //   const exists = await prisma.category.findFirst({ where: { name } })
  //   if (!exists) {
  //     await prisma.category.create({ data: { name } })
  //   }
  // }

  console.log('✅ Seed terminé : user créé.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })