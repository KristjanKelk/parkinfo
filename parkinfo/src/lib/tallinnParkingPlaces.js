const CITY_POINTS_URL = 'https://gis.tallinn.ee/arcgis/rest/services/AVP/AVP_parkimisalad/MapServer/1/query?where=1%3D1&outFields=*&f=geojson&outSR=4326'

export async function fetchCityParkingPoints() {
  const res = await fetch(CITY_POINTS_URL)
  if (!res.ok) throw new Error('Failed to load city parking points')
  return res.json()
}

