import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'
import { toast } from 'sonner'

interface UseRecipeDraftLeaveGuardOptions {
  enabled?: boolean
  hasPendingChanges: () => boolean
  saveDraft: () => Promise<void>
}

export function useRecipeDraftLeaveGuard({
  enabled = true,
  hasPendingChanges,
  saveDraft,
}: UseRecipeDraftLeaveGuardOptions) {
  const isAutosavingRef = useRef(false)
  const handledTransitionRef = useRef<string | null>(null)
  const saveDraftRef = useRef(saveDraft)
  const hasPendingChangesRef = useRef(hasPendingChanges)

  useEffect(() => {
    saveDraftRef.current = saveDraft
    hasPendingChangesRef.current = hasPendingChanges
  }, [saveDraft, hasPendingChanges])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!enabled) return false
    if (currentLocation.pathname === nextLocation.pathname) return false
    return hasPendingChangesRef.current()
  })

  useEffect(() => {
    if (blocker.state === 'unblocked') {
      handledTransitionRef.current = null
      return
    }

    if (blocker.state !== 'blocked' || isAutosavingRef.current) return

    const transitionKey = blocker.location.pathname + blocker.location.search
    if (handledTransitionRef.current === transitionKey) return
    handledTransitionRef.current = transitionKey

    isAutosavingRef.current = true
    void (async () => {
      try {
        await saveDraftRef.current()
        toast.success('Szkic został automatycznie zapisany')
      } catch {
        toast.error('Nie udało się zapisać szkicu przed opuszczeniem strony')
        handledTransitionRef.current = null
        blocker.reset()
        return
      } finally {
        isAutosavingRef.current = false
      }

      try {
        blocker.proceed()
      } catch {
        // Zapis się udał — nawigacja mogła już ruszyć lub blocker wygasł.
      }
    })()
  }, [blocker.state, blocker])

  return blocker
}
