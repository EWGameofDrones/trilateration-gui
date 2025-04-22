import { Component, useContext } from 'solid-js'
import { PathContext } from '../contexts/PathContext'
import { reconcile } from 'solid-js/store'

// when pressed, delete all paths
export const ClearPathsButton: Component<{}> = () => {
  const pathContext = useContext(PathContext)
  if (pathContext === undefined) throw new Error('Failed to load path context.')

  return (
    <>
      <button
        class="mx-4 cursor-pointer mb-4 bg-violet-950 border-[1px] hover:bg-violet-700 active:bg-violet-500 border-white rounded-md p-2 flex-1"
        onClick={() => pathContext.setPaths(reconcile({}))}
      >
        Clear Paths
      </button>
    </>
  )
}
