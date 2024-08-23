export default defineNuxtRouteMiddleware((to) => {
    const { status, signIn } = useAuth()

    // Return immediately if user is already authenticated
    if (status.value === 'authenticated' && to.path === '/') {
        return navigateTo('/app/dashboard')
    }

    else if (status.value === 'unauthenticated' && to.path !== '/sign-in' && to.path !== '/') {
        return navigateTo('/sign-in')
    }

    return
})