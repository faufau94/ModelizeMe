import { z } from 'zod'

// User schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string(), // ISO string for Date
  updatedAt: z.string(),
  role: z.string().nullable(),
  banned: z.boolean().optional().nullable(),
  banReason: z.string().optional().nullable(),
  banExpires: z.string().optional().nullable(),
})

// Role schema (not in Prisma, but keep for app logic)
export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

// Team schema
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
    description: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    maxMembers: z.number().nullable().optional(),
  organizationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
})

// Organization (Workspace) schema
export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  createdAt: z.string(),
  metadata: z.string().nullable().optional(),
  teams: z.array(teamSchema),
})

export const workspaceRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

// Model schema
export const modelSchema = z.object({
  id: z.number(),
  reference: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  locked: z.boolean(),
  nodes: z.any(),
  edges: z.any(),
  type: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  workspaceId: z.string(),
  teamId: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
})

// Member schema
export const memberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.string(),
  teamId: z.string().nullable().optional(),
})

// TeamMember schema (not explicit in Prisma, but can be used for member with teamId)
export const teamMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string(),
})

export type User = z.infer<typeof userSchema>
export type Role = z.infer<typeof roleSchema>
export type Workspace = z.infer<typeof workspaceSchema>
export type Model = z.infer<typeof modelSchema>
export type Member = z.infer<typeof memberSchema>
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>
export type Team = z.infer<typeof teamSchema>
export type TeamMember = z.infer<typeof teamMemberSchema>
