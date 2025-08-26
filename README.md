# Parkinfo (Tallinn)

Find the closest and cheapest legal parking spot near a chosen location in Tallinn, show exact zone rules, and estimate cost for the planned duration.

## Run

```bash
pnpm i
pnpm dev
```

Build PWA:

```bash
pnpm build && pnpm preview
```

## Tech
- Vite + Vue 3 + Leaflet + dayjs + @turf/turf
- No backend, all public data client-side

## Data sources
- Tallinn zones (ArcGIS GeoJSON): `https://gis.tallinn.ee/arcgis/rest/services/parkimine/MapServer/6/query?f=geojson&outSR=4326&where=1%3D1&outFields=*`
- Tallinn city parking points (ArcGIS GeoJSON): `https://gis.tallinn.ee/arcgis/rest/services/parkimine/MapServer/1/query?f=geojson&outSR=4326&where=1%3D1&outFields=*`
- OSM lots (Overpass): `https://overpass-api.de/api/interpreter`
- Search (Nominatim): `https://nominatim.openstreetmap.org/search`

## Features
- Mobile-first map with zone detection (point-in-polygon)
- Duration slider with 15 min free and pay-until-free logic
- OSM lots and city points with clear legend and toggles
- Bottom sheet actions: Notify and Navigate
- PWA: installable, offline shell, runtime caching for tiles and APIs

