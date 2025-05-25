import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  name: z.string(),
  role: z.number(),
})

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.number(),
  inviteCode: z.string(),
})

export const modelSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  nodes: z.object({}),
  edges: z.object({}),
  description: z.string(),
  reference: z.string(),
  authorId: z.number(),
  locked: z.boolean(),
  teamId: z.number(),
  workspaceId: z.number(),
  inviteCode: z.string(),
})

export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  roleId: z.string(),
  canViewAllTeams: z.boolean(),
})


export type User = z.infer<typeof userSchema>
export type Role = z.infer<typeof roleSchema>
export type Workspace = z.infer<typeof workspaceSchema>
export type Model = z.infer<typeof modelSchema>
export type Member = z.infer<typeof memberSchema>
