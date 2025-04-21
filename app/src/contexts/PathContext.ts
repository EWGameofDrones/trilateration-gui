import { createContext } from 'solid-js'
import { SetStoreFunction } from 'solid-js/store'

export const PathContext = createContext<{
  getPaths: () => Record<
    number,
    {
      x: number
      y: number
    }[]
  >
  setPaths: SetStoreFunction<
    Record<
      number,
      {
        x: number
        y: number
      }[]
    >
  >
  setDronePositions: SetStoreFunction<
    Record<
      number,
      {
        x: number
        y: number
      }
    >
  >
}>()
