import { auth } from "@/lib/auth"

async function main() {
  const adminUser = await auth.api.createUser({
    body: {
      name: "Admin test",
      email: "admin@admin.com",
      password: "password123",
      role: "admin",
    }
  });
  
  const regularUser = await auth.api.createUser({
    body: {
      name: "User test",
      email: "user@user.com",
      password: "password123",
      role: "user",
    }
  });

  const organizationUser = await auth.api.createOrganization({
    body: {
      name: "Default workspace",
      slug: "default-workspace",
      userId: regularUser.user.id,
      metadata: {
        description: "Main workspace for the application"
      }
    }
  });

}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })