import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  // With better-auth organization plugin, roles are: owner, admin, member
  return [
    { name: "owner", label: "Propriétaire" },
    { name: "admin", label: "Administrateur" },
    { name: "member", label: "Membre" },
  ];
});
