import {
  axisBottom,
  axisLeft,
  axisRight,
  axisTop,
  scaleLinear,
  select,
} from 'd3'
import {
  Component,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'

// props to be passed into CageGraph components
type CageGraphProps = {}

// renders the grid display as well as the markers on it
export const CageGraph: Component<CageGraphProps> = (props) => {
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
  const cornerGap = 40 // gap lengthwise along an axis
  const sideGap = 30 // gap perpendicular to an axis

  // dimensions of the cage in feet
  const [cageWidth, setCageWidth] = createSignal(20)
  const [cageLength, setCageLength] = createSignal(40)

  // holds available size for the graphic
  const [graphicHeight, setGraphicHeight] = createSignal<number>(100)
  const [graphicWidth, setGraphicWidth] = createSignal<number>(100)

  // used to set the position of the right and bottom axes
  // as the size of the grid changes
  const [rightPos, setRightPos] = createSignal(0)
  const [bottomPos, setBottomPos] = createSignal(0)

  createEffect(() => {
    if (
      leftAxis !== undefined &&
      rightAxis !== undefined &&
      topAxis !== undefined &&
      bottomAxis !== undefined
    ) {
      // calculate the size of the axes in order to maintain a 1:1 ratio while
      // taking up as much space as possible
      let axisWidth: number
      let axisHeight: number
      if (graphicWidth() / graphicHeight() > cageLength() / cageWidth()) {
        // if the container's width is the constraining dimension, use that
        //   as the base for the axes height
        // subtract the gaps in the corners to avoid the axis hitting the edge of
        //   available space
        axisHeight = graphicHeight() - 2 * cornerGap
        // maintain 1:1
        axisWidth = cageLength() * (axisHeight / cageWidth())
      } else {
        // if the container's height is the constraining dimension, use that
        //   as the base for the axes width
        // subtract the gaps in the corners to avoid the axis hitting the edge of
        //   available space
        axisWidth = graphicWidth() - 2 * cornerGap
        // maintain 1:1
        axisHeight = cageWidth() * (axisWidth / cageLength())
      }

      // create the scales to be used in mapping the grid size (ft) to the
      // screen size (pixels)
      const xScale = scaleLinear([0, cageLength()], [0, axisWidth])
      const yScale = scaleLinear([0, cageWidth()], [0, axisHeight])

      // ensure teh right and bottom axes are appropriately positioned
      setRightPos(axisWidth + 2 * cornerGap - sideGap)
      setBottomPos(axisHeight + 2 * cornerGap - sideGap)

      // have d3 render the axes
      select(leftAxis).call(axisLeft(yScale))
      select(rightAxis).call(axisRight(yScale))
      select(topAxis).call(axisTop(xScale))
      select(bottomAxis).call(axisBottom(xScale))
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
            transform={`translate(${sideGap}, ${cornerGap})`}
          />
          <g
            ref={rightAxis}
            transform={`translate(${rightPos()}, ${cornerGap})`}
          />
          <g
            ref={topAxis}
            transform={`translate(${cornerGap}, ${sideGap})`}
          />
          <g
            ref={bottomAxis}
            transform={`translate(${cornerGap}, ${bottomPos()})`}
          />
        </svg>
      </div>
    </>
  )
}
