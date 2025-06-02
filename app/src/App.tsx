import { Component, createSignal } from 'solid-js'
import './App.css'
import { CageGraph } from './components/CageGraph'
import { parsePacket } from './electronInteraction/handlePacket'
import Dialog from '@corvu/dialog' // 'corvu/dialog'

const App: Component<{}> = () => {
  if (window.electronAPI !== undefined) {
    window.electronAPI.onPositionUpdate(parsePacket)
  } else {
    console.warn('Serial communication is unavailable.')
  }

  // Cage Dimension
  const [cageLength, setCageLength] = createSignal(7)
  const [cageWidth, setCageWidth] = createSignal(13.416)
  // const [showPaths, setShowPaths] = createSignal(false)

  // Anchor positions with default values
  const [anchor1, setAnchor1] = createSignal({ x: 0, y: 0, z: 0 })
  const [anchor2, setAnchor2] = createSignal({ x: 7, y: 0, z: 0 })
  const [anchor3, setAnchor3] = createSignal({ x: 5.5, y: 13.416, z: 0 })
  

  // Input handlers
  const handleLengthChange = (e: Event) => {
    const value = parseFloat((e.target as HTMLInputElement).value)
    if (!isNaN(value) && value > 0) {
      setCageLength(value)
    }
  }
  const handleWidthChange = (e: Event) => {
    const value = parseFloat((e.target as HTMLInputElement).value)
    if (!isNaN(value) && value > 0) {
      setCageWidth(value)
    }
  }

    // Input handlers for anchor positions
    const handleAnchorChange = (anchorNumber: number, coordinate: 'x' | 'y' | 'z', e: Event) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      if (!isNaN(value)) {
        if (anchorNumber === 1) {
          setAnchor1(prev => ({ ...prev, [coordinate]: value }))
        } else if (anchorNumber === 2) {
          setAnchor2(prev => ({ ...prev, [coordinate]: value }))
        } else if (anchorNumber === 3) {
          setAnchor3(prev => ({ ...prev, [coordinate]: value }))
        }
      }
    }
    // Submit handler for anchor positions
    const handleSubmit = () => {
      // Send anchor positions to main process via IPC
      if (window.electronAPI?.updateAnchors) {
        const anchors = [
          [anchor1().x, anchor1().y, anchor1().z],
          [anchor2().x, anchor2().y, anchor2().z],
          [anchor3().x, anchor3().y, anchor3().z]
        ]
        window.electronAPI.updateAnchors(anchors)
      }
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
      {/* pop up */}
      <Dialog open={showPaths()} onOpenChange={setShowPaths}>
        <Dialog.Trigger
          class="m-4 bg-violet-950 border-[1px] border-white rounded-md p-2"
        >
          Open
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0% data-closed:animate-out data-closed:fade-out-0%" />
            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 min-w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-corvu-400 bg-corvu-100 px-8 py-6 data-open:animate-in data-open:fade-in-0% data-open:zoom-in-95% data-open:slide-in-from-top-10% data-closed:animate-out data-closed:fade-out-0% data-closed:zoom-out-95% data-closed:slide-out-to-top-10%">            
            <Dialog.Label class="text-lg font-bold">
              Cage Dimension Configuration
            </Dialog.Label>

            <div class="mt-3 flex items-center">
              <label class="mr-2 font-bold">Length</label>
              <input 
              type="number"
              value={cageLength()}
              onInput={handleLengthChange}
              class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden" />
            </div>
            <div class="mt-3 flex items-center">
              <label class="mr-2 font-bold">Width</label>
              <input 
              type="number"
              value={cageWidth()}
              onInput={handleWidthChange}
              class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden" />
            </div>

            <div class="mt-3 flex items-center">
              <label class="mr-2 font-bold">Anchor1</label>
              <div class="flex space-x-2">
              <input
                placeholder="x"
                type="number"
                value={anchor1().x}
                onInput={(e) => handleAnchorChange(1, 'x', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              <input
                placeholder="y"
                type="number"
                value={anchor1().y}
                onInput={(e) => handleAnchorChange(1, 'y', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              <input
                placeholder="z"
                type="number"
                value={anchor1().z}
                onInput={(e) => handleAnchorChange(1, 'z', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              </div>
            </div>

            <div class="mt-3 flex items-center">
              <label class="mr-2 font-bold">Anchor2</label>
              <div class="flex space-x-2">
              <input
                placeholder="x"
                type="number"
                value={anchor2().x}
                onInput={(e) => handleAnchorChange(2, 'x', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              <input
                placeholder="y"
                type="number"
                value={anchor2().y}
                onInput={(e) => handleAnchorChange(2, 'y', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              <input
                placeholder="z"
                type="number"
                value={anchor2().z}
                onInput={(e) => handleAnchorChange(2, 'z', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              </div>
            </div>

            <div class="mt-3 flex items-center">
              <label class="mr-2 font-bold">Anchor3</label>
              <div class="flex space-x-2">
              <input
                placeholder="x"
                type="number"
                value={anchor3().x}
                onInput={(e) => handleAnchorChange(3, 'x', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              <input
                placeholder="y"
                type="number"
                value={anchor3().y}
                onInput={(e) => handleAnchorChange(3, 'y', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              <input
                placeholder="z"
                type="number"
                value={anchor3().z}
                onInput={(e) => handleAnchorChange(3, 'z', e)}
                class="w-full rounded-sm border-2 border-corvu-400 bg-corvu-100 focus:outline-hidden"
              />
              </div>
            </div>

            <Dialog.Close class="bg-violet-950 text-white px-4 py-2 rounded-md ml-auto"
            onClick={handleSubmit}>
              Submit
            </Dialog.Close>
            

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <CageGraph 
        showPaths={showPaths} 
        cageLength={cageLength} 
        cageWidth={cageWidth} 
        anchors={[
          [anchor1().x, anchor1().y, anchor1().z],
          [anchor2().x, anchor2().y, anchor2().z],
          [anchor3().x, anchor3().y, anchor3().z]
        ]}
      />


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
