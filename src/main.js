import { createApp } from 'vue'
import {createRouter, createMemoryHistory, createWebHistory} from 'vue-router'
import BlockGame from './components/BlockGame.vue'
import Register from './components/Register.vue';
import './style.css'
import App from './App.vue'

const routes = createRouter({
  history: createWebHistory(),
  routes: 
  [
    {path: '/', component: Register},
    {path: '/game/:name', component: BlockGame, props: route=> ({name: route.params.name})}
  ]

})


const app = createApp(App)
app.use(routes)
app.mount('#app')
