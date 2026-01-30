import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { ClockPanel } from './components/ClockPanel'
import { ModeToggle, type TimeMode } from './components/ModeToggle'
import { useLocalTimezone } from './hooks/useLocalTimezone'

const GITHUB_URL = 'https://github.com/kstonekuan/when-is-that'

const DEFAULT_COMPARISON_TIMEZONE = 'America/New_York'

// rendering-hoist-jsx: Hoist static elements outside component
const GitHubIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

// rendering-hoist-jsx: Hoist static shortcut hint outside component
const ShortcutHint = (
  <span className={styles.shortcutHint}>Press Space to toggle</span>
)

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

  // Keyboard shortcut to toggle mode (Space)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (event.code === 'Space') {
        event.preventDefault()
        setMode((prev) => (prev === 'live' ? 'custom' : 'live'))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>When Is That?</h1>
      </header>

      <main className={styles.clocksContainer}>
        <ClockPanel
          timezone={localTimezone}
          onTimezoneChange={handleLocalTimezoneChange}
          title="Your Time"
          customDateTime={localCustomDateTime}
          onCustomDateTimeChange={handleLocalDateTimeChange}
        />

        <div className={styles.divider} />

        <ClockPanel
          timezone={comparisonTimezone}
          onTimezoneChange={setComparisonTimezone}
          title="Their Time"
          customDateTime={convertedDateTime}
          onCustomDateTimeChange={handleComparisonDateTimeChange}
        />
      </main>

      <div className={styles.floatingToggle}>
        <ModeToggle mode={mode} onModeChange={setMode} />
        {ShortcutHint}
      </div>

      <footer className={styles.footer}>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          {GitHubIcon}
          <span className={styles.srOnly}>View on GitHub</span>
        </a>
      </footer>
    </div>
  )
}
