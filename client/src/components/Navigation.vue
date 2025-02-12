<template>
  <div class="navigation-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <!-- Sidebar Header with SPMS Logo -->
      <div class="sidebar-header">
        <img src="@/assets/logo2.png" alt="SPMS Logo" class="sidebar-logo">
        <h3 class="sidebar-title" v-show="!isSidebarCollapsed">SPMS</h3>
        <button class="collapse-btn" @click="toggleSidebar">
          <i :class="isSidebarCollapsed ? 'fas fa-angle-right' : 'fas fa-angle-left'"></i>
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <!-- CIT Head Navigation -->
        <template v-if="isCITHead">
          <router-link to="/dashboard" class="nav-item" active-class="active" v-tooltip="isSidebarCollapsed ? 'Dashboard' : ''">
            <i class="fas fa-chart-line"></i>
            <span v-show="!isSidebarCollapsed">Dashboard</span>
          </router-link>
          <router-link to="/student-management" class="nav-item" active-class="active" v-tooltip="isSidebarCollapsed ? 'Student Management' : ''">
            <i class="fas fa-users"></i>
            <span v-show="!isSidebarCollapsed">Student Management</span>
          </router-link>
          <router-link to="/register" class="nav-item" active-class="active" v-tooltip="isSidebarCollapsed ? 'Add Teacher/SSP' : ''">
            <i class="fas fa-user-plus"></i>
            <span v-show="!isSidebarCollapsed">Add Teacher/SSP</span>
          </router-link>
        </template>

        <!-- Teacher Navigation -->
        <template v-if="isTeacher">
          <router-link to="/teacher-dashboard" class="nav-item" active-class="active" v-tooltip="isSidebarCollapsed ? 'Dashboard' : ''">
            <i class="fas fa-chart-line"></i>
            <span v-show="!isSidebarCollapsed">Dashboard</span>
          </router-link>
          <router-link to="/class-records" class="nav-item" active-class="active" v-tooltip="isSidebarCollapsed ? 'Class Records' : ''">
            <i class="fas fa-book"></i>
            <span v-show="!isSidebarCollapsed">Class Records</span>
          </router-link>
          <router-link to="/attendance" class="nav-item" active-class="active" v-tooltip="isSidebarCollapsed ? 'Attendance' : ''">
            <i class="fas fa-clipboard-list"></i>
            <span v-show="!isSidebarCollapsed">Attendance</span>
          </router-link>
        </template>
      </nav>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="content-wrapper">
      <!-- Top Navbar -->
      <nav class="top-navbar">
        <div class="navbar-left">
          <h2 class="page-title">
            {{ pageTitle }}
            <span v-if="selectedInfo" class="selected-info">
              {{ selectedInfo }}
            </span>
          </h2>
        </div>

        <div class="navbar-right">
          <!-- Profile Dropdown -->
          <div class="dropdown">
            <button class="btn btn-link nav-btn dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <div class="avatar">{{ userInitials }}</div>
            </button>
            <ul class="dropdown-menu dropdown-menu-end profile-menu">
              <li class="px-3 py-2 d-flex flex-column">
                <span class="user-name">{{ user?.firstName }} {{ user?.lastName }}</span>
                <span class="user-role">{{ user?.role === 'citHead' ? 'CIT Head' : 'Teacher' }}</span>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <router-link class="dropdown-item" to="/profile/view">
                  <i class="fas fa-user me-2"></i> View Profile
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/profile/edit">
                  <i class="fas fa-edit me-2"></i> Edit Profile
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/profile/password">
                  <i class="fas fa-key me-2"></i> Change Password
                </router-link>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a class="dropdown-item text-danger" href="#" @click.prevent="handleLogout">
                  <i class="fas fa-sign-out-alt me-2"></i> Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'Navigation',
  props: {
    selectedInfo: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    // State
    const isSidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')

    // Computed
    const user = computed(() => store.state.auth.user)
    const isCITHead = computed(() => store.getters.isCITHead)
    const isTeacher = computed(() => store.getters.isTeacher)
    
    const userInitials = computed(() => {
      if (!user.value) return ''
      return `${user.value.firstName?.charAt(0) || ''}${user.value.lastName?.charAt(0) || ''}`
    })
    
    const pageTitle = computed(() => {
      const routeName = route.name
      switch (routeName) {
        case 'ClassRecords':
          return 'Class Records'
        case 'Attendance':
          return 'Attendance'
        case 'Dashboard':
          return 'Dashboard'
        case 'TeacherDashboard':
          return 'Dashboard'
        case 'StudentManagement':
          return 'Student Management'
        case 'ViewProfile':
          return 'Profile'
        case 'EditProfile':
          return 'Edit Profile'
        case 'ChangePassword':
          return 'Change Password'
        case 'Register':
          return 'Add Teacher/SSP'
        default:
          return routeName || 'Dashboard'
      }
    })

    // Methods
    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value)
    }

    const handleLogout = async () => {
      try {
        await store.dispatch('logout')
        router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    return {
      user,
      pageTitle,
      handleLogout,
      isCITHead,
      isTeacher,
      userInitials,
      isSidebarCollapsed,
      toggleSidebar
    }
  }
}
</script>

<style scoped>
.navigation-wrapper {
  min-height: 100vh;
  display: flex;
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background: #203464;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1020;
  transition: all 0.3s ease;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 70px;
  background: #203464;
  position: relative;
}

.sidebar-logo {
  width: 35px;
  height: 35px;
  object-fit: contain;
}

.sidebar-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.collapse-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: none;
  color: #203464;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.sidebar-collapsed .collapse-btn {
  transform: translateY(-50%) rotate(180deg);
}

.sidebar-nav {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item:hover::before {
  transform: translateX(0);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 500;
}

.nav-item.active::before {
  transform: translateX(0);
}

.nav-item i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
}

/* Content Wrapper Styles */
.content-wrapper {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
}

.sidebar-collapsed .content-wrapper {
  margin-left: 70px;
}

/* Top Navbar Styles */
.top-navbar {
  background: #203464;
  padding: 0.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  right: 0;
  left: auto;
  width: calc(100% - 250px);
  height: 70px;
  z-index: 1019;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;
}

.sidebar-collapsed .top-navbar {
  width: calc(100% - 70px);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.page-title {
  color: #fff;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-info {
  font-size: 1rem;
  opacity: 0.8;
  font-weight: normal;
  padding-left: 1rem;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Profile Styles */
.nav-btn {
  color: white;
  position: relative;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.profile-menu {
  margin-top: 0.5rem;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  min-width: 240px;
}

.user-name {
  font-weight: 600;
  color: #212529;
}

.user-role {
  font-size: 0.875rem;
  color: #6c757d;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  width: 16px;
  text-align: center;
}

.dropdown-divider {
  margin: 0.5rem 0;
  border-color: #f1f3f5;
}

.text-danger {
  color: #dc3545 !important;
}

.text-danger:hover {
  background-color: #fff5f5 !important;
}

/* Main Content Styles */
.main-content {
  padding: 90px 2rem 2rem;
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.collapsed {
    transform: translateX(0);
    width: 250px;
  }

  .content-wrapper {
    margin-left: 0 !important;
  }

  .top-navbar {
    width: 100% !important;
    left: 0;
  }

  .page-title {
    font-size: 1.1rem;
  }

  .selected-info {
    display: none;
  }
}
</style> 