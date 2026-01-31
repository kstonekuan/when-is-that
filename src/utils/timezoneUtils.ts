import { createRegExp, digit, exactly, maybe, oneOrMore } from 'magic-regexp'

// Pattern to match offset-style abbreviations like GMT, GMT+5, GMT-8, GMT+5:30
const gmtOffsetPattern = createRegExp(
  exactly('GMT')
    .at.lineStart()
    .and(
      maybe(
        exactly('+').or('-'),
        oneOrMore(digit),
        maybe(':', oneOrMore(digit)),
      ),
    )
    .at.lineEnd(),
)

export interface TimezoneOption {
  value: string
  label: string
  region: string
  offset: string
  abbreviation: string
}

export interface TimezoneGroup {
  label: string
  options: TimezoneOption[]
}

const TIMEZONE_DATA: { zone: string; label: string; region: string }[] = [
  // Americas
  { zone: 'America/New_York', label: 'New York', region: 'Americas' },
  { zone: 'America/Chicago', label: 'Chicago', region: 'Americas' },
  { zone: 'America/Denver', label: 'Denver', region: 'Americas' },
  { zone: 'America/Los_Angeles', label: 'San Francisco', region: 'Americas' },
  { zone: 'America/Phoenix', label: 'Phoenix', region: 'Americas' },
  { zone: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { zone: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas' },
  { zone: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Americas' },

  // Europe
  { zone: 'Europe/London', label: 'London', region: 'Europe' },
  { zone: 'Europe/Paris', label: 'Paris', region: 'Europe' },
  { zone: 'Europe/Helsinki', label: 'Helsinki', region: 'Europe' },
  { zone: 'Europe/Athens', label: 'Athens', region: 'Europe' },
  { zone: 'Europe/Moscow', label: 'Moscow', region: 'Europe' },
  { zone: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe' },

  // Asia
  { zone: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia' },
  { zone: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia' },
  { zone: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { zone: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia' },
  { zone: 'Asia/Kolkata', label: 'Mumbai', region: 'Asia' },
  { zone: 'Asia/Dubai', label: 'Dubai', region: 'Asia' },
  { zone: 'Asia/Tel_Aviv', label: 'Tel Aviv', region: 'Asia' },
  { zone: 'Asia/Karachi', label: 'Karachi', region: 'Asia' },

  // Pacific
  { zone: 'Pacific/Honolulu', label: 'Honolulu', region: 'Pacific' },
  { zone: 'Pacific/Auckland', label: 'Auckland', region: 'Pacific' },

  // Australia
  { zone: 'Australia/Sydney', label: 'Sydney', region: 'Australia' },
  { zone: 'Australia/Perth', label: 'Perth', region: 'Australia' },

  // Africa
  { zone: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
  { zone: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa' },

  // UTC
  { zone: 'UTC', label: 'UTC', region: 'Universal' },
]

export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(now)
    const abbreviationPart = parts.find((part) => part.type === 'timeZoneName')
    const abbreviation = abbreviationPart?.value ?? ''

    // Filter out offset-style abbreviations (GMT+X, GMT+X:30, GMT-X, GMT) as they're redundant with the UTC offset
    if (gmtOffsetPattern.test(abbreviation)) {
      return ''
    }

    return abbreviation
  } catch {
    return ''
  }
}

function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(now)
    const offsetPart = parts.find((part) => part.type === 'timeZoneName')
    if (offsetPart) {
      const offset = offsetPart.value
      if (offset === 'GMT') return 'UTC+0'
      return offset.replace('GMT', 'UTC')
    }
    return ''
  } catch {
    return ''
  }
}

// js-caching: Cache computed timezone data to avoid recalculation on each call
let cachedTimezoneGroups: TimezoneGroup[] | null = null
let cachedAllTimezones: TimezoneOption[] | null = null
let cachedDisplayNameMap: Map<string, string> | null = null

export function getTimezoneGroups(): TimezoneGroup[] {
  if (cachedTimezoneGroups) return cachedTimezoneGroups

  const grouped: Record<string, TimezoneOption[]> = {}

  for (const tz of TIMEZONE_DATA) {
    const option: TimezoneOption = {
      value: tz.zone,
      label: tz.label,
      region: tz.region,
      offset: getTimezoneOffset(tz.zone),
      abbreviation: getTimezoneAbbreviation(tz.zone),
    }

    if (!grouped[tz.region]) {
      grouped[tz.region] = []
    }
    grouped[tz.region].push(option)
  }

  const regionOrder = [
    'Americas',
    'Europe',
    'Asia',
    'Pacific',
    'Australia',
    'Africa',
    'Universal',
  ]

  cachedTimezoneGroups = regionOrder
    .filter((region) => grouped[region])
    .map((region) => ({
      label: region,
      options: grouped[region],
    }))

  return cachedTimezoneGroups
}

export function getAllTimezones(): TimezoneOption[] {
  if (cachedAllTimezones) return cachedAllTimezones

  cachedAllTimezones = TIMEZONE_DATA.map((tz) => ({
    value: tz.zone,
    label: tz.label,
    region: tz.region,
    offset: getTimezoneOffset(tz.zone),
    abbreviation: getTimezoneAbbreviation(tz.zone),
  }))

  return cachedAllTimezones
}

export function searchTimezones(query: string): TimezoneOption[] {
  const lowerQuery = query.toLowerCase()
  // js-early-exit: Return early for empty queries
  if (!lowerQuery) return getAllTimezones()

  return getAllTimezones().filter(
    (tz) =>
      tz.label.toLowerCase().includes(lowerQuery) ||
      tz.value.toLowerCase().includes(lowerQuery) ||
      tz.region.toLowerCase().includes(lowerQuery) ||
      tz.offset.toLowerCase().includes(lowerQuery) ||
      tz.abbreviation.toLowerCase().includes(lowerQuery),
  )
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getTimezoneDisplayName(timezone: string): string {
  // js-caching: Cache city name lookups
  if (!cachedDisplayNameMap) {
    cachedDisplayNameMap = new Map()
    for (const tz of getAllTimezones()) {
      cachedDisplayNameMap.set(tz.value, tz.label)
    }
  }

  let cityName = cachedDisplayNameMap.get(timezone)
  if (!cityName) {
    // Fallback for unknown timezones
    const parts = timezone.split('/')
    cityName = parts[parts.length - 1].replace(/_/g, ' ')
  }

  // Get dynamic abbreviation (not cached to reflect current DST status)
  const abbreviation = getTimezoneAbbreviation(timezone)
  return abbreviation ? `${cityName} (${abbreviation})` : cityName
}
