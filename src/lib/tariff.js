import dayjs from 'dayjs'

function isWithin(time, from, to) {
    const h = time.hour() + time.minute()/60
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
    const inSeason = (monthDay >= '05-15' && monthDay <= '09-15')
    if (!inSeason) return false
    return isWithin(now, 10, 22)
}

export function zonePaidNow(zoneKey, when = dayjs()) {
    if (zoneKey === 'SÜDALINN' || zoneKey === 'VANALINN') return true
    if (zoneKey === 'KESKLINN') return isPaidNowForKesklinn(when)
    if (zoneKey === 'PIRITA') return isPaidNowForPirita(when)
    return false
}

export function estimateCost(zone, minutes, start = dayjs()) {
    // 15 min tasuta, kui tasulisel alal ja alustad õigesti – MVP: lahutame 15 min kui tasuline
    const paidNow = zonePaidNow(zone.key, start)
    let billableMin = minutes
    if (paidNow && zone.free15min) billableMin = Math.max(0, minutes - 15)
    const ratePerMin = zone.pricePerHour / 60
    return +(billableMin * ratePerMin).toFixed(2)
}
