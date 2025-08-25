<script setup>
import { onMounted, ref, computed } from 'vue'
import L from 'leaflet'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { getBrowserLocation } from '../lib/geo'
import { fetchParkingsAround } from '../lib/overpass'
import { fetchTallinnZonesGeoJSON } from '../lib/tallinnZonesGeo'
import { ZONE_RULES } from '../data/tallinnZones'
import DurationPicker from '../components/DurationPicker.vue'
import * as turf from '@turf/turf'
import { estimateCost, zonePaidNow } from '../lib/tariff'  // kasutame sama arvutusloogikat

const route = useRoute()
const router = useRouter()
const mapDiv = ref(null)
let map, marker, zonesLayer, cityPointsLayer, lotsLayer

const pos = ref(null)

const lots = ref([])
const duration = ref(60)
const zonesGeo = ref(null)     // GeoJSON
const activeZoneKey = ref(null) // 'KESKLINN' | 'SÜDALINN' | 'VANALINN' | 'PIRITA' | null

import { fetchTallinnParkingPoints } from '../lib/tallinnParkingPlaces'

async function loadCityParkingPoints() {
  const fc = await fetchTallinnParkingPoints()
  cityPointsLayer.clearLayers()
  L.geoJSON(fc, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 3 })
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
  zonesGeo.value = await fetchTallinnZonesGeoJSON()
  drawZones(zonesGeo.value)

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
    }
  }
}

function drawZones(fc) {
  zonesLayer.clearLayers()
  L.geoJSON(fc, {
    style: { color: '#2563eb', weight: 1, fillOpacity: 0.05 }
  }).addTo(zonesLayer)
}

function setPosition(latlng) {
  pos.value = latlng
  map.setView(latlng, 16)
  if (marker) marker.remove()
  marker = L.marker(latlng).addTo(map).bindPopup('Sinu sihtkoht').openPopup()
}

async function loadLots() {
  lots.value = await fetchParkingsAround(pos.value.lat, pos.value.lng, 800)
  lotsLayer.clearLayers()
  lots.value.forEach(p => {
    L.circleMarker([p.lat, p.lng], { radius: 6 })
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

function goDetail(lot) {
  router.push({ path: `/lot/${encodeURIComponent(lot.id)}`, query: { name: lot.name } })
}
</script>

<template>
  <div style="height: 100vh; display:flex; flex-direction:column;">
    <div class="header" style="padding:8px 12px;">
      <button class="btn outline" @click="$router.push('/')">← Tagasi</button>
      <h2 style="margin:0;">Kaart</h2>
      <div style="width:64px;"></div>
    </div>

    <div style="flex:1;">
      <div ref="mapDiv" style="height:100%;"></div>
    </div>

    <div class="page" style="padding-bottom:12px;">
      <DurationPicker v-model="duration" />

      <div class="card" v-if="bestZone">
        <div class="row" style="justify-content:space-between;">
          <div>
            <strong>{{ bestZone.precise ? 'Tsoon' : 'Odavaim eelduslik tsoon' }}:</strong>
            {{ bestZone.zone.key }}
            <div v-if="!bestZone.precise" style="font-size:12px;color:#6b7280">
              Eelduslik – kinnita märgistuse järgi
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:700">{{ bestZone.cost.toFixed(2) }} €</div>
            <span class="badge" :class="bestZone.paidNow ? 'red' : 'green'">
              {{ bestZone.paidNow ? 'Tasuline nüüd' : 'Praegu tasuta' }}
            </span>
          </div>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:6px;">
          * Tsoonireeglid: Tallinna ametlik info (24/7 Vanalinn/Südalinn; Kesklinn tööpäevadel/poollaupäeval; Pirita hooajaliselt; 15 min tasuta).
        </div>
      </div>

      <div>
        <h3 style="margin:8px 0;">Lähimad parklad (OSM)</h3>
        <div v-for="lot in lots" :key="lot.id" class="card" @click="goDetail(lot)" style="cursor:pointer;">
          <div class="row" style="justify-content:space-between;">
            <div>
              <strong>{{ lot.name }}</strong>
              <div style="font-size:12px;color:#6b7280;">
                {{ lot.operator ? lot.operator + ' · ' : '' }}
                {{ lot.capacity ? (lot.capacity + ' kohta') : 'mahutavus: ?' }}
              </div>
            </div>
            <div>
              <span class="badge" :class="lot.feeTag === 'no' ? 'green' : (lot.feeTag === 'yes' ? 'red' : 'gray')">
                {{ lot.feeTag === 'no' ? 'Tasuta' : (lot.feeTag === 'yes' ? 'Tasuline' : 'Tundmatu') }}
              </span>
            </div>
          </div>
        </div>
        <p style="font-size:12px;color:#6b7280;">Eraoperaatorite hinnad võivad erineda – kontrolli kohapeal.</p>
      </div>
    </div>
  </div>
</template>
