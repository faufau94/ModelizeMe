import { authClient } from "@/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to, from) => {
	const { data: session } = await authClient.useSession(useFetch);

	// Unauthenticated users: block access to /app and /admin
	if (!session.value) {
		if (to.path.startsWith("/app") || to.path.startsWith("/admin")) {
			return await navigateTo("/sign-in");
		}
	}

	// Authenticated users: redirect away from public auth pages
	if (session.value) {
		if (to.path === "/" || to.path === "/sign-in" || to.path === "/sign-up") {
			return await navigateTo(
				`/app/workspace/${session.value.session?.activeOrganizationId}/dashboard`
			);
		}

		// Non-admin users: block access to /admin routes
		if (to.path.startsWith("/admin") && session.value.user?.role !== "admin") {
			return await navigateTo(
				`/app/workspace/${session.value.session?.activeOrganizationId}/dashboard`
			);
		}
	}
});
