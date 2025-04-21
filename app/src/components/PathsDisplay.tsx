import { ScaleLinear } from 'd3'
import { Component, For, useContext } from 'solid-js'
import { PathDisplay } from './PathDisplay'
import { PathContext } from '../contexts/PathContext'

// colors for different drones' paths
const pathColors = [
  'rgb(194,0,251)',
  'rgb(252,47,0)',
  'rgb(236,125,16)',
  'rgb(236,8,104)',
  'rgb(255,188,10)',
]

// displays a path for each drone
export const PathsDisplay: Component<{
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
}> = (props) => {
  // we pull paths from the context
  const pathContext = useContext(PathContext)
  if (pathContext === undefined) {
    console.error('Could not access path data! Paths will not be displayed')
    return <></>
  }

  return (
    <>
      <For each={Object.entries(pathContext.getPaths())}>
        {([id, path]) => (
          <PathDisplay
            xScale={props.xScale}
            yScale={props.yScale}
            color={pathColors[parseInt(id) % pathColors.length]}
            path={path}
          />
        )}
      </For>
    </>
  )
}
