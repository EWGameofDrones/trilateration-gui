const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // create a way for the renderer to register a callback to handle drone positions
  // the value is expected to be in the form { x: number, y: number, id: number }
  // to send a packet to the renderer, use:
  //  <win>.webContents.send('update-position', <packet>)
  // where <win> is the window and <packet> is the packet object
  onPositionUpdate: (callback) =>
    ipcRenderer.on('update-position', (_, value) => callback(value)),
})
