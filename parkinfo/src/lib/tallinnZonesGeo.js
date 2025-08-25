// Placeholder for dynamic loading of Tallinn zones from ArcGIS GeoJSON.
// MVP can swap this to a static file in /src/data.

const TALLINN_ZONES_URL = 'https://gis.tallinn.ee/arcgis/rest/services/AVP/AVP_parkimisalad/MapServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326'

export async function fetchTallinnZones() {
  const res = await fetch(TALLINN_ZONES_URL)
  if (!res.ok) throw new Error('Failed to load Tallinn zones')
  const geojson = await res.json()
  return geojson
}

