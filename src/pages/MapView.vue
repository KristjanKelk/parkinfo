<script setup>
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getBrowserLocation } from '../lib/geo'
import { fetchParkingsAround } from '../lib/overpass'
import { fetchTallinnZonesGeoJSON } from '../lib/tallinnZonesGeo'
import { ZONE_RULES } from '../data/tallinnZones'
import DurationPicker from '../components/DurationPicker.vue'
import SearchBox from '../components/SearchBox.vue'
import * as turf from '@turf/turf'
import { estimateCost, zonePaidNow, minutesUntilFree } from '../lib/tariff'  // kasutame sama arvutusloogikat

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const mapDiv = ref(null)
let map, marker, zonesLayer, cityPointsLayer, lotsLayer

const pos = ref(null)

const lots = ref([])
const duration = ref(60)
const zonesGeo = ref(null)     // GeoJSON
const activeZoneKey = ref(null) // 'KESKLINN' | 'SÜDALINN' | 'VANALINN' | 'PIRITA' | null
const sheetExpanded = ref(false)

// Layer toggles
const showZones = ref(true)
const showLots = ref(true)
const showCity = ref(true)

let notifyTimer = null

import { fetchTallinnParkingPoints } from '../lib/tallinnParkingPlaces'

async function loadCityParkingPoints() {
  const fc = await fetchTallinnParkingPoints()
  cityPointsLayer.clearLayers()
  L.geoJSON(fc, {
    pointToLayer: (feature, latlng) => {
      const color = getToken('--points-city') || '#22c55e'
      return L.circleMarker(latlng, { radius: 3, color, fillColor: color, fillOpacity: 1 })
    }
  }).addTo(cityPointsLayer)
}

async function initMap() {
  map = L.map(mapDiv.value, { zoomControl: true })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Loo kihid
  zonesLayer = L.layerGroup().addTo(map)
  cityPointsLayer = L.layerGroup().addTo(map)
  lotsLayer = L.layerGroup().addTo(map)

  // Lae tsoonid
  try {
    zonesGeo.value = await fetchTallinnZonesGeoJSON()
    drawZones(zonesGeo.value)
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('map.toast.zonesFail') } }))
  }

  // (SOOVIKORRAL) Lae Tallinna ametlikud parkimispunktid
  await loadCityParkingPoints()

  if (route.query.mode === 'pick') {
    const tallinn = { lat: 59.437, lng: 24.7536 }
    map.setView(tallinn, 14)
    map.on('click', async (e) => {
      setPosition(e.latlng)
      await loadLots()
      resolveZoneForPoint(e.latlng)
    })
  } else {
    try {
      const loc = await getBrowserLocation()
      setPosition(loc)
      await loadLots()
      resolveZoneForPoint(loc)
    } catch (e) {
      const fallback = { lat: 59.437, lng: 24.7536 }
      setPosition(fallback)
      await loadLots()
      resolveZoneForPoint(fallback)
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('map.toast.enableLocation') } }))
    }
  }
}

function getZoneColor(key) {
  if (key === 'VANALINN') return getComputedStyle(document.documentElement).getPropertyValue('--zones-vanalinn').trim() || '#ef4444'
  if (key === 'SÜDALINN') return getComputedStyle(document.documentElement).getPropertyValue('--zones-sydalinn').trim() || '#f59e0b'
  if (key === 'KESKLINN') return getComputedStyle(document.documentElement).getPropertyValue('--zones-kesklinn').trim() || '#3b82f6'
  if (key === 'PIRITA') return getComputedStyle(document.documentElement).getPropertyValue('--zones-pirita').trim() || '#10b981'
  return '#2563eb'
}

function getToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function drawZones(fc) {
  zonesLayer.clearLayers()
  L.geoJSON(fc, {
    style: (feature) => {
      const props = feature.properties || {}
      const rawName = props.NIMI || props.NAME || props.TSOON || props.TSON || props.ZONE || ''
      const key = normalizeZoneName(rawName)
      const color = getZoneColor(key)
      return { color, weight: 2, fillOpacity: 0.10, fillColor: color }
    }
  }).addTo(zonesLayer)
}

function setPosition(latlng) {
  pos.value = latlng
  map.setView(latlng, 16)
  if (marker) marker.remove()
  marker = L.marker(latlng).addTo(map).bindPopup(t('map.marker.destination')).openPopup()
}

async function loadLots() {
  lots.value = await fetchParkingsAround(pos.value.lat, pos.value.lng, 800)
  lotsLayer.clearLayers()
  lots.value.forEach(p => {
    const color = getToken('--lots-osm') || '#2563eb'
    L.circleMarker([p.lat, p.lng], { radius: 6, color, fillColor: color, fillOpacity: 1 })
        .addTo(lotsLayer)
        .bindPopup(p.name)
  })
}

function normalizeZoneName(raw) {
  // Siin tee vajadusel ArcGIS atribuut => meie ZONE_RULES võti
  // Paljudel andmetel on väljad nagu NAME/TSON/ZONE vms; vaatame tegeliku välja:
  // Võid logida esimese feature.props, et näha, mis nimi on (nt "SÜDALINN", "VANALINN", "KESKLINN", "PIRITA")
  const s = (raw || '').toUpperCase()
  if (s.includes('KESK')) return 'KESKLINN'
  if (s.includes('SÜDA') || s.includes('SYDA')) return 'SÜDALINN'
  if (s.includes('VANA')) return 'VANALINN'
  if (s.includes('PIRITA')) return 'PIRITA'
  return null
}

function resolveZoneForPoint(latlng) {
  if (!zonesGeo.value) return (activeZoneKey.value = null)
  const pt = turf.point([latlng.lng, latlng.lat])
  let found = null

  for (const f of zonesGeo.value.features) {
    // Leia nimi väljadest. Proovi mitu varianti:
    const props = f.properties || {}
    const rawName = props.NIMI || props.NAME || props.TSOON || props.TSON || props.ZONE || ''
    const key = normalizeZoneName(rawName)
    if (!key) continue
    const inside = turf.booleanPointInPolygon(pt, f)
    if (inside) { found = key; break }
  }
  activeZoneKey.value = found
}

onMounted(initMap)
onBeforeUnmount(() => { if (notifyTimer) clearTimeout(notifyTimer) })

const now = dayjs()
const bestZone = computed(() => {
  // Kui teame täpset tsooni, näitame seda; muidu konservatiivne odavaim eelduslik (nagu enne).
  if (activeZoneKey.value && ZONE_RULES[activeZoneKey.value]) {
    const z = ZONE_RULES[activeZoneKey.value]
    return {
      zone: { key: activeZoneKey.value, pricePerHour: z.perHour, free15min: z.free15 },
      paidNow: zonePaidNow(activeZoneKey.value, now),
      cost: estimateCost({ key: activeZoneKey.value, pricePerHour: z.perHour, free15min: z.free15 }, duration.value, now),
      precise: true
    }
  } else {
    // tagavara: vali odavaim eelduslik
    const entries = Object.entries(ZONE_RULES).map(([k, z]) => ({
      zone: { key: k, pricePerHour: z.perHour, free15min: z.free15 },
      paidNow: zonePaidNow(k, now),
      cost: estimateCost({ key: k, pricePerHour: z.perHour, free15min: z.free15 }, duration.value, now),
      precise: false
    }))
    entries.sort((a,b) => a.cost - b.cost)
    return entries[0]
  }
})

const freeHint = computed(() => {
  if (!activeZoneKey.value) return null
  const z = ZONE_RULES[activeZoneKey.value]
  if (!z) return null
  const paid = zonePaidNow(activeZoneKey.value, now)
  if (!paid) return 'Praegu tasuta'
  const m = minutesUntilFree(activeZoneKey.value, now)
  if (m === null) return null // 24/7 paid
  if (m === 0) return 'Varsti tasuta'
  if (duration.value > m) return `Tasuline ~${m} min, siis tasuta`
  return null
})

const zoneDotClass = computed(() => {
  if (!activeZoneKey.value) return ''
  if (activeZoneKey.value === 'VANALINN') return 'vanalinn'
  if (activeZoneKey.value === 'SÜDALINN') return 'sydalinn'
  if (activeZoneKey.value === 'KESKLINN') return 'kesklinn'
  if (activeZoneKey.value === 'PIRITA') return 'pirita'
  return ''
})

function recenter() {
  getBrowserLocation().then(loc => {
    setPosition(loc)
    loadLots()
    resolveZoneForPoint(loc)
  }).catch(() => window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('map.toast.locationReadFailed') } })))
}

function onSearchSelect(item) {
  const latlng = { lat: item.lat, lng: item.lng }
  setPosition(latlng)
  loadLots()
  resolveZoneForPoint(latlng)
}

function toggleLayers() {
  if (showZones.value) zonesLayer.addTo(map); else map.removeLayer(zonesLayer)
  if (showLots.value) lotsLayer.addTo(map); else map.removeLayer(lotsLayer)
  if (showCity.value) cityPointsLayer.addTo(map); else map.removeLayer(cityPointsLayer)
}

function notify() {
  const mins = Math.max(0, duration.value - 10)
  const ms = mins * 60 * 1000
  if ('Notification' in window) {
    Notification.requestPermission().then(p => {
      if (p === 'granted') {
        if (notifyTimer) clearTimeout(notifyTimer)
        notifyTimer = setTimeout(() => {
          new Notification(t('app.title'), { body: t('map.toast.notifySet', { minutes: 10 }) })
        }, ms)
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('map.toast.notifySet', { minutes: mins }) } }))
      }
    })
  } else {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('map.toast.notSupported') } }))
  }
}

function navigateToPoint() {
  if (!pos.value) return
  const { lat, lng } = pos.value
  const url = `https://www.google.com/maps?q=${lat},${lng}`
  window.open(url, '_blank')
}

function goDetail(lot) {
  router.push({ path: `/lot/${encodeURIComponent(lot.id)}`, query: { name: lot.name } })
}

function toggleSheet() {
  sheetExpanded.value = !sheetExpanded.value
}
</script>

<template>
  <div style="height: 100vh; display:flex; flex-direction:column;">
    <div class="header map-header" style="padding:8px 12px;">
      <button class="btn outline" @click="$router.push('/')">{{ t('map.back') }}</button>
      <h2 style="margin:0;">{{ t('map.title') }}</h2>
      <div style="width:64px;"></div>
    </div>

    <div style="flex:1;">
      <div ref="mapDiv" style="height:100%; position:relative;"></div>
      <div class="floating-controls">
        <SearchBox @select="onSearchSelect" />
        <div v-if="bestZone" class="chip" role="button" :aria-label="t('map.zone.info')" @click="toggleSheet">
          <span class="dot" :class="zoneDotClass"></span>
          <span>{{ bestZone.zone.key }}</span>
          <span style="opacity:.6;">·</span>
          <span>{{ bestZone.cost.toFixed(2) }} €</span>
        </div>
        <div class="control-box" role="group" :aria-label="t('map.layers.aria')">
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="checkbox" v-model="showZones" @change="toggleLayers" /> {{ t('map.layers.zones') }}
          </label>
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="checkbox" v-model="showLots" @change="toggleLayers" /> {{ t('map.layers.osmLots') }}
          </label>
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="checkbox" v-model="showCity" @change="toggleLayers" /> {{ t('map.layers.city') }}
          </label>
        </div>
        <button class="btn" :aria-label="t('map.recenter.aria')" @click="recenter">{{ t('map.recenter') }}
        </button>
      </div>
      <div class="floating-controls right">
        <div class="control-box legend" :aria-label="t('map.legend.title')">
          <div class="legend-item"><span class="dot vanalinn"></span> {{ t('map.legend.oldtown') }}</div>
          <div class="legend-item"><span class="dot sydalinn"></span> {{ t('map.legend.citycenter') }}</div>
          <div class="legend-item"><span class="dot kesklinn"></span> {{ t('map.legend.central') }}</div>
          <div class="legend-item"><span class="dot pirita"></span> {{ t('map.legend.pirita') }}</div>
          <div class="legend-item"><span class="dot osm"></span> {{ t('map.legend.osm') }}</div>
          <div class="legend-item"><span class="dot city"></span> {{ t('map.legend.city') }}</div>
        </div>
      </div>
    </div>

    <div class="bottom-sheet" role="dialog" :aria-label="t('map.sheet.aria')" :class="{ expanded: sheetExpanded }" :aria-expanded="sheetExpanded ? 'true' : 'false'">
      <div class="handle" aria-hidden="true" @click="toggleSheet"></div>
      <div class="content">
        <DurationPicker v-model="duration" />

        <div class="card" v-if="bestZone">
          <div class="row" style="justify-content:space-between;">
            <div>
              <strong>{{ bestZone.precise ? t('map.zone.preciseLabel') : t('map.zone.estimateLabel') }}:</strong>
              {{ bestZone.zone.key }}
              <div v-if="!bestZone.precise" style="font-size:12px;color:#6b7280">
                {{ t('map.zone.estimateNote') }}
              </div>
              <div v-if="freeHint" style="font-size:12px;color:#6b7280; margin-top:4px;">{{ freeHint }}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:20px;font-weight:700">{{ bestZone.cost.toFixed(2) }} €</div>
              <span class="badge" :class="bestZone.paidNow ? 'red' : 'green'">
                {{ bestZone.paidNow ? t('map.paid.now') : t('map.free.now') }}
              </span>
            </div>
          </div>
          <div class="row" style="margin-top:8px;">
            <button class="btn" :aria-label="t('map.notify')" @click="notify">{{ t('map.notify') }}</button>
            <button class="btn outline" :aria-label="t('map.navigate')" @click="navigateToPoint">{{ t('map.navigate') }}</button>
          </div>
          <div style="font-size:12px;color:#6b7280;margin-top:6px;">
            {{ t('map.rules.note') }}
          </div>
        </div>

        <div>
          <h3 style="margin:8px 0;">{{ t('map.nearby.title') }}</h3>
          <div v-for="lot in lots" :key="lot.id" class="card" @click="goDetail(lot)" style="cursor:pointer;">
            <div class="row" style="justify-content:space-between;">
              <div>
                <strong>{{ lot.name }}</strong>
                <div style="font-size:12px;color:#6b7280;">
                  {{ lot.operator ? lot.operator + ' · ' : '' }}
                  {{ lot.capacity ? t('map.lot.capacityKnown', { count: lot.capacity }) : t('map.lot.capacityUnknown') }}
                </div>
              </div>
              <div>
                <span class="badge" :class="lot.feeTag === 'no' ? 'green' : (lot.feeTag === 'yes' ? 'red' : 'gray')">
                  {{ lot.feeTag === 'no' ? t('map.lot.fee.free') : (lot.feeTag === 'yes' ? t('map.lot.fee.paid') : t('map.lot.fee.unknown')) }}
                </span>
              </div>
            </div>
          </div>
          <p style="font-size:12px;color:#6b7280;">{{ t('lot.pricesDisclaimer') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
