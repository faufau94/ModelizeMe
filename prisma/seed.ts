import { PrismaClient } from "~/prisma/generated/prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  // 1) Upsert des rôles
  const superRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "Accès total à l'administration",
    },
  })
  const userRole = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      name: "USER",
      description: "Utilisateur standard",
    },
  })

  // 2) Création du super-admin "Faudel Admin"
  const hashedAdmin = await bcrypt.hash("faufauPassword123", 10)
  await prisma.user.upsert({
    where: { email: "faufau@modelizeme.app" },
    update: {
      first_name: "Faudel",
      name: "Admin",
      password: hashedAdmin,
      roleId: superRole.id,         // <-- on set directement le roleId
    },
    create: {
      email: "faufau@modelizeme.app",
      first_name: "Faudel",
      name: "Admin",
      password: hashedAdmin,
      roleId: superRole.id,
    },
  })

  // 3) Création d’un utilisateur normal
  const hashedUser = await bcrypt.hash("userPassword123", 10)
  await prisma.user.upsert({
    where: { email: "normal@modelizeme.app" },
    update: {
      first_name: "Normal",
      name: "User",
      password: hashedUser,
      roleId: userRole.id,          // <-- ici aussi on set roleId
    },
    create: {
      email: "normal@modelizeme.app",
      first_name: "Normal",
      name: "User",
      password: hashedUser,
      roleId: userRole.id,
    },
  })

  console.log("✅ Seed terminé : rôles et users créés avec roleId.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })