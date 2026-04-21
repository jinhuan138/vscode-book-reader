import { createApp } from 'vue'
import App from './App.vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import './app.css'
import 'element-plus/es/components/message/style/css'
//https://www.npmjs.com/package/ebook-convert
//https://web.koodoreader.com/
//https://github.com/laowus/Less-Reader
//https://johnfactotum.github.io/foliate

const routes = [
  { path: '/', component: () => import('@/BookViewer/Home.vue') },
  { path: '/Viewer', component: () => import('@/BookViewer/BookViewer.vue') },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
const app = createApp(App)
app.use(router)
app.mount('#app')
