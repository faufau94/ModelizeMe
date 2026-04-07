import { toPng, toJpeg, toSvg } from 'html-to-image'
import { toast } from 'vue-sonner'
import { useMLDStore } from '~/stores/mld-store.js'

// Padding ratio around the diagram (0.08 = 8% of image width/height)
const IMAGE_PADDING = 0.08

/**
 * Composable centralizing all export logic for the model editor.
 *
 * @param {import('vue').Ref} currentFlow - Ref to the active VueFlow instance
 * @param {import('vue').Ref} model       - Ref to the current model object { name, ... }
 */
export function useExport(currentFlow, model) {
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

  // ─── Image export (PNG / JPEG / SVG) ──────────────────────────────────────
  // Uses Vue Flow's fitView to frame the diagram tightly, captures via
  // html-to-image, then restores the original viewport position.

  async function exportAsImage(type = 'png') {
    const flow = currentFlow.value
    if (!flow) return

    const nodes = Array.isArray(flow.getNodes) ? flow.getNodes : flow.getNodes?.value ?? []
    if (!nodes.length) {
      toast.warning('Aucun nœud à exporter.')
      return
    }

    const containerEl = flow.vueFlowRef
    const viewportEl = containerEl?.querySelector('.vue-flow__viewport')
    if (!viewportEl || !containerEl) {
      toast.error('Impossible de trouver le viewport.')
      return
    }

    const filter = (node) => {
      if (node.classList?.contains('vue-flow__panel')) return false
      if (node.classList?.contains('vue-flow__controls')) return false
      if (node.classList?.contains('vue-flow__minimap')) return false
      return true
    }

    const isDark = colorMode.value === 'dark'
    const bgColor = isDark ? '#0f172a' : '#ffffff'

    // Deselect all nodes before capture to avoid rendering selection outlines
    const previousSelected = nodes.filter((n) => n.selected).map((n) => n.id)
    nodes.forEach((n) => { n.selected = false })

    // Save original viewport so we can restore it after capture
    const originalViewport = flow.getViewport()

    try {
      // Use Vue Flow's fitView to frame all nodes with padding
      flow.fitView({ padding: IMAGE_PADDING, duration: 0 })

      // Wait for Vue Flow to apply the new viewport transform
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Capture at the container's actual screen dimensions
      const { width: screenW, height: screenH } = containerEl.getBoundingClientRect()

      const baseOptions = {
        width: screenW,
        height: screenH,
        pixelRatio: 2,
        backgroundColor: bgColor,
        skipFonts: true,
        filter,
      }

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
    } finally {
      // Restore original viewport position
      flow.setViewport(originalViewport, { duration: 0 })
      // Restore previously selected nodes
      nodes.forEach((n) => {
        if (previousSelected.includes(n.id)) n.selected = true
      })
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

  const exportItems = [
    { type: 'label', title: 'Image' },
    { title: 'PNG', action: () => exportAsImage('png') },
    { title: 'JPEG', action: () => exportAsImage('jpeg') },
    { title: 'SVG', action: () => exportAsImage('svg') },
    { type: 'separator' },
    { type: 'label', title: 'Données' },
    { title: 'JSON', action: () => exportToJSON() },
    { type: 'separator' },
    { type: 'label', title: 'Base de données' },
    { title: 'SQL (MySQL)', action: () => exportToSQL('mysql') },
    { title: 'SQL (PostgreSQL)', action: () => exportToSQL('pgsql') },
  ]

  return { exportAsImage, exportToSQL, exportToJSON, exportItems }
}
