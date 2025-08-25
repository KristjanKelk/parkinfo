<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
onMounted(() => {
  router.replace('/map')
})
</script>

<template>
  <div />
  
</template>

<style scoped>
</style>

