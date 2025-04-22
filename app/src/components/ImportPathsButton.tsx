import { Component, createSignal, Show, useContext } from 'solid-js'
import { z } from 'zod'
import { PathContext } from '../contexts/PathContext'
import { BiRegularErrorCircle } from 'solid-icons/bi'

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

  const [errMessage, setErrMessage] = createSignal('')

  // when clicked, get paths from the main process and use them to set the state
  const onClick = async () => {
    // read the file as a string
    const pathsString = await window.electronAPI?.importPaths()
    if (pathsString === undefined) {
      setErrMessage('Failed to read file.')
      return
    }

    try {
      // parse the string as the type of the paths, then set
      const paths = pathsSchema.parse(JSON.parse(pathsString))
      setErrMessage('')
      pathContext.setPaths(paths)
    } catch (err: unknown) {
      if (!(err instanceof z.ZodError || err instanceof SyntaxError)) throw err
      setErrMessage('Failed to parse file.')
    }
  }

  return (
    <>
      <button
        classList={{
          'relative flex justify-center mx-4 mb-4 cursor-pointer hover:bg-violet-700':
            true,
          'active:bg-violet-500 bg-violet-950 border-[1px] border-white rounded-md p-2 flex-1':
            true,
          'tooltip': errMessage() !== '',
        }}
        data-tip={errMessage()}
        onClick={onClick}
      >
        <Show when={errMessage() !== ''}>
          <span class="px-10 top-1/2 transform -translate-y-1/2 absolute left-0">
            <BiRegularErrorCircle color="#F00000" />
          </span>
        </Show>
        <span>Import Paths</span>
      </button>
    </>
  )
}
