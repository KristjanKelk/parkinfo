<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchParkingById } from '../lib/overpass'
import { buildParkingInfo } from '../lib/parkingInfo'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const lotId = route.params.id
const lot = ref(null)
const info = ref({ lines: [] })
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    lot.value = await fetchParkingById(lotId)
    info.value = buildParkingInfo(lot.value)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})

function navigate() {
  if (!lot.value) return
  const { lat, lng } = lot.value
  const url = `https://www.google.com/maps?q=${lat},${lng}`
  window.open(url, '_blank')
}
</script>

<template>
  <div class="page">
    <div class="header">
      <button class="btn outline" @click="router.back()">{{ t('common.back') }}</button>
      <h2 style="margin:0;">{{ lot?.name || t('lot.defaultName') }}</h2>
      <div style="width:64px;"></div>
    </div>

    <div class="card">
      <template v-if="loading">
        <p>{{ t('common.loading') }}</p>
      </template>
      <template v-else-if="error">
        <p style="color:#b91c1c;">{{ error }}</p>
      </template>
      <template v-else>
        <p>{{ t('lot.pricesDisclaimer') }}</p>
        <ul style="padding-left:16px;">
          <li v-for="line in info.lines" :key="line.label">
            <strong>{{ line.label }}:</strong>
            <template v-if="line.href">
              <a :href="line.href" target="_blank" rel="noopener noreferrer">{{ line.value }}</a>
            </template>
            <template v-else>
              {{ line.value }}
            </template>
          </li>
        </ul>
        <div class="row">
          <button class="btn" @click="navigate">{{ t('lot.openNavigation') }}</button>
          <a v-if="info.lines.find(l => l.label==='Website')" class="btn outline"
             :href="info.lines.find(l => l.label==='Website').href" target="_blank" rel="noopener noreferrer">
            {{ t('common.openWebsite') || 'Open website' }}
          </a>
        </div>
      </template>
    </div>
  </div>
</template>
