export function useWorkspaceNavigation() {
  const { data } = useAuth()

  // — SELECTED WORKSPACE —
  const goToDashboard = () => {
    const lastActiveWorkspaceId = data.value?.user?.lastActiveWorkspaceId
    return `/app/workspace/${lastActiveWorkspaceId}/dashboard`
  }

  return { 
    
    // when the user is authenticated, we can use the lastActiveWorkspaceId
    goToDashboard,
   }
}