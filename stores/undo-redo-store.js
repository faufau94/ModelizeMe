import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUndoRedoStore = defineStore('undo-redo', () => {
  // Local stacks (in-memory only, not persisted)
  const undoStack = ref([])
  const redoStack = ref([])

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  /**
   * Push an undoable event onto the undo stack.
   * Called by mcdStore.emitEvent() after each successful action.
   * Non-undoable events (LAYOUT_APPLIED, BATCH_POSITIONS) are ignored.
   */
  function pushUndoable(event) {
    if (!event.undoable || !event.inverse) return
    undoStack.value.push(event)
    redoStack.value = [] // new action clears redo stack
  }

  /**
   * Push a batch of undoable events as a single undo group.
   * Used for operations like removeNode (TABLE_DELETED + N × RELATION_DELETED).
   */
  function pushUndoableBatch(events) {
    const undoableEvents = events.filter(e => e.undoable && e.inverse)
    if (!undoableEvents.length) return
    undoStack.value.push({ _batch: true, events: undoableEvents })
    redoStack.value = []
  }

  /**
   * Undo: pop from undo stack, emit inverse event(s), push to redo stack.
   * emitFn is the mcdStore.emitEvent function (avoids circular import).
   */
  async function undo(idModel, emitFn) {
    const entry = undoStack.value.pop()
    if (!entry) return

    if (entry._batch) {
      // Undo batch: emit all inverses in reverse order
      const inverseEvents = entry.events
        .slice()
        .reverse()
        .map(e => ({ ...e.inverse, undoable: false }))
      await emitFn(idModel, inverseEvents)
    } else {
      // Undo single event
      await emitFn(idModel, [{ ...entry.inverse, undoable: false }])
    }

    redoStack.value.push(entry)
  }

  /**
   * Redo: pop from redo stack, re-emit original event(s), push to undo stack.
   */
  async function redo(idModel, emitFn) {
    const entry = redoStack.value.pop()
    if (!entry) return

    if (entry._batch) {
      // Redo batch: re-emit all original events in order
      const reEvents = entry.events.map(e => ({
        type: e.type,
        payload: e.payload,
        inverse: e.inverse,
        undoable: false
      }))
      await emitFn(idModel, reEvents)
    } else {
      await emitFn(idModel, [{
        type: entry.type,
        payload: entry.payload,
        inverse: entry.inverse,
        undoable: false
      }])
    }

    undoStack.value.push(entry)
  }

  function clear() {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    pushUndoable,
    pushUndoableBatch,
    undo,
    redo,
    clear
  }
})
