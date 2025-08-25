<script setup>
import { onMounted, ref, computed } from 'vue'
import L from 'leaflet'
import { useRoute, useRouter } from 'vue-router'
import { getBrowserLocation } from '../lib/geo'
import { fetchParkingsAround } from '../lib/overpass'
import { TALLINN_ZONES } from '../data/tallinnZones'
import { estimateCost, zonePaidNow } from '../lib/tariff'
import DurationPicker from '../components/DurationPicker.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const mapDiv = ref(null)
let map, marker
const pos = ref(null)
const lots = ref([])
const duration = ref(60) // min

const zones = TALLINN_ZONES

async function initMap() {
  map = L.map(mapDiv.value, { zoomControl: true })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OSM'
  }).addTo(map)

  if (route.query.mode === 'pick') {
    // keskenda Tallinna peale, lase kasutajal puudutada
    const tallinn = { lat: 59.437, lng: 24.7536 }
    map.setView(tallinn, 14)
    map.on('click', async (e) => {
      setPosition(e.latlng)
      await loadLots()
    })
  } else {
    try {
      const loc = await getBrowserLocation()
      setPosition(loc)
      await loadLots()
    } catch (e) {
      // fallback: Tallinn center
      setPosition({ lat: 59.437, lng: 24.7536 })
      await loadLots()
    }
  }
}

function setPosition(latlng) {
  pos.value = latlng
  map.setView(latlng, 16)
  if (marker) marker.remove()
  marker = L.marker(latlng).addTo(map).bindPopup('Sinu sihtkoht').openPopup()
}

async function loadLots() {
  lots.value = await fetchParkingsAround(pos.value.lat, pos.value.lng, 800)
  lots.value.forEach(p => {
    L.circleMarker([p.lat, p.lng], { radius: 6 }).addTo(map).bindPopup(p.name)
  })
}

const now = dayjs()
const bestZone = computed(() => {
  // MVP: kui me ei tea täpset tsooni polügooni, näitame tsoonide reegleid ja kalkuleerime parima hinna
  // Kasutajale kuvame selgelt: "Tsoon eelduslik – kinnita kohapeal märgistuse järgi."
  // Valime madalaima hinna, mis on hetkel tasuline; kui tasuta, siis €0.
  const estimates = zones.map(z => ({
    zone: z,
    paidNow: zonePaidNow(z.key, now),
    cost: estimateCost(z, duration.value, now)
  }))
  // Sorteeri hinna järgi
  return estimates.sort((a,b) => a.cost - b.cost)[0]
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
            <strong>Odavaim eelduslik tsoon:</strong> {{ bestZone.zone.key }}
            <div style="font-size:12px;color:#6b7280">Eelduslik – kinnita märgistuse järgi</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:700">{{ bestZone.cost.toFixed(2) }} €</div>
            <span class="badge" :class="bestZone.paidNow ? 'red' : 'green'">
              {{ bestZone.paidNow ? 'Tasuline nüüd' : 'Praegu tasuta' }}
            </span>
          </div>
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
