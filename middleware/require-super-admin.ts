// /middleware/require-super-admin.global.ts
import { defineNuxtRouteMiddleware, navigateTo, useAuth } from '#imports'
import { watch } from 'vue'
import { useWorkspace } from '~/composables/api/useWorkspace'

export default defineNuxtRouteMiddleware(async (to) => {
  const { goToDashboard } = useWorkspace()
  
  // only run on /admin routes
  if (!to.path.startsWith('/admin')) {
    return
  }

  const { status, data } = useAuth()
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

  const session = data.value
  const isAdmin = Array.isArray(session?.user?.role)
    && session.user.role === 'SUPER_ADMIN'

  // if they’re not an admin, send them back to /app
  if (!isAdmin) {
    return navigateTo(goToDashboard())
  }
  // otherwise allow into /admin/**
})
