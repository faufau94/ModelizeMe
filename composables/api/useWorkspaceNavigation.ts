// import { useSession } from "~/lib/auth-client"

// export async function useWorkspaceNavigation() {

//   // — SELECTED WORKSPACE —
//   const goToDashboard = async () => {
//     const { data: session } = await useSession(useFetch)
//     console.log(session)
//     if (session?.value?.activeOrganizationId) {
//       return `/app/workspace/${session?.value?.activeOrganizationId}/dashboard`
//     }
//     return '/' // fallback if no active organization
//   }

//   return { 
//     // when the user is authenticated, we can use the lastActiveWorkspaceId
//     goToDashboard,
//   }
// }