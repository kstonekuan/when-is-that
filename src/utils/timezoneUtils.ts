export interface TimezoneOption {
  value: string
  label: string
  region: string
  offset: string
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
  { zone: 'America/Anchorage', label: 'Anchorage', region: 'Americas' },
  { zone: 'America/Phoenix', label: 'Phoenix', region: 'Americas' },
  { zone: 'America/Toronto', label: 'Toronto', region: 'Americas' },
  { zone: 'America/Vancouver', label: 'Vancouver', region: 'Americas' },
  { zone: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { zone: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas' },
  { zone: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Americas' },
  { zone: 'America/Lima', label: 'Lima', region: 'Americas' },
  { zone: 'America/Bogota', label: 'Bogotá', region: 'Americas' },
  { zone: 'America/Santiago', label: 'Santiago', region: 'Americas' },

  // Europe
  { zone: 'Europe/London', label: 'London', region: 'Europe' },
  { zone: 'Europe/Paris', label: 'Paris', region: 'Europe' },
  { zone: 'Europe/Berlin', label: 'Berlin', region: 'Europe' },
  { zone: 'Europe/Rome', label: 'Rome', region: 'Europe' },
  { zone: 'Europe/Madrid', label: 'Madrid', region: 'Europe' },
  { zone: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe' },
  { zone: 'Europe/Brussels', label: 'Brussels', region: 'Europe' },
  { zone: 'Europe/Vienna', label: 'Vienna', region: 'Europe' },
  { zone: 'Europe/Zurich', label: 'Zurich', region: 'Europe' },
  { zone: 'Europe/Stockholm', label: 'Stockholm', region: 'Europe' },
  { zone: 'Europe/Oslo', label: 'Oslo', region: 'Europe' },
  { zone: 'Europe/Copenhagen', label: 'Copenhagen', region: 'Europe' },
  { zone: 'Europe/Helsinki', label: 'Helsinki', region: 'Europe' },
  { zone: 'Europe/Warsaw', label: 'Warsaw', region: 'Europe' },
  { zone: 'Europe/Prague', label: 'Prague', region: 'Europe' },
  { zone: 'Europe/Athens', label: 'Athens', region: 'Europe' },
  { zone: 'Europe/Moscow', label: 'Moscow', region: 'Europe' },
  { zone: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe' },
  { zone: 'Europe/Lisbon', label: 'Lisbon', region: 'Europe' },
  { zone: 'Europe/Dublin', label: 'Dublin', region: 'Europe' },

  // Asia
  { zone: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia' },
  { zone: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia' },
  { zone: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia' },
  { zone: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { zone: 'Asia/Seoul', label: 'Seoul', region: 'Asia' },
  { zone: 'Asia/Taipei', label: 'Taipei', region: 'Asia' },
  { zone: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia' },
  { zone: 'Asia/Jakarta', label: 'Jakarta', region: 'Asia' },
  { zone: 'Asia/Manila', label: 'Manila', region: 'Asia' },
  { zone: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', region: 'Asia' },
  { zone: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh', region: 'Asia' },
  { zone: 'Asia/Kolkata', label: 'Mumbai', region: 'Asia' },
  { zone: 'Asia/Dubai', label: 'Dubai', region: 'Asia' },
  { zone: 'Asia/Riyadh', label: 'Riyadh', region: 'Asia' },
  { zone: 'Asia/Tel_Aviv', label: 'Tel Aviv', region: 'Asia' },
  { zone: 'Asia/Karachi', label: 'Karachi', region: 'Asia' },
  { zone: 'Asia/Dhaka', label: 'Dhaka', region: 'Asia' },

  // Pacific
  { zone: 'Pacific/Honolulu', label: 'Honolulu', region: 'Pacific' },
  { zone: 'Pacific/Auckland', label: 'Auckland', region: 'Pacific' },
  { zone: 'Pacific/Fiji', label: 'Fiji', region: 'Pacific' },
  { zone: 'Pacific/Guam', label: 'Guam', region: 'Pacific' },

  // Australia
  { zone: 'Australia/Sydney', label: 'Sydney', region: 'Australia' },
  { zone: 'Australia/Melbourne', label: 'Melbourne', region: 'Australia' },
  { zone: 'Australia/Brisbane', label: 'Brisbane', region: 'Australia' },
  { zone: 'Australia/Perth', label: 'Perth', region: 'Australia' },
  { zone: 'Australia/Adelaide', label: 'Adelaide', region: 'Australia' },

  // Africa
  { zone: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
  { zone: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa' },
  { zone: 'Africa/Lagos', label: 'Lagos', region: 'Africa' },
  { zone: 'Africa/Nairobi', label: 'Nairobi', region: 'Africa' },
  { zone: 'Africa/Casablanca', label: 'Casablanca', region: 'Africa' },

  // UTC
  { zone: 'UTC', label: 'UTC', region: 'Universal' },
]

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
    const offset = getTimezoneOffset(tz.zone)
    const option: TimezoneOption = {
      value: tz.zone,
      label: tz.label,
      region: tz.region,
      offset,
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
      tz.offset.toLowerCase().includes(lowerQuery),
  )
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getTimezoneDisplayName(timezone: string): string {
  // js-caching: Cache display name lookups
  if (!cachedDisplayNameMap) {
    cachedDisplayNameMap = new Map()
    for (const tz of getAllTimezones()) {
      cachedDisplayNameMap.set(tz.value, tz.label)
    }
  }

  const cachedLabel = cachedDisplayNameMap.get(timezone)
  if (cachedLabel) return cachedLabel

  // Fallback for unknown timezones
  const parts = timezone.split('/')
  return parts[parts.length - 1].replace(/_/g, ' ')
}
