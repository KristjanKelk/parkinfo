<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAllProviders, getProvidersForZone } from '../lib/parkingProviders'

const props = defineProps({
  zone: { type: String, default: null },
  compact: { type: Boolean, default: false }
})

const { locale } = useI18n()

const providers = computed(() => {
  if (props.zone) {
    return getProvidersForZone(props.zone)
  }
  return getAllProviders()
})

const getDescription = (provider) => {
  return provider.description[locale.value] || provider.description.en
}
</script>

<template>
  <div class="providers-container" :class="{ compact }">
    <div v-for="provider in providers" :key="provider.key" class="provider-card">
      <div class="provider-header">
        <div class="provider-logo" :style="{ background: provider.color }">
          {{ provider.logo }}
        </div>
        <div class="provider-info">
          <div class="provider-name">{{ provider.name }}</div>
          <div class="provider-desc">{{ getDescription(provider) }}</div>
        </div>
      </div>

      <div class="provider-actions">
        <!-- App Links -->
        <div v-if="provider.app" class="provider-apps">
          <a
              v-if="provider.app.ios"
              :href="provider.app.ios"
              target="_blank"
              rel="noopener noreferrer"
              class="app-link ios"
          >
            <span class="app-icon">🍎</span>
            <span class="app-text">App Store</span>
          </a>
          <a
              v-if="provider.app.android"
              :href="provider.app.android"
              target="_blank"
              rel="noopener noreferrer"
              class="app-link android"
          >
            <span class="app-icon">📱</span>
            <span class="app-text">Google Play</span>
          </a>
        </div>

        <!-- SMS Info -->
        <div v-if="provider.sms && !compact" class="provider-sms">
          <div class="sms-label">💬 SMS: {{ provider.sms.number }}</div>
          <div class="sms-format">{{ provider.sms.format }}</div>
        </div>

        <!-- Website -->
        <a
            v-if="provider.web"
            :href="provider.web"
            target="_blank"
            rel="noopener noreferrer"
            class="provider-web"
        >
          🌐 {{ locale === 'et' ? 'Koduleht' : 'Website' }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.providers-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.providers-container.compact .provider-card {
  padding: 12px;
}

.provider-card {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.provider-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.provider-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.provider-info {
  flex: 1;
}

.provider-name {
  font-size: 16px;
  font-weight: 800;
  color: #000;
  margin-bottom: 2px;
}

.provider-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.provider-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.provider-apps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.app-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.app-link:active {
  transform: scale(0.98);
  background: #f7f7f7;
}

.app-link.ios {
  border-color: #007AFF;
}

.app-link.android {
  border-color: #3DDC84;
}

.app-icon {
  font-size: 18px;
}

.app-text {
  font-size: 12px;
}

.provider-sms {
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  border: 1.5px dashed #d0d0d0;
}

.sms-label {
  font-size: 13px;
  font-weight: 700;
  color: #000;
  margin-bottom: 4px;
}

.sms-format {
  font-size: 11px;
  color: #666;
  font-family: monospace;
  background: #f7f7f7;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.provider-web {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.provider-web:active {
  transform: scale(0.98);
  background: #f7f7f7;
}

@media (max-width: 480px) {
  .provider-apps {
    grid-template-columns: 1fr;
  }
}
</style>