<template>
  <div class="edit-profile">
    <div class="card">
      <div class="card-header">
        <h4>Edit Profile</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="updateProfile">
          <div class="mb-3">
            <label class="form-label">First Name</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="form.firstName"
              required
            >
          </div>
          
          <div class="mb-3">
            <label class="form-label">Last Name</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="form.lastName"
              required
            >
          </div>
          
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              class="form-control" 
              v-model="form.email"
              required
            >
          </div>

          <div v-if="isTeacher" class="mb-3">
            <label class="form-label">Teaching Year</label>
            <select class="form-select" v-model="form.teachingYear" required>
              <option value="">Select Year</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <router-link to="/dashboard" class="btn btn-secondary">Cancel</router-link>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'EditProfile',
  setup() {
    const store = useStore()
    const router = useRouter()
    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      teachingYear: ''
    })

    const isTeacher = computed(() => store.getters.isTeacher)
    const user = computed(() => store.state.auth.user)

    onMounted(() => {
      // Initialize form with current user data
      if (user.value) {
        form.value = {
          firstName: user.value.firstName || '',
          lastName: user.value.lastName || '',
          email: user.value.email || '',
          teachingYear: user.value.teachingYear || ''
        }
      }
    })

    const updateProfile = async () => {
      try {
        const response = await axios.put('/api/users/profile', form.value, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })

        if (response.data) {
          // Update store with new user data
          store.commit('SET_USER', response.data)
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(response.data))
          // Redirect to profile
          router.push('/profile')
        }
      } catch (error) {
        console.error('Failed to update profile:', error)
        alert(error.response?.data?.message || 'Failed to update profile')
      }
    }

    return {
      form,
      isTeacher,
      updateProfile
    }
  }
}
</script>

<style scoped>
.edit-profile {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: white;
  border-bottom: 1px solid #eee;
  padding: 1.5rem;
}

.card-header h4 {
  margin: 0;
  color: var(--primary-color);
}

.card-body {
  padding: 2rem;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.25);
}
</style> 