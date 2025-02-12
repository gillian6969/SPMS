<template>
  <div class="dashboard">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="dashboard-title">Dashboard</h2>
      
      <!-- Combined Filter Dropdown -->
      <div class="dropdown">
        <button class="btn btn-filter dropdown-toggle" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fas fa-filter me-2"></i>
          {{ getFilterDisplay() }}
        </button>
        <div class="dropdown-menu filter-menu p-3" aria-labelledby="filterDropdown">
          <h6 class="dropdown-header">Filter Options</h6>
          <div class="mb-3">
            <label class="form-label">Academic Year</label>
            <select class="form-select mb-2" v-model="selectedYear" @change="handleYearChange">
              <option value="">All Years</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Section</label>
            <select class="form-select mb-2" v-model="selectedSection" :disabled="!selectedYear">
              <option value="">All Sections</option>
              <option v-for="section in sections" :key="section" :value="section">{{ section }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Subject</label>
            <select class="form-select mb-2" v-model="selectedSubject" :disabled="!selectedYear">
              <option value="">All Subjects</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
            </select>
          </div>
          <div class="dropdown-divider"></div>
          <button class="btn btn-primary w-100" @click="applyFilters">Apply Filters</button>
        </div>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div class="row g-4">
      <!-- Total Students Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-user-graduate"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Total Students</h3>
            <div class="stat-value">{{ totalStudents }}</div>
          </div>
        </div>
      </div>

      <!-- Total Sections Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-chalkboard"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Active Sections</h3>
            <div class="stat-value">{{ totalSections }}</div>
          </div>
        </div>
      </div>

      <!-- Total Subjects Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-book"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">My Subjects</h3>
            <div class="stat-value">{{ totalSubjects }}</div>
          </div>
        </div>
      </div>

      <!-- Average Score Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Class Average</h3>
            <div class="stat-value" v-if="hasPerformanceData">{{ averageScore }}%</div>
            <div class="no-data" v-else>No data available</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary Stats Row -->
    <div class="row mt-4">
      <div class="col-md-6">
        <div class="dashboard-card h-100">
          <div class="icon-container">
            <i class="fas fa-clock"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Average Attendance</h3>
            <div class="stat-value" v-if="hasAttendanceData">{{ averageAttendance }}%</div>
            <div class="no-data" v-else>No attendance data available</div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="dashboard-card h-100">
          <div class="icon-container">
            <i class="fas fa-tasks"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Assessment Completion</h3>
            <div class="stat-value" v-if="hasAssessmentData">{{ assessmentCompletion }}%</div>
            <div class="no-data" v-else>No assessment data available</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row mb-4">
      <!-- Performance Chart -->
      <div class="col-md-6">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">Class Performance Distribution</h5>
            <div class="chart-container">
              <canvas ref="performanceChart"></canvas>
              <p v-if="!hasPerformanceData" class="no-data-message">No performance data available</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Attendance Chart -->
      <div class="col-md-6">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">Attendance Trends</h5>
            <div class="chart-container">
              <canvas ref="attendanceChart"></canvas>
              <p v-if="!hasAttendanceData" class="no-data-message">No attendance data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Recent Activity</h5>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!hasActivity">
                <td colspan="3" class="text-center">No recent activity</td>
              </tr>
              <tr v-for="activity in recentActivities" :key="activity.id">
                <td>{{ formatDate(activity.date) }}</td>
                <td>{{ activity.type }}</td>
                <td>{{ activity.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'
import moment from 'moment'

export default {
  name: 'TeacherDashboard',
  setup() {
    const store = useStore()
    const performanceChart = ref(null)
    const attendanceChart = ref(null)

    // Data refs
    const totalStudents = ref(0)
    const totalSections = ref(0)
    const totalSubjects = ref(0)
    const averageAttendance = ref(0)
    const averageScore = ref(0)
    const assessmentCompletion = ref(0)
    const recentActivities = ref([])
    const sections = ref([])
    const subjects = ref([])
    
    // Filter refs
    const selectedYear = ref('')
    const selectedSection = ref('')
    const selectedSubject = ref('')

    // Get teacher ID from store
    const getTeacherId = () => {
      const user = store.state.auth.user
      if (!user || !user.id) {
        console.error('No teacher ID found in store')
        return null
      }
      return user.id
    }

    // Computed properties for data availability
    const hasAttendanceData = computed(() => averageAttendance.value > 0)
    const hasPerformanceData = computed(() => averageScore.value > 0)
    const hasAssessmentData = computed(() => assessmentCompletion.value > 0)
    const hasActivity = computed(() => recentActivities.value.length > 0)

    const fetchTeacherSectionsAndSubjects = async (year = '') => {
      try {
        const teacherId = getTeacherId()
        if (!teacherId) return

        const token = store.state.auth.token
        const response = await axios.get(`http://localhost:8000/api/class-records/sections-subjects/${teacherId}`, {
          params: { year },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.data) {
          sections.value = response.data.sections || []
          subjects.value = response.data.subjects || []
        }
      } catch (error) {
        console.error('Error fetching teacher sections and subjects:', error)
        sections.value = []
        subjects.value = []
      }
    }

    const handleYearChange = async () => {
      selectedSection.value = ''
      selectedSubject.value = ''
      if (selectedYear.value) {
        await fetchTeacherSectionsAndSubjects(selectedYear.value)
      } else {
        sections.value = []
        subjects.value = []
      }
    }

    const getFilterDisplay = () => {
      const filters = []
      if (selectedYear.value) filters.push(selectedYear.value + ' Year')
      if (selectedSection.value) filters.push(selectedSection.value)
      if (selectedSubject.value) filters.push(selectedSubject.value)
      return filters.length > 0 ? filters.join(' - ') : 'Filter View'
    }

    const fetchDashboardData = async () => {
      try {
        const teacherId = store.state.auth.user._id
        const token = store.state.auth.token

        // Fetch class records for the teacher
        const response = await axios.get(`http://localhost:8000/api/class-records`, {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        console.log('Class Records:', response.data) // Debug log

        const classRecords = response.data

        if (Array.isArray(classRecords)) {
          // Count total students from class records
          const uniqueStudentIds = new Set()
          const uniqueSections = new Set()
          const uniqueSubjects = new Set()

          classRecords.forEach(record => {
            // Count unique students
            if (record.students && Array.isArray(record.students)) {
              record.students.forEach(student => {
                if (student && student.studentId) {
                  uniqueStudentIds.add(student.studentId)
                }
              })
            }

            // Add section to unique sections set
            if (record.section) {
              uniqueSections.add(record.section)
            }

            // Add subject to unique subjects set
            if (record.subject) {
              uniqueSubjects.add(record.subject)
            }
          })

          // Update the reactive refs
          totalStudents.value = uniqueStudentIds.size
          totalSections.value = uniqueSections.size
          totalSubjects.value = uniqueSubjects.size

          console.log('Counts:', {
            students: uniqueStudentIds.size,
            sections: uniqueSections.size,
            subjects: uniqueSubjects.size,
            uniqueStudentIds: Array.from(uniqueStudentIds)
          }) // Debug log
        }

        // Fetch additional dashboard stats
        const statsResponse = await axios.get(`http://localhost:8000/api/dashboard/teacher/${teacherId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (statsResponse.data) {
          averageAttendance.value = statsResponse.data.averageAttendance || 0
          averageScore.value = statsResponse.data.averageScore || 0
          assessmentCompletion.value = statsResponse.data.assessmentCompletion || 0
          recentActivities.value = statsResponse.data.recentActivities || []
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        totalStudents.value = 0
        totalSections.value = 0
        totalSubjects.value = 0
      }
    }

    const applyFilters = async () => {
      try {
        const teacherId = store.state.auth.user._id
        const token = store.state.auth.token

        // Fetch filtered class records
        const response = await axios.get(`http://localhost:8000/api/class-records/teacher/${teacherId}`, {
          params: {
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        console.log('Filtered Class Records:', response.data) // Debug log

        const filteredRecords = response.data

        if (Array.isArray(filteredRecords)) {
          // Count students from filtered records
          let studentCount = 0
          const uniqueSections = new Set()
          const uniqueSubjects = new Set()

          filteredRecords.forEach(record => {
            // Count students
            if (record.students && Array.isArray(record.students)) {
              studentCount += record.students.length
            }

            // Add section to unique sections
            if (record.section) {
              uniqueSections.add(record.section)
            }

            // Add subject to unique subjects
            if (record.subject) {
              uniqueSubjects.add(record.subject)
            }
          })

          // Update the counts
          totalStudents.value = studentCount
          totalSections.value = uniqueSections.size
          totalSubjects.value = uniqueSubjects.size

          console.log('Filtered Counts:', {
            students: studentCount,
            sections: uniqueSections.size,
            subjects: uniqueSubjects.size
          }) // Debug log
        }

      } catch (error) {
        console.error('Error applying filters:', error)
      }
    }

    const updatePerformanceChart = (data) => {
      const ctx = performanceChart.value.getContext('2d')
      const existingChart = Chart.getChart(ctx)
      if (existingChart) {
        existingChart.destroy()
      }

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['90-100', '80-89', '70-79', '60-69', 'Below 60'],
          datasets: [{
            label: 'Number of Students',
            data: data,
            backgroundColor: '#003366',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Students'
              }
            }
          }
        }
      })
    }

    const updateAttendanceChart = (data) => {
      const ctx = attendanceChart.value.getContext('2d')
      const existingChart = Chart.getChart(ctx)
      if (existingChart) {
        existingChart.destroy()
      }

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(t => moment(t.date).format('MMM D')),
          datasets: [{
            label: 'Attendance Rate',
            data: data.map(t => t.rate),
            borderColor: '#003366',
            backgroundColor: 'rgba(0, 51, 102, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Attendance Rate (%)'
              }
            }
          }
        }
      })
    }

    const formatDate = (date) => {
      return moment(date).format('MMM D, YYYY')
    }

    onMounted(async () => {
      await fetchTeacherSectionsAndSubjects()
      await fetchDashboardData()
    })

    return {
      totalStudents,
      totalSections,
      totalSubjects,
      averageAttendance,
      averageScore,
      assessmentCompletion,
      performanceChart,
      attendanceChart,
      recentActivities,
      sections,
      subjects,
      selectedYear,
      selectedSection,
      selectedSubject,
      hasAttendanceData,
      hasPerformanceData,
      hasAssessmentData,
      hasActivity,
      formatDate,
      getFilterDisplay,
      handleYearChange,
      applyFilters
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.filter-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-select {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.9rem;
  color: #495057;
}

.dashboard-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 100%;
}

.icon-container {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #003366;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-container i {
  color: white;
  font-size: 1.5rem;
}

.card-info {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #212529;
  line-height: 1;
}

.no-data {
  color: #6c757d;
  font-style: italic;
  font-size: 0.875rem;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 1.5rem;
  padding: 1.5rem;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 1.5rem;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #6c757d;
  font-style: italic;
  text-align: center;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-card {
    margin-bottom: 1rem;
  }
}

.btn-filter {
  background-color: white;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #495057;
  min-width: 200px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-filter:hover {
  background-color: #f8f9fa;
  border-color: #003366;
}

.dropdown-menu {
  width: 300px;
  padding: 1rem;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.dropdown-header {
  color: #003366;
  font-weight: 600;
  padding: 0;
  margin-bottom: 1rem;
}

.dropdown-divider {
  margin: 1rem 0;
}

.form-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
</style> 