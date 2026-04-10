import { z } from "zod";

// ─── Common ───
export const idSchema = z.string().min(1, "ID requis");

// ─── Models ───
export const createModelSchema = z.object({
  title: z.string().min(2, "Titre trop court").max(100, "Titre trop long"),
  selectedWorkspaceId: z.string().min(1, "Workspace requis"),
  teamId: z.string().optional(),
});

export const updateModelSchema = z.object({
  type: z.enum(["node", "edge"]),
  node: z.record(z.unknown()).optional(),
  edge: z.record(z.unknown()).optional(),
  teamId: z.string().optional(),
});

export const deleteModelElementSchema = z.object({
  type: z.enum(["node", "edge", "model"]).optional(),
  action: z.enum(["removeNode", "removeEdge", "removeModel"]).optional(),
});

export const bulkDeleteModelsSchema = z.object({
  ids: z.array(z.string().min(1)),
});

export const bulkMoveModelsSchema = z.object({
  ids: z.array(z.string().min(1)),
  teamId: z.string().nullable().optional(),
});

export const bulkCopyModelsSchema = z.object({
  ids: z.array(z.string().min(1)),
  targetWorkspaceId: z.string().min(1, "Workspace de destination requis"),
});

export const renameModelSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
});

export const importModelSchema = z.object({
  type: z.enum(["node", "edge"]),
  items: z.array(z.record(z.unknown())).max(500, "Trop d'éléments (max 500)"),
});

// ─── Teams ───
export const createTeamSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  organizationId: z.string().min(1, "Organisation requise"),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  userId: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

export const renameTeamSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
});

// ─── Categories ───
export const createCategorySchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
});

// ─── Feedback ───
export const createFeedbackSchema = z.object({
  category: z.enum(["suggestion", "bug", "feedback", "praise"]),
  message: z.string().min(1, "Message requis").max(5000, "Message trop long"),
});

// ─── Galeries ───
export const createGalerySchema = z.object({
  modelId: z.string().min(1, "Modèle requis"),
  categoryId: z.string().min(1, "Catégorie requise"),
  userId: z.string().min(1, "Utilisateur requis"),
});

// ─── Admin ───
export const editUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  banned: z.boolean().optional(),
  banReason: z.string().optional(),
});

// ─── Generator ───
export const generateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  framework: z.enum(["django", "laravel", "nuxt"]),
  database: z.enum(["postgresql", "mysql", "sqlite"]),
  orm: z.enum(["django_orm", "sqlalchemy", "eloquent", "prisma", "typeorm", "doctrine"]),
  nodes: z.array(z.record(z.unknown())),
  edges: z.array(z.record(z.unknown())),
  packages: z.array(z.string()).optional(),
});

export const projectNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, "Nom de projet invalide");

export const generateFileSchema = z.object({
  title: z.string().optional(),
  database: z.string().min(1),
  nodes: z.array(z.record(z.unknown())),
  edges: z.array(z.record(z.unknown())),
});
