<script setup>
import { ref } from 'vue'

const toasts = ref([])

function pushToast(message) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 4000)
}

defineExpose({ pushToast })
</script>

<template>
  <div style="position:fixed; bottom: 64px; left: 0; right: 0; display:flex; flex-direction:column; align-items:center; gap:8px; z-index:1000;">
    <div v-for="t in toasts" :key="t.id" style="background:#111827; border:1px solid rgba(255,255,255,.08); padding:10px 12px; border-radius:10px; max-width:90%; color:#e5e7eb;">
      {{ t.message }}
    </div>
  </div>
</template>

<style scoped>
</style>

