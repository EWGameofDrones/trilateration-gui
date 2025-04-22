declare global {
  interface Window {
    electronAPI?: {
      onPositionUpdate: (callback: (data: unknown) => unknown) => unknown
      exportPaths: (
        paths: Record<
          number,
          {
            x: number
            y: number
          }[]
        >
      ) => unknown
      importPaths: () => Promise<string>
    }
  }
}
