<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
const queue = ref([])

function onToast(ev) {
  const { message } = ev.detail || {}
  if (!message) return
  const id = Date.now() + Math.random()
  queue.value.push({ id, message })
  setTimeout(() => dismiss(id), 3000)
}

function dismiss(id) {
  queue.value = queue.value.filter(t => t.id !== id)
}

onMounted(() => window.addEventListener('toast', onToast))
onBeforeUnmount(() => window.removeEventListener('toast', onToast))
</script>

<template>
  <div style="position:fixed; left:0; right:0; bottom:16px; display:flex; flex-direction:column; gap:8px; align-items:center; z-index:2000; pointer-events:none;">
    <div v-for="t in queue" :key="t.id" style="pointer-events:auto; background:#111827; color:#fff; padding:10px 12px; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,.2); max-width:90vw;">
      {{ t.message }}
    </div>
  </div>
</template>

