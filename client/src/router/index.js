import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

// Import components
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import TeacherDashboard from '../views/TeacherDashboard.vue'
import StudentManagement from '../views/StudentManagement.vue'
import ClassRecords from '../views/ClassRecords.vue'
import Attendance from '../views/Attendance.vue'
import Profile from '@/views/Profile.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: true, citHeadOnly: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, citHeadOnly: true }
  },
  {
    path: '/teacher-dashboard',
    name: 'TeacherDashboard',
    component: TeacherDashboard,
    meta: { requiresAuth: true, teacherOnly: true }
  },
  {
    path: '/student-management',
    name: 'StudentManagement',
    component: StudentManagement,
    meta: { requiresAuth: true, citHeadOnly: true }
  },
  {
    path: '/class-records',
    name: 'ClassRecords',
    component: ClassRecords,
    meta: { requiresAuth: true, teacherOnly: true }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: Attendance,
    meta: { requiresAuth: true, teacherOnly: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters.isLoggedIn
  const isCITHead = store.getters.isCITHead
  const isTeacher = store.getters.isTeacher

  // Routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isLoggedIn) {
      next('/login')
      return
    }

    // CIT Head only routes
    if (to.matched.some(record => record.meta.citHeadOnly) && !isCITHead) {
      next('/teacher-dashboard')
      return
    }

    // Teacher only routes
    if (to.matched.some(record => record.meta.teacherOnly) && !isTeacher) {
      next('/dashboard')
      return
    }
  }

  // Routes for guests only (login, register)
  if (to.matched.some(record => record.meta.guest)) {
    if (isLoggedIn) {
      if (isCITHead) {
        next('/dashboard')
      } else if (isTeacher) {
        next('/teacher-dashboard')
      }
      return
    }
  }

  // Redirect to appropriate dashboard after login
  if (to.path === '/dashboard') {
    if (isTeacher) {
      next('/teacher-dashboard')
      return
    }
  }

  next()
})

export default router 