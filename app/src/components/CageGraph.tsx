import {
  axisBottom,
  axisLeft,
  axisRight,
  axisTop,
  ScaleLinear,
  scaleLinear,
  select,
} from 'd3'
import { Component, createSignal, onCleanup, onMount } from 'solid-js'

type CageGraphProps = {}

export const CageGraph: Component<CageGraphProps> = (props) => {
  let leftAxis: undefined | SVGGElement
  let rightAxis: undefined | SVGGElement
  let topAxis: undefined | SVGGElement
  let bottomAxis: undefined | SVGGElement
  let containerDiv: undefined | HTMLDivElement

  const cageWidth = 20
  const cageLength = 40

  const [rightPos, setRightPos] = createSignal(0)
  const [bottomPos, setBottomPos] = createSignal(0)

  let xScale: ScaleLinear<number, number, never>
  let yScale: ScaleLinear<number, number, never>

  const calculateScales = () => {
    if (containerDiv !== undefined) {
      xScale = scaleLinear([0, cageLength], [0, containerDiv.offsetHeight - 80])
      yScale = scaleLinear([0, cageWidth], [0, containerDiv.offsetWidth - 80])
    }
  }

  const handleResize = () => {
    if (
      leftAxis !== undefined &&
      rightAxis !== undefined &&
      topAxis !== undefined &&
      bottomAxis !== undefined &&
      containerDiv !== undefined
    ) {
      calculateScales()
      setRightPos(containerDiv.offsetWidth - 30)
      setBottomPos(containerDiv.offsetHeight - 30)
      select(leftAxis).call(axisLeft(xScale))
      select(rightAxis).call(axisRight(xScale))
      select(topAxis).call(axisTop(yScale))
      select(bottomAxis).call(axisBottom(yScale))
    } else {
      console.warn('Could not load axis!')
    }
  }

  scaleLinear()
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
          <g
            ref={leftAxis}
            transform="translate(30, 40)"
          />
          <g
            ref={rightAxis}
            transform={`translate(${rightPos()}, 40)`}
          />
          <g
            ref={topAxis}
            transform={`translate(40, 30)`}
          />
          <g
            ref={bottomAxis}
            transform={`translate(40, ${bottomPos()})`}
          />
        </svg>
      </div>
    </>
  )
}
