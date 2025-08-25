// Minimal static structure to map layer names/ids to tariff zones
export const ZONE_STYLE = {
  vanalinn: { color: 'var(--zones-vanalinn)' },
  sydalinn: { color: 'var(--zones-sydalinn)' },
  kesklinn: { color: 'var(--zones-kesklinn)' },
  pirita: { color: 'var(--zones-pirita)' }
}

export function colorForZone(zoneKey) {
  return ZONE_STYLE[zoneKey]?.color || '#8884d8'
}

