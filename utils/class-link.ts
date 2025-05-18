// utils/url.ts
import { useRuntimeConfig } from '#imports'

export function makeClassLink(joinCode: string) {
  const { baseUrl } = useRuntimeConfig().public
  return `${baseUrl}/app/welcome?joinCode=${joinCode}`
}
