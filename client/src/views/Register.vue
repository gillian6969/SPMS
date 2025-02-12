<template>
  <div class="register-container">
    <div class="register-box">
      <h2 class="text-center mb-4">Create New Account</h2>
      <p class="text-center text-muted mb-4">Register new teachers and SSP advisers</p>
      
      <form @submit.prevent="handleRegister">
        <!-- First Name -->
        <div class="mb-3">
          <label class="form-label">First Name</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="firstName"
            required
          >
        </div>

        <!-- Last Name -->
        <div class="mb-3">
          <label class="form-label">Last Name</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="lastName"
            required
          >
        </div>

        <!-- Email -->
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input 
            type="email" 
            class="form-control" 
            v-model="email"
            required
          >
        </div>

        <!-- Password -->
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="password"
            required
          >
        </div>

        <!-- Confirm Password -->
        <div class="mb-3">
          <label class="form-label">Confirm Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="confirmPassword"
            required
          >
        </div>

        <!-- Teaching Year -->
        <div class="mb-3">
          <label class="form-label">Teaching Year</label>
          <select class="form-select" v-model="teachingYear" required>
            <option value="">Select Year</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>
        </div>

        <!-- Role -->
        <div class="mb-3">
          <label class="form-label">Role</label>
          <select class="form-select" v-model="role" required>
            <option value="">Select Role</option>
            <option value="teacher">Teacher</option>
            <option value="ssp">SSP Adviser</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary w-100">Create Account</button>
      </form>

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>

      <!-- Success Alert -->
      <div v-if="success" class="alert alert-success mt-3">
        {{ success }}
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
  name: 'Register',
  setup() {
    const store = useStore()
    const router = useRouter()

    const firstName = ref('')
    const lastName = ref('')
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const teachingYear = ref('')
    const role = ref('')
    const error = ref('')
    const success = ref('')

    const handleRegister = async () => {
      try {
        error.value = ''
        success.value = ''

        // Validate passwords match
        if (password.value !== confirmPassword.value) {
          error.value = 'Passwords do not match'
          return
        }

        const userData = {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          password: password.value,
          confirmPassword: confirmPassword.value,
          teachingYear: teachingYear.value,
          role: role.value
        }

        const response = await axios.post('http://localhost:8000/api/auth/register', userData, {
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        })

        if (response.data.success) {
          success.value = 'Account created successfully!'
          // Reset form
          firstName.value = ''
          lastName.value = ''
          email.value = ''
          password.value = ''
          confirmPassword.value = ''
          teachingYear.value = ''
          role.value = ''
        }
      } catch (err) {
        error.value = err.response?.data?.message || 'Registration failed. Please try again.'
      }
    }

    return {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      teachingYear,
      role,
      error,
      success,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.register-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

h2 {
  color: #003366;
}

.form-control:focus,
.form-select:focus {
  border-color: #003366;
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.25);
}

a {
  color: #003366;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.btn-primary {
  background-color: #003366;
  border-color: #003366;
}

.btn-primary:hover {
  background-color: #002244;
  border-color: #002244;
}
</style> 