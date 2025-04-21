import { Accessor, createEffect, on, Owner, runWithOwner } from 'solid-js'

// given a reactive record mapping number ids to positions,
// run side effects when individual elements change
export function createEffectsOnMove(
  owner: Owner | null,
  source: Accessor<
    Record<
      number,
      {
        x: number
        y: number
      }
    >
  >,
  effect: (
    id: number,
    pos: {
      x: number
      y: number
    }
  ) => unknown,
  cleanup?: (id: number) => unknown
) {
  runWithOwner(owner, () => {
    // keep track of drones we have side effects attached to
    const trackedIds: number[] = []
    // create side effects for new drones and cleanup side effects
    // for unused drone ids
    createEffect(
      on(
        () => Object.values(source()).length,
        () => {
          Object.entries(source()).forEach(([strId, pos]) => {
            const id = parseInt(strId)
            // don't create a side effect if one already should exist
            if (id in trackedIds) return
            // run with the provided owner to prevent from being disposed
            // when the parent effect reevaluates
            runWithOwner(owner, () =>
              createEffect(
                on(
                  () => pos,
                  () => effect(id, pos)
                )
              )
            )
            // track id to avoid creating effect again
            trackedIds.push(id)
          })

          // cleanup removed ids
          for (let i = trackedIds.length - 1; i >= 0; i--) {
            if (trackedIds[i] in source()) return
            cleanup?.(trackedIds[i]) // call cleanup callback if provided
            trackedIds.splice(i, 1)
          }
        }
      )
    )
  })
}
