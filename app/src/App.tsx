import { Component, createSignal } from 'solid-js'
import './App.css'
import { CageGraph } from './components/CageGraph'
import { parsePacket } from './electronInteraction/handlePacket'

const App: Component<{}> = () => {
  if (window.electronAPI !== undefined) {
    window.electronAPI.onPositionUpdate(parsePacket)
  } else {
    console.warn('Serial communication is unavailable.')
  }

  const [showPaths, setShowPaths] = createSignal(false)
  let buttonRef: HTMLButtonElement | undefined
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return
    if (event.altKey === true) return
    if (event.ctrlKey === true) return
    if (event.metaKey === true) return
    if (event.repeat === true) return
    if (event.shiftKey === true) return
    if (buttonRef !== undefined && event.target === buttonRef) return
    setShowPaths((prev) => !prev)
  })

  return (
    <div class="w-screen flex flex-col h-screen">
      <CageGraph />

      <button
        ref={buttonRef}
        class="m-4 bg-violet-950 border-[1px] border-white rounded-md p-2"
        onClick={() => {
          setShowPaths((prev) => !prev)
        }}
      >
        Path Visibility: {showPaths() ? 'Visible' : 'Hidden'}
      </button>
    </div>
  )
}

export default App
