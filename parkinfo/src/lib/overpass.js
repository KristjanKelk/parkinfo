const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export async function fetchParkingLots(lat, lng, radiusMeters = 800) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="parking"](around:${radiusMeters},${lat},${lng});
      way["amenity"="parking"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="parking"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query }).toString()
  })
  if (!res.ok) throw new Error('Overpass request failed')
  const data = await res.json()
  return data.elements
}

