<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'

const map = ref(null)
const mapEl = ref(null)

onMounted(() => {
  map.value = L.map(mapEl.value, { zoomControl: false }).setView([59.437, 24.7536], 14)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  L.control.zoom({ position: 'bottomright' }).addTo(map.value)
})
</script>

<template>
  <div class="map-container">
    <div ref="mapEl" style="height:100%; width:100%"></div>
  </div>

  <div class="bottom-sheet" role="dialog" aria-label="Parking details">
    <div class="sheet-handle" />
    <div class="sheet-content">
      <p>Bottom sheet placeholder: duration, estimate, hint, notify, navigate.</p>
    </div>
  </div>
</template>

<style scoped>
</style>

