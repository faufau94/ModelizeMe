// /middleware/authentication.global.ts
import { defineNuxtRouteMiddleware, navigateTo, useAuth } from '#imports'
import { watch } from 'vue'
import { useWorkspace } from '~/composables/api/useWorkspace'

export default defineNuxtRouteMiddleware(async (to) => {
  const { status, data } = useAuth()
  const { goToDashboard } = useWorkspace()
  

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

  // 2.5) Authenticated users get sent to the dashboard if they try /sign-in or /sign-up
  if (status.value === 'authenticated' &&
      (to.path === '/sign-in' || to.path === '/sign-up')
  ) {
    return navigateTo(goToDashboard())
  }
  
  const isSuperAdmin = data.value?.user?.role === 'SUPER_ADMIN'
  

  // 3) Root landing page → send to proper home
  if (status.value === 'authenticated' && to.path === '/') {
    return navigateTo(isSuperAdmin ? '/admin' : goToDashboard())
  }

  // 4) Admins must live in /admin
  if (status.value === 'authenticated' && isSuperAdmin && to.path.startsWith('/app')) {
    return navigateTo('/admin')
  }

  // 5) Non-admins must not go into /admin
  if (status.value === 'authenticated' && !isSuperAdmin && to.path.startsWith('/admin')) {
    return navigateTo(goToDashboard())
  }

  // otherwise, let them through
})