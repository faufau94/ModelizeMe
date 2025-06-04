import { authClient } from "@/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to, from) => {

	const { data: session } = await authClient.useSession(useFetch); 
	if (!session.value) {
		if (to.path === "/dashboard") {
			return navigateTo("/");
		}
	}

	if (session.value) {
		if (to.path === "/" || to.path === "/sign-in" || to.path === "/sign-up") {
			return navigateTo("/dashboard");
		}
	}
});



// // /middleware/authentication.global.ts
// import { defineNuxtRouteMiddleware, navigateTo, useAuth } from '#imports'
// import { watch } from 'vue'
// import { useWorkspaceNavigation } from '~/composables/api/useWorkspaceNavigation'

// export default defineNuxtRouteMiddleware(async (to) => {
//   const { status, data } = useAuth()
//   const { goToDashboard } = useWorkspaceNavigation()
  

//   // 1) Wait until we know auth status
//   if (status.value === 'loading') {
//     await new Promise<void>(resolve => {
//       const stop = watch(status, () => {
//         if (status.value !== 'loading') {
//           stop()
//           resolve()
//         }
//       })
//     })
//   }

//   const isAuth  = status.value === 'authenticated'
//   const isNotAuth = status.value === 'unauthenticated'

//   // 2) If the user is authenticated and the route is /, send them to the dashboard
//   if (isAuth && to.path === '/') {
//     return navigateTo(goToDashboard())
//   }
  

//   // 2) Unauthenticated users get sent to /sign-in if they try /app or /admin
//   if (isNotAuth &&
//       (to.path.startsWith('/app') || to.path.startsWith('/admin'))
//   ) {
//     return navigateTo('/sign-in')
//   }

//   // 2.5) Authenticated users get sent to the dashboard if they try /sign-in or /sign-up
//   if (isAuth &&
//       (to.path === '/sign-in' || to.path === '/sign-up')
//   ) {
//     return navigateTo(goToDashboard())
//   }
  
//   const isSuperAdmin = data.value?.user?.role === 'SUPER_ADMIN'
  

//   // 3) Root landing page → send to proper home
//   if (isAuth && to.path === '/') {
//     return navigateTo(isSuperAdmin ? '/admin' : goToDashboard())
//   }

//   // 4) Admins must live in /admin
//   if (isAuth && isSuperAdmin && to.path.startsWith('/app')) {
//     return navigateTo('/admin')
//   }

//   // 5) Non-admins must not go into /admin
//   if (isAuth && !isSuperAdmin && to.path.startsWith('/admin')) {
//     return navigateTo(goToDashboard())
//   }

//   // otherwise, let them through
// })