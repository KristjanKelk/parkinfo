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
  <div class="page home-page">
    <section class="card hero accent">
      <div class="hero__header">
        <h1 class="hero__title">{{ t('app.title') }}</h1>
        <p class="tagline">“{{ t('app.tagline') }}”</p>
      </div>
      <p class="hero__subtitle">{{ t('home.start.title') }}</p>
      <div class="row cta-row">
        <button class="btn" @click="useMyLocation">{{ t('home.useMyLocation') }}</button>
        <button class="btn outline" @click="pickOnMap">{{ t('home.pickOnMap') }}</button>
      </div>
      <p class="muted small">{{ t('home.privacy') }}</p>
    </section>

    <section class="card steps-card">
      <h3 class="card-title">{{ t('home.how.title') }}</h3>
      <ol class="steps-list">
        <li>{{ t('home.how.step1') }}</li>
        <li>{{ t('home.how.step2') }}</li>
        <li>{{ t('home.how.step3') }}</li>
      </ol>
    </section>
  </div>
</template>
