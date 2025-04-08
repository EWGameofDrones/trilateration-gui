import { ScaleLinear } from 'd3'
import { Component, createMemo, For, JSX } from 'solid-js'

export const CageLines: Component<{
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
}> = (props) => {
  // create the attributes for each rect
  const rectAttributes = createMemo<JSX.HTMLAttributes<SVGRectElement>[][]>(
    () => {
      const xRange = props.xScale.range()
      const yRange = props.yScale.range()

      // the exact target dimensions of the rects
      const width = (xRange[1] - xRange[0]) / 3
      const height = (yRange[1] - yRange[0]) / 3

      // in order to get whole numbers for dimension, we floor the first 2
      // in both directions and make up for it on the last row/column
      const normalWidth = Math.floor(width)
      const normalHeight = Math.floor(height)
      const lastWidth = xRange[1] - xRange[0] - 2 * normalWidth
      const lastHeight = yRange[1] - yRange[0] - 2 * normalHeight

      // construct the attributes for 9 (3x3) rects
      return Array(3)
        .fill([])
        .map((_, xIndex) =>
          Array(3)
            .fill({})
            .map((_, yIndex) => ({
              'width': xIndex === 2 ? lastWidth : width,
              'height': yIndex === 2 ? lastHeight : height,
              'x': xRange[0] + xIndex * normalWidth,
              'y': yRange[0] + yIndex * normalHeight,
              'style': 'stroke-width:3; stroke:grey',
              'fill-opacity': 0,
            }))
        )
    }
  )

  return (
    <>
      <For each={rectAttributes()}>
        {(cellsInColumn) => (
          <For each={cellsInColumn}>{(rectData) => <rect {...rectData} />}</For>
        )}
      </For>
    </>
  )
}
