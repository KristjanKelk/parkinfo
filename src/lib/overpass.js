const ENDPOINT = 'https://overpass-api.de/api/interpreter'

export async function fetchParkingsAround(lat, lng, radius = 800) {
    const query = `
    [out:json][timeout:25];
    (
      node(around:${radius}, ${lat}, ${lng})["amenity"="parking"];
      way(around:${radius}, ${lat}, ${lng})["amenity"="parking"];
      relation(around:${radius}, ${lat}, ${lng})["amenity"="parking"];
    );
    out center tags;
  `.trim()

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams({ data: query }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        })

        if (!res.ok) {
            console.warn('Overpass API error:', res.status)
            return [] // Return empty array instead of throwing
        }

        const json = await res.json()
        return (json.elements || []).map(e => ({
            id: `${e.type}/${e.id}`,
            lat: e.center ? e.center.lat : e.lat,
            lng: e.center ? e.center.lon : e.lon,
            name: e.tags?.name || 'Parkla',
            operator: e.tags?.operator,
            feeTag: e.tags?.fee,
            charge: e.tags?.charge,
            capacity: e.tags?.capacity,
            rawTags: e.tags || {}
        }))
    } catch (error) {
        console.warn('Failed to fetch parking data:', error.message)
        return [] // Return empty array on error
    }
}

export async function fetchParkingById(osmId) {
    const [type, idStr] = String(osmId).split('/')
    const id = Number(idStr)
    if (!type || !Number.isFinite(id)) throw new Error('Vigane OSM id')

    const query = `
    [out:json][timeout:25];
    ${type}(id:${id});
    out center tags;
  `.trim()

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams({ data: query }),
            signal: AbortSignal.timeout(30000)
        })

        if (!res.ok) throw new Error('Overpass ei vastanud')

        const json = await res.json()
        const e = (json.elements || [])[0]
        if (!e) throw new Error('Parkla ei leitud')

        const tags = e.tags || {}
        return {
            id: `${e.type}/${e.id}`,
            lat: e.center ? e.center.lat : e.lat,
            lng: e.center ? e.center.lon : e.lon,
            name: tags.name || 'Parkla',
            operator: tags.operator,
            feeTag: tags.fee,
            capacity: tags.capacity,
            website: tags.website || tags['contact:website'] || tags.url,
            phone: tags.phone || tags['contact:phone'],
            email: tags.email || tags['contact:email'],
            openingHours: tags.opening_hours,
            maxstay: tags.maxstay,
            maxheight: tags.maxheight,
            access: tags.access,
            surface: tags.surface,
            operatorType: tags['operator:type'],
            charge: tags.charge,
            payment: Object.keys(tags)
                .filter(k => k.startsWith('payment:') && tags[k] === 'yes')
                .map(k => k.replace('payment:', '')),
            rawTags: tags
        }
    } catch (error) {
        console.warn('Failed to fetch parking details:', error.message)
        throw error
    }
}