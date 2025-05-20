// /middleware/require-super-admin.global.ts
import { defineNuxtRouteMiddleware, navigateTo, useAuth } from '#imports'
import { watch } from 'vue'

export default defineNuxtRouteMiddleware(async (to) => {
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
    && session.user.role.some((r: any) => r.name === 'admin')

  // if they’re not an admin, send them back to /app
  if (!isAdmin) {
    return navigateTo('/app')
  }
  // otherwise allow into /admin/**
})
