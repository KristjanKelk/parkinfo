<script setup>
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from './i18n'
import ToastHost from './components/ToastHost.vue'

const { locale, t } = useI18n()
watch(locale, (val) => setLocale(val))
</script>

<template>
  <div>
    <div style="position:fixed; top:10px; right:10px; z-index:1200; background:#ffffffcc; backdrop-filter: blur(6px); border:1px solid #e5e7eb; border-radius:8px; padding:4px 8px; display:flex; gap:6px; align-items:center;">
      <label for="lang-select" style="font-size:12px; color:#374151;">{{ t('app.language') }}</label>
      <select id="lang-select" v-model="locale" style="font-size:12px; padding:4px 6px; border:1px solid #e5e7eb; border-radius:6px; background:#fff;">
        <option value="et">{{ t('app.lang.et') }}</option>
        <option value="en">{{ t('app.lang.en') }}</option>
      </select>
    </div>
    <router-view />
  </div>
  <ToastHost />
</template>
