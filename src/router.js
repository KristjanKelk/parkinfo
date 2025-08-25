import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import MapView from './pages/MapView.vue'
import LotDetails from './pages/LotDetails.vue'

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/map', component: MapView },
        { path: '/lot/:id', component: LotDetails, props: true },
    ]
})
