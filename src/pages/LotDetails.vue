<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const lotName = route.query.name || t('lot.defaultName')
function navigate() {
  // Ava Apple/Google Maps
  // NB! Koordinaate ei tõmba uuesti – MVP: tagasi kaardile klikkima markerile
  alert(t('lot.navigate.alert'))
}
</script>

<template>
  <div class="page">
    <div class="header">
      <button class="btn outline" @click="router.back()">{{ t('common.back') }}</button>
      <h2 style="margin:0;">{{ lotName }}</h2>
      <div style="width:64px;"></div>
    </div>

    <div class="card">
      <p>{{ t('lot.pricesDisclaimer') }}</p>
      <div class="row">
        <button class="btn" @click="navigate">{{ t('lot.openNavigation') }}</button>
      </div>
    </div>
  </div>
</template>
