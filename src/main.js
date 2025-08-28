import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import 'leaflet/dist/leaflet.css'
import { registerSW } from 'virtual:pwa-register'
import i18n from './i18n'

createApp(App).use(router).use(i18n).mount('#app')

registerSW({ immediate: true })
