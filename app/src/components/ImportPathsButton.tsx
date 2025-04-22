import { Component, useContext } from 'solid-js'
import { z } from 'zod'
import { PathContext } from '../contexts/PathContext'

const pathsSchema = z.record(
  z.coerce.number(),
  z.array(
    z.object({
      x: z.number(),
      y: z.number(),
    })
  )
)

// request the main process to import a paths file, then apply it
export const ImportPathsButton: Component<{}> = () => {
  // we need access to the paths to set them
  const pathContext = useContext(PathContext)
  if (pathContext === undefined) throw new Error('Could not load path context.')

  // when clicked, get paths from the main process and use them to set the state
  const onClick = async () => {
    const paths = pathsSchema.parse(await window.electronAPI?.importPaths())
    pathContext.setPaths(paths)
  }

  return (
    <>
      <button
        class="mx-4 mb-4 cursor-pointer hover:bg-violet-700 active:bg-violet-500 bg-violet-950 border-[1px] border-white rounded-md p-2 flex-1"
        onClick={onClick}
      >
        Import Paths
      </button>
    </>
  )
}
