import { useMemo } from 'react'
import { getLocalTimezone } from '../utils/timezoneUtils'

export function useLocalTimezone(): string {
  return useMemo(() => getLocalTimezone(), [])
}
