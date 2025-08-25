<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function useMyLocation() {
  router.push({ path: '/map', query: { mode: 'current' } })
}
function pickOnMap() {
  router.push({ path: '/map', query: { mode: 'pick' } })
}
</script>

<template>
  <div class="page">
    <div class="header">
      <h1>Parkinfo</h1>
      <span style="font-size:12px;color:#6b7280">“Leia lähim & odavaim parkimine”</span>
    </div>

    <div class="card">
      <p>Vali, kuidas alustada:</p>
      <div class="row" style="margin-top:8px;">
        <button class="btn" @click="useMyLocation">Kasuta minu asukohta</button>
        <button class="btn outline" @click="pickOnMap">Vali sihtkoht kaardilt</button>
      </div>
      <p style="font-size:12px;color:#6b7280;margin-top:6px;">
        Me ei kogu sinu asukohalugu; luba kasutatakse vaid hetke leidmiseks.
      </p>
    </div>

    <div class="card">
      <h3>Kuidas see töötab?</h3>
      <ol>
        <li>Vali asukoht</li>
        <li>Näed lähedal parklate hindu & tasulisaegu</li>
        <li>Vali kestus → prognoosime summa</li>
      </ol>
    </div>
  </div>
</template>
