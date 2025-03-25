type PositionPacket = {
  id: number
  x: number
  y: number
}

const handlers: ((packet: PositionPacket) => unknown)[] = []

export function registerPacketHandler(
  handler: (packet: PositionPacket) => unknown
) {
  handlers.push(handler)
}

function parsePacket() {
  const parsedPacket = {
    id: 0,
    x: 0,
    y: 0,
  }
  handlers.forEach((handler) => handler(parsedPacket))
}
