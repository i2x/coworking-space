import { createApp } from 'vue'
import { WagmiPlugin } from '@wagmi/vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { config } from './wagmi'
import './style.css'

createApp(App)
  .use(WagmiPlugin, { config })
  .use(VueQueryPlugin)
  .use(router)
  .mount('#app')
