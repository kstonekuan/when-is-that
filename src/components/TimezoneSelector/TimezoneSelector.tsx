import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  getTimezoneDisplayName,
  getTimezoneGroups,
  searchTimezones,
  type TimezoneGroup,
  type TimezoneOption,
} from '../../utils/timezoneUtils'
import styles from './TimezoneSelector.module.css'

// rendering-hoist-jsx: Hoist static JSX outside component
const NoResultsMessage = (
  <div className={styles.noResults}>No timezones found</div>
)

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  label?: string
}

interface TimezoneOptionItemProps {
  option: TimezoneOption
  isHighlighted: boolean
  isSelected: boolean
  onOptionClick: (option: TimezoneOption) => void
  onMouseEnter: () => void
}

// rerender-stable-callbacks: Extract option to avoid inline functions in map
const TimezoneOptionItem = memo(function TimezoneOptionItem({
  option,
  isHighlighted,
  isSelected,
  onOptionClick,
  onMouseEnter,
}: TimezoneOptionItemProps) {
  const handleClick = useCallback(() => {
    onOptionClick(option)
  }, [option, onOptionClick])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        onOptionClick(option)
      }
    },
    [option, onOptionClick],
  )

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={`${styles.option} ${isHighlighted ? styles.optionHighlighted : ''} ${isSelected ? styles.optionSelected : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
      tabIndex={-1}
    >
      <span className={styles.optionLabel}>{option.label}</span>
      <span className={styles.optionOffset}>{option.offset}</span>
    </div>
  )
})

// rerender-memoize: Wrap in memo to prevent unnecessary re-renders
export const TimezoneSelector = memo(function TimezoneSelector({
  value,
  onChange,
  label,
}: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const displayValue = getTimezoneDisplayName(value)

  const filteredGroups = useMemo((): TimezoneGroup[] => {
    if (!searchQuery.trim()) {
      return getTimezoneGroups()
    }
    const results = searchTimezones(searchQuery)
    if (results.length === 0) return []
    return [{ label: 'Search Results', options: results }]
  }, [searchQuery])

  const flatOptions = useMemo((): TimezoneOption[] => {
    return filteredGroups.flatMap((group) => group.options)
  }, [filteredGroups])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value)
      setHighlightedIndex(0)
      if (!isOpen) setIsOpen(true)
    },
    [isOpen],
  )

  const handleInputFocus = useCallback(() => {
    setIsOpen(true)
    setSearchQuery('')
  }, [])

  const handleOptionClick = useCallback(
    (option: TimezoneOption) => {
      onChange(option.value)
      setIsOpen(false)
      setSearchQuery('')
      inputRef.current?.blur()
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'ArrowDown' || event.key === 'Enter') {
          setIsOpen(true)
          event.preventDefault()
        }
        return
      }

      switch (event.key) {
        case 'ArrowDown':
          setHighlightedIndex((prev) =>
            prev < flatOptions.length - 1 ? prev + 1 : prev,
          )
          event.preventDefault()
          break
        case 'ArrowUp':
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          event.preventDefault()
          break
        case 'Enter':
          if (flatOptions[highlightedIndex]) {
            handleOptionClick(flatOptions[highlightedIndex])
          }
          event.preventDefault()
          break
        case 'Escape':
          setIsOpen(false)
          setSearchQuery('')
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, flatOptions, highlightedIndex, handleOptionClick],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          className={styles.input}
          value={isOpen ? searchQuery : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search timezone..."
          aria-label={label ? undefined : 'Select timezone'}
        />
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {filteredGroups.length === 0
            ? NoResultsMessage
            : filteredGroups.map((group) => {
                const groupStartIndex = flatOptions.indexOf(group.options[0])
                return (
                  <div key={group.label} className={styles.group}>
                    <div className={styles.groupLabel}>{group.label}</div>
                    {group.options.map((option, optionIndex) => {
                      const absoluteIndex = groupStartIndex + optionIndex
                      return (
                        <TimezoneOptionItem
                          key={option.value}
                          option={option}
                          isHighlighted={absoluteIndex === highlightedIndex}
                          isSelected={option.value === value}
                          onOptionClick={handleOptionClick}
                          onMouseEnter={() =>
                            setHighlightedIndex(absoluteIndex)
                          }
                        />
                      )
                    })}
                  </div>
                )
              })}
        </div>
      )}
    </div>
  )
})
