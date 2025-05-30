import {
  axisBottom,
  axisLeft,
  axisRight,
  axisTop,
  scaleLinear,
  select,
} from 'd3'
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { CageLines } from './CageLines'
import { DroneDisplay } from './DroneDisplay'

// renders the grid display as well as the markers on it
export const CageGraph: Component<{
  showPaths: Accessor<boolean>
}> = (props) => {
  // references to each axis graphic
  // used to update axes on changed data
  let leftAxis: undefined | SVGGElement
  let rightAxis: undefined | SVGGElement
  let topAxis: undefined | SVGGElement
  let bottomAxis: undefined | SVGGElement

  // reference to the div containing the graphics
  // used to find available size
  let containerDiv: undefined | HTMLDivElement

  // gaps by axes to improve readability
  const cornerGap = 10 // gap lengthwise along an axis
  const sideGap = 80 // gap perpendicular to an axis
  const droneProportion = 0.05 // percent of the cage width that a drone icon should occupy

  // dimensions of the cage in feet
  // const [cageWidth] = createSignal(4.24)
  const [cageWidth] = createSignal(13.416)
  // const [cageLength] = createSignal(5.664)
  const [cageLength] = createSignal(7)

  // holds available size for the graphic
  const [graphicHeight, setGraphicHeight] = createSignal<number>(100)
  const [graphicWidth, setGraphicWidth] = createSignal<number>(100)

  const axisSize = createMemo(() => {
    // calculate the size of the axes in order to maintain a 1:1 ratio while
    // taking up as much space as possible
    const axisWidth = graphicWidth() - 2 * (cornerGap + sideGap)
    const axisHeight = graphicHeight() - 2 * (cornerGap + sideGap)
    // if (graphicWidth() / graphicHeight() > cageLength() / cageWidth()) {
    //   // if the container's width is the constraining dimension, use that
    //   //   as the base for the axes height
    //   // subtract the gaps in the corners to avoid the axis hitting the edge of
    //   //   available space
    //   axisHeight = graphicHeight() - 2 * (cornerGap + sideGap)
    //   // maintain 1:1
    //   axisWidth = cageLength() * (axisHeight / cageWidth())
    // } else {
    //   // if the container's height is the constraining dimension, use that
    //   //   as the base for the axes width
    //   // subtract the gaps in the corners to avoid the axis hitting the edge of
    //   //   available space
    //   axisWidth = graphicWidth() - 2 * (cornerGap + sideGap)
    //   // maintain 1:1
    //   axisHeight = cageWidth() * (axisWidth / cageLength())
    // }

    return {
      x: axisWidth,
      y: axisHeight,
      // ensure the right and bottom axes are appropriately positioned
      right: axisWidth + 2 * cornerGap + sideGap,
      bottom: axisHeight + 2 * cornerGap + sideGap,
    }
  })

  // the horizontal scale to be used in mapping the grid size (ft) to the
  // screen size (pixels)
  const getXScale = createMemo(() =>
    scaleLinear(
      [0, cageLength()],
      [sideGap + cornerGap, sideGap + cornerGap + axisSize().x]
    )
  )

  // the vertical scale to be used in mapping the grid size (ft) to the
  // screen size (pixels)
  const getYScale = createMemo(() =>
    scaleLinear(
      [0, cageWidth()],
      [sideGap + cornerGap, sideGap + cornerGap + axisSize().y]
    )
  )

  // render axes
  createEffect(() => {
    if (
      leftAxis !== undefined &&
      rightAxis !== undefined &&
      topAxis !== undefined &&
      bottomAxis !== undefined
    ) {
      // have d3 render the axes
      select(leftAxis).call(axisLeft(getYScale()).ticks(cageWidth() / 5))
      select(rightAxis).call(axisRight(getYScale()).ticks(cageWidth() / 5))
      select(topAxis).call(axisTop(getXScale()).ticks(cageLength() / 5))
      select(bottomAxis).call(axisBottom(getXScale()).ticks(cageLength() / 5))
    } else {
      console.warn('Could not load axis!')
    }
  })

  // resize event handler
  const handleResize = () => {
    if (containerDiv !== undefined) {
      // get the size of the constraining container
      setGraphicHeight(containerDiv.offsetHeight)
      setGraphicWidth(containerDiv.offsetWidth)
    }
  }

  onMount(() => {
    window.addEventListener('resize', handleResize)
    handleResize()
  })

  onCleanup(() => {
    window.removeEventListener('resize', handleResize)
  })

  return (
    <>
      <div
        ref={containerDiv}
        class="size-full flex-1"
      >
        <svg class="size-full">
          {/* Axes */}
          <g
            ref={leftAxis}
            transform={`translate(${sideGap}, 0)`}
          />
          <g
            ref={rightAxis}
            transform={`translate(${axisSize().right}, 0)`}
          />
          <g
            ref={topAxis}
            transform={`translate(0, ${sideGap})`}
          />
          <g
            ref={bottomAxis}
            transform={`translate(0, ${axisSize().bottom})`}
          />

          <CageLines
            xScale={getXScale()}
            yScale={getYScale()}
          />
          <DroneDisplay
            xScale={getXScale()}
            yScale={getYScale()}
            droneSize={droneProportion * getYScale().range()[1]}
            showPaths={props.showPaths()}
          />
        </svg>
      </div>
    </>
  )
}
