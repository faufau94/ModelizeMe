import { toPng, toJpeg, toSvg } from 'html-to-image'
import { getRectOfNodes, getTransformForBounds } from '@vue-flow/core'
import { toast } from 'vue-sonner'
import { useMLDStore } from '~/stores/mld-store.js'

// Output resolution for image exports
const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 1080

/**
 * Composable centralizing all export/import logic for the model editor.
 *
 * @param {import('vue').Ref} currentFlow - Ref to the active VueFlow instance
 * @param {import('vue').Ref} model       - Ref to the current model object { name, ... }
 */
export function useExportImport(currentFlow, model) {
  const route = useRoute()
  const mldStore = useMLDStore()

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
  // Uses Vue Flow's getRectOfNodes + getTransformForBounds to capture ALL nodes
  // regardless of current viewport position/zoom — same approach as the
  // official React Flow "Download Image" example adapted for Vue Flow.

  async function exportAsImage(type = 'png') {
    const flow = currentFlow.value
    if (!flow) return

    // getNodes can be a computed ref (.value) or a plain reactive array depending on context
    const nodes = Array.isArray(flow.getNodes) ? flow.getNodes : flow.getNodes?.value ?? []
    if (!nodes.length) {
      toast.warning('Aucun nœud à exporter.')
      return
    }

    // Target the inner viewport element, NOT the outer container
    const viewportEl = flow.vueFlowRef?.querySelector('.vue-flow__viewport')
    if (!viewportEl) {
      toast.error('Impossible de trouver le viewport.')
      return
    }

    // Calculate a transform that fits all nodes into the output image
    const bounds = getRectOfNodes(nodes)
    const { x, y, zoom } = getTransformForBounds(bounds, IMAGE_WIDTH, IMAGE_HEIGHT, 0.5, 2, 0.1)

    const filter = (node) => !node.classList?.contains('vue-flow__panel')

    const baseOptions = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      filter,
      style: {
        width: `${IMAGE_WIDTH}px`,
        height: `${IMAGE_HEIGHT}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    }

    try {
      const safeName = getSafeFileName(model.value?.name)
      let dataUrl

      if (type === 'jpeg') {
        dataUrl = await toJpeg(viewportEl, { ...baseOptions, backgroundColor: '#ffffff', quality: 0.95 })
      } else if (type === 'svg') {
        dataUrl = await toSvg(viewportEl, baseOptions)
      } else {
        dataUrl = await toPng(viewportEl, { ...baseOptions, backgroundColor: '#ffffff' })
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
      const { nodesMLD, edgesMLD } = mldStore.generateMLD(mcdModel.nodes, mcdModel.edges)

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
    { title: 'Exporter en SVG', action: () => exportAsImage('svg') },
    { title: 'Exporter en JPEG', action: () => exportAsImage('jpeg') },
    { title: 'Exporter en JSON', action: () => exportToJSON() },
    { title: 'Exporter en SQL (MySQL)', action: () => exportToSQL('mysql') },
    { title: 'Exporter en SQL (PostgreSQL)', action: () => exportToSQL('pgsql') },
  ]

  return { exportAsImage, exportToSQL, exportToJSON, importItems, exportItems }
}
