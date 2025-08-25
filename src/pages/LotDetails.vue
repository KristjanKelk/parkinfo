<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const lotName = route.query.name || 'Parkla'
function navigate() {
  // Ava Apple/Google Maps
  // NB! Koordinaate ei tõmba uuesti – MVP: tagasi kaardile klikkima markerile
  alert('Navigeerimiseks vali kaardil marker (MVP). V2-s lisame otse-lingi.')
}
</script>

<template>
  <div class="page">
    <div class="header">
      <button class="btn outline" @click="router.back()">← Tagasi</button>
      <h2 style="margin:0;">{{ lotName }}</h2>
      <div style="width:64px;"></div>
    </div>

    <div class="card">
      <p>Eraoperaatorite hinnad võivad olla muutuvad. Kontrolli kohapeal märgistust või operaatori kodulehte.</p>
      <div class="row">
        <button class="btn" @click="navigate">Ava navigeerimine</button>
      </div>
    </div>
  </div>
</template>
