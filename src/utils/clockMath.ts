/**
 * Calculate the rotation angle for the hour hand
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns Angle in degrees (0-360)
 */
export function calculateHourHandAngle(hours: number, minutes: number): number {
  const normalizedHours = hours % 12
  const hourAngle = normalizedHours * 30
  const minuteContribution = minutes * 0.5
  return hourAngle + minuteContribution
}

/**
 * Calculate the rotation angle for the minute hand
 * @param minutes - Minutes (0-59)
 * @param seconds - Seconds (0-59)
 * @returns Angle in degrees (0-360)
 */
export function calculateMinuteHandAngle(
  minutes: number,
  seconds: number,
): number {
  const minuteAngle = minutes * 6
  const secondContribution = seconds * 0.1
  return minuteAngle + secondContribution
}

/**
 * Calculate the rotation angle for the second hand
 * @param seconds - Seconds (0-59)
 * @param milliseconds - Milliseconds (0-999)
 * @returns Angle in degrees (0-360)
 */
export function calculateSecondHandAngle(
  seconds: number,
  milliseconds: number,
): number {
  const secondAngle = seconds * 6
  const millisecondContribution = (milliseconds / 1000) * 6
  return secondAngle + millisecondContribution
}
