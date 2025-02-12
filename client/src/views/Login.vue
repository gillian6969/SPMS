<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="text-center mb-4">Student Performance Monitoring</h2>
      
      <!-- Login Type Selector -->
      <div class="btn-group w-100 mb-4">
        <button 
          class="btn" 
          :class="{'btn-primary': loginType === 'citHead', 'btn-outline-primary': loginType !== 'citHead'}"
          @click="loginType = 'citHead'"
        >
          CIT Head
        </button>
        <button 
          class="btn" 
          :class="{'btn-primary': loginType === 'user', 'btn-outline-primary': loginType !== 'user'}"
          @click="loginType = 'user'"
        >
          Teacher/Student
        </button>
      </div>

      <!-- CIT Head Login Form -->
      <form v-if="loginType === 'citHead'" @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input 
            type="email" 
            class="form-control" 
            v-model="email"
            required
          >
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="password"
            required
          >
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
      </form>

      <!-- Teacher/Student Login Form -->
      <form v-else @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input 
            type="email" 
            class="form-control" 
            v-model="email"
            required
          >
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="password"
            required
          >
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
      </form>

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const store = useStore()
    const router = useRouter()

    const loginType = ref('user')
    const email = ref('')
    const password = ref('')
    const error = ref('')

    const handleLogin = async () => {
      try {
        error.value = ''
        const credentials = {
          email: email.value,
          password: password.value,
          loginType: loginType.value
        }

        const response = await store.dispatch('login', credentials)
        
        // Check if the user's role matches the login type
        const user = response.data.user
        if (loginType.value === 'citHead' && user.role !== 'citHead') {
          error.value = 'Access denied. Please use the Teacher/Student login.'
          await store.dispatch('logout')
          return
        }
        
        if (loginType.value === 'user' && user.role === 'citHead') {
          error.value = 'Access denied. Please use the CIT Head login.'
          await store.dispatch('logout')
          return
        }

        router.push('/dashboard')
      } catch (err) {
        error.value = err.response?.data?.message || 'Login failed. Please try again.'
      }
    }

    return {
      loginType,
      email,
      password,
      error,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.btn-group {
  border-radius: 4px;
  overflow: hidden;
}

.btn-group .btn {
  flex: 1;
}

h2 {
  color: #003366;
}

.form-control:focus {
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
</style> 