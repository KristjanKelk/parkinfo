<script setup>
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from './i18n'
import ToastHost from './components/ToastHost.vue'

const { locale } = useI18n()
watch(locale, (val) => setLocale(val))

function toggleLocale() {
  locale.value = locale.value === 'et' ? 'en' : 'et'
}
</script>

<template>
  <div>
    <!-- Uber-style minimal language toggle -->
    <button
        class="lang-toggle"
        @click="toggleLocale"
        :aria-label="locale === 'et' ? 'Switch to English' : 'Lülitu eesti keelele'"
    >
      <span class="flag">{{ locale === 'et' ? '🇪🇪' : '🇬🇧' }}</span>
      <span class="lang-text">{{ locale === 'et' ? 'ET' : 'EN' }}</span>
    </button>
    <router-view />
  </div>
  <ToastHost />
</template>

<style>
.lang-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lang-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.lang-toggle:active {
  transform: translateY(0);
}

.flag {
  font-size: 18px;
  line-height: 1;
}

.lang-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
</style>