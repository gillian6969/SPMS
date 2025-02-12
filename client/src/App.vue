<template>
  <div class="app-container">
    <!-- Left Sidebar - Hidden on login page -->
    <div class="sidebar" v-if="!isLoginPage">
      <div class="logo-container">
        <div class="logo">  
          <img src="@/assets/phinmalogo.png" alt="PHINMA">
        </div>
      </div>
      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item" v-if="isCITHead">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/teacher-dashboard" class="nav-item" v-if="isTeacher">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/student-management" class="nav-item" v-if="isCITHead">
          <i class="fas fa-users"></i>
          <span>Student Management</span>
        </router-link>
        <router-link to="/register" class="nav-item" v-if="isCITHead">
          <i class="fas fa-user-plus"></i>
          <span>Add Teacher/SSP</span>
        </router-link>
        <router-link to="/attendance" class="nav-item" v-if="isTeacher">
          <i class="fas fa-clipboard-check"></i>
          <span>Attendance</span>
        </router-link>
        <router-link to="/class-records" class="nav-item" v-if="isTeacher">
          <i class="fas fa-book"></i>
          <span>Class Records</span>
        </router-link>
        <router-link to="/profile" class="nav-item">
          <i class="fas fa-user"></i>
          <span>Profile</span>
        </router-link>
        <div class="nav-item" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </div>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'no-sidebar': isLoginPage }">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const isCITHead = computed(() => store.getters.isCITHead)
    const isTeacher = computed(() => store.getters.isTeacher)
    const isLoginPage = computed(() => route.path === '/login')

    const logout = () => {
      store.dispatch('logout')
      router.push('/login')
    }

    return {
      isCITHead,
      isTeacher,
      isLoginPage,
      logout
    }
  }
}
</script>

<style>
:root {
  --primary-color: #003366;
  --secondary-color: #17a2b8;
  --text-color: #333;
  --sidebar-width: 280px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  color: var(--text-color);
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
}

.logo-container {
  text-align: center;
  margin-bottom: 1rem;
}

.logo {
  max-width: 300px;
  margin: 0 auto;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.3s;
  cursor: pointer;
}

.nav-item:hover,
.nav-item.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item i {
  margin-right: 1rem;
  width: 20px;
  text-align: center;
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: 2rem;
  background-color: #f8f9fa;
  transition: margin-left 0.3s ease;
}

.main-content.no-sidebar {
  margin-left: 0;
}

/* Table Styles */
.table {
  width: 100%;
  background: white;
  border-radius: 10px;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}

.table th {
  background-color: #f8f9fa;
  color: #666;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #eee;
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Modal Styles */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1999;
}

.modal-dialog {
  position: relative;
  width: 90%;
  max-width: 500px;
  margin: 1.75rem auto;
  z-index: 2001;
  transform: translateY(0);
  transition: transform 0.3s ease-out;
}

.modal-dialog.modal-lg {
  max-width: 800px;
}

.modal-content {
  background: white;
  border: none;
  border-radius: 15px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.modal-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1.5rem;
  border-bottom: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.modal-body {
  padding: 2rem;
  background-color: #fff;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  opacity: 0.8;
  transition: opacity 0.3s;
  padding: 0.5rem;
  cursor: pointer;
}

.btn-close:hover {
  opacity: 1;
}

/* Form Styles in Modal */
.modal-body .form-label {
  font-weight: 500;
  color: #444;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.modal-body .form-control,
.modal-body .form-select {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.modal-body .form-control:focus,
.modal-body .form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
}

.modal-body .btn {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.modal-body small.text-muted {
  color: #6c757d;
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  display: block;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: #002347;
  border-color: #002347;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.btn-info {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
}

.btn-info:hover {
  background-color: #138496;
  border-color: #138496;
}
</style> 