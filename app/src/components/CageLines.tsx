import { Component } from 'solid-js'

export const CageLines: Component<{
  xScale: (feet: number) => number
  yScale: (feet: number) => number
}> = (props) => {
  return (
    <>
      <rect></rect>
    </>
  )
}
