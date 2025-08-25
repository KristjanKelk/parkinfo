// /src/lib/tallinnParkingPlaces.js
const POINTS_URL =
    'https://gis.tallinn.ee/arcgis/rest/services/parkimine/MapServer/1/query?' +
    new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
        outSR: '4326'
    });

export async function fetchTallinnParkingPoints() {
    const r = await fetch(POINTS_URL);
    if (!r.ok) throw new Error('Parkimiskohad ei laadinud');
    return r.json();
}
