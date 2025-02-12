<template>
  <div class="attendance">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Attendance</h2>
      
      <!-- Date Navigation -->
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-primary" @click="previousDay">
          <i class="fas fa-chevron-left"></i>
        </button>
        <input 
          type="date" 
          class="form-control" 
          v-model="selectedDate"
          :max="today"
        >
        <button class="btn btn-outline-primary" @click="nextDay" :disabled="isToday">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Section Selection -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <label class="form-label">Section</label>
            <select class="form-select" v-model="selectedSection">
              <option value="">Select Section</option>
              <option value="South 1">South 1</option>
              <option value="South 2">South 2</option>
              <option value="South 3">South 3</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Subject</label>
            <select class="form-select" v-model="selectedSubject">
              <option value="">Select Subject</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Search</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="searchQuery"
              placeholder="Search by name or ID..."
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Table -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th class="text-center">Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in filteredStudents" :key="student.studentId">
                <td>{{ student.studentId }}</td>
                <td>{{ student.lastName }}</td>
                <td>{{ student.firstName }}</td>
                <td class="text-center">
                  <div class="form-check form-check-inline">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      :checked="isPresent(student)"
                      @change="toggleAttendance(student)"
                      :disabled="!canEditAttendance"
                    >
                    <label class="form-check-label">
                      {{ isPresent(student) ? 'Present' : 'Absent' }}
                    </label>
                  </div>
                </td>
                <td>
                  <button 
                    class="btn btn-sm btn-info"
                    @click="viewAttendanceHistory(student)"
                  >
                    <i class="fas fa-history"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredStudents.length === 0" class="text-center py-4">
          <p class="text-muted">No students found</p>
        </div>
      </div>
    </div>

    <!-- Attendance History Modal -->
    <div v-if="selectedStudent" class="modal fade show" style="display: block">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Attendance History</h5>
            <button type="button" class="btn-close" @click="selectedStudent = null"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-12 mb-4">
                <h6>Student Information</h6>
                <p><strong>Name:</strong> {{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</p>
                <p><strong>ID:</strong> {{ selectedStudent.studentId }}</p>
              </div>
              <div class="col-md-12 mb-4">
                <h6>Attendance Chart</h6>
                <canvas ref="attendanceChart"></canvas>
              </div>
              <div class="col-md-12">
                <h6>Attendance Records</h6>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="record in selectedStudent.attendanceHistory" :key="record.date">
                        <td>{{ formatDate(record.date) }}</td>
                        <td>{{ record.subject }}</td>
                        <td>
                          <span 
                            class="badge"
                            :class="record.status === 'present' ? 'bg-success' : 'bg-danger'"
                          >
                            {{ record.status === 'present' ? 'Present' : 'Absent' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import Chart from 'chart.js/auto'
import moment from 'moment'

export default {
  name: 'Attendance',
  setup() {
    const store = useStore()
    const user = computed(() => store.state.auth.user)
    
    const selectedDate = ref(moment().format('YYYY-MM-DD'))
    const selectedSection = ref('')
    const selectedSubject = ref('')
    const searchQuery = ref('')
    const students = ref([])
    const selectedStudent = ref(null)
    const attendanceChart = ref(null)

    // Get today's date
    const today = moment().format('YYYY-MM-DD')
    const isToday = computed(() => selectedDate.value === today)

    // Check if attendance can be edited (only allow editing for current day)
    const canEditAttendance = computed(() => selectedDate.value === today)

    // Get available subjects based on teaching year
    const availableSubjects = computed(() => {
      const year = user.value.teachingYear
      switch (year) {
        case '1st':
          return ['ITE 100', 'ITE 101', 'ITE 102', 'ITE 103']
        case '2nd':
          return ['ITE 200', 'ITE 201', 'ITE 202', 'ITE 203']
        case '3rd':
          return ['ITE 301', 'ITE 302', 'ITE 303', 'ITE 304']
        case '4th':
          return ['ITE 400', 'ITE 401', 'ITE 402', 'ITE 403', 'ITE 404']
        default:
          return []
      }
    })

    // Filter students
    const filteredStudents = computed(() => {
      return students.value.filter(student => {
        const searchLower = searchQuery.value.toLowerCase()
        return (
          student.studentId.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        )
      })
    })

    // Fetch attendance data
    const fetchAttendanceData = async () => {
      if (!selectedSection.value || !selectedSubject.value) return

      try {
        const response = await axios.get('http://localhost:8000/api/attendance', {
          params: {
            date: selectedDate.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          }
        })
        
        students.value = response.data
      } catch (error) {
        console.error('Failed to fetch attendance data:', error)
      }
    }

    // Check if student is present
    const isPresent = (student) => {
      return student.attendance?.find(a => 
        a.date === selectedDate.value && 
        a.subject === selectedSubject.value
      )?.status === 'present'
    }

    // Toggle student attendance
    const toggleAttendance = async (student) => {
      try {
        await axios.post('http://localhost:8000/api/attendance', {
          studentId: student.studentId,
          date: selectedDate.value,
          subject: selectedSubject.value,
          status: isPresent(student) ? 'absent' : 'present'
        })
        
        fetchAttendanceData()
      } catch (error) {
        console.error('Failed to update attendance:', error)
        alert('Failed to update attendance. Please try again.')
      }
    }

    // View attendance history
    const viewAttendanceHistory = async (student) => {
      selectedStudent.value = student

      try {
        const response = await axios.get(`http://localhost:8000/api/attendance/${student.studentId}/history`, {
          params: { subject: selectedSubject.value }
        })

        selectedStudent.value.attendanceHistory = response.data

        // Create attendance chart
        const monthlyData = response.data.reduce((acc, record) => {
          const month = moment(record.date).format('MMM YYYY')
          if (!acc[month]) {
            acc[month] = { present: 0, total: 0 }
          }
          acc[month].total++
          if (record.status === 'present') {
            acc[month].present++
          }
          return acc
        }, {})

        new Chart(attendanceChart.value, {
          type: 'bar',
          data: {
            labels: Object.keys(monthlyData),
            datasets: [{
              label: 'Attendance Rate (%)',
              data: Object.values(monthlyData).map(d => (d.present / d.total) * 100),
              backgroundColor: '#003366'
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        })
      } catch (error) {
        console.error('Failed to fetch attendance history:', error)
      }
    }

    // Date navigation
    const previousDay = () => {
      selectedDate.value = moment(selectedDate.value).subtract(1, 'day').format('YYYY-MM-DD')
    }

    const nextDay = () => {
      if (!isToday.value) {
        selectedDate.value = moment(selectedDate.value).add(1, 'day').format('YYYY-MM-DD')
      }
    }

    // Format date
    const formatDate = (date) => {
      return moment(date).format('MMM D, YYYY')
    }

    // Watch for changes
    watch([selectedDate, selectedSection, selectedSubject], () => {
      fetchAttendanceData()
    })

    // Initialize
    onMounted(() => {
      if (selectedSection.value && selectedSubject.value) {
        fetchAttendanceData()
      }
    })

    return {
      selectedDate,
      selectedSection,
      selectedSubject,
      searchQuery,
      students,
      filteredStudents,
      availableSubjects,
      selectedStudent,
      attendanceChart,
      today,
      isToday,
      canEditAttendance,
      isPresent,
      toggleAttendance,
      viewAttendanceHistory,
      previousDay,
      nextDay,
      formatDate
    }
  }
}
</script>

<style scoped>
.attendance {
  padding: 20px;
}

.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table th {
  border-top: none;
  color: #666;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: white;
}

.btn-info:hover {
  background-color: #138496;
  border-color: #138496;
}

.form-check-input:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.form-control:focus,
.form-select:focus {
  border-color: #003366;
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.25);
}

.badge {
  font-size: 0.875rem;
}
</style> 