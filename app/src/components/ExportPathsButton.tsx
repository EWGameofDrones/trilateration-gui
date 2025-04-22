import { Component, useContext } from 'solid-js'
import { PathContext } from '../contexts/PathContext'
import { unwrap } from 'solid-js/store'

export const ExportPathsButton: Component<{}> = (props) => {
  const pathContext = useContext(PathContext)
  if (pathContext === undefined) throw new Error('Unable to load path context.')

  const onClick = () => {
    const paths = pathContext.getPaths()
    window.electronAPI?.exportPaths(structuredClone(unwrap(paths)))
    console.log(structuredClone(unwrap(paths)))
  }

  return (
    <>
      <button
        class="mx-4 mb-4 bg-violet-950 border-[1px] border-white rounded-md p-2 flex-1"
        onClick={onClick}
      >
        Export Paths
      </button>
    </>
  )
}
