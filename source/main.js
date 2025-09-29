import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
// Theme service removed for MVP — styles use CSS defaults and Tailwind

const app = createApp(App)
app.mount('#app')