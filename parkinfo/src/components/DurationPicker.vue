<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: { type: Number, default: 60 },
  min: { type: Number, default: 15 },
  max: { type: Number, default: 480 },
  step: { type: Number, default: 15 }
})
const emit = defineEmits(['update:modelValue'])
const value = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', Number(v))
})
</script>

<template>
  <label style="display:block; font-weight:600; margin-bottom:4px">Duration (min)</label>
  <input
    type="range"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    v-model="value"
    aria-label="Duration"
  />
  <div style="margin-top:4px">{{ value }} min</div>
  
</template>

<style scoped>
input[type="range"] { width: 100%; }
</style>

