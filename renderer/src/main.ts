import { createApp } from 'vue'
import App from './App.vue'
import './app.css'
import { i18n } from './locales'
//https://www.npmjs.com/package/ebook-convert
//https://web.koodoreader.com/
//https://github.com/laowus/Less-Reader
//https://johnfactotum.github.io/foliate

const app = createApp(App)
app.use(i18n)
app.mount('#app')
