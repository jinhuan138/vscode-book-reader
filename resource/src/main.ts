import { createApp, defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'
import './app.css'
import 'element-plus/es/components/message/style/css'
import BookViewer from '@/BookViewer/BookViewer.vue'
import SidebarViewer from '@/SidebarViewer/SidebarViewer.vue'
import { isSidebar } from '@/hooks/useSidebar'
//https://www.npmjs.com/package/ebook-convert
//https://web.koodoreader.com/
//https://github.com/laowus/Less-Reader
//https://johnfactotum.github.io/foliate

const Viewer = defineComponent(() => {
  return () => (!isSidebar.value ? h(BookViewer) : h(SidebarViewer))
})

const routes = [
  {
    path: '/',
    component: Viewer,
  },
  { path: '/Home', component: () => import('@/BookViewer/Home.vue') },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
const app = createApp(App)
app.use(router)
app.mount('#app')
