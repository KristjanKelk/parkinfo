const ENDPOINT = 'https://overpass-api.de/api/interpreter'
// Lihtne päring: leia 800 m raadiuses parklad (node/way/relation)
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
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query })
    })
    if (!res.ok) throw new Error('Overpass ei vastanud')
    const json = await res.json()
    return (json.elements || []).map(e => ({
        id: `${e.type}/${e.id}`,
        lat: e.center ? e.center.lat : e.lat,
        lng: e.center ? e.center.lon : e.lon,
        name: e.tags?.name || 'Parkla',
        operator: e.tags?.operator,
        feeTag: e.tags?.fee,        // 'yes' | 'no' | undefined
        capacity: e.tags?.capacity,
        rawTags: e.tags || {}
    }))
}
