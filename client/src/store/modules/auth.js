import axios from 'axios'

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  tempToken: null,
  requiresOTP: false
}

const getters = {
  isLoggedIn: state => !!state.token,
  currentUser: state => state.user,
  requiresOTP: state => state.requiresOTP,
  isCITHead: state => state.user?.role === 'citHead',
  isTeacher: state => state.user?.role === 'teacher',
  isSSP: state => state.user?.role === 'ssp'
}

const actions = {
  async login({ commit }, credentials) {
    try {
      console.log('Making login request with:', { ...credentials, password: '****' })
      const response = await axios.post('http://localhost:8000/api/auth/login', credentials)
      console.log('Login response:', response.data)
      
      if (response.data.requiresOTP) {
        // Store temporary token and set OTP required flag
        commit('SET_TEMP_TOKEN', response.data.tempToken)
        commit('SET_REQUIRES_OTP', true)
        commit('SET_USER', response.data.user) // Store the partial user data
      } else {
        // If no OTP required, store the full user data
        const { token, user } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        commit('SET_TOKEN', token)
        commit('SET_USER', user)
        commit('SET_REQUIRES_OTP', false)
        commit('SET_TEMP_TOKEN', null)
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      return response
    } catch (error) {
      console.error('Login error in store:', error.response || error)
      // Clear any partial state on error
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
      commit('SET_REQUIRES_OTP', false)
      commit('SET_TEMP_TOKEN', null)
      throw error
    }
  },

  async verifyOTP({ commit, state }, otp) {
    try {
      console.log('Verifying OTP with token:', state.tempToken)
      const response = await axios.post('http://localhost:8000/api/auth/verify-otp', {
        otp,
        tempToken: state.tempToken
      })
      console.log('OTP verification response:', response.data)

      const { token, user } = response.data

      // Store in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Update state
      commit('SET_TOKEN', token)
      commit('SET_USER', user)
      commit('SET_REQUIRES_OTP', false)
      commit('SET_TEMP_TOKEN', null)

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return response
    } catch (error) {
      console.error('OTP verification error in store:', error.response || error)
      // Clear state on error
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
      commit('SET_REQUIRES_OTP', false)
      commit('SET_TEMP_TOKEN', null)
      throw error
    }
  },

  async register({ commit }, userData) {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/register', userData)
      return response
    } catch (error) {
      throw error
    }
  },

  logout({ commit }) {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Clear state
    commit('SET_TOKEN', null)
    commit('SET_USER', null)
    commit('SET_REQUIRES_OTP', false)
    commit('SET_TEMP_TOKEN', null)

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization']
  },

  async updateProfile({ commit }, userData) {
    try {
      const response = await axios.put('http://localhost:8000/api/users/profile', userData)
      const updatedUser = response.data

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser))

      // Update state
      commit('SET_USER', updatedUser)

      return response
    } catch (error) {
      throw error
    }
  }
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_TEMP_TOKEN(state, token) {
    state.tempToken = token
  },
  SET_REQUIRES_OTP(state, requires) {
    state.requiresOTP = requires
  }
}

export default {
  state,
  getters,
  actions,
  mutations
} 