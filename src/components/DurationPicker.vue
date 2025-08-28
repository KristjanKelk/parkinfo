<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ modelValue: { type: Number, default: 60 } })
const emit = defineEmits(['update:modelValue'])
const local = ref(props.modelValue)
watch(() => props.modelValue, v => (local.value = v))
watch(local, v => emit('update:modelValue', v))
const { t } = useI18n()
const label = computed(() => {
  const h = Math.floor(local.value/60), m = local.value%60
  return h ? `${h} ${t('duration.h')} ${m || ''}`.trim() : `${m} ${t('duration.min')}`
})
</script>

<template>
  <div class="card">
    <label style="display:block;margin-bottom:8px;">{{ t('duration.label') }}</label>
    <input type="range" min="15" max="480" step="15" v-model.number="local" style="width:100%;" />
    <div style="margin-top:6px;">{{ t('duration.valuePrefix') }} <strong>{{ label }}</strong></div>
  </div>
</template>
