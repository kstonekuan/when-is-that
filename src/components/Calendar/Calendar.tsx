import type { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCurrentTime } from '../../hooks/useCurrentTime'
import styles from './Calendar.module.css'

interface CalendarProps {
  timezone: string
  customDateTime?: DateTime
  onDateChange?: (dateTime: DateTime) => void
}

// rendering-hoist-jsx: Hoist static data outside component
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TOTAL_CALENDAR_CELLS = 42

interface CalendarDay {
  date: number
  monthOffset: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  key: string
}

export function Calendar({
  timezone,
  customDateTime,
  onDateChange,
}: CalendarProps) {
  const liveTime = useCurrentTime(timezone)
  const displayDateTime = customDateTime ?? liveTime.dateTime
  const todayInZone = liveTime.dateTime

  const [viewDate, setViewDate] = useState(() =>
    displayDateTime.startOf('month'),
  )

  const prevMonthYearRef = useRef({
    month: displayDateTime.month,
    year: displayDateTime.year,
  })

  useEffect(() => {
    const prev = prevMonthYearRef.current
    if (
      prev.month !== displayDateTime.month ||
      prev.year !== displayDateTime.year
    ) {
      setViewDate(displayDateTime.startOf('month'))
      prevMonthYearRef.current = {
        month: displayDateTime.month,
        year: displayDateTime.year,
      }
    }
  }, [displayDateTime])

  const selectedDay = displayDateTime.day
  const selectedMonth = displayDateTime.month
  const selectedYear = displayDateTime.year

  const calendarDays = useMemo((): CalendarDay[] => {
    const firstOfMonth = viewDate.startOf('month')
    const lastOfMonth = viewDate.endOf('month')
    const startWeekday = firstOfMonth.weekday % 7
    const daysInMonth = lastOfMonth.day

    const days: CalendarDay[] = []

    const prevMonth = firstOfMonth.minus({ months: 1 })
    const daysInPrevMonth = prevMonth.endOf('month').day
    for (let i = startWeekday - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i
      days.push({
        date,
        monthOffset: -1,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        key: `prev-${date}`,
      })
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const isToday =
        date === todayInZone.day &&
        viewDate.month === todayInZone.month &&
        viewDate.year === todayInZone.year
      const isSelected =
        date === selectedDay &&
        viewDate.month === selectedMonth &&
        viewDate.year === selectedYear
      days.push({
        date,
        monthOffset: 0,
        isCurrentMonth: true,
        isToday,
        isSelected,
        key: `current-${date}`,
      })
    }

    const remainingDays = TOTAL_CALENDAR_CELLS - days.length
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        monthOffset: 1,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        key: `next-${date}`,
      })
    }

    return days
  }, [
    viewDate,
    todayInZone.day,
    todayInZone.month,
    todayInZone.year,
    selectedDay,
    selectedMonth,
    selectedYear,
  ])

  const handlePrevMonth = useCallback(() => {
    setViewDate((prev) => prev.minus({ months: 1 }))
  }, [])

  const handleNextMonth = useCallback(() => {
    setViewDate((prev) => prev.plus({ months: 1 }))
  }, [])

  // rerender-defer-reads: Use refs for values only used in callbacks
  const customDateTimeRef = useRef(customDateTime)
  customDateTimeRef.current = customDateTime
  const viewDateRef = useRef(viewDate)
  viewDateRef.current = viewDate

  const handleDayClick = useCallback(
    (day: CalendarDay) => {
      // js-early-exit: Return early if not interactive
      if (!onDateChange) return
      const currentCustomDateTime = customDateTimeRef.current
      if (!currentCustomDateTime) return

      const targetMonth = viewDateRef.current.plus({ months: day.monthOffset })
      const newDateTime = currentCustomDateTime.set({
        year: targetMonth.year,
        month: targetMonth.month,
        day: day.date,
      })
      onDateChange(newDateTime)
    },
    [onDateChange],
  )

  const monthYearDisplay = viewDate.toFormat('MMMM yyyy')
  const isInteractive = !!onDateChange

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.monthYear}>{monthYearDisplay}</span>
        <button
          type="button"
          className={styles.navButton}
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {calendarDays.map((day) => (
          <button
            key={day.key}
            type="button"
            className={`${styles.day} ${!day.isCurrentMonth ? styles.dayOtherMonth : ''} ${day.isToday ? styles.dayToday : ''} ${day.isSelected && !day.isToday ? styles.daySelected : ''} ${isInteractive ? styles.dayClickable : ''}`}
            onClick={() => handleDayClick(day)}
            disabled={!isInteractive}
            tabIndex={isInteractive ? 0 : -1}
          >
            {day.date}
          </button>
        ))}
      </div>
    </div>
  )
}
