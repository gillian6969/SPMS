<template>
  <div class="view-profile">
    <div class="profile-header">
      <div class="profile-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <h2>{{ user.firstName }} {{ user.lastName }}</h2>
      <p class="text-muted">{{ user.role === 'citHead' ? 'CIT Head' : user.role === 'teacher' ? 'Teacher' : 'SSP Adviser' }}</p>
    </div>

    <div class="profile-content">
      <div class="info-card">
        <h3>Personal Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>First Name</label>
            <span>{{ user.firstName }}</span>
          </div>
          <div class="info-item">
            <label>Last Name</label>
            <span>{{ user.lastName }}</span>
          </div>
          <div class="info-item">
            <label>Email</label>
            <span>{{ user.email }}</span>
          </div>
          <div class="info-item" v-if="user.role !== 'citHead'">
            <label>Teaching Year</label>
            <span>{{ user.teachingYear }}</span>
          </div>
          <div class="info-item">
            <label>Role</label>
            <span>{{ user.role === 'citHead' ? 'CIT Head' : user.role === 'teacher' ? 'Teacher' : 'SSP Adviser' }}</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <router-link to="/profile/edit" class="btn btn-primary">
          <i class="fas fa-user-edit"></i>
          Edit Information
        </router-link>
        <router-link to="/profile/password" class="btn btn-secondary">
          <i class="fas fa-key"></i>
          Change Password
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'ViewProfile',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const user = computed(() => store.state.auth.user || {})
    const isLoggedIn = computed(() => store.getters.isLoggedIn)

    // Redirect if not logged in
    if (!isLoggedIn.value) {
      router.push('/login')
    }

    return {
      user
    }
  }
}
</script>

<style scoped>
.view-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar i {
  font-size: 3rem;
  color: white;
}

.profile-header h2 {
  margin: 0.5rem 0;
  color: var(--primary-color);
}

.profile-content {
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.info-card {
  margin-bottom: 2rem;
}

.info-card h3 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.info-item span {
  font-size: 1.1rem;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #eee;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn i {
  font-size: 1rem;
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
</style> 