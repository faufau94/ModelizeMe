import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

  const { workspaceId, name, description, maxMembers, selectedUsers } = await readBody(event)
  if (!workspaceId || !name) {
    throw createError({ statusCode: 400, message: 'workspaceId et name sont requis' })
  }

  console.log('selectedUsers', selectedUsers)

  const team = await prisma.team.create({
    data: {
      name,
      description,
      maxMembers,
      workspaceId: String(workspaceId),
    }
  })

  // Add members to the team
  if (maxMembers && maxMembers > 0) {
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: selectedUsers[0],
      }
    })
  }
  return null
})
