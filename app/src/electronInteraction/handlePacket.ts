import { onCleanup, Owner, runWithOwner } from 'solid-js'
import { z } from 'zod'

// define the data type we will accept from the main process
const packetSchema = z.object({
  id: z.number(),
  x: z.number(),
  y: z.number(),
  z1: z.number().optional(),
})
export type PositionPacket = z.infer<typeof packetSchema>

// we store all functions that want to be called when
// we get a new packet
const handlers: ((packet: PositionPacket) => unknown)[] = []

// save a callback to be called whenever we get a new packet
export function registerPacketHandler(
  handler: (packet: PositionPacket) => unknown,
  owner?: Owner | null
) {
  handlers.push(handler)

  // register a cleanup function
  if (owner !== undefined) {
    runWithOwner(owner, () => {
      onCleanup(() => {
        const handlerIndex = handlers.indexOf(handler)
        if (handlerIndex !== -1) handlers.splice(handlerIndex, 1)
      })
    })
  }
}

// taking in a packet from the main process,
// ensure it is the right type and call handlers
export function parsePacket(packet: unknown) {
  // check packet format
  const parsedPacket = packetSchema.safeParse(packet)
  if (parsedPacket.success === false) {
    console.error('Unable to parse packet from main process!')
    console.error(parsedPacket.error)
    return
  }

  // pass packet to handlers
  handlers.forEach((handler) => handler(parsedPacket.data))
}
