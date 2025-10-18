<script setup>
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getBrowserLocation } from '../lib/geo'
import { fetchParkingsAround } from '../lib/overpass'
import { fetchTallinnZonesGeoJSON } from '../lib/tallinnZonesGeo'
import { fetchTallinnParkingPoints } from '../lib/tallinnParkingPlaces'
import { ZONE_RULES } from '../data/tallinnZones'
import * as turf from '@turf/turf'
import { estimateCost, zonePaidNow, minutesUntilFree } from '../lib/tariff'
import ParkingProviders from '../components/ParkingProviders.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const mapDiv = ref(null)
let map, marker, zonesLayer, cityPointsLayer, lotsLayer

const pos = ref(null)
const lots = ref([])
const duration = ref(60)
const zonesGeo = ref(null)
const activeZoneKey = ref(null)
const sheetOpen = ref(false)
const showControls = ref(false)
const showSearch = ref(false)
const selectedLot = ref(null) // NEW: For parking popup

// Layer toggles
const showZones = ref(true)
const showLots = ref(true)
const showCity = ref(false)

let notifyTimer = null

async function loadCityParkingPoints() {
  try {
    const fc = await fetchTallinnParkingPoints()
    cityPointsLayer.clearLayers()
    L.geoJSON(fc, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 3,
          color: '#03C04A',
          fillColor: '#03C04A',
          fillOpacity: 1,
          weight: 0
        })
      }
    }).addTo(cityPointsLayer)
  } catch (e) {
    console.warn('Failed to load city points')
  }
}

async function initMap() {
  map = L.map(mapDiv.value, {
    zoomControl: false,
    attributionControl: false
  })

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OSM'
  }).addTo(map)

  zonesLayer = L.layerGroup().addTo(map)
  cityPointsLayer = L.layerGroup()
  lotsLayer = L.layerGroup().addTo(map)

  try {
    zonesGeo.value = await fetchTallinnZonesGeoJSON()
    drawZones(zonesGeo.value)
  } catch (e) {
    console.warn('Failed to load zones')
  }

  if (showCity.value) await loadCityParkingPoints()

  if (route.query.mode === 'pick') {
    const tallinn = { lat: 59.437, lng: 24.7536 }
    map.setView(tallinn, 14)
    map.on('click', async (e) => {
      setPosition(e.latlng)
      await loadLots()
      resolveZoneForPoint(e.latlng)
      selectedLot.value = null // Close popup when clicking map
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
    }
  }
}

function getZoneColor(key) {
  const colors = {
    'VANALINN': '#ef4444',
    'SÜDALINN': '#f59e0b',
    'KESKLINN': '#3b82f6',
    'PIRITA': '#10b981'
  }
  return colors[key] || '#2563eb'
}

function drawZones(fc) {
  zonesLayer.clearLayers()
  L.geoJSON(fc, {
    style: (feature) => {
      const props = feature.properties || {}
      const rawName = props.NIMI || props.NAME || props.TSOON || props.TSON || props.ZONE || ''
      const key = normalizeZoneName(rawName)
      const color = getZoneColor(key)
      return {
        color,
        weight: 1.5,
        fillOpacity: 0.08,
        fillColor: color,
        opacity: 0.6
      }
    }
  }).addTo(zonesLayer)
}

function setPosition(latlng) {
  pos.value = latlng
  map.setView(latlng, 16)
  if (marker) marker.remove()
  marker = L.marker(latlng).addTo(map)
}

async function loadLots() {
  try {
    lots.value = await fetchParkingsAround(pos.value.lat, pos.value.lng, 800)
    lotsLayer.clearLayers()
    lots.value.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: '#000',
        fillColor: '#0057FF',
        fillOpacity: 1,
        weight: 2
      })
          .addTo(lotsLayer)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e)
            handleLotClick(p)
          })
    })
  } catch (e) {
    console.warn('Failed to load parking lots')
  }
}

// NEW: Handle parking lot click
function handleLotClick(lot) {
  selectedLot.value = lot
  sheetOpen.value = false // Close bottom sheet to avoid overlap
}

// NEW: Close parking popup
function closeLotPopup() {
  selectedLot.value = null
}

function normalizeZoneName(raw) {
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
  if (activeZoneKey.value && ZONE_RULES[activeZoneKey.value]) {
    const z = ZONE_RULES[activeZoneKey.value]
    return {
      zone: { key: activeZoneKey.value, pricePerHour: z.perHour, free15min: z.free15 },
      paidNow: zonePaidNow(activeZoneKey.value, now),
      cost: estimateCost({ key: activeZoneKey.value, pricePerHour: z.perHour, free15min: z.free15 }, duration.value, now),
      precise: true
    }
  } else {
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

const durationLabel = computed(() => {
  const h = Math.floor(duration.value/60)
  const m = duration.value % 60
  return h ? `${h}h ${m}m` : `${m}m`
})

function recenter() {
  getBrowserLocation().then(loc => {
    setPosition(loc)
    loadLots()
    resolveZoneForPoint(loc)
  }).catch(() => {})
}

function toggleLayers() {
  if (showZones.value) zonesLayer.addTo(map)
  else map.removeLayer(zonesLayer)

  if (showLots.value) lotsLayer.addTo(map)
  else map.removeLayer(lotsLayer)

  if (showCity.value) {
    loadCityParkingPoints()
    cityPointsLayer.addTo(map)
  } else {
    map.removeLayer(cityPointsLayer)
  }
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
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: t('map.toast.notifySet', { minutes: mins }) }
        }))
      }
    })
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
  sheetOpen.value = !sheetOpen.value
  if (sheetOpen.value) {
    selectedLot.value = null // Close popup when opening sheet
  }
}
</script>

<template>
  <div class="map-page">
    <!-- Minimal Top Bar -->
    <div class="top-bar">
      <button class="top-btn" @click="$router.push('/')">
        <span>←</span>
      </button>
      <button class="top-btn" @click="showSearch = !showSearch">
        <span>🔍</span>
      </button>
    </div>

    <!-- Map -->
    <div ref="mapDiv" class="full-map" @click="closeLotPopup"></div>

    <!-- Search Overlay -->
    <div v-if="showSearch" class="search-overlay" @click="showSearch = false">
      <div class="search-panel" @click.stop>
        <input
            type="text"
            class="search-input-mobile"
            :placeholder="t('search.placeholder')"
            autofocus
        />
        <button class="search-close" @click="showSearch = false">✕</button>
      </div>
    </div>

    <!-- NEW: Parking Lot Popup -->
    <div v-if="selectedLot" class="lot-popup" @click.stop>
      <div class="lot-popup-header">
        <div class="lot-popup-title">{{ selectedLot.name }}</div>
        <button class="lot-popup-close" @click="closeLotPopup">✕</button>
      </div>

      <div class="lot-popup-content">
        <div v-if="selectedLot.operator" class="lot-popup-row">
          <span class="lot-popup-label">{{ t('lot.operator') || 'Operator' }}</span>
          <span class="lot-popup-value">{{ selectedLot.operator }}</span>
        </div>

        <div v-if="selectedLot.capacity" class="lot-popup-row">
          <span class="lot-popup-label">{{ t('lot.capacity') || 'Capacity' }}</span>
          <span class="lot-popup-value">{{ selectedLot.capacity }} {{ t('map.lot.capacityKnown', { count: '' }) }}</span>
        </div>

        <div v-if="selectedLot.charge" class="lot-popup-row">
          <span class="lot-popup-label">{{ t('lot.tariff') || 'Tariff' }}</span>
          <span class="lot-popup-value">{{ selectedLot.charge }}</span>
        </div>

        <div v-if="selectedLot.feeTag" class="lot-popup-row">
          <span class="lot-popup-label">{{ t('lot.fee') || 'Fee' }}</span>
          <span class="lot-popup-badge" :class="selectedLot.feeTag === 'no' ? 'free' : 'paid'">
            {{ selectedLot.feeTag === 'no' ? t('map.lot.fee.free') : t('map.lot.fee.paid') }}
          </span>
        </div>
      </div>

      <button class="lot-popup-btn" @click="goDetail(selectedLot)">
        {{ t('lot.viewDetails') || 'View Full Details' }} →
      </button>
    </div>

    <!-- Zone Chip -->
    <div v-if="bestZone && !sheetOpen && !selectedLot" class="zone-chip" @click="toggleSheet">
      <div class="zone-chip-content">
        <span class="zone-name">{{ bestZone.zone.key }}</span>
        <span class="zone-divider">·</span>
        <span class="zone-cost">{{ bestZone.cost.toFixed(2) }} €</span>
        <span class="zone-duration">({{ durationLabel }})</span>
      </div>
    </div>

    <!-- Recenter Button -->
    <button class="recenter-btn" @click="recenter" :aria-label="t('map.recenter')">
      <span>📍</span>
    </button>

    <!-- Controls Toggle -->
    <button class="controls-toggle" @click="showControls = !showControls">
      <span v-if="showControls">✕</span>
      <span v-else">⚙️</span>
    </button>

    <!-- Layer Controls -->
    <div v-if="showControls" class="layer-controls">
      <label class="layer-toggle">
        <input type="checkbox" v-model="showZones" @change="toggleLayers" />
        <span>Zones</span>
      </label>
      <label class="layer-toggle">
        <input type="checkbox" v-model="showLots" @change="toggleLayers" />
        <span>Parking</span>
      </label>
      <label class="layer-toggle">
        <input type="checkbox" v-model="showCity" @change="toggleLayers" />
        <span>City</span>
      </label>
    </div>

    <!-- Bottom Sheet -->
    <div class="bottom-sheet-mobile" :class="{ open: sheetOpen }">
      <div class="sheet-handle" @click="toggleSheet"></div>

      <div class="sheet-content">
        <!-- Duration Slider -->
        <div class="duration-section">
          <div class="duration-header">
            <span class="duration-label">{{ t('duration.label') }}</span>
            <span class="duration-value">{{ durationLabel }}</span>
          </div>
          <input
              type="range"
              class="duration-slider"
              min="15"
              max="480"
              step="15"
              v-model.number="duration"
          />
        </div>

        <!-- Zone Info -->
        <div v-if="bestZone" class="zone-info-card">
          <div class="zone-info-header">
            <div>
              <div class="zone-info-name">{{ bestZone.zone.key }}</div>
              <div v-if="!bestZone.precise" class="zone-info-note">
                {{ t('map.zone.estimateNote') }}
              </div>
            </div>
            <div class="zone-info-price">
              <div class="price-amount">{{ bestZone.cost.toFixed(2) }} €</div>
              <span class="price-badge" :class="bestZone.paidNow ? 'paid' : 'free'">
                {{ bestZone.paidNow ? t('map.paid.now') : t('map.free.now') }}
              </span>
            </div>
          </div>

          <div v-if="activeZoneKey" class="services-section">
            <h3 class="services-title">
              {{ t('services.title') || (locale === 'et' ? 'Parkimisteenused' : 'Parking Services') }}
            </h3>
            <ParkingProviders :zone="activeZoneKey" :compact="true" />
          </div>

          <!-- Actions -->
          <div class="action-buttons">
            <button class="action-btn primary" @click="notify">
              <span>🔔</span>
              <span>{{ t('map.notify') }}</span>
            </button>
            <button class="action-btn secondary" @click="navigateToPoint">
              <span>🧭</span>
              <span>{{ t('map.navigate') }}</span>
            </button>
          </div>
        </div>

        <!-- Nearby Parking -->
        <div v-if="lots.length" class="nearby-section">
          <h3 class="nearby-title">{{ t('map.nearby.title') }} ({{ lots.length }})</h3>
          <div class="parking-list">
            <div
                v-for="lot in lots.slice(0, 5)"
                :key="lot.id"
                class="parking-item"
                @click="handleLotClick(lot)"
            >
              <div class="parking-info">
                <div class="parking-name">{{ lot.name }}</div>
                <div class="parking-meta">
                  <span v-if="lot.operator" class="parking-operator">{{ lot.operator }}</span>
                  <span v-if="lot.capacity" class="parking-capacity">
                    {{ lot.capacity }} {{ t('map.lot.capacityKnown', { count: '' }) }}
                  </span>
                </div>
              </div>
              <span class="parking-badge" :class="lot.feeTag === 'no' ? 'free' : 'paid'">
                {{ lot.feeTag === 'no' ? t('map.lot.fee.free') : t('map.lot.fee.paid') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.full-map {
  width: 100%;
  height: 100%;
}

/* Top Bar */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  padding: 12px;
  pointer-events: none;
}

.top-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  border: none;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: auto;
}

.top-btn:active {
  opacity: 0.8;
}

/* Search Overlay */
.search-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1100;
  animation: fadeIn 0.2s ease;
}

.search-panel {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input-mobile {
  flex: 1;
  border: none;
  font-size: 16px;
  padding: 8px;
  outline: none;
}

.search-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  border: none;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* NEW: Parking Lot Popup */
.lot-popup {
  position: absolute;
  bottom: 90px;
  left: 16px;
  right: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1200;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 400px;
  margin: 0 auto;
}

.lot-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.lot-popup-title {
  font-size: 18px;
  font-weight: 800;
  color: #000;
  flex: 1;
  padding-right: 8px;
}

.lot-popup-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f7f7f7;
  border: none;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.lot-popup-close:active {
  background: #e8e8e8;
}

.lot-popup-content {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lot-popup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.lot-popup-label {
  color: #666;
  font-weight: 500;
}

.lot-popup-value {
  color: #000;
  font-weight: 600;
  text-align: right;
}

.lot-popup-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.lot-popup-badge.free {
  background: #E7F7EE;
  color: #03C04A;
}

.lot-popup-badge.paid {
  background: #FEEAE8;
  color: #E11900;
}

.lot-popup-btn {
  width: 100%;
  padding: 14px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 0 0 16px 16px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.lot-popup-btn:active {
  opacity: 0.8;
}

/* Zone Chip */
.zone-chip {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 900;
  background: #000;
  color: #fff;
  padding: 10px 16px;
  border-radius: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  animation: slideDown 0.3s ease;
}

.zone-chip-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
}

.zone-name {
  font-weight: 800;
}

.zone-divider {
  opacity: 0.5;
}

.zone-duration {
  font-size: 12px;
  opacity: 0.7;
}

/* Recenter Button */
.recenter-btn {
  position: absolute;
  bottom: 100px;
  right: 16px;
  z-index: 900;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e0e0e0;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.recenter-btn:active {
  transform: scale(0.95);
}

/* Controls Toggle */
.controls-toggle {
  position: absolute;
  top: 70px;
  right: 16px;
  z-index: 900;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e0e0e0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

/* Layer Controls */
.layer-controls {
  position: absolute;
  top: 120px;
  right: 16px;
  z-index: 900;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideIn 0.2s ease;
}

.layer-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.layer-toggle input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Bottom Sheet */
.bottom-sheet-mobile {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: translateY(calc(100% - 60px));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 70vh;
}

.bottom-sheet-mobile.open {
  transform: translateY(0);
}

.sheet-handle {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.sheet-handle::before {
  content: '';
  width: 40px;
  height: 4px;
  background: #d0d0d0;
  border-radius: 2px;
}

.sheet-content {
  padding: 0 20px 24px;
  overflow-y: auto;
  max-height: calc(70vh - 60px);
}

/* Duration Section */
.duration-section {
  margin-bottom: 20px;
}

.duration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.duration-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.duration-value {
  font-size: 16px;
  font-weight: 800;
  color: #000;
}

.duration-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.duration-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #000;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.duration-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #000;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Zone Info Card */
.zone-info-card {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.zone-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px}
.zone-info-name {
  font-size: 18px;
  font-weight: 800;
  color: #000;
}
.zone-info-note {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.zone-info-price {
  text-align: right;
}
.price-amount {
  font-size: 24px;
  font-weight: 800;
  color: #000;
  line-height: 1;
}
.price-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 4px;
}
.price-badge.free {
  background: #E7F7EE;
  color: #03C04A;
}
.price-badge.paid {
  background: #FEEAE8;
  color: #E11900;
}
/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.action-btn:active {
  opacity: 0.7;
}
.action-btn.primary {
  background: #000;
  color: #fff;
}
.action-btn.secondary {
  background: #fff;
  color: #000;
  border: 1.5px solid #e0e0e0;
}
/* Nearby Section */
.nearby-section {
  margin-top: 24px;
}
.nearby-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin: 0 0 12px;
}
.parking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.parking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f7f7;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.parking-item:active {
  background: #ebebeb;
}
.parking-info {
  flex: 1;
}
.parking-name {
  font-size: 15px;
  font-weight: 700;
  color: #000;
  margin-bottom: 2px;
}
.parking-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
}
.parking-operator::after {
  content: '·';
  margin-left: 8px;
}
.parking-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.parking-badge.free {
  background: #E7F7EE;
  color: #03C04A;
}
.parking-badge.paid {
  background: #FEEAE8;
  color: #E11900;
}

/*Services Section*/
.services-section {
  margin-top: 24px;
  margin-bottom: 24px;
}

.services-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin: 0 0 12px;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideDown {
  from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>