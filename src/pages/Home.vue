<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const router = useRouter()
const { t } = useI18n()
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
      <h1>{{ t('app.title') }}</h1>
      <span style="font-size:12px;color:#6b7280">“{{ t('app.tagline') }}”</span>
    </div>

    <div class="card">
      <p>{{ t('home.start.title') }}</p>
      <div class="row" style="margin-top:8px;">
        <button class="btn" @click="useMyLocation">{{ t('home.useMyLocation') }}</button>
        <button class="btn outline" @click="pickOnMap">{{ t('home.pickOnMap') }}</button>
      </div>
      <p style="font-size:12px;color:#6b7280;margin-top:6px;">{{ t('home.privacy') }}</p>
    </div>

    <div class="card">
      <h3>{{ t('home.how.title') }}</h3>
      <ol>
        <li>{{ t('home.how.step1') }}</li>
        <li>{{ t('home.how.step2') }}</li>
        <li>{{ t('home.how.step3') }}</li>
      </ol>
    </div>
  </div>
</template>
