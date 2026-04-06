interface Viewer {
  userId: string
  userName: string
  userImage: string | null
  lastSeen: number
}

// In-memory store: modelId -> Map<userId, Viewer>
const modelViewers = new Map<string, Map<string, Viewer>>()

const VIEWER_TTL = 60_000 // 60 seconds

function cleanExpired() {
  const now = Date.now()
  for (const [modelId, viewers] of modelViewers) {
    for (const [userId, viewer] of viewers) {
      if (now - viewer.lastSeen > VIEWER_TTL) {
        viewers.delete(userId)
      }
    }
    if (viewers.size === 0) {
      modelViewers.delete(modelId)
    }
  }
}

export function registerViewer(modelId: string, userId: string, userName: string, userImage: string | null) {
  if (!modelViewers.has(modelId)) {
    modelViewers.set(modelId, new Map())
  }
  modelViewers.get(modelId)!.set(userId, {
    userId,
    userName,
    userImage,
    lastSeen: Date.now(),
  })
}

export function unregisterViewer(modelId: string, userId: string) {
  const viewers = modelViewers.get(modelId)
  if (viewers) {
    viewers.delete(userId)
    if (viewers.size === 0) {
      modelViewers.delete(modelId)
    }
  }
}

export function getViewersForModels(modelIds: string[]): Record<string, Viewer[]> {
  cleanExpired()
  const result: Record<string, Viewer[]> = {}
  for (const modelId of modelIds) {
    const viewers = modelViewers.get(modelId)
    if (viewers && viewers.size > 0) {
      result[modelId] = Array.from(viewers.values())
    }
  }
  return result
}
