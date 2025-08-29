// Koondab OSM tagidest inimesele loetava info ja lingid

export function buildParkingInfo(parking) {
    const tags = parking?.rawTags || {}
    const website = parking.website || tags.website || tags['contact:website'] || tags.url
    const phone = parking.phone || tags.phone || tags['contact:phone']
    const email = parking.email || tags.email || tags['contact:email']
    const operator = parking.operator || tags.operator
    const openingHours = parking.openingHours || tags.opening_hours
    const capacity = parking.capacity || tags.capacity
    const fee = parking.feeTag || tags.fee
    const payment = parking.payment || Object.keys(tags)
        .filter(k => k.startsWith('payment:') && tags[k] === 'yes')
        .map(k => k.replace('payment:', ''))

    const lines = []
    if (operator) lines.push({ label: 'Operator', value: operator })
    if (capacity) lines.push({ label: 'Capacity', value: String(capacity) })
    if (fee) lines.push({ label: 'Fee', value: fee })
    if (openingHours) lines.push({ label: 'Opening hours', value: openingHours })
    if (phone) lines.push({ label: 'Phone', value: phone, href: phone ? `tel:${phone}` : undefined })
    if (email) lines.push({ label: 'Email', value: email, href: email ? `mailto:${email}` : undefined })
    if (website) lines.push({ label: 'Website', value: website, href: website })
    if (payment && payment.length) lines.push({ label: 'Payment', value: payment.join(', ') })

    // OSM element link
    if (parking?.id) {
        const [type, idStr] = String(parking.id).split('/')
        if (type && idStr) {
            const osmHref = `https://www.openstreetmap.org/${type}/${idStr}`
            lines.push({ label: 'OpenStreetMap', value: 'View element', href: osmHref })
        }
    }

    return { lines }
}

