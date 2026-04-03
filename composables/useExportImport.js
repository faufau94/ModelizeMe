import { toPng, toJpeg, toSvg } from 'html-to-image'
import { toast } from 'vue-sonner'
import { useMLDStore } from '~/stores/mld-store.js'

// Padding around diagram in the output image (in CSS px)
const IMAGE_PADDING = 40
// Pixel ratio — multiplies the actual file resolution for sharpness
const PIXEL_RATIO = 2

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

    // Measure the real bounding box of all content from the DOM
    const { viewport } = flow
    const vp = viewport.value || { x: 0, y: 0, zoom: 1 }
    const containerRect = flow.vueFlowRef.getBoundingClientRect()
    const selectors = '.vue-flow__node, .vue-flow__edge path, .vue-flow__edgelabel-renderer > div'
    const elements = viewportEl.querySelectorAll(selectors)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    elements.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      // Screen coords → flow coords: undo viewport translate + zoom
      const x1 = (r.left - containerRect.left - vp.x) / vp.zoom
      const y1 = (r.top - containerRect.top - vp.y) / vp.zoom
      const x2 = x1 + r.width / vp.zoom
      const y2 = y1 + r.height / vp.zoom
      if (x1 < minX) minX = x1
      if (y1 < minY) minY = y1
      if (x2 > maxX) maxX = x2
      if (y2 > maxY) maxY = y2
    })

    const boundsW = maxX - minX
    const boundsH = maxY - minY

    // Output image: fixed width, height follows diagram aspect ratio
    const imageWidth = 1920
    const imageHeight = Math.ceil(imageWidth * (boundsH / boundsW))

    // Zoom to fit the diagram inside the image with padding
    const zoom = Math.min(
      (imageWidth - IMAGE_PADDING * 2) / boundsW,
      (imageHeight - IMAGE_PADDING * 2) / boundsH,
    )

    // Center the diagram in the image
    const tx = (imageWidth - boundsW * zoom) / 2 - minX * zoom
    const ty = (imageHeight - boundsH * zoom) / 2 - minY * zoom

    const filter = (node) => !node.classList?.contains('vue-flow__panel')

    const baseOptions = {
      width: imageWidth,
      height: imageHeight,
      pixelRatio: PIXEL_RATIO,
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
        dataUrl = await toJpeg(viewportEl, { ...baseOptions, backgroundColor: '#ffffff', quality: 0.95 })
      } else if (type === 'svg') {
        dataUrl = await toSvg(viewportEl, { ...baseOptions, pixelRatio: 1 })
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
    { title: 'Exporter en JPEG', action: () => exportAsImage('jpeg') },
    { title: 'Exporter en SVG', action: () => exportAsImage('svg') },
    { title: 'Exporter en JSON', action: () => exportToJSON() },
    { title: 'Exporter en SQL (MySQL)', action: () => exportToSQL('mysql') },
    { title: 'Exporter en SQL (PostgreSQL)', action: () => exportToSQL('pgsql') },
  ]

  return { exportAsImage, exportToSQL, exportToJSON, importItems, exportItems }
}
