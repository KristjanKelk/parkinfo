import dayjs from 'dayjs'

const ZONES = {
  vanalinn: { key: 'vanalinn', name: 'Vanalinn', perHour: 6.0, free15: true, always: true },
  sydalinn: { key: 'sydalinn', name: 'Südalinn', perHour: 4.8, free15: true, always: true },
  kesklinn: { key: 'kesklinn', name: 'Kesklinn', perHour: 1.5, free15: true },
  pirita: { key: 'pirita', name: 'Pirita', perHour: 0.6, free15: true }
}

export function zonePaidNow(zoneKey, startTime = new Date()) {
  const t = dayjs(startTime)
  const zone = ZONES[zoneKey]
  if (!zone) return false
  if (zone.always) return true

  const day = t.day() // 0=Sun
  const hour = t.hour()

  if (zoneKey === 'kesklinn') {
    if (day === 0) return false
    if (day >= 1 && day <= 5) return hour >= 7 && hour < 19
    if (day === 6) return hour >= 8 && hour < 15
    return false
  }

  if (zoneKey === 'pirita') {
    const month = t.month() + 1 // 1-12
    const date = t.date()
    const inSeason = (month > 5 && month < 9) || (month === 5 && date >= 15) || (month === 9 && date <= 15)
    if (!inSeason) return false
    return hour >= 10 && hour < 22
  }

  return false
}

export function minutesUntilFree(zoneKey, startTime = new Date()) {
  const t = dayjs(startTime)
  if (zoneKey === 'vanalinn' || zoneKey === 'sydalinn') return null

  if (!zonePaidNow(zoneKey, t)) return 0

  if (zoneKey === 'kesklinn') {
    const day = t.day()
    const endHour = (day >= 1 && day <= 5) ? 19 : (day === 6 ? 15 : null)
    if (endHour == null) return 0
    const end = t.hour(endHour).minute(0).second(0)
    return Math.max(0, end.diff(t, 'minute'))
  }

  if (zoneKey === 'pirita') {
    const end = t.hour(22).minute(0).second(0)
    return Math.max(0, end.diff(t, 'minute'))
  }

  return null
}

export function estimateCost(zoneKey, startTime, durationMinutes) {
  const zone = ZONES[zoneKey]
  if (!zone) return { price: 0, billableMinutes: 0 }

  let billableMinutes = durationMinutes
  if (zonePaidNow(zoneKey, startTime) && zone.free15) {
    billableMinutes = Math.max(0, billableMinutes - 15)
  }

  const muf = minutesUntilFree(zoneKey, startTime)
  if (muf !== null && muf !== 0) {
    billableMinutes = Math.min(billableMinutes, muf)
  }

  const perMinute = zone.perHour / 60
  const price = Math.round(billableMinutes * perMinute * 100) / 100
  return { price, billableMinutes }
}

export function getZoneMeta(zoneKey) {
  return ZONES[zoneKey] || null
}

