// src/components/AltitudeIndicator.tsx
import { Component, createSignal, onMount, onCleanup } from 'solid-js'
import { registerPacketHandler } from '../electronInteraction/handlePacket'
import { getOwner } from 'solid-js'
import { set } from 'zod'

export const AltitudeIndicator: Component<{
  droneId: number
  maxHeight: number
  label: string
}> = (props) => {
  const [altitude, setAltitude] = createSignal(0)
  const [maxAltitude, setMaxAltitude] = createSignal(props.maxHeight || 10)

  onMount(() => {
    setMaxAltitude(15)
    // setAltitude(25)
    // Register handler to receive position updates
    registerPacketHandler((packet) => {
        // console.log("Received packet:", packet)
        if (packet.id === props.droneId) {
            console.log("Received packet for drone:", packet.id)
            setAltitude(packet.z1)
        }
    //   if (packet.id === props.droneId) {
    //     // Use z1 as altitude (could also be z2 depending on your data)
    //     if (packet.z1 !== undefined) {
    //       setAltitude(packet.z1)
          
    //       // Adjust max height if needed
    //       if (packet.z1 > maxAltitude()) {
    //         setMaxAltitude(Math.ceil(packet.z1) + 2)
    //       }
    //     }
    //   }
    }, getOwner())
  })

// onMount(() => {
//     registerPacketHandler((packet) => {
//         if (packet.id === props.droneId) {
//             console.log('Received packet:', packet);
//         }
//     }, getOwner());
// });

  return (
    <div class="flex flex-col items-center h-full p-2">
      <div class="text-center font-bold mb-1">{props.label}</div>
      <div class="h-full w-16 bg-corvu-100 border-2 border-corvu-400 rounded-md relative">
        {/* Height markers */}
        <div class="absolute inset-0 flex flex-col justify-between px-1 py-2 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div class="flex justify-between items-center w-full">
              <div class="w-2 h-[1px] bg-white/50"></div>
              <div class="text-xs text-white/70">
                {((maxAltitude() / 5) * (5 - i)).toFixed(1)}
              </div>
              <div class="w-2 h-[1px] bg-white/50"></div>
            </div>
          ))}
        </div>
        
        {/* Altitude needle */}
        <div 
          class="absolute left-0 right-0 h-1 bg-red-500"
          style={{
            bottom: `${(altitude() / maxAltitude()) * 100}%`,
            transition: "bottom 0.2s ease-out"
          }}
        >
          <div class="absolute right-0 -top-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
      <div class="text-center mt-1">{altitude().toFixed(2)} ft</div>
    </div>
  )
}