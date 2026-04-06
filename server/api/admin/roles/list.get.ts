import { requireAdmin } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  // With better-auth, roles are stored as strings on User.role
  // Return the available role values
  return [
    { name: "user", label: "Utilisateur" },
    { name: "admin", label: "Administrateur" },
  ];
});
