import type { DateTime } from 'luxon'
import { memo } from 'react'
import { AnalogClock } from '../AnalogClock'
import { Calendar } from '../Calendar'
import { TimezoneSelector } from '../TimezoneSelector'
import styles from './ClockPanel.module.css'

interface ClockPanelProps {
  timezone: string
  onTimezoneChange?: (timezone: string) => void
  title: string
  customDateTime?: DateTime
  onCustomDateTimeChange?: (dateTime: DateTime) => void
}

// rerender-memoize: Wrap in memo to prevent unnecessary re-renders
export const ClockPanel = memo(function ClockPanel({
  timezone,
  onTimezoneChange,
  title,
  customDateTime,
  onCustomDateTimeChange,
}: ClockPanelProps) {
  const isCustomMode = !!customDateTime
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.selectorWrapper}>
        {onTimezoneChange && (
          <TimezoneSelector value={timezone} onChange={onTimezoneChange} />
        )}
      </div>

      <div className={styles.clockContainer}>
        <AnalogClock
          timezone={timezone}
          size={240}
          customDateTime={customDateTime}
          onTimeChange={isCustomMode ? onCustomDateTimeChange : undefined}
        />
        <Calendar
          timezone={timezone}
          customDateTime={customDateTime}
          onDateChange={isCustomMode ? onCustomDateTimeChange : undefined}
        />
      </div>
    </div>
  )
})
