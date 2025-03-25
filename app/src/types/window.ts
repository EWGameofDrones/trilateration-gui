declare global {
  interface Window {
    electronAPI?: {
      onPositionUpdate: (callback: (data: unknown) => unknown) => unknown
    }
  }
}
