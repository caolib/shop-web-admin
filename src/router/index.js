import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CommodityView from '@/views/CommodityView.vue'
import SearchView from '@/views/SearchView.vue'
import UserView from '@/views/UserView.vue'
import OrderListView from '@/views/OrderListView.vue'
import PayView from '@/views/PayView.vue'
import AboutView from '@/views/AboutView.vue'
import StatisticsView from '@/views/StatisticsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/commodity',
      name: 'commodity',
      component: CommodityView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/user',
      name: 'user',
      component: UserView,
    },
    {
      path: '/order-list',
      name: 'order-list',
      component: OrderListView,
    },
    {
      path: '/pay',
      name: 'pay',
      component: PayView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: StatisticsView,
    },
  ],
})

export default router
