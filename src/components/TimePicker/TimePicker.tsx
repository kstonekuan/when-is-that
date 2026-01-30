import type { DateTime } from 'luxon'
import { useCallback, useRef } from 'react'
import styles from './TimePicker.module.css'

interface TimePickerProps {
  dateTime: DateTime
  onChange: (dateTime: DateTime) => void
}

export function TimePicker({ dateTime, onChange }: TimePickerProps) {
  const hours = dateTime.hour.toString().padStart(2, '0')
  const minutes = dateTime.minute.toString().padStart(2, '0')

  // rerender-defer-reads: Use ref to avoid recreating callbacks when dateTime changes
  const dateTimeRef = useRef(dateTime)
  dateTimeRef.current = dateTime

  const handleHoursChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.replace(/\D/g, '').slice(0, 2)
      const numValue = Math.min(
        23,
        Math.max(0, Number.parseInt(value, 10) || 0),
      )
      onChange(dateTimeRef.current.set({ hour: numValue }))
    },
    [onChange],
  )

  const handleMinutesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.replace(/\D/g, '').slice(0, 2)
      const numValue = Math.min(
        59,
        Math.max(0, Number.parseInt(value, 10) || 0),
      )
      onChange(dateTimeRef.current.set({ minute: numValue }))
    },
    [onChange],
  )

  return (
    <div className={styles.container}>
      <div className={styles.timeInputs}>
        <input
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={hours}
          onChange={handleHoursChange}
          aria-label="Hours"
          maxLength={2}
        />
        <span className={styles.separator}>:</span>
        <input
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={minutes}
          onChange={handleMinutesChange}
          aria-label="Minutes"
          maxLength={2}
        />
      </div>
    </div>
  )
}
