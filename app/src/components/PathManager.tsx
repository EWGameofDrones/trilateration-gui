import { Component, JSX } from 'solid-js'
import { PathContext } from '../contexts/PathContext'
import { createStore, produce, unwrap } from 'solid-js/store'

export const PathManager: Component<{
  children?: JSX.Element | string
}> = (props) => {
  const [paths, setPaths] = createStore<
    Record<
      number,
      {
        x: number
        y: number
      }[]
    >
  >({})
  const [dronePositions, setDronePositions] = createStore<
    Record<
      number,
      {
        x: number
        y: number
      }
    >
  >({})

  // the smallest distance in feet away from the last path node
  // for which a new path node will be generated
  const pathResolution = 1

  const fpsCap = 30

  // add a drone's position to its path if it has moved far enough away
  function trackPath(id: number) {
    // get the drone's position
    if (!(id in dronePositions)) return
    const position = dronePositions[id]

    // if we don't have a path yet, start it at the current position
    if (!(id in paths)) {
      setPaths(id, [structuredClone(unwrap(position))])
      return
    }

    // compare the last path position to the drone's position
    const lastPosition = paths[id][paths[id].length - 1]
    if (
      Math.sqrt(
        Math.pow(position.x - lastPosition.x, 2) +
          Math.pow(position.y - lastPosition.y, 2)
      ) >= pathResolution
    ) {
      // add to the path
      setPaths(
        id,
        produce((path) => path.push(structuredClone(unwrap(position))))
      )
    }
  }

  // record flight paths of a drone
  async function trackPaths() {
    while (true) {
      Object.keys(dronePositions).forEach((id) => trackPath(parseInt(id)))

      // wait to avoid going over the fps cap
      await new Promise<void>((resolve) =>
        setTimeout(() => resolve(), 1000 / fpsCap)
      )
    }
  }

  // begin converting drone positions into recorded paths
  trackPaths()

  return (
    <>
      <PathContext.Provider
        value={{
          getPaths: () => paths,
          setPaths: setPaths,
          setDronePositions,
        }}
      >
        {props.children}
      </PathContext.Provider>
    </>
  )
}
