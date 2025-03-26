import { ScaleLinear } from 'd3'
import { Component, mapArray } from 'solid-js'
import { clamp } from '../util/clamp'

// given two points, get info about the line between them
function getLine(
  point1: {
    x: number
    y: number
  },
  point2: {
    x: number
    y: number
  }
) {
  const xLength = point2.x - point1.x
  const yLength = point2.y - point1.y
  return {
    // calculate the length and angle of the line
    length: Math.sqrt(Math.pow(xLength, 2) + Math.pow(yLength, 2)),
    angle: Math.atan2(yLength, xLength),
  }
}

export const PathDisplay: Component<{
  path: {
    x: number
    y: number
  }[]
  xScale: ScaleLinear<number, number, never>
  yScale: ScaleLinear<number, number, never>
  index: number
}> = (props) => {
  // arbitrary for controlling smoothing of bezier control points
  const smoothingFactor = 0.2

  // get a bezier control point given the
  // surrounding points
  function getControlPoint(
    prevPoint: {
      x: number
      y: number
    },
    currentPoint: {
      x: number
      y: number
    },
    nextPoint: {
      x: number
      y: number
    },
    reversed: boolean // we want a reversed control point for ends of curves
  ) {
    // get details on the line from the previous to next point
    const opposedLine = getLine(prevPoint, nextPoint)

    // the control point is parallel to the opposed line
    return {
      x:
        currentPoint.x +
        opposedLine.length *
          smoothingFactor *
          Math.cos(opposedLine.angle + (reversed ? Math.PI : 0)),
      y:
        currentPoint.y +
        opposedLine.length *
          smoothingFactor *
          Math.sin(opposedLine.angle + (reversed ? Math.PI : 0)),
    }
  }

  // construct an array of instructions for an svg path
  const pathInstructions = mapArray(
    () => props.path,
    (point, index) => {
      // first point doesn't need a line.
      // instead start the line there
      if (index() === 0) {
        return `M ${Math.round(props.xScale(point.x))} ${Math.round(
          props.yScale(point.y)
        )}`
      }

      // get points 2 previous and 1 ahead
      const prevIndex = clamp(0, props.path.length - 1, index() - 1)
      const prev2Index = clamp(0, props.path.length - 1, index() - 2)
      const nextIndex = clamp(0, props.path.length - 1, index() + 1)

      // get the bezier control points for the start and end of the curve
      const startControl = getControlPoint(
        props.path[prev2Index],
        props.path[prevIndex],
        point,
        false
      )
      const endControl = getControlPoint(
        props.path[prevIndex],
        point,
        props.path[nextIndex],
        true
      )

      // generate the curve instruction
      return `C ${props.xScale(startControl.x)} ${props.yScale(
        startControl.y
      )} ${props.xScale(endControl.x)} ${props.yScale(
        endControl.y
      )} ${props.xScale(point.x)} ${props.yScale(point.y)}`
    }
  )

  return (
    <>
      <path
        d={pathInstructions().join('\n')}
        stroke="blue"
        stroke-width="2"
        fill-opacity="0"
      />
    </>
  )
}
