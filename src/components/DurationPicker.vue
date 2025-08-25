<script setup>
import { ref, watch, computed } from 'vue'
const props = defineProps({ modelValue: { type: Number, default: 60 } })
const emit = defineEmits(['update:modelValue'])
const local = ref(props.modelValue)
watch(() => props.modelValue, v => (local.value = v))
watch(local, v => emit('update:modelValue', v))
const label = computed(() => {
  const h = Math.floor(local.value/60), m = local.value%60
  return h ? `${h} h ${m || ''}`.trim() : `${m} min`
})
</script>

<template>
  <div class="card">
    <label style="display:block;margin-bottom:8px;">Kui kaua parkida?</label>
    <input type="range" min="15" max="480" step="15" v-model.number="local" style="width:100%;" />
    <div style="margin-top:6px;">Kestus: <strong>{{ label }}</strong></div>
  </div>
</template>
