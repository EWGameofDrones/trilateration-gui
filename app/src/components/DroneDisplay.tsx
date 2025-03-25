import { ScaleLinear } from 'd3'
import { Component, createResource, getOwner } from 'solid-js'
import {
  PositionPacket,
  registerPacketHandler,
} from '../electronInteraction/handlePacket'
import droneIcon from '../assets/drone-svgrepo-com.svg?url'

export const DroneDisplay: Component<{
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
}> = (props) => {
  const droneStates: Map<number, { x: number; y: number }> = new Map()

  const handleMovement = (move: PositionPacket) => {}

  registerPacketHandler(handleMovement, getOwner())

  return (
    <>
      <image
        href={droneIcon}
        width="20"
        height="20"
      ></image>
    </>
  )
}
