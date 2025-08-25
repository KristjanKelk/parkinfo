<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div style="padding:12px">
    <h2>Lot {{ route.params.id }}</h2>
    <p>Details TBD</p>
  </div>
</template>

<style scoped>
</style>

