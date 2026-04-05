import { toPng, toJpeg, toSvg } from 'html-to-image'
import { toast } from 'vue-sonner'
import { useMLDStore } from '~/stores/mld-store.js'

// Fixed padding in px around the diagram in the output image
const IMAGE_PADDING = 30
// Scale: pixels per flow-coordinate unit (1 = 1:1 with screen at zoom 1)
const IMAGE_SCALE = 1.2

/**
 * Composable centralizing all export/import logic for the model editor.
 *
 * @param {import('vue').Ref} currentFlow - Ref to the active VueFlow instance
 * @param {import('vue').Ref} model       - Ref to the current model object { name, ... }
 */
export function useExportImport(currentFlow, model) {
  const route = useRoute()
  const mldStore = useMLDStore()
  const colorMode = useColorMode()

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function getSafeFileName(name) {
    return (name || 'model').toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_')
  }

  function triggerDownload(urlOrDataUrl, fileName) {
    const a = document.createElement('a')
    a.href = urlOrDataUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  /**
   * Compute the bounding box of ALL nodes using their flow-coordinate
   * positions and measured dimensions. This is independent of the current
   * viewport pan/zoom, so nodes that are scrolled off-screen are still
   * included (unlike DOM-based getBoundingClientRect).
   * An extra margin is added to account for edge labels / cardinality badges
   * that sit slightly outside the node bounds.
   */
  function getContentBounds(flow) {
    const nodes = Array.isArray(flow.getNodes) ? flow.getNodes : flow.getNodes?.value ?? []
    if (!nodes.length) return null

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const node of nodes) {
      const pos = node.computedPosition || node.position
      const w = node.dimensions?.width ?? node.width ?? 0
      const h = node.dimensions?.height ?? node.height ?? 0
      if (!pos || (!w && !h)) continue

      const x1 = pos.x
      const y1 = pos.y
      const x2 = pos.x + w
      const y2 = pos.y + h

      if (x1 < minX) minX = x1
      if (y1 < minY) minY = y1
      if (x2 > maxX) maxX = x2
      if (y2 > maxY) maxY = y2
    }

    if (!isFinite(minX)) return null

    // Extra margin for edge labels / cardinality badges that overflow nodes
    const LABEL_MARGIN = 50
    return {
      x: minX - LABEL_MARGIN,
      y: minY - LABEL_MARGIN,
      width: (maxX - minX) + LABEL_MARGIN * 2,
      height: (maxY - minY) + LABEL_MARGIN * 2,
    }
  }

  // ─── Image export (PNG / JPEG / SVG) ──────────────────────────────────────
  // Captures all flow elements (nodes + edges + labels) by computing their
  // bounding box in flow coordinates, then uses getTransformForBounds from
  // Vue Flow to produce a transform that fits them tightly in the output image.

  async function exportAsImage(type = 'png') {
    const flow = currentFlow.value
    if (!flow) return

    const nodes = Array.isArray(flow.getNodes) ? flow.getNodes : flow.getNodes?.value ?? []
    if (!nodes.length) {
      toast.warning('Aucun nœud à exporter.')
      return
    }

    const viewportEl = flow.vueFlowRef?.querySelector('.vue-flow__viewport')
    if (!viewportEl) {
      toast.error('Impossible de trouver le viewport.')
      return
    }

    // Get the real bounding box of all visible elements
    const bounds = getContentBounds(flow)
    if (!bounds) {
      toast.warning('Aucun élément visible à exporter.')
      return
    }

    // Image dimensions derived from the actual content size
    const imageWidth = Math.ceil(bounds.width * IMAGE_SCALE) + IMAGE_PADDING * 2
    const imageHeight = Math.ceil(bounds.height * IMAGE_SCALE) + IMAGE_PADDING * 2

    // Transform: scale the content then center it with padding
    const tx = -bounds.x * IMAGE_SCALE + IMAGE_PADDING
    const ty = -bounds.y * IMAGE_SCALE + IMAGE_PADDING
    const zoom = IMAGE_SCALE

    const filter = (node) => {
      if (node.classList?.contains('vue-flow__panel')) return false
      if (node.classList?.contains('vue-flow__controls')) return false
      if (node.classList?.contains('vue-flow__minimap')) return false
      return true
    }

    const isDark = colorMode.value === 'dark'
    const bgColor = isDark ? '#0f172a' : '#ffffff'

    const baseOptions = {
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 1,
      backgroundColor: bgColor,
      filter,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
      },
    }

    try {
      const safeName = getSafeFileName(model.value?.name)
      let dataUrl

      if (type === 'jpeg') {
        dataUrl = await toJpeg(viewportEl, { ...baseOptions, quality: 0.95 })
      } else if (type === 'svg') {
        dataUrl = await toSvg(viewportEl, baseOptions)
      } else {
        dataUrl = await toPng(viewportEl, baseOptions)
      }

      triggerDownload(dataUrl, `${safeName}-diagram.${type}`)
      toast.success(`Export ${type.toUpperCase()} généré avec succès !`)
    } catch (e) {
      console.error(e)
      toast.error(`Une erreur est survenue lors de l'export ${type.toUpperCase()}.`)
    }
  }

  // ─── SQL export ────────────────────────────────────────────────────────────

  async function exportToSQL(database) {
    try {
      const mcdModel = await $fetch('/api/models/read', {
        method: 'GET',
        query: { id: route.params.idModel },
      })
      const { nodesMLD, edgesMLD } = await mldStore.generateMLD(mcdModel.nodes, mcdModel.edges)

      const safeName = getSafeFileName(mcdModel?.name)
      const title = `${safeName}_${Date.now()}_${crypto.randomUUID()}`
      const response = await $fetch('/api/generator/generate-file', {
        method: 'POST',
        body: { title, database, nodes: nodesMLD, edges: edgesMLD },
      })

      const blob = new Blob([response], { type: 'application/x-sql' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `${title}.sql`)
      URL.revokeObjectURL(url)
      toast.success('Export SQL généré avec succès !')
    } catch (e) {
      console.error(e)
      toast.error("Une erreur est survenue lors de l'export SQL.")
    }
  }

  // ─── JSON export ───────────────────────────────────────────────────────────

  async function exportToJSON() {
    try {
      const mcdModel = await $fetch('/api/models/read', {
        method: 'GET',
        query: { id: route.params.idModel },
      })
      const dataForExport = { nodes: mcdModel.nodes, edges: mcdModel.edges }

      const blob = new Blob([JSON.stringify(dataForExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const safeName = getSafeFileName(mcdModel?.name)
      triggerDownload(url, `${safeName}.json`)
      URL.revokeObjectURL(url)
      toast.success('Export JSON généré avec succès !')
    } catch (e) {
      console.error(e)
      toast.error("Une erreur est survenue lors de l'export JSON.")
    }
  }

  // ─── Items for the dropdown ────────────────────────────────────────────────

  const importItems = [
    { title: 'Importer un fichier JSON' },
    { title: 'Importer un fichier SQL' },
    { title: 'Importer un fichier XML' },
  ]

  const exportItems = [
    { title: 'Exporter en PNG', action: () => exportAsImage('png') },
    { title: 'Exporter en JPEG', action: () => exportAsImage('jpeg') },
    { title: 'Exporter en SVG', action: () => exportAsImage('svg') },
    { title: 'Exporter en JSON', action: () => exportToJSON() },
    { title: 'Exporter en SQL (MySQL)', action: () => exportToSQL('mysql') },
    { title: 'Exporter en SQL (PostgreSQL)', action: () => exportToSQL('pgsql') },
  ]

  return { exportAsImage, exportToSQL, exportToJSON, importItems, exportItems }
}
