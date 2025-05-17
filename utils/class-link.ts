// utils/url.ts
import { useRuntimeConfig } from '#imports'

export function makeClassLink(slug: string) {
  const { baseUrl } = useRuntimeConfig().public
  return `${baseUrl}/app/classes/invite/${slug}`
}
