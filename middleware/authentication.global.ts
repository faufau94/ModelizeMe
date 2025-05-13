// /middleware/authentication.global.ts
import { defineNuxtRouteMiddleware, navigateTo, useAuth } from '#imports'
import { watch } from 'vue'

export default defineNuxtRouteMiddleware(async (to) => {
  const { status, data } = useAuth()

  console.log('Auth status:', status.value)
  console.log('Auth data:', data.value);
  

  // 1) Wait until we know auth status
  if (status.value === 'loading') {
    await new Promise<void>(resolve => {
      const stop = watch(status, () => {
        if (status.value !== 'loading') {
          stop()
          resolve()
        }
      })
    })
  }

  

  // 2) Unauthenticated users get sent to /sign-in if they try /app or /admin
  if (status.value === 'unauthenticated' &&
      (to.path.startsWith('/app') || to.path.startsWith('/admin'))
  ) {
    return navigateTo('/sign-in')
  }

  const isSuperAdmin = data.value?.user?.role === 'admin'
  

  // 3) Root landing page → send to proper home
  if (status.value === 'authenticated' && to.path === '/') {
    return navigateTo(isSuperAdmin ? '/admin' : '/app')
  }

  // 4) Admins must live in /admin
  if (status.value === 'authenticated' && isSuperAdmin && to.path.startsWith('/app')) {
    return navigateTo('/admin')
  }

  // 5) Non-admins must not go into /admin
  if (status.value === 'authenticated' && !isSuperAdmin && to.path.startsWith('/admin')) {
    return navigateTo('/app')
  }

  // otherwise, let them through
})