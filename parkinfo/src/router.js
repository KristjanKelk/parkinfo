import { createRouter, createWebHistory } from 'vue-router'

import Home from './pages/Home.vue'
import MapView from './pages/MapView.vue'
import LotDetails from './pages/LotDetails.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/map', name: 'map', component: MapView },
  { path: '/lot/:id', name: 'lot', component: LotDetails }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

