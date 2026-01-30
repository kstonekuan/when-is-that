import { DateTime } from 'luxon'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface CurrentTime {
  dateTime: DateTime
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export function useCurrentTime(timezone: string): CurrentTime {
  const [time, setTime] = useState<CurrentTime>(() => getTimeInZone(timezone))
  const rafIdRef = useRef<number | null>(null)
  const isVisibleRef = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateTime = useCallback(() => {
    setTime(getTimeInZone(timezone))
  }, [timezone])

  useEffect(() => {
    const animationLoop = () => {
      updateTime()
      rafIdRef.current = requestAnimationFrame(animationLoop)
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (document.hidden) {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        intervalRef.current = setInterval(updateTime, 1000)
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        rafIdRef.current = requestAnimationFrame(animationLoop)
      }
    }

    rafIdRef.current = requestAnimationFrame(animationLoop)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateTime])

  return time
}

function getTimeInZone(timezone: string): CurrentTime {
  const dateTime = DateTime.now().setZone(timezone)
  return {
    dateTime,
    hours: dateTime.hour,
    minutes: dateTime.minute,
    seconds: dateTime.second,
    milliseconds: dateTime.millisecond,
  }
}
