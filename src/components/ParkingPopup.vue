<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  parking: { type: Object, required: true },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'navigate'])

const { t } = useI18n()

const displayInfo = computed(() => {
  const p = props.parking
  const tags = p.rawTags || {}

  return {
    name: p.name || t('lot.defaultName'),
    operator: p.operator,
    capacity: p.capacity,
    fee: p.feeTag,
    charge: p.charge,
    openingHours: p.openingHours || tags.opening_hours,
    maxheight: p.maxheight || tags.maxheight,
    maxstay: p.maxstay || tags.maxstay,
    surface: p.surface || tags.surface,
    access: p.access || tags.access,
    phone: p.phone || tags.phone || tags['contact:phone'],
    website: p.website || tags.website || tags['contact:website'],
    email: p.email || tags.email || tags['contact:email'],
    payment: p.payment || Object.keys(tags)
        .filter(k => k.startsWith('payment:') && tags[k] === 'yes')
        .map(k => k.replace('payment:', ''))
  }
})
</script>

<template>
  <div class="parking-popup-overlay" @click="emit('close')">
    <div class="parking-popup" @click.stop>
      <button class="popup-close" @click="emit('close')" :aria-label="t('common.close')">✕</button>

      <div v-if="loading" class="popup-loading">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>

      <div v-else class="popup-content">
        <!-- Header -->
        <div class="popup-header">
          <div>
            <h3 class="popup-title">{{ displayInfo.name }}</h3>
            <p v-if="displayInfo.operator" class="popup-operator">{{ displayInfo.operator }}</p>
          </div>
          <div v-if="displayInfo.capacity" class="capacity-badge-popup">
            <div class="capacity-number-popup">{{ displayInfo.capacity }}</div>
            <div class="capacity-label-popup">{{ t('map.lot.capacityKnown', { count: '' }) }}</div>
          </div>
        </div>

        <!-- Quick Info Grid -->
        <div class="info-grid">
          <div v-if="displayInfo.fee" class="info-item-popup">
            <span class="info-icon-popup">💰</span>
            <div>
              <div class="info-label-popup">{{ t('parking.fee') }}</div>
              <div class="info-value-popup">
                <span class="badge" :class="displayInfo.fee === 'no' ? 'green' : 'red'">
                  {{ displayInfo.fee === 'no' ? t('map.lot.fee.free') : t('map.lot.fee.paid') }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="displayInfo.charge" class="info-item-popup">
            <span class="info-icon-popup">💵</span>
            <div>
              <div class="info-label-popup">{{ t('parking.charge') }}</div>
              <div class="info-value-popup strong">{{ displayInfo.charge }}</div>
            </div>
          </div>

          <div v-if="displayInfo.openingHours" class="info-item-popup">
            <span class="info-icon-popup">🕐</span>
            <div>
              <div class="info-label-popup">{{ t('parking.hours') }}</div>
              <div class="info-value-popup">{{ displayInfo.openingHours }}</div>
            </div>
          </div>

          <div v-if="displayInfo.maxheight" class="info-item-popup">
            <span class="info-icon-popup">📏</span>
            <div>
              <div class="info-label-popup">{{ t('parking.maxHeight') }}</div>
              <div class="info-value-popup">{{ displayInfo.maxheight }}</div>
            </div>
          </div>

          <div v-if="displayInfo.maxstay" class="info-item-popup">
            <span class="info-icon-popup">⏱️</span>
            <div>
              <div class="info-label-popup">{{ t('parking.maxStay') }}</div>
              <div class="info-value-popup">{{ displayInfo.maxstay }}</div>
            </div>
          </div>

          <div v-if="displayInfo.surface" class="info-item-popup">
            <span class="info-icon-popup">🛣️</span>
            <div>
              <div class="info-label-popup">{{ t('parking.surface') }}</div>
              <div class="info-value-popup">{{ displayInfo.surface }}</div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div v-if="displayInfo.payment && displayInfo.payment.length" class="payment-methods-popup">
          <div class="info-label-popup">{{ t('payment.methods') }}</div>
          <div class="payment-tags">
            <span v-for="method in displayInfo.payment" :key="method" class="payment-tag">
              {{ method }}
            </span>
          </div>
        </div>

        <!-- Contact Info -->
        <div v-if="displayInfo.phone || displayInfo.website || displayInfo.email" class="contact-section-popup">
          <div class="contact-buttons">
            <a v-if="displayInfo.phone" :href="`tel:${displayInfo.phone}`" class="contact-btn">
              <span>📞</span>
              <span>{{ t('lot.call') }}</span>
            </a>
            <a v-if="displayInfo.website" :href="displayInfo.website" target="_blank" rel="noopener noreferrer" class="contact-btn">
              <span>🌐</span>
              <span>{{ t('lot.website') }}</span>
            </a>
            <a v-if="displayInfo.email" :href="`mailto:${displayInfo.email}`" class="contact-btn">
              <span>📧</span>
              <span>{{ t('lot.email') }}</span>
            </a>
          </div>
        </div>

        <!-- Actions -->
        <div class="popup-actions">
          <button class="btn btn-large" @click="emit('navigate')">
            <span style="margin-right:8px;">📍</span>
            {{ t('parking.viewDetails') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parking-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2500;
  padding: 0;
}

.parking-popup {
  background: white;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  z-index: 10;
}

.popup-close:hover {
  background: rgba(0, 0, 0, 0.15);
  color: #0f172a;
}

.popup-loading {
  padding: 60px 24px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.popup-content {
  padding: 24px;
  padding-top: 32px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 24px;
  gap: 16px;
}

.popup-title {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.popup-operator {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.capacity-badge-popup {
  text-align: right;
  flex-shrink: 0;
}

.capacity-number-popup {
  font-size: 28px;
  font-weight: 800;
  color: #10b981;
  line-height: 1;
}

.capacity-label-popup {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-item-popup {
  display: flex;
  align-items: start;
  gap: 10px;
  padding: 12px;
  background: rgba(148, 163, 184, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.info-icon-popup {
  font-size: 20px;
  flex-shrink: 0;
}

.info-label-popup {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 4px;
}

.info-value-popup {
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
}

.info-value-popup.strong {
  font-weight: 700;
  font-size: 16px;
  color: #1d4ed8;
}

.payment-methods-popup {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(147, 51, 234, 0.04));
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.payment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.payment-tag {
  background: white;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.contact-section-popup {
  margin-bottom: 20px;
}

.contact-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.contact-btn {
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
  flex: 1;
  min-width: 120px;
  justify-content: center;
}

.contact-btn:hover {
  border-color: #3b82f6;
  color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.contact-btn span:first-child {
  font-size: 18px;
}

.popup-actions {
  margin-top: 16px;
}

.btn-large {
  width: 100%;
  padding: 16px;
  font-size: 16px;
}

@media (max-width: 720px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .contact-buttons {
    flex-direction: column;
  }

  .contact-btn {
    width: 100%;
  }
}
</style>