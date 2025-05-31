
export function makeWorkspaceLink(inviteCode: string) {
  const { baseUrl } = useRuntimeConfig().public
  return `${baseUrl}/app/welcome?inviteCode=${inviteCode}`
}
