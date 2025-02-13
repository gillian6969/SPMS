<template>
  <div class="login-container">
    <div class="login-card" :data-login-type="loginType">
      <div class="left-section">
        <div class="content-wrapper">
          <div class="logo-container">
            <img src="@/assets/logo1.png" alt="School Logo" class="logo logo1" :class="{ active: loginType === 'citHead' }">
            <img src="@/assets/logo2.png" alt="School Logo" class="logo logo2" :class="{ active: loginType === 'user' }">
          </div>
          <h1 class="school-name">PHINMA ARAULLO UNIVERSITY</h1>
          <p class="system-name">Student Performance Monitoring System</p>
        </div>
      </div>
      
      <div class="right-section" :data-login-type="loginType">
        <h2 class="form-title">{{ loginType === 'citHead' ? 'CIT HEAD LOGIN' : 'TEACHER & SSP LOGIN' }}</h2>
        
        <!-- Login Type Selector -->
        <div class="login-type-selector">
          <button 
            class="type-btn" 
            :class="{'active': loginType === 'citHead'}"
            :data-login-type="loginType"
            @click="loginType = 'citHead'"
          >
            CIT Head
          </button>
          <button 
            class="type-btn" 
            :class="{'active': loginType === 'user'}"
            :data-login-type="loginType"
            @click="loginType = 'user'"
          >
            TEACHER & SSP ADVISERS LOGIN
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="email" 
              placeholder="Enter your email here"
              required
              :disabled="isLoading || showOTP"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-control" 
              v-model="password" 
              placeholder="Enter your password here"
              required
              :disabled="isLoading || showOTP"
            >
          </div>

          <!-- OTP Field (shows only after initial login) -->
          <div v-if="showOTP" class="form-group otp-section">
            <label class="form-label">Enter OTP Code</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="otp" 
              placeholder="Enter 6-digit OTP"
              maxlength="6"
              @keypress="onlyNumbers"
              required
              :disabled="isLoading"
            >
            <p class="otp-info">Please enter the OTP code sent to your email</p>
          </div>

          <button type="submit" class="btn-login" :data-login-type="loginType" :disabled="isLoading">
            <span v-if="isLoading" class="spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>
              {{ showOTP ? 'Verify OTP' : 'Login' }}
            </span>
          </button>

          <p v-if="error" class="error-message">{{ error }}</p>
        </form>
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
    const otp = ref('')
    const error = ref('')
    const showOTP = ref(false)
    const isLoading = ref(false)

    const onlyNumbers = (e) => {
      const char = String.fromCharCode(e.keyCode)
      if (!/[0-9]/.test(char)) {
        e.preventDefault()
      }
    }

    const handleLogin = async () => {
      try {
        error.value = ''
        isLoading.value = true

        if (!showOTP.value) {
          // First step: Login with credentials
          const credentials = {
            email: email.value,
            password: password.value,
            loginType: loginType.value
          }

          console.log('Attempting login with:', { 
            email: credentials.email, 
            loginType: credentials.loginType,
            timestamp: new Date().toISOString()
          })

          const response = await store.dispatch('login', credentials)
          console.log('Login response received:', {
            requiresOTP: response.data.requiresOTP,
            userRole: response.data.user?.role,
            loginType: loginType.value,
            timestamp: new Date().toISOString()
          })
          
          if (response.data.requiresOTP) {
            console.log('OTP required, showing OTP input')
            showOTP.value = true
            return
          }

          // If we get here, it means login was successful without OTP
          const user = response.data.user
          console.log('User data received:', {
            role: user.role,
            loginType: loginType.value,
            timestamp: new Date().toISOString()
          })
          
          // Check login type before proceeding
          if (loginType.value === 'citHead' && user.role !== 'citHead') {
            console.log('Access denied: Non-CIT Head using CIT Head login')
            error.value = 'Access denied. Please use the Teacher/Student login.'
            await store.dispatch('logout')
            return
          }
          
          if (loginType.value === 'user' && user.role === 'citHead') {
            console.log('Access denied: CIT Head using regular login')
            error.value = 'Access denied. Please use the CIT Head login.'
            await store.dispatch('logout')
            return
          }

          router.push('/dashboard')
        } else {
          // Second step: Verify OTP
          console.log('Verifying OTP:', {
            loginType: loginType.value,
            timestamp: new Date().toISOString()
          })
          const response = await store.dispatch('verifyOTP', otp.value)
          
          // After successful OTP verification
          const user = response.data.user
          console.log('OTP verification successful:', {
            role: user.role,
            loginType: loginType.value,
            timestamp: new Date().toISOString()
          })
          
          // Double check login type after OTP
          if (loginType.value === 'citHead' && user.role !== 'citHead') {
            console.log('Access denied after OTP: Non-CIT Head using CIT Head login')
            error.value = 'Access denied. Please use the Teacher/Student login.'
            await store.dispatch('logout')
            showOTP.value = false
            return
          }
          
          if (loginType.value === 'user' && user.role === 'citHead') {
            console.log('Access denied after OTP: CIT Head using regular login')
            error.value = 'Access denied. Please use the CIT Head login.'
            await store.dispatch('logout')
            showOTP.value = false
            return
          }

          console.log('Login successful, redirecting to dashboard')
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Login error:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          timestamp: new Date().toISOString()
        })
        
        // Handle specific error cases
        if (err.response?.data?.error === 'email_service_error') {
          error.value = 'Unable to send verification code. Please check your email configuration or try again later.'
        } else if (err.response?.data?.error === 'otp_process_error') {
          error.value = 'Error processing verification code. Please try again.'
        } else if (err.response?.status === 403) {
          error.value = err.response.data.message || 'Access denied. Please check your login type.'
        } else if (err.response?.status === 400) {
          error.value = err.response.data.message || 'Invalid credentials. Please try again.'
        } else {
          error.value = 'Login failed. Please try again.'
        }
        
        if (showOTP.value) {
          otp.value = '' // Clear OTP field on error
        }
      } finally {
        isLoading.value = false
      }
    }

    return {
      loginType,
      email,
      password,
      otp,
      error,
      showOTP,
      isLoading,
      handleLogin,
      onlyNumbers
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  background: #f5f5f5;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.login-card {
  width: 100vw;
  height: 100%;
  display: flex;
  background: white;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: relative;
}

.left-section {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: white;
  margin: 0;
  position: relative;
  transition: transform 0.5s ease;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  text-align: center;
  padding: 0 2rem;
  margin-top: -8rem;
}

.logo-container {
  position: relative;
  width: 600px;
  height: 600px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  position: absolute;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.8s ease;
  opacity: 0;
  object-fit: contain;
}

.logo.active {
  opacity: 1;
}

/* Logo transitions based on login type */
.login-card[data-login-type="citHead"] .logo-container .logo1 {
  opacity: 1;
}

.login-card[data-login-type="citHead"] .logo-container .logo2 {
  opacity: 0;
}

.login-card[data-login-type="user"] .logo-container .logo1 {
  opacity: 0;
}

.login-card[data-login-type="user"] .logo-container .logo2 {
  opacity: 1;
}

.right-section {
  min-width: 500px;
  width: 600px;
  padding: 5rem;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  position: relative;
  transition: all 0.8s ease;
}

/* Sliding animations */
.login-card[data-login-type="citHead"] .left-section {
  transform: translateX(0);
}

.login-card[data-login-type="citHead"] .right-section {
  transform: translateX(0);
  background: #1B4D40;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
}

.login-card[data-login-type="user"] .left-section {
  transform: translateX(600px);
}

.login-card[data-login-type="user"] .right-section {
  transform: translateX(calc(-100vw + 600px));
  background: #163F5C;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

.login-type-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.type-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid white;
  background: transparent;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.type-btn.active {
  background: white;
  color: #163F5C;
}

.type-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
}

.type-btn.active[data-login-type="citHead"] {
  background: white;
  color: #1B4D40;
}

.type-btn.active[data-login-type="user"] {
  background: white;
  color: #163F5C;
}

.school-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1B4D40;
  margin: 0;
  text-align: center;
  position: relative;
  width: 100%;
  line-height: 1.2;
  margin-top: -2rem;
}

.system-name {
  font-size: 1.5rem;
  color: #111111;
  margin: 0;
  position: relative;
  width: 100%;
  line-height: 1.4;
  margin-top: 0.5rem;
}

.login-form {
  width: 100%;
}

.form-title {
  font-size: 4.5rem;
  font-weight: 600;
  margin-bottom: 4rem;
  color: white;
  text-align: start;
  margin-top: -150PX;
}

.form-group {
  margin-bottom: 1.8rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: white;
  font-size: 1rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  background: transparent;
  color: white;
  font-size: 1rem;
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.form-control:focus {
  outline: none;
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.btn-login {
  background: #ffffff;
  color: #163F5C;
  padding: 0.75rem;
  border-radius: 5px;
  width: 60%;
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 4rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.btn-login:hover {
  background: #bebebe;
  color: #163F5C;
}

.btn-login[data-login-type="citHead"] {
  color: #1B4D40;
}

.btn-login[data-login-type="user"] {
  color: #163F5C;
}

.error-message {
  color: #ff6b6b;
  margin-top: 1rem;
  text-align: center;
}

.otp-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.otp-info {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.spinner {
  display: inline-block;
  margin-right: 0.5rem;
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-control:disabled {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
    max-width: 400px;
  }

  .right-section {
    width: 100%;
  }

  .left-section {
    padding: 2rem;
  }
}
</style>