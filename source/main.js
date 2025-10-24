/*
================================================================================
File: source/main.js
Description: Application entry point - creates and mounts the Vue app instance
             with styles and global configuration.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

import './index.css';

import { createApp } from 'vue';

import App from './App.vue';
import i18n from './i18n';

const app = createApp(App);
app.use(i18n);
app.mount('#app');
