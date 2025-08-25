<script setup>
import { ref } from 'vue'

const query = ref('')
const emit = defineEmits(['search'])

function onSubmit() {
  if (!query.value) return
  emit('search', query.value)
}
</script>

<template>
  <form @submit.prevent="onSubmit" aria-label="Search address">
    <input
      v-model="query"
      type="text"
      placeholder="Search address..."
      aria-label="Search"
      style="width: 220px; height: 44px; border-radius: 12px; padding: 0 12px; border:1px solid rgba(255,255,255,.1); background:#0f172a; color:#e5e7eb;"
    />
  </form>
</template>

<style scoped>
</style>

