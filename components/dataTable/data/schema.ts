import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  name: z.string(),
  role: z.string(),
})

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.number(),
  inviteCode: z.string(),
})


export type User = z.infer<typeof userSchema>
export type Role = z.infer<typeof roleSchema>
export type Class = z.infer<typeof classSchema>
