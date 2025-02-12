<template>
  <div class="otp-verification">
    <div class="otp-card">
      <h2>Verify Your Login</h2>
      <p>Please enter the OTP sent to your email</p>
      
      <div class="otp-input">
        <input 
          type="text" 
          v-model="otp" 
          maxlength="6"
          placeholder="Enter 6-digit OTP"
          @keypress="onlyNumbers"
        >
      </div>

      <div class="error" v-if="error">{{ error }}</div>

      <button 
        @click="verifyOTP" 
        :disabled="loading || !isValidOTP"
        :class="{ loading }"
      >
        {{ loading ? 'Verifying...' : 'Verify OTP' }}
      </button>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'OTPVerification',
  data() {
    return {
      otp: '',
      loading: false,
      error: null
    }
  },
  computed: {
    isValidOTP() {
      return this.otp.length === 6 && /^\d+$/.test(this.otp)
    }
  },
  methods: {
    ...mapActions(['verifyOTP']),
    
    onlyNumbers(e) {
      const char = String.fromCharCode(e.keyCode)
      if (!/[0-9]/.test(char)) {
        e.preventDefault()
      }
    },
    
    async handleVerifyOTP() {
      if (!this.isValidOTP) return
      
      this.loading = true
      this.error = null
      
      try {
        await this.verifyOTP(this.otp)
        this.$router.push('/dashboard') // or your home route
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to verify OTP'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.otp-verification {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.otp-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 400px;
}

h2 {
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
}

.otp-input {
  margin-bottom: 2rem;
}

input {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
}

button {
  width: 100%;
  padding: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button.loading {
  opacity: 0.8;
}

.error {
  color: #f44336;
  margin-bottom: 1rem;
}
</style> 