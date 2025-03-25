import { Component } from 'solid-js'
import './App.css'
import { CageGraph } from './components/CageGraph'
import {
  parsePacket,
  registerPacketHandler,
} from './electronInteraction/handlePacket'

const App: Component<{}> = () => {
  if (window.electronAPI !== undefined) {
    window.electronAPI.onPositionUpdate(parsePacket)
  } else {
    console.warn('Serial communication is unavailable.')
  }

  registerPacketHandler((data: { id: number }) => {
    console.log(data.id)
  })

  return (
    <div class="w-screen flex h-screen">
      <CageGraph />
    </div>
  )
}

export default App
