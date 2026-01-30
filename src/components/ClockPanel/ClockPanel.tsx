import type { DateTime } from 'luxon'
import { AnalogClock } from '../AnalogClock'
import { Calendar } from '../Calendar'
import { TimePicker } from '../TimePicker'
import { TimezoneSelector } from '../TimezoneSelector'
import styles from './ClockPanel.module.css'

interface ClockPanelProps {
  timezone: string
  onTimezoneChange?: (timezone: string) => void
  title: string
  customDateTime?: DateTime
  onCustomDateTimeChange?: (dateTime: DateTime) => void
  showTimePicker?: boolean
}

export function ClockPanel({
  timezone,
  onTimezoneChange,
  title,
  customDateTime,
  onCustomDateTimeChange,
  showTimePicker = false,
}: ClockPanelProps) {
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
          onTimeChange={showTimePicker ? onCustomDateTimeChange : undefined}
        />
        {showTimePicker && customDateTime && onCustomDateTimeChange && (
          <TimePicker
            dateTime={customDateTime}
            onChange={onCustomDateTimeChange}
          />
        )}
        <Calendar
          timezone={timezone}
          customDateTime={customDateTime}
          onDateChange={showTimePicker ? onCustomDateTimeChange : undefined}
        />
      </div>
    </div>
  )
}
