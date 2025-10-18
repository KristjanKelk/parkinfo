<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchParkingById } from '../lib/overpass'
import { buildParkingInfo } from '../lib/parkingInfo'
import ParkingProviders from "../components/ParkingProviders.vue";

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const lotId = route.params.id
const lot = ref(null)
const info = ref({ lines: [] })
const loading = ref(true)
const error = ref(null)
const plateNumber = ref('')

// Detect known payment operators and their info
const paymentInfo = computed(() => {
  if (!lot.value) return null

  const operator = lot.value.operator?.toLowerCase() || ''
  const tags = lot.value.rawTags || {}

  // Check for common Estonian parking operators
  const operatorData = {
    europark: {
      name: 'Europark',
      sms: { number: '1902', format: 'PARK {plate} {zone}' },
      app: {
        name: 'Europark',
        ios: 'https://apps.apple.com/ee/app/europark/id444114813',
        android: 'https://play.google.com/store/apps/details?id=ee.europark.android'
      }
    },
    'q-park': {
      name: 'Q-Park',
      sms: { number: '1510', format: 'QPARK {plate}' },
      app: {
        name: 'Q-Park',
        ios: 'https://apps.apple.com/app/q-park/id566695062',
        android: 'https://play.google.com/store/apps/details?id=com.qpark.mobile'
      }
    },
    parkman: {
      name: 'Parkman',
      app: {
        name: 'Parkman',
        ios: 'https://apps.apple.com/app/parkman/id444753650',
        android: 'https://play.google.com/store/apps/details?id=com.parkman.mobile'
      }
    }
  }

  // Find matching operator
  for (const [key, data] of Object.entries(operatorData)) {
    if (operator.includes(key)) {
      return data
    }
  }

  // Check for generic payment methods in tags
  const hasApp = tags['payment:app'] === 'yes' || tags['payment:mobile_app'] === 'yes'
  const hasSMS = tags['payment:sms'] === 'yes'

  if (hasApp || hasSMS) {
    return {
      name: lot.value.operator || 'Operator',
      generic: true,
      hasApp,
      hasSMS
    }
  }

  return null
})

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
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank')
}

function openSMS(smsData) {
  if (!smsData) return
  const zone = lot.value.rawTags?.ref || lot.value.rawTags?.zone || 'ZONE'
  const message = smsData.format
      .replace('{plate}', plateNumber.value || 'ABC123')
      .replace('{zone}', zone)
  window.location.href = `sms:${smsData.number}?body=${encodeURIComponent(message)}`
}
</script>

<template>
  <div class="page details-page">
    <div class="header detail-header">
      <button class="btn outline" @click="router.back()">{{ t('common.back') }}</button>
      <h2 class="detail-title">{{ lot?.name || t('lot.defaultName') }}</h2>
      <div class="header-spacer" aria-hidden="true"></div>
    </div>

    <template v-if="loading">
      <div class="card">
        <p>{{ t('common.loading') || 'Loading...' }}</p>
      </div>
    </template>

    <template v-else-if="error">
      <div class="card">
        <p class="error-text">{{ error }}</p>
      </div>
    </template>

    <template v-else>
      <!-- Main Info Card -->
      <div class="card detail-card">
        <div class="lot-header">
          <div>
            <h3 class="lot-name">{{ lot.name }}</h3>
            <p v-if="lot.operator" class="muted">{{ lot.operator }}</p>
          </div>
          <div v-if="lot.capacity" class="capacity-badge">
            <div class="capacity-number">{{ lot.capacity }}</div>
            <div class="capacity-label">{{ t('map.lot.capacityKnown', { count: '' }) || 'spaces' }}</div>
          </div>
        </div>

        <div v-if="lot.charge" class="price-highlight">
          <div class="price-label">{{ t('map.lot.charge', { amount: '' }) || 'Tariff' }}</div>
          <div class="price-value">{{ lot.charge }}</div>
        </div>

        <div class="info-grid-compact">
          <div v-if="lot.openingHours" class="info-compact">
            <span class="info-icon">🕐</span>
            <span>{{ lot.openingHours }}</span>
          </div>
          <div v-if="lot.maxheight" class="info-compact">
            <span class="info-icon">📏</span>
            <span>{{ t('lot.maxheight') || 'Max height' }}: {{ lot.maxheight }}</span>
          </div>
          <div v-if="lot.feeTag" class="info-compact">
            <span class="info-icon">💰</span>
            <span class="badge" :class="lot.feeTag === 'no' ? 'green' : 'red'">
              {{ lot.feeTag === 'no' ? t('map.lot.fee.free') : t('map.lot.fee.paid') }}
            </span>
          </div>
        </div>

        <p class="muted small">{{ t('lot.pricesDisclaimer') }}</p>
      </div>

      <!-- Payment Methods -->
      <div v-if="paymentInfo" class="card payment-section">
        <h3 class="card-title">{{ t('payment.methods') || 'Payment Methods' }}</h3>

        <!-- SMS Payment -->
        <div v-if="paymentInfo.sms" class="payment-card sms-card">
          <div class="payment-header">
            <span class="payment-icon">💬</span>
            <h4>{{ t('payment.sms') || 'SMS Parking' }}</h4>
          </div>

          <div class="sms-info">
            <div class="info-row">
              <span class="label">{{ t('payment.sms.number') || 'Send to' }}:</span>
              <span class="value large">{{ paymentInfo.sms.number }}</span>
            </div>

            <div class="input-group">
              <label for="plate-input">{{ t('payment.plate') || 'Your plate number' }}:</label>
              <input
                  id="plate-input"
                  type="text"
                  v-model="plateNumber"
                  :placeholder="t('payment.plate.placeholder') || 'ABC123'"
                  class="plate-input"
                  maxlength="10"
              />
            </div>

            <div class="sms-preview">
              <span class="label">{{ t('payment.sms.preview') || 'Message preview' }}:</span>
              <code class="sms-format">
                {{ paymentInfo.sms.format
                  .replace('{plate}', plateNumber || 'ABC123')
                  .replace('{zone}', lot.rawTags?.ref || lot.rawTags?.zone || 'ZONE') }}
              </code>
            </div>

            <button
                @click="openSMS(paymentInfo.sms)"
                class="btn btn-large"
                :disabled="!plateNumber"
            >
              <span style="margin-right: 8px;">💬</span>
              {{ t('payment.sms.open') || 'Open SMS App' }}
            </button>
          </div>
        </div>

        <!-- App Payment -->
        <div v-if="paymentInfo.app" class="payment-card app-card">
          <div class="payment-header">
            <span class="payment-icon">📱</span>
            <h4>{{ paymentInfo.app.name }} {{ t('payment.app') || 'App' }}</h4>
          </div>

          <div class="app-buttons">
            <a
                v-if="paymentInfo.app.ios"
                :href="paymentInfo.app.ios"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-app"
            >
              <span class="app-icon">🍎</span>
              <div class="app-text">
                <div class="app-label">{{ t('payment.app.download') || 'Download on' }}</div>
                <div class="app-name">App Store</div>
              </div>
            </a>

            <a
                v-if="paymentInfo.app.android"
                :href="paymentInfo.app.android"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-app"
            >
              <span class="app-icon">📱</span>
              <div class="app-text">
                <div class="app-label">{{ t('payment.app.get') || 'Get it on' }}</div>
                <div class="app-name">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        <!-- Generic payment info -->
        <div v-if="paymentInfo.generic" class="payment-note">
          <p class="muted small">
            <template v-if="paymentInfo.hasApp">📱 {{ t('payment.app.available') || 'Mobile app payment available' }}</template>
            <template v-if="paymentInfo.hasApp && paymentInfo.hasSMS"> · </template>
            <template v-if="paymentInfo.hasSMS">💬 {{ t('payment.sms.available') || 'SMS payment available' }}</template>
          </p>
        </div>
      </div>

      <div class="card services-card">
        <h3 class="card-title">
          {{ t('services.available') || (locale === 'et' ? 'Saadaolevad parkimisteenused' : 'Available Parking Services') }}
        </h3>
        <ParkingProviders />
      </div>

      <!-- Contact & Additional Info -->
      <div class="card contact-card">
        <h3 class="card-title">{{ t('lot.contact') || 'Contact & Info' }}</h3>

        <ul class="info-list">
          <li v-for="line in info.lines" :key="line.label" class="info-item">
            <span class="info-label">{{ line.label }}:</span>
            <span class="info-value">
              <a v-if="line.href" :href="line.href" target="_blank" rel="noopener noreferrer">
                {{ line.value }}
              </a>
              <span v-else>{{ line.value }}</span>
            </span>
          </li>
        </ul>

        <div class="contact-actions">
          <a v-if="lot.phone" :href="`tel:${lot.phone}`" class="btn-contact">
            <span>📞</span>
            {{ t('lot.call') || 'Call' }}
          </a>
          <a v-if="lot.website" :href="lot.website" target="_blank" rel="noopener noreferrer" class="btn-contact">
            <span>🌐</span>
            {{ t('lot.website') || 'Website' }}
          </a>
          <a v-if="lot.email" :href="`mailto:${lot.email}`" class="btn-contact">
            <span>📧</span>
            {{ t('lot.email') || 'Email' }}
          </a>
        </div>
      </div>

      <!-- Navigation -->
      <div class="card">
        <button class="btn btn-large" @click="navigate">
          <span style="margin-right: 8px;">🧭</span>
          {{ t('lot.openNavigation') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lot-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 20px;
}

.lot-name {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 700;
}

.capacity-badge {
  text-align: right;
}

.capacity-number {
  font-size: 28px;
  font-weight: 800;
  color: #10b981;
  line-height: 1;
}

.capacity-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.price-highlight {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.08));
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.price-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.price-value {
  font-size: 24px;
  font-weight: 800;
  color: #1d4ed8;
}

.info-grid-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.info-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 8px;
  font-size: 13px;
}

.info-icon {
  font-size: 16px;
}

.payment-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-card {
  padding: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.03));
  border: 2px solid rgba(59, 130, 246, 0.15);
  border-radius: 16px;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.payment-header h4 {
  margin: 0;
  font-size: 18px;
  color: #1d4ed8;
}

.payment-icon {
  font-size: 24px;
}

.sms-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.value.large {
  font-size: 24px;
  font-weight: 800;
  color: #1d4ed8;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.plate-input {
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  background: white;
  transition: border-color 0.2s;
}

.plate-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sms-preview {
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.sms-format {
  display: block;
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  color: #1e40af;
  word-break: break-all;
}

.btn-large {
  width: 100%;
  padding: 16px;
  font-size: 16px;
}

.btn-large:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-app {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: #0f172a;
  transition: all 0.2s ease;
}

.btn-app:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.15);
}

.app-icon {
  font-size: 36px;
}

.app-text {
  text-align: left;
}

.app-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  margin-top: 2px;
}

.payment-note {
  padding: 12px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 10px;
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.btn-contact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-contact:hover {
  border-color: #3b82f6;
  color: #1d4ed8;
  transform: translateY(-1px);
}

.btn-contact span {
  font-size: 18px;
}
</style>