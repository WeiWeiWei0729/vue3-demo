import { createRouter, createWebHistory } from 'vue-router'
import Demo from '../pages/Demo.vue'
import Home from '../App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/demo',
      component: Demo,
    },
  ],
})

export default router
