<template>
  <div class="change-password">
    <div class="card">
      <div class="card-header">
        <h4>Change Password</h4>
      </div>
      <div class="card-body">
        <!-- Success Alert -->
        <div v-if="successMessage" class="alert alert-success mb-3">
          {{ successMessage }}
        </div>

        <form @submit.prevent="updatePassword">
          <div class="mb-3">
            <label class="form-label">Current Password</label>
            <input 
              type="password" 
              class="form-control" 
              v-model="form.currentPassword"
              required
            >
          </div>
          
          <div class="mb-3">
            <label class="form-label">New Password</label>
            <input 
              type="password" 
              class="form-control" 
              v-model="form.newPassword"
              required
            >
          </div>
          
          <div class="mb-3">
            <label class="form-label">Confirm New Password</label>
            <input 
              type="password" 
              class="form-control" 
              v-model="form.confirmPassword"
              required
            >
          </div>

          <div class="d-flex justify-content-end gap-2">
            <router-link to="/dashboard" class="btn btn-secondary">Cancel</router-link>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Changing Password...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'ChangePassword',
  setup() {
    const store = useStore()
    const router = useRouter()
    const form = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    const successMessage = ref('')
    const isSubmitting = ref(false)

    const updatePassword = async () => {
      try {
        // Validate passwords match
        if (form.value.newPassword !== form.value.confirmPassword) {
          alert('New passwords do not match')
          return
        }

        isSubmitting.value = true
        const response = await axios.put('/api/users/profile/password', {
          currentPassword: form.value.currentPassword,
          newPassword: form.value.newPassword
        }, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })

        if (response.data.success) {
          successMessage.value = 'Password changed successfully!'
          form.value = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
          // Wait for 2 seconds to show the success message before redirecting
          setTimeout(() => {
            router.push('/profile')
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to change password:', error)
        alert(error.response?.data?.message || 'Failed to change password')
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      form,
      updatePassword,
      successMessage,
      isSubmitting
    }
  }
}
</script>

<style scoped>
.change-password {
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

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.25);
}

.alert {
  border-radius: 8px;
  padding: 1rem;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>