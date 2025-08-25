<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['select'])
const query = ref('')
const loading = ref(false)
const results = ref([])
const showList = ref(false)

async function search(q) {
  if (!q || q.length < 3) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=0&countrycodes=ee`
    const res = await fetch(url, { headers: { 'Accept-Language': 'et' } })
    const json = await res.json()
    results.value = json.map(r => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      display: r.display_name
    }))
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Otsing ebaõnnestus' } }))
  } finally {
    loading.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Enter') {
    // Pick first result after fetching if needed
    if (results.value.length > 0) {
      emit('select', results.value[0])
      showList.value = false
    } else {
      // trigger search then select first
      search(query.value).then(() => {
        if (results.value.length > 0) {
          emit('select', results.value[0])
          showList.value = false
        }
      })
    }
  }
}

watch(query, (q) => {
  showList.value = true
  search(q)
})

function selectItem(item) {
  emit('select', item)
  showList.value = false
}
</script>

<template>
  <div class="control-box" style="position:relative;">
    <input class="search-input" :aria-label="'Otsi aadressi'" v-model="query" @keydown="onKeydown" placeholder="Otsi aadressi..." />
    <div v-if="loading" style="position:absolute; right:14px; top:12px; font-size:12px; color:#6b7280;">…</div>
    <div v-if="showList && results.length" style="position:absolute; top:46px; left:0; right:0; background:#fff; border:1px solid #e5e7eb; border-radius:10px; max-height:240px; overflow:auto; z-index:1001;">
      <div v-for="r in results" :key="r.display" @click="selectItem(r)" style="padding:8px 10px; cursor:pointer;">
        {{ r.display }}
      </div>
    </div>
  </div>
  
</template>

