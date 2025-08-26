import dayjs from 'dayjs'

function isWithin(time, from, to) {
    const h = time.hour() + time.minute() / 60
    return h >= from && h < to
}

export function isPaidNowForKesklinn(now) {
    const dow = now.day() // 0=Sun
    if (dow === 0) return false
    if (dow >= 1 && dow <= 5) return isWithin(now, 7, 19)
    if (dow === 6) return isWithin(now, 8, 15)
    return false
}

export function isPaidNowForPirita(now) {
    const monthDay = now.format('MM-DD')
    const inSeason = monthDay >= '05-15' && monthDay <= '09-15'
    if (!inSeason) return false
    return isWithin(now, 10, 22)
}

export function zonePaidNow(zoneKey, when = dayjs()) {
    if (zoneKey === 'SÜDALINN' || zoneKey === 'VANALINN') return true
    if (zoneKey === 'KESKLINN') return isPaidNowForKesklinn(when)
    if (zoneKey === 'PIRITA') return isPaidNowForPirita(when)
    return false
}

// Minutes until the parking becomes free. Returns:
// - null for zones that are always paid (24/7)
// - 0 if already free
// - positive minutes until free otherwise
export function minutesUntilFree(zoneKey, start = dayjs()) {
    if (zoneKey === 'VANALINN' || zoneKey === 'SÜDALINN') return null

    if (zoneKey === 'KESKLINN') {
        const dow = start.day()
        // Sunday is free all day
        if (dow === 0) return 0
        const hourMin = start.hour() + start.minute() / 60
        if (dow >= 1 && dow <= 5) {
            // Mon-Fri 7-19 paid
            if (hourMin < 7) return 0
            if (hourMin >= 19) return 0
            const minsTo19 = Math.max(0, Math.round((19 - hourMin) * 60))
            return minsTo19
        }
        if (dow === 6) {
            // Sat 8-15 paid
            if (hourMin < 8) return 0
            if (hourMin >= 15) return 0
            const minsTo15 = Math.max(0, Math.round((15 - hourMin) * 60))
            return minsTo15
        }
        return 0
    }

    if (zoneKey === 'PIRITA') {
        const monthDay = start.format('MM-DD')
        const inSeason = monthDay >= '05-15' && monthDay <= '09-15'
        if (!inSeason) return 0
        const hourMin = start.hour() + start.minute() / 60
        if (hourMin < 10) return 0
        if (hourMin >= 22) return 0
        const minsTo22 = Math.max(0, Math.round((22 - hourMin) * 60))
        return minsTo22
    }

    return null
}

export function estimateCost(zone, durationMinutes, start = dayjs()) {
    const paidNow = zonePaidNow(zone.key, start)
    let billableMinutes = durationMinutes

    // 15 min free if currently paid and zone supports free15
    if (paidNow && zone.free15min) {
        billableMinutes = Math.max(0, billableMinutes - 15)
    }

    // If the duration overlaps a free window, cap usage at minutes until free
    const untilFree = minutesUntilFree(zone.key, start)
    if (untilFree !== null) {
        if (untilFree === 0) {
            billableMinutes = 0
        } else if (paidNow) {
            billableMinutes = Math.min(billableMinutes, untilFree)
        }
    }

    const ratePerMinute = zone.pricePerHour / 60
    const price = billableMinutes * ratePerMinute
    return Math.round(price * 100) / 100
}
