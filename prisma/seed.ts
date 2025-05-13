import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Step 1: Create roles
  const [admin, teacher, student] = await Promise.all([
    prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } }),
    prisma.role.upsert({ where: { name: 'teacher' }, update: {}, create: { name: 'teacher' } }),
    prisma.role.upsert({ where: { name: 'student' }, update: {}, create: { name: 'student' } }),
  ])

  // Step 2: List of all permission actions
  const permissionActions = [
    'create_user', 'update_user', 'delete_user', 'read_user', 'manage_users', 'assign_roles', 'view_users',
    'create_class', 'update_class', 'delete_class', 'invite_to_class', 'view_class_members',
    'create_model', 'edit_model', 'delete_model', 'read_model', 'share_model', 'view_model_list',
    'comment_model', 'edit_comment', 'delete_comment',
    'create_galery_entry', 'manage_galeries',
    'access_all', 'view_dashboard',
  ]

  // Step 3: Create all permissions if they don't exist
  const createdPermissions = await Promise.all(
    permissionActions.map(action =>
      prisma.permission.upsert({ where: { action }, update: {}, create: { action } })
    )
  )

  // Step 4: Define permissions for each role
  const rolePermissionsMap: Record<string, string[]> = {
    admin: [
      'create_user', 'update_user', 'delete_user', 'read_user', 'manage_users', 'assign_roles', 'view_users',
      'delete_model', 'delete_comment', 'manage_galeries', 'access_all', 'view_dashboard', 'view_model_list'
    ],
    teacher: [
      'create_class', 'update_class', 'delete_class', 'invite_to_class', 'view_class_members',
      'read_model', 'share_model', 'comment_model', 'create_galery_entry', 'view_model_list', 'view_dashboard'
    ],
    student: [
      'create_model', 'edit_model', 'read_model', 'comment_model', 'edit_comment', 'view_class_members', 'view_model_list', 'view_dashboard'
    ],
  }

  // Step 5: Assign permissions to roles
  const roleIdMap = { admin: admin.id, teacher: teacher.id, student: student.id }

  for (const [roleName, actions] of Object.entries(rolePermissionsMap)) {
    const roleId = roleIdMap[roleName]
    for (const action of actions) {
      const permission = createdPermissions.find(p => p.action === action)
      if (!permission) continue
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id }
      })
    }
  }

  // Step 6: Create default super-admin user "faufau"
  const defaultPassword = 'faufauPassword123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  const faufau = await prisma.user.upsert({
    where: { email: 'faufau@modelizeme.app' },
    update: { password: hashedPassword },
    create: {
      email: 'faufau@modelizeme.app',
      password: hashedPassword,
      first_name: 'Fau',
      name: 'faufau',
      provider: 'credentials',
      createdAt: new Date(),
    }
  })

  // Step 7: Assign admin role to faufau (skipDuplicates avoids composite unique errors)
  await prisma.userRole.createMany({
    data: [ { userId: faufau.id, roleId: admin.id } ],
    skipDuplicates: true
  })

  console.log('✅ Roles, permissions, and default user seeded successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })