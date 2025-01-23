import './assets/main.css'
import 'ant-design-vue/dist/reset.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'

import { createPersistedState } from 'pinia-persistedstate-plugin'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 使用pinia和persist保存状态并持久化
const pinia = createPinia()
const persist = createPersistedState()
pinia.use(persist)

app.use(pinia)
app.use(router)
app.use(Antd)

app.mount('#app')