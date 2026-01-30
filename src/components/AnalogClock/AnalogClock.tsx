import type { DateTime } from 'luxon'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useCurrentTime } from '../../hooks/useCurrentTime'
import {
  calculateHourHandAngle,
  calculateMinuteHandAngle,
  calculateSecondHandAngle,
} from '../../utils/clockMath'
import styles from './AnalogClock.module.css'

interface AnalogClockProps {
  timezone: string
  size?: number
  customDateTime?: DateTime
  onTimeChange?: (dateTime: DateTime) => void
}

interface MarkerPosition {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

type DragTarget = 'hour' | 'minute' | null

// rerender-memoize: Wrap in memo to prevent unnecessary re-renders
export const AnalogClock = memo(function AnalogClock({
  timezone,
  size = 240,
  customDateTime,
  onTimeChange,
}: AnalogClockProps) {
  const liveTime = useCurrentTime(timezone)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)

  // Store values in refs so event handlers always have access to latest values
  const customDateTimeRef = useRef(customDateTime)
  customDateTimeRef.current = customDateTime
  const onTimeChangeRef = useRef(onTimeChange)
  onTimeChangeRef.current = onTimeChange
  // dragTarget ref needed because event listeners are attached before state updates
  const dragTargetRef = useRef<DragTarget>(null)
  // Track previous minute value to detect crossing 12 o'clock
  const previousMinuteRef = useRef<number | null>(null)

  const isLive = !customDateTime
  const isDraggable = !!onTimeChange && !!customDateTime
  const displayDateTime = customDateTime ?? liveTime.dateTime
  const hours = customDateTime ? customDateTime.hour : liveTime.hours
  const minutes = customDateTime ? customDateTime.minute : liveTime.minutes
  const seconds = customDateTime ? 0 : liveTime.seconds
  const milliseconds = customDateTime ? 0 : liveTime.milliseconds

  const hourAngle = calculateHourHandAngle(hours, minutes)
  const minuteAngle = calculateMinuteHandAngle(minutes, seconds)
  const secondAngle = calculateSecondHandAngle(seconds, milliseconds)

  const center = size / 2
  const radius = size / 2 - 4

  const getAngleFromPoint = useCallback(
    (clientX: number, clientY: number): number => {
      if (!svgRef.current) return 0
      const rect = svgRef.current.getBoundingClientRect()
      const x = clientX - rect.left - center
      const y = clientY - rect.top - center
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90
      if (angle < 0) angle += 360
      return angle
    },
    [center],
  )

  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, target: DragTarget) => {
      if (!isDraggable) return
      event.preventDefault()
      dragTargetRef.current = target
      // Initialize previous minute for detecting 12 o'clock crossings
      if (target === 'minute' && customDateTimeRef.current) {
        previousMinuteRef.current = customDateTimeRef.current.minute
      }
      setDragTarget(target)
    },
    [isDraggable],
  )

  const handleDrag = useCallback(
    (clientX: number, clientY: number) => {
      // Read from ref to get latest value (state may not have updated yet)
      const currentDragTarget = dragTargetRef.current
      if (!currentDragTarget) return
      const currentOnTimeChange = onTimeChangeRef.current
      const currentCustomDateTime = customDateTimeRef.current
      if (!currentOnTimeChange || !currentCustomDateTime) return

      const angle = getAngleFromPoint(clientX, clientY)

      if (currentDragTarget === 'minute') {
        const newMinutes = Math.round(angle / 6) % 60
        const previousMinutes = previousMinuteRef.current
        let hourAdjustment = 0

        if (previousMinutes !== null) {
          // Detect crossing 12 o'clock (0/60 boundary)
          // Forward: going from high minutes (45-59) to low minutes (0-14)
          if (previousMinutes > 45 && newMinutes < 15) {
            hourAdjustment = 1
          }
          // Backward: going from low minutes (0-14) to high minutes (45-59)
          else if (previousMinutes < 15 && newMinutes > 45) {
            hourAdjustment = -1
          }
        }

        previousMinuteRef.current = newMinutes

        let newDateTime = currentCustomDateTime.set({ minute: newMinutes })
        if (hourAdjustment !== 0) {
          newDateTime = newDateTime.plus({ hours: hourAdjustment })
        }
        currentOnTimeChange(newDateTime)
      } else if (currentDragTarget === 'hour') {
        const hourFromAngle = angle / 30
        const currentHour = currentCustomDateTime.hour
        const isPM = currentHour >= 12
        let newHour = Math.round(hourFromAngle) % 12
        if (isPM) newHour += 12
        if (newHour === 24) newHour = 12
        if (newHour === 12 && !isPM) newHour = 0
        currentOnTimeChange(currentCustomDateTime.set({ hour: newHour }))
      }
    },
    [getAngleFromPoint],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      handleDrag(event.clientX, event.clientY)
    },
    [handleDrag],
  )

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length > 0) {
        handleDrag(event.touches[0].clientX, event.touches[0].clientY)
      }
    },
    [handleDrag],
  )

  const handleDragEnd = useCallback(() => {
    dragTargetRef.current = null
    previousMinuteRef.current = null
    setDragTarget(null)
  }, [])

  const handleClockMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isDraggable) return

      const angle = getAngleFromPoint(event.clientX, event.clientY)
      const hourAngleNormalized = hourAngle % 360
      const minuteAngleNormalized = minuteAngle % 360

      const hourDiff = Math.abs(angle - hourAngleNormalized)
      const minuteDiff = Math.abs(angle - minuteAngleNormalized)
      const hourDiffWrapped = Math.min(hourDiff, 360 - hourDiff)
      const minuteDiffWrapped = Math.min(minuteDiff, 360 - minuteDiff)

      if (minuteDiffWrapped < 20) {
        handleDragStart(event, 'minute')
      } else if (hourDiffWrapped < 25) {
        handleDragStart(event, 'hour')
      } else if (minuteDiffWrapped < hourDiffWrapped) {
        handleDragStart(event, 'minute')
      } else {
        handleDragStart(event, 'hour')
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener(
        'mouseup',
        () => {
          handleDragEnd()
          document.removeEventListener('mousemove', handleMouseMove)
        },
        { once: true },
      )
    },
    [
      isDraggable,
      getAngleFromPoint,
      hourAngle,
      minuteAngle,
      handleDragStart,
      handleMouseMove,
      handleDragEnd,
    ],
  )

  const handleClockTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!isDraggable || event.touches.length === 0) return

      const touch = event.touches[0]
      const angle = getAngleFromPoint(touch.clientX, touch.clientY)
      const hourAngleNormalized = hourAngle % 360
      const minuteAngleNormalized = minuteAngle % 360

      const hourDiff = Math.abs(angle - hourAngleNormalized)
      const minuteDiff = Math.abs(angle - minuteAngleNormalized)
      const hourDiffWrapped = Math.min(hourDiff, 360 - hourDiff)
      const minuteDiffWrapped = Math.min(minuteDiff, 360 - minuteDiff)

      if (minuteDiffWrapped < 20) {
        handleDragStart(event, 'minute')
      } else if (hourDiffWrapped < 25) {
        handleDragStart(event, 'hour')
      } else if (minuteDiffWrapped < hourDiffWrapped) {
        handleDragStart(event, 'minute')
      } else {
        handleDragStart(event, 'hour')
      }

      const onTouchEnd = () => {
        handleDragEnd()
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      })
      document.addEventListener('touchend', onTouchEnd)
    },
    [
      isDraggable,
      getAngleFromPoint,
      hourAngle,
      minuteAngle,
      handleDragStart,
      handleTouchMove,
      handleDragEnd,
    ],
  )

  const hourMarkers = useMemo((): MarkerPosition[] => {
    const markers: MarkerPosition[] = []
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180)
      const outerRadius = radius - 8
      const innerRadius = radius - 20
      markers.push({
        id: `hour-${i}`,
        x1: center + Math.cos(angle) * innerRadius,
        y1: center + Math.sin(angle) * innerRadius,
        x2: center + Math.cos(angle) * outerRadius,
        y2: center + Math.sin(angle) * outerRadius,
      })
    }
    return markers
  }, [center, radius])

  const minuteMarkers = useMemo((): MarkerPosition[] => {
    const markers: MarkerPosition[] = []
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue
      const angle = (i * 6 - 90) * (Math.PI / 180)
      const outerRadius = radius - 8
      const innerRadius = radius - 14
      markers.push({
        id: `minute-${i}`,
        x1: center + Math.cos(angle) * innerRadius,
        y1: center + Math.sin(angle) * innerRadius,
        x2: center + Math.cos(angle) * outerRadius,
        y2: center + Math.sin(angle) * outerRadius,
      })
    }
    return markers
  }, [center, radius])

  // Track editing state for unpadded input display
  const [editingHours, setEditingHours] = useState<string | null>(null)
  const [editingMinutes, setEditingMinutes] = useState<string | null>(null)

  const handleHoursChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value.replace(/\D/g, '').slice(0, 2)
      setEditingHours(rawValue)

      const currentOnTimeChange = onTimeChangeRef.current
      const currentCustomDateTime = customDateTimeRef.current
      if (!currentOnTimeChange || !currentCustomDateTime) return
      const newHour = Math.min(
        23,
        Math.max(0, Number.parseInt(rawValue, 10) || 0),
      )
      currentOnTimeChange(currentCustomDateTime.set({ hour: newHour }))
    },
    [],
  )

  const handleMinutesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value.replace(/\D/g, '').slice(0, 2)
      setEditingMinutes(rawValue)

      const currentOnTimeChange = onTimeChangeRef.current
      const currentCustomDateTime = customDateTimeRef.current
      if (!currentOnTimeChange || !currentCustomDateTime) return
      const newMinute = Math.min(
        59,
        Math.max(0, Number.parseInt(rawValue, 10) || 0),
      )
      currentOnTimeChange(currentCustomDateTime.set({ minute: newMinute }))
    },
    [],
  )

  const handleHoursFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setEditingHours(event.target.value.replace(/^0/, ''))
      event.target.select()
    },
    [],
  )

  const handleMinutesFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setEditingMinutes(event.target.value.replace(/^0/, ''))
      event.target.select()
    },
    [],
  )

  const handleHoursBlur = useCallback(() => {
    setEditingHours(null)
  }, [])

  const handleMinutesBlur = useCallback(() => {
    setEditingMinutes(null)
  }, [])

  const hoursDisplay = displayDateTime.toFormat('HH')
  const minutesDisplay = displayDateTime.toFormat('mm')
  const secondsDisplay = displayDateTime.toFormat('ss')

  return (
    <div className={styles.container}>
      {isLive ? (
        <div className={styles.digitalTime}>
          {hoursDisplay}:{minutesDisplay}:{secondsDisplay}
        </div>
      ) : (
        <div className={styles.digitalTimeEditable}>
          <input
            type="text"
            inputMode="numeric"
            className={styles.timeInput}
            value={editingHours ?? hoursDisplay}
            onChange={handleHoursChange}
            onFocus={handleHoursFocus}
            onBlur={handleHoursBlur}
            aria-label="Hours"
            maxLength={2}
          />
          <span className={styles.timeSeparator}>:</span>
          <input
            type="text"
            inputMode="numeric"
            className={styles.timeInput}
            value={editingMinutes ?? minutesDisplay}
            onChange={handleMinutesChange}
            onFocus={handleMinutesFocus}
            onBlur={handleMinutesBlur}
            aria-label="Minutes"
            maxLength={2}
          />
        </div>
      )}
      <div className={styles.clockWrapper}>
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={`${styles.clock} ${isDraggable ? styles.clockDraggable : ''} ${dragTarget ? styles.clockDragging : ''}`}
          role="img"
          aria-label={`Analog clock showing ${hoursDisplay}:${minutesDisplay}${isLive ? `:${secondsDisplay}` : ''}`}
          onMouseDown={handleClockMouseDown}
          onTouchStart={handleClockTouchStart}
        >
          <circle cx={center} cy={center} r={radius} className={styles.face} />
          <circle
            cx={center}
            cy={center}
            r={radius - 24}
            className={styles.innerRing}
          />

          {minuteMarkers.map((marker) => (
            <line
              key={marker.id}
              x1={marker.x1}
              y1={marker.y1}
              x2={marker.x2}
              y2={marker.y2}
              className={styles.minuteMarker}
            />
          ))}

          {hourMarkers.map((marker) => (
            <line
              key={marker.id}
              x1={marker.x1}
              y1={marker.y1}
              x2={marker.x2}
              y2={marker.y2}
              className={styles.hourMarker}
            />
          ))}

          <g
            transform={`rotate(${hourAngle}, ${center}, ${center})`}
            className={`${isDraggable ? styles.handDraggable : ''} ${dragTarget === 'hour' ? styles.handActive : ''}`}
          >
            <rect
              x={center - 4}
              y={center - radius * 0.45}
              width={8}
              height={radius * 0.5}
              rx={4}
              className={styles.hourHand}
            />
          </g>

          <g
            transform={`rotate(${minuteAngle}, ${center}, ${center})`}
            className={`${isDraggable ? styles.handDraggable : ''} ${dragTarget === 'minute' ? styles.handActive : ''}`}
          >
            <rect
              x={center - 3}
              y={center - radius * 0.65}
              width={6}
              height={radius * 0.7}
              rx={3}
              className={styles.minuteHand}
            />
          </g>

          {isLive && (
            <g transform={`rotate(${secondAngle}, ${center}, ${center})`}>
              <rect
                x={center - 1.5}
                y={center - radius * 0.75}
                width={3}
                height={radius * 0.85}
                rx={1.5}
                className={styles.secondHand}
              />
              <circle
                cx={center}
                cy={center + radius * 0.08}
                r={6}
                className={styles.secondHand}
              />
            </g>
          )}

          <circle cx={center} cy={center} r={8} className={styles.centerDot} />
          <circle
            cx={center}
            cy={center}
            r={4}
            className={styles.centerDotInner}
          />
        </svg>
      </div>
    </div>
  )
})
