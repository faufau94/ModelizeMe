export default defineNuxtRouteMiddleware((to) => {
    const { status, signIn } = useAuth()

    // Return immediately if user is already authenticated
    if (status.value === 'authenticated' && to.path === '/') {
        return navigateTo('/app')
    }

    // Redirect to sign-in page if user is unauthenticated
    if(status.value === 'unauthenticated' && to.path.startsWith('/app')) {
        return navigateTo('/sign-in')
    }

    // Redirect to home page if user is unauthenticated
    else if (status.value === 'unauthenticated' && to.path !== '/sign-in' && to.path !== '/sign-up' && to.path !== '/') {
        return navigateTo('/sign-in')
    }

    return
})