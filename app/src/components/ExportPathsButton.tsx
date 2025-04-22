import { Component, useContext } from 'solid-js'
import { PathContext } from '../contexts/PathContext'
import { unwrap } from 'solid-js/store'

// button for exporting drone paths to a file
export const ExportPathsButton: Component<{}> = (props) => {
  // we need access to path data to export
  const pathContext = useContext(PathContext)
  if (pathContext === undefined) throw new Error('Unable to load path context.')

  // when button is clicked: export
  const onClick = () => {
    const paths = pathContext.getPaths()
    window.electronAPI?.exportPaths(structuredClone(unwrap(paths)))
  }

  return (
    <>
      <button
        class="mx-4 cursor-pointer mb-4 bg-violet-950 border-[1px] hover:bg-violet-700 active:bg-violet-500 border-white rounded-md p-2 flex-1"
        onClick={onClick}
      >
        Export Paths
      </button>
    </>
  )
}
