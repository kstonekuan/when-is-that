import { useCallback } from 'react'
import styles from './ModeToggle.module.css'

export type TimeMode = 'live' | 'custom'

interface ModeToggleProps {
  mode: TimeMode
  onModeChange: (mode: TimeMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const isCustom = mode === 'custom'

  // rerender-functional-setstate: Use callback for stable reference
  const handleToggle = useCallback(() => {
    onModeChange(isCustom ? 'live' : 'custom')
  }, [isCustom, onModeChange])

  return (
    <div className={styles.container}>
      <span
        className={`${styles.label} ${!isCustom ? styles.labelActive : ''}`}
      >
        Live
      </span>
      <button
        type="button"
        className={styles.toggle}
        onClick={handleToggle}
        data-active={isCustom}
        aria-label={`Switch to ${isCustom ? 'live' : 'custom'} time mode`}
      >
        <span className={styles.toggleKnob} />
      </button>
      <span className={`${styles.label} ${isCustom ? styles.labelActive : ''}`}>
        Set Time
      </span>
    </div>
  )
}
