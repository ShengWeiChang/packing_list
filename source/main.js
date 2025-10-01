/*
================================================================================
File: source/main.js
Description: Application entry point - creates and mounts the Vue app instance
             with styles and global configuration.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
Last-Modified: 2025-09-30
================================================================================
*/

import { createApp } from 'vue'
import App from './App.vue'
import './index.css'

const app = createApp(App)
app.mount('#app')
