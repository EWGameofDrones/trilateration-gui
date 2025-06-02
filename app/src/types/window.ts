// In types/window.ts
declare global {
  interface Window {
    electronAPI?: {
      onPositionUpdate: (callback: (data: unknown) => unknown) => unknown
      updateAnchors: (anchors: number[][]) => void
    }
  }
}

export {}