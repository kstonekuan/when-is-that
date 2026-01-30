import { DateTime } from 'luxon'
import { useCallback, useMemo, useState } from 'react'
import styles from './App.module.css'
import { ClockPanel } from './components/ClockPanel'
import { ModeToggle, type TimeMode } from './components/ModeToggle'
import { useLocalTimezone } from './hooks/useLocalTimezone'

const DEFAULT_COMPARISON_TIMEZONE = 'America/New_York'

export default function App() {
  const detectedTimezone = useLocalTimezone()
  const [localTimezone, setLocalTimezone] = useState(detectedTimezone)
  const [comparisonTimezone, setComparisonTimezone] = useState(() => {
    if (detectedTimezone === DEFAULT_COMPARISON_TIMEZONE) {
      return 'Europe/London'
    }
    return DEFAULT_COMPARISON_TIMEZONE
  })

  const [mode, setMode] = useState<TimeMode>('live')
  const [customDateTime, setCustomDateTime] = useState<DateTime>(() =>
    DateTime.now().setZone(detectedTimezone).set({ second: 0, millisecond: 0 }),
  )

  const handleLocalTimezoneChange = useCallback(
    (newTimezone: string) => {
      if (mode === 'custom') {
        setCustomDateTime((prev) =>
          prev.setZone(newTimezone, { keepLocalTime: true }),
        )
      }
      setLocalTimezone(newTimezone)
    },
    [mode],
  )

  const handleLocalDateTimeChange = useCallback(
    (newDateTime: DateTime) => {
      // Time changed on local clock - keep the local time and store in local timezone
      setCustomDateTime(
        newDateTime.setZone(localTimezone, { keepLocalTime: true }),
      )
    },
    [localTimezone],
  )

  const handleComparisonDateTimeChange = useCallback(
    (newDateTime: DateTime) => {
      // Time changed on comparison clock - convert back to local timezone for storage
      setCustomDateTime(newDateTime.setZone(localTimezone))
    },
    [localTimezone],
  )

  const convertedDateTime = useMemo(() => {
    if (mode === 'live') return undefined
    return customDateTime.setZone(comparisonTimezone)
  }, [mode, customDateTime, comparisonTimezone])

  const localCustomDateTime = useMemo(() => {
    if (mode === 'live') return undefined
    return customDateTime.setZone(localTimezone)
  }, [mode, customDateTime, localTimezone])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>When Is That?</h1>
        <p className={styles.subtitle}>Compare times across the world</p>
        <div className={styles.modeToggle}>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>
      </header>

      <main className={styles.clocksContainer}>
        <ClockPanel
          timezone={localTimezone}
          onTimezoneChange={handleLocalTimezoneChange}
          title="Your Time"
          customDateTime={localCustomDateTime}
          onCustomDateTimeChange={handleLocalDateTimeChange}
          showTimePicker={mode === 'custom'}
        />

        <div className={styles.divider} />

        <ClockPanel
          timezone={comparisonTimezone}
          onTimezoneChange={setComparisonTimezone}
          title="Their Time"
          customDateTime={convertedDateTime}
          onCustomDateTimeChange={handleComparisonDateTimeChange}
          showTimePicker={mode === 'custom'}
        />
      </main>
    </div>
  )
}
