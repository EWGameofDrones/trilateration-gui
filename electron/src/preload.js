// In preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onPositionUpdate: (callback) => ipcRenderer.on('update-position', (_event, value) => callback(value)),
  updateAnchors: (anchors) => ipcRenderer.invoke('update-anchors', anchors)
})