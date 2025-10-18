<template>
  <div class="page home-page">
    <section class="hero">
      <h1 class="hero__title">{{ t('app.title') }}</h1>
      <p class="tagline">{{ t('app.tagline') }}</p>

      <div class="cta-row">
        <button class="btn" @click="useMyLocation">
          📍 {{ t('home.useMyLocation') }}
        </button>
        <button class="btn outline" @click="pickOnMap">
          🗺️ {{ t('home.pickOnMap') }}
        </button>
      </div>
    </section>

    <section class="card">
      <h3 class="card-title">{{ t('home.how.title') }}</h3>
      <ol class="steps-list">
        <li>{{ t('home.how.step1') }}</li>
        <li>{{ t('home.how.step2') }}</li>
        <li>{{ t('home.how.step3') }}</li>
      </ol>
    </section>

    <!-- NEW: All Parking Services -->
    <section class="card">
      <h3 class="card-title">
        {{ t('services.allTitle') || (locale === 'et' ? 'Kõik parkimisteenused' : 'All Parking Services') }}
      </h3>
      <ParkingProviders />
    </section>

    <p class="muted small" style="text-align: center;">{{ t('home.privacy') }}</p>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ParkingProviders from '../components/ParkingProviders.vue'

const router = useRouter()
const { t, locale } = useI18n()

function useMyLocation() {
  router.push({ path: '/map', query: { mode: 'current' } })
}

function pickOnMap() {
  router.push({ path: '/map', query: { mode: 'pick' } })
}
</script>