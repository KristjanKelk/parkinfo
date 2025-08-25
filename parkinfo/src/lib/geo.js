import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point, polygon } from '@turf/helpers'

export function isPointInPolygon(lat, lng, polyCoords) {
  const pt = point([lng, lat])
  const poly = polygon([polyCoords])
  return booleanPointInPolygon(pt, poly)
}

