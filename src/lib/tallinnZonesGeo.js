// Tallinna ametlik ArcGIS teenus. Kasutame kihti "Parkimistsoon ala (6)" GeoJSONina.
// NB: palume WGS84 (outSR=4326), et Leafletiga sobiks.
const ZONES_URL =
    'https://gis.tallinn.ee/arcgis/rest/services/parkimine/MapServer/6/query?' +
    new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
        outSR: '4326'
    });

export async function fetchTallinnZonesGeoJSON() {
    const res = await fetch(ZONES_URL);
    if (!res.ok) throw new Error('Tallinna tsoonid ei laadinud');
    return res.json(); // GeoJSON FeatureCollection
}
