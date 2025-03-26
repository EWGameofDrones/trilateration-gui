/**
 * constrain a value to be within a defined minimum and maximum
 * @param min {number} the minimum return value
 * @param max {number} the maximum return value
 * @param value {number} the value to return if it is within the bounds
 * @returns {number} the value, increased to the min or decreased to the max if neccessary
 */
export function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value))
}
