import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import RoomPage from './pages/RoomPage.vue'
import MyBookingsPage from './pages/MyBookingsPage.vue'
import AdminPage from './pages/AdminPage.vue'
import PresentPage from './pages/PresentPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/room/:id', component: RoomPage, props: true },
    { path: '/my-bookings', component: MyBookingsPage },
    // การกันจริงอยู่ที่ onlyOwner ใน contract — หน้าเว็บแค่ซ่อน/แสดง
    { path: '/admin', component: AdminPage },
    { path: '/present', component: PresentPage },
  ],
})
