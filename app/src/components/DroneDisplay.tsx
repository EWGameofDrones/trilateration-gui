import { easeQuadInOut, ScaleLinear } from 'd3'
import { Component, For, getOwner, Show } from 'solid-js'
import {
  PositionPacket,
  registerPacketHandler,
} from '../electronInteraction/handlePacket'
import droneIcon from '../assets/drone-svgrepo-com.svg?url'
import { createStore, produce, unwrap } from 'solid-js/store'
import { PathDisplay } from './PathDisplay'

// used to represent the state of a drone graphic
type DroneState = {
  // the position it started from in the current animation
  originPos: {
    x: number
    y: number
  }
  // the target final position of the current animation
  targetPos: {
    x: number
    y: number
  }
  // the position to animate move towards after the current
  // animation finishes
  queuedPos: {
    x: number
    y: number
  }
  // the current position in the cage
  x: number
  y: number
  // 0-1 | completeness of movement animation
  animationProgress: number
  // stores the drone's path over the course of the game
  path: {
    x: number
    y: number
  }[]
}

export const DroneDisplay: Component<{
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
  droneSize: number
  showPaths: boolean
}> = (props) => {
  // track the state of each drone graphic seperately
  const [droneStates, setDroneStates] = createStore<Record<number, DroneState>>(
    {}
  )

  const moveRate = 0.25 // time it takes in seconds for a drone icon to move
  const fpsCap = 60 // maximum amount of frames per second to allow resource allocation for

  // the smallest distance in feet away from the last path node
  // for which a new path node will be generated
  const pathResolution = 1

  // if the animation is done and there is a move in the queue,
  // start an animation to move toward it
  const checkForNewMove = (id: number) => {
    if (!(id in droneStates)) return

    const droneState = droneStates[id]
    if (
      droneState.animationProgress >= 1 &&
      (droneState.targetPos.x !== droneState.queuedPos.x ||
        droneState.targetPos.y !== droneState.queuedPos.y)
    ) {
      // restart the animation
      setDroneStates(id, 'animationProgress', 0)

      // get the next target position from the queue
      setDroneStates(
        id,
        'targetPos',
        structuredClone(unwrap(droneState.queuedPos))
      )

      // start the animation
      animate(id)
    }
  }

  // over a period of time, animate a drone graphic's movement from
  // an origin point to a target point
  async function animate(id: number) {
    if (!(id in droneStates)) return
    const state = droneStates[id]

    // we track the time the animation starts so that we can use
    // it to see how far along we should be
    const startTime = Date.now()

    // keep animating until complete
    while (state.animationProgress < 1) {
      // set the animation progress based on the time
      // elapsed since the start
      const currentTime = Date.now()
      setDroneStates(
        id,
        'animationProgress',
        currentTime - startTime === 0 // avoid divide by 0
          ? 0
          : (currentTime - startTime) / (moveRate * 1000)
      )

      // convert the percentage of how far along the animation we should be
      // to the percentage of how far we should have traveled toward the target
      const traversalProgress = easeQuadInOut(state.animationProgress)

      // set the position for each dimension
      // (distance between origin and target * percentage of distance traveled)
      //  + origin
      setDroneStates(
        id,
        'x',
        (state.targetPos.x - state.originPos.x) * traversalProgress +
          state.originPos.x
      )
      setDroneStates(
        id,
        'y',
        (state.targetPos.y - state.originPos.y) * traversalProgress +
          state.originPos.y
      )

      // wait a period of time to avoid going over the fps cap
      await new Promise<void>((resolve) =>
        setTimeout(() => resolve(), 1000 / fpsCap)
      )
    }

    // animation is over. previous target position is now the origin position
    setDroneStates(id, 'originPos', structuredClone(unwrap(state.targetPos)))

    // check to see if there is a move queued
    checkForNewMove(id)
  }

  // record flight paths of a drone
  async function trackPath(id: number) {
    if (!(id in droneStates)) return
    const state = droneStates[id]

    while (true) {
      const lastPathNode = state.path[state.path.length - 1]

      // if the drone has moved far enough away from the last path
      // point, add a new one
      if (
        Math.sqrt(
          Math.pow(state.x - lastPathNode.x, 2) +
            Math.pow(state.y - lastPathNode.y, 2)
        ) >= pathResolution
      ) {
        setDroneStates(
          id,
          'path',
          produce((prev) =>
            prev.push({ x: unwrap(state.x), y: unwrap(state.y) })
          )
        )
      }

      // wait to avoid going over the fps cap
      await new Promise<void>((resolve) =>
        setTimeout(() => resolve(), 1000 / fpsCap)
      )
    }
  }

  // set the drone graphics' states based on packets received from the main electron proccess
  const handleMovement = (move: PositionPacket) => {
    // if the drone with the given id does not yet have a graphic,
    // create the state for one
    if (!(move.id in droneStates)) {
      setDroneStates(move.id, {
        animationProgress: 1, // start at 100%
        originPos: { x: move.x, y: move.y },
        targetPos: { x: move.x, y: move.y },
        queuedPos: { x: move.x, y: move.y },
        x: move.x,
        y: move.y,
        path: [{ x: move.x, y: move.y }],
      })
      trackPath(move.id)
      return
    }

    // add the new position to the queue and check if the animation is complete
    setDroneStates(move.id, 'queuedPos', { x: move.x, y: move.y })
    checkForNewMove(move.id)
  }
  registerPacketHandler(handleMovement, getOwner())

  return (
    <>
      <For each={Object.values(droneStates)}>
        {(state, index) => (
          <>
            {/* icon */}
            <image
              href={droneIcon}
              width={props.droneSize}
              height={props.droneSize}
              x={Math.floor(props.xScale(state.x) - 0.5 * props.droneSize)}
              y={Math.floor(props.yScale(state.y) - 0.5 * props.droneSize)}
              filter="invert(100%)"
            />
            {/* path */}
            <Show when={props.showPaths === true}>
              <PathDisplay
                xScale={props.xScale}
                yScale={props.yScale}
                path={state.path}
                index={index()}
              />
            </Show>
          </>
        )}
      </For>
    </>
  )
}
