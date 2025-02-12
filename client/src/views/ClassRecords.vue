<template>
  <div class="class-records">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex gap-2">
        <button class="btn btn-primary" @click="showAddStudentRecordModal = true">
          <i class="fas fa-user-plus"></i> Add Student Record
        </button>
        <button class="btn btn-primary" @click="showAddAssessmentModal = true">
          <i class="fas fa-plus"></i> Add Assessment
        </button>
      </div>
    </div>

    <!-- Records Table -->
    <div class="card">
      <div class="card-body">
        <!-- Table Controls -->
        <div class="table-controls mb-3">
          <div class="d-flex gap-2 align-items-center">
            <!-- Sort Dropdown -->
            <div class="dropdown">
              <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-sort"></i> Sort
              </button>
              <ul class="dropdown-menu">
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('studentNumber')">
                    Student Number <i :class="getSortIcon('studentNumber')"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('lastName')">
                    Name <i :class="getSortIcon('lastName')"></i>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Filter Dropdown -->
            <div class="dropdown">
              <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-filter"></i> Filter
              </button>
              <div class="dropdown-menu p-3" style="width: 250px">
                <div class="mb-3">
                  <label class="form-label">Year</label>
                  <select class="form-select form-select-sm" v-model="selectedYear" @change="applyFilters">
                    <option value="">Select Year</option>
                    <option v-for="year in availableYears" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Section</label>
                  <select class="form-select form-select-sm" v-model="selectedSection" @change="applyFilters">
                    <option value="">Select Section</option>
                    <option v-for="section in availableSections" :key="section" :value="section">
                      {{ section }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Subject</label>
                  <select class="form-select form-select-sm" v-model="selectedSubject" @change="applyFilters">
                    <option value="">Select Subject</option>
                    <option v-for="subject in teacherSubjects" :key="subject" :value="subject">
                      {{ subject }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Search Control -->
            <div class="d-flex align-items-center gap-2">
              <button 
                class="btn btn-outline-secondary btn-sm"
                @click="toggleSearch"
              >
                <i class="fas fa-search"></i>
              </button>
              <div v-if="showSearch" class="search-input">
                <input 
                  type="text" 
                  class="form-control form-control-sm" 
                  v-model="searchQuery"
                  placeholder="Search by name or number..."
                  @keyup.enter="handleSearch"
                >
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th v-for="assessment in assessments" :key="assessment.id">
                  <div class="assessment-header" @click="editAssessment(assessment)">
                      {{ assessment.type }} {{ assessment.number }}
                      <br>
                      <small>({{ assessment.maxScore }} pts)</small>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-if="sortedStudents.length > 0">
                <tr 
                  v-for="student in sortedStudents" 
                  :key="student.studentNumber"
                  @click="viewStudentDetails(student)"
                  class="clickable-row"
                >
                  <td>{{ student.studentNumber }}</td>
                  <td>{{ student.lastName }}</td>
                  <td>{{ student.firstName }}</td>
                  <td v-for="assessment in assessments" :key="assessment.id">
                    <input 
                      type="number" 
                      class="form-control form-control-sm score-input"
                      v-model="student.scores[assessment.id]"
                      :max="assessment.maxScore"
                      min="0"
                      @change="updateScore(student, assessment)"
                      @click.stop
                    >
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="5" class="text-center py-4">
                  <div class="empty-state-message">
                    <i class="fas fa-users text-muted mb-2"></i>
                    <p class="mb-0">No students found</p>
                    <p class="text-muted small" v-if="hasActiveFilters">
                      Try adjusting your filters
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Assessment Modal -->
    <div v-if="showAddAssessmentModal" class="modal fade show" style="display: block">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Assessment</h5>
            <button type="button" class="btn-close" @click="showAddAssessmentModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleAddAssessment">
              <!-- Assessment Type -->
              <div class="mb-3">
                <label class="form-label">Type</label>
                <select class="form-select" v-model="newAssessment.type" required>
                  <option value="">Select Type</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Activity">Activity</option>
                  <option value="Performance Task">Performance Task</option>
                </select>
              </div>

              <!-- Assessment Number -->
              <div class="mb-3">
                <label class="form-label">Number</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="newAssessment.number"
                  min="1"
                  required
                >
              </div>

              <!-- Max Score -->
              <div class="mb-3">
                <label class="form-label">Maximum Score</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="newAssessment.maxScore"
                  min="1"
                  required
                >
              </div>

              <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" @click="showAddAssessmentModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Add Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>

    <!-- Student Details Modal -->
    <div v-if="selectedStudent" class="modal-wrapper">
      <div class="modal">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h4 class="modal-title mb-0">
              <i class="fas fa-user-graduate me-2"></i>
              Student Details
            </h4>
            <button type="button" class="btn-close btn-close-white" @click="selectedStudent = null"></button>
          </div>
          <div class="modal-body">
            <!-- Student Information Card -->
            <div class="student-info-card mb-4">
              <div class="student-info-header">
                <i class="fas fa-info-circle me-2"></i>
                Student Information
              </div>
              <div class="student-info-content">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Student Number</label>
                    <span>{{ selectedStudent?.studentNumber }}</span>
                  </div>
                  <div class="info-item">
                    <label>Name</label>
                    <span>{{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Year & Section</label>
                    <span>{{ selectedYear }} - {{ selectedSection }}</span>
                  </div>
                  <div class="info-item">
                    <label>Subject</label>
                    <span>{{ selectedSubject }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Charts -->
            <div class="performance-card mb-4">
              <div class="performance-header">
                <i class="fas fa-chart-line me-2"></i>
                Performance Overview
                  <div class="ms-auto d-flex gap-2">
                    <div class="date-filter">
                      <button class="btn btn-sm btn-outline-light" @click="showChartDateFilter = true">
                        <i class="fas fa-calendar me-1"></i>
                        {{ chartDateRange.start ? formatDate(chartDateRange.start) : 'Start' }} - 
                        {{ chartDateRange.end ? formatDate(chartDateRange.end) : 'End' }}
                      </button>
                    </div>
                  </div>
              </div>
              <div class="performance-content">
                <div class="row">
                  <div class="col-md-4">
                    <div class="chart-container">
                      <h6>Quiz Scores</h6>
                      <canvas ref="quizChart"></canvas>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="chart-container">
                      <h6>Activity Scores</h6>
                      <canvas ref="activityChart"></canvas>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="chart-container">
                      <h6>Performance Task Scores</h6>
                      <canvas ref="performanceChart"></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Score History -->
            <div class="history-card">
              <div class="history-header">
                <i class="fas fa-history me-2"></i>
                Score History
                  <div class="ms-auto d-flex gap-2">
                    <div class="assessment-filter">
                      <select class="form-select form-select-sm" v-model="selectedAssessmentType">
                        <option value="">All Types</option>
                        <option value="Quiz">Quizzes</option>
                        <option value="Activity">Activities</option>
                        <option value="Performance Task">Performance Tasks</option>
                      </select>
                    </div>
                    <div class="date-filter">
                      <button class="btn btn-sm btn-outline-light" @click="showHistoryDateFilter = true">
                        <i class="fas fa-calendar me-1"></i>
                        {{ historyDateRange.start ? formatDate(historyDateRange.start) : 'Start' }} - 
                        {{ historyDateRange.end ? formatDate(historyDateRange.end) : 'End' }}
                      </button>
                    </div>
                  </div>
              </div>
              <div class="history-content">
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Assessment</th>
                        <th>Score</th>
                        <th>Max Score</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                        <tr v-for="assessment in filteredAssessments" :key="assessment.id">
                        <td>{{ formatDate(assessment.date) }}</td>
                        <td>
                          <span :class="'badge ' + getAssessmentBadgeClass(assessment.type)">
                            {{ assessment.type }}
                          </span>
                        </td>
                        <td>{{ assessment.number }}</td>
                        <td>{{ assessment.scores[selectedStudent.studentNumber] || 0 }}</td>
                        <td>{{ assessment.maxScore }}</td>
                        <td>
                          <span :class="getScoreClass((assessment.scores[selectedStudent.studentNumber] || 0) / assessment.maxScore * 100)">
                            {{ ((assessment.scores[selectedStudent.studentNumber] || 0) / assessment.maxScore * 100).toFixed(1) }}%
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
      </div>
      <div class="modal-backdrop" @click="selectedStudent = null"></div>
    </div>

    <!-- Chart Date Filter Modal -->
    <div v-if="showChartDateFilter" class="modal-wrapper">
      <div class="modal">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Filter Chart Date Range</h5>
              <button type="button" class="btn-close btn-close-white" @click="showChartDateFilter = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-control" v-model="chartDateRange.start">
              </div>
              <div class="mb-3">
                <label class="form-label">End Date</label>
                <input type="date" class="form-control" v-model="chartDateRange.end">
              </div>
              <div class="text-end">
                <button class="btn btn-secondary me-2" @click="clearChartDateFilter">Clear</button>
                <button class="btn btn-primary" @click="applyChartDateFilter">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="showChartDateFilter = false"></div>
    </div>

    <!-- History Date Filter Modal -->
    <div v-if="showHistoryDateFilter" class="modal-wrapper">
      <div class="modal">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Filter History Date Range</h5>
              <button type="button" class="btn-close btn-close-white" @click="showHistoryDateFilter = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-control" v-model="historyDateRange.start">
              </div>
              <div class="mb-3">
                <label class="form-label">End Date</label>
                <input type="date" class="form-control" v-model="historyDateRange.end">
              </div>
              <div class="text-end">
                <button class="btn btn-secondary me-2" @click="clearHistoryDateFilter">Clear</button>
                <button class="btn btn-primary" @click="applyHistoryDateFilter">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="showHistoryDateFilter = false"></div>
    </div>

    <!-- Add Student Record Modal -->
    <div v-if="showAddStudentRecordModal" class="modal fade show" style="display: block">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Student Record</h5>
            <button type="button" class="btn-close" @click="showAddStudentRecordModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleAddStudentRecord">
              <!-- Year Selection -->
              <div class="mb-3">
                <label class="form-label">Year</label>
                <select class="form-select" v-model="newStudentRecord.year" required>
                  <option value="">Select Year</option>
                  <option v-for="year in availableYears" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </div>

              <!-- Section Selection -->
              <div class="mb-3">
                <label class="form-label">Section</label>
                <select class="form-select" v-model="newStudentRecord.section" required>
                  <option value="">Select Section</option>
                  <option v-for="section in availableSections" :key="section" :value="section">
                    {{ section }}
                  </option>
                </select>
              </div>

              <!-- Subject Input -->
              <div class="mb-3">
                <label class="form-label">Subject</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newStudentRecord.subject" 
                  placeholder="Enter subject name"
                  required
                >
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="showAddStudentRecordModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="!canAddStudentRecord">
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>

    <!-- Edit Assessment Modal -->
    <div v-if="showEditAssessmentModal" class="modal fade show" style="display: block">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Assessment</h5>
            <button type="button" class="btn-close" @click="showEditAssessmentModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleEditAssessment">
              <!-- Assessment Type -->
              <div class="mb-3">
                <label class="form-label">Type</label>
                <select class="form-select" v-model="editingAssessment.type" required>
                  <option value="">Select Type</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Activity">Activity</option>
                  <option value="Performance Task">Performance Task</option>
                </select>
              </div>

              <!-- Assessment Number -->
              <div class="mb-3">
                <label class="form-label">Number</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="editingAssessment.number"
                  min="1"
                  required
                >
              </div>

              <!-- Max Score -->
              <div class="mb-3">
                <label class="form-label">Maximum Score</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="editingAssessment.maxScore"
                  min="1"
                  required
                >
              </div>

              <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-danger" @click="handleDeleteAssessment">
                  <i class="fas fa-trash me-1"></i> Delete Assessment
                </button>
                <div>
                <button type="button" class="btn btn-secondary me-2" @click="showEditAssessmentModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Save Changes
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import Chart from 'chart.js/auto'
import moment from 'moment'
import { useRouter } from 'vue-router'

export default {
  name: 'ClassRecords',
  setup() {
    const store = useStore()
    const router = useRouter()
    const user = ref(store.state.auth.user || {
      teachingYear: 'N/A',
      _id: null,
      firstName: '',
      lastName: ''
    })
    
    const selectedYear = ref(localStorage.getItem('selectedYear') || '')
    const selectedSection = ref(localStorage.getItem('selectedSection') || '')
    const selectedSubject = ref(localStorage.getItem('selectedSubject') || '')
    const searchQuery = ref('')
    const students = ref([])
    const assessments = ref([])
    const showAddAssessmentModal = ref(false)
    const selectedStudent = ref(null)
    const quizChart = ref(null)
    const activityChart = ref(null)
    const performanceChart = ref(null)
    const showAddStudentRecordModal = ref(false)
    const showSearch = ref(false)
    const sortField = ref('')
    const sortOrder = ref('asc')
    const newStudentRecord = ref({
      year: '',
      section: '',
      subject: ''
    })

    // Add new refs for filters
    const selectedAssessmentType = ref('')
    const showChartDateFilter = ref(false)
    const showHistoryDateFilter = ref(false)
    const chartDateRange = ref({
      start: '',
      end: ''
    })
    const historyDateRange = ref({
      start: '',
      end: ''
    })

    const newAssessment = ref({
      type: '',
      number: '',
      maxScore: ''
    })

    const availableYears = ref([])
    const availableSections = ref([])
    const teacherSubjects = ref([])

    const teachingYear = computed(() => {
      console.log('User object:', user.value);
      console.log('Teaching year:', user.value?.teachingYear);
      return user.value?.teachingYear || 'N/A';
    });

    // Get available subjects based on teaching year
    const availableSubjects = computed(() => {
      const year = teachingYear.value
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
          student.studentNumber.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        )
      })
    })

    // Sort students
    const sortedStudents = computed(() => {
      let sortedList = [...filteredStudents.value]

      if (sortField.value) {
        sortedList.sort((a, b) => {
          let aVal = a[sortField.value]
          let bVal = b[sortField.value]

          // Handle case-insensitive string comparison
          if (typeof aVal === 'string') aVal = aVal.toLowerCase()
          if (typeof bVal === 'string') bVal = bVal.toLowerCase()

          if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
          if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
          return 0
        })
      }

      return sortedList
    })

    // Sort functions
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortOrder.value = 'asc'
      }
    }

    const getSortIcon = (field) => {
      if (sortField.value !== field) return 'fas fa-sort'
      return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
    }

    // Search functions
    const toggleSearch = () => {
      showSearch.value = !showSearch.value
      if (!showSearch.value) {
        searchQuery.value = ''
      }
    }

    const handleSearch = () => {
      // Additional search logic can be added here if needed
      console.log('Searching for:', searchQuery.value)
    }

    // Filter functions
    const applyFilters = async () => {
      console.log('Applying filters:', {
        year: selectedYear.value,
        section: selectedSection.value,
        subject: selectedSubject.value
      })
      
      // Reset subject when year or section changes
      if (!selectedYear.value || !selectedSection.value) {
        selectedSubject.value = ''
        availableSubjects.value = []
      }
      
      // Fetch available subjects when year and section are selected
      if (selectedYear.value && selectedSection.value) {
        await updateTeacherSubjects()
      }
      
      // Fetch students and assessments if all filters are selected
      if (selectedYear.value && selectedSection.value && selectedSubject.value) {
        await Promise.all([
          fetchClassData(),
          fetchAssessments()
        ])
      }
    }

    // Computed property to check if record can be added
    const canAddStudentRecord = computed(() => {
      return newStudentRecord.value.year && 
             newStudentRecord.value.section && 
             newStudentRecord.value.subject
    })

    // Fetch class data
    const fetchClassData = async () => {
      if (!selectedYear.value || !selectedSection.value || !selectedSubject.value) return

      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id || user.value?._id

        if (!teacherId) {
          console.error('Teacher ID is not available')
          return
        }

        const response = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: {
            teacherId,
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data && response.data.length > 0) {
          const record = response.data[0]
          students.value = record.students.map(student => ({
            ...student,
            scores: student.scores || {},
            assessments: student.assessments || []
          }))
          assessments.value = record.assessments || []
        } else {
          students.value = []
          assessments.value = []
        }
      } catch (error) {
        console.error('Failed to fetch class data:', error)
        if (error.response?.status === 401) {
          store.dispatch('logout')
          router.push('/login')
        } else {
          alert('Failed to fetch class data. Please try again.')
        }
      }
    }

    // Handle adding new assessment
    const handleAddAssessment = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id || user.value?._id

        if (!teacherId) {
          alert('Teacher ID is not available. Please try logging in again.')
          store.dispatch('logout')
          router.push('/login')
          return
        }

        if (!selectedSection.value || !selectedSubject.value) {
          alert('Please select a section and subject before adding an assessment.')
          return
        }

        // Validate assessment data
        if (!newAssessment.value.type || !newAssessment.value.number || !newAssessment.value.maxScore) {
          alert('Please fill in all assessment fields.')
          return
        }

        // Check for assessment limit per day
        const today = new Date().toISOString().split('T')[0]
        const todaysAssessments = assessments.value.filter(assessment => {
          const assessmentDate = new Date(assessment.date).toISOString().split('T')[0]
          return assessmentDate === today
        })

        if (todaysAssessments.length >= 5) {
          alert('Maximum limit of 5 assessments per day has been reached.')
          return
        }

        // First, create the assessment in the assessments collection
        const assessmentData = {
          ...newAssessment.value,
          teacherId,
          section: selectedSection.value,
          subject: selectedSubject.value,
          date: new Date().toISOString()
        }

        console.log('Creating assessment with data:', assessmentData)

        const assessmentResponse = await axios.post(
          'http://localhost:8000/api/assessments', 
          assessmentData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (!assessmentResponse.data) {
          throw new Error('Failed to create assessment')
        }

        console.log('Assessment created:', assessmentResponse.data)

        // Add the new assessment to the local state
        const newAssessmentWithId = {
          ...assessmentResponse.data,
          id: assessmentResponse.data._id
        }
        
        // Update the assessments array
        assessments.value = [...assessments.value, newAssessmentWithId]

        // Initialize scores for all students for this assessment
        students.value.forEach(student => {
          if (!student.scores) {
            student.scores = {}
          }
          student.scores[newAssessmentWithId.id] = null
        })

        // Close the modal and reset the form
        showAddAssessmentModal.value = false
        newAssessment.value = { type: '', number: '', maxScore: '' }

        // Show success message
        alert('Assessment added successfully!')
      } catch (error) {
        console.error('Failed to add assessment:', error)
        const errorMessage = error.response?.data?.message || error.message || 'Please try again.'
        alert('Failed to add assessment: ' + errorMessage)
      }
    }

    // Fetch assessments for the current section and subject
    const fetchAssessments = async () => {
      try {
        if (!selectedSection.value || !selectedSubject.value) return;

        const teacherId = store.state.auth.user?._id || user.value?._id;
        const response = await axios.get('http://localhost:8000/api/assessments', {
          params: {
            teacherId,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });

        // Map the assessments and initialize scores
        assessments.value = response.data.map(assessment => ({
          ...assessment,
          id: assessment._id
        }));

        // Initialize scores for all students
        students.value.forEach(student => {
          if (!student.scores) {
            student.scores = {};
          }
          assessments.value.forEach(assessment => {
            if (!student.scores[assessment.id]) {
              // Access scores directly from the object using studentNumber
              student.scores[assessment.id] = assessment.scores?.[student.studentNumber] || null;
            }
          });
        });

        console.log('Fetched assessments:', assessments.value);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        alert('Failed to load assessments. Please try again.');
      }
    };

    // Update student score
    const updateScore = async (student, assessment) => {
      try {
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id || user.value?._id;
        const score = parseFloat(student.scores[assessment.id]);

        // Validate score
        if (score === null || isNaN(score) || score === undefined || score === '') {
          student.scores[assessment.id] = null;
          return;
        }

        if (score < 0 || score > assessment.maxScore) {
          alert(`Score must be between 0 and ${assessment.maxScore}`);
          student.scores[assessment.id] = null;
          return;
        }

        console.log('Updating score with data:', {
          teacherId,
          studentNumber: student.studentNumber,
          assessmentId: assessment._id || assessment.id,
          score
        });

        // Update score in the assessments collection
        const assessmentResponse = await axios.put(
          'http://localhost:8000/api/assessments/score',
          {
            teacherId,
            studentNumber: student.studentNumber,
            assessmentId: assessment._id || assessment.id,
            score
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!assessmentResponse.data) {
          throw new Error('Failed to update score');
        }

        // Update the local assessment scores
        const updatedAssessment = assessmentResponse.data.assessment;
        const assessmentIndex = assessments.value.findIndex(a => 
          a._id === (assessment._id || assessment.id)
        );
        
        if (assessmentIndex !== -1) {
          // Update the assessment in the array
          assessments.value[assessmentIndex] = {
            ...updatedAssessment,
            id: updatedAssessment._id
          };

          // Ensure the student's scores are updated
          if (!student.scores) {
            student.scores = {};
          }
          student.scores[assessment.id] = score;
        }

        // Update the student's assessment history
        if (!student.assessments) {
          student.assessments = [];
        }

        const assessmentRecord = {
          id: assessment._id || assessment.id,
          type: assessment.type,
          number: assessment.number,
          score: score,
          maxScore: assessment.maxScore,
          date: new Date().toISOString()
        };

        const existingIndex = student.assessments.findIndex(a => 
          a.id === (assessment._id || assessment.id)
        );
        
        if (existingIndex !== -1) {
          student.assessments[existingIndex] = assessmentRecord;
        } else {
          student.assessments.push(assessmentRecord);
        }

        // If this student is currently selected, update their details view
        if (selectedStudent.value && selectedStudent.value.studentNumber === student.studentNumber) {
          selectedStudent.value = {
            ...student,
            assessments: student.assessments
          };
        }

        console.log('Score updated successfully');
      } catch (error) {
        console.error('Failed to update score:', error);
        alert('Failed to update score. Please try again.');
        // Refresh data to ensure UI is in sync with database
        await fetchAssessments();
      }
    };

    // View student details
    const viewStudentDetails = async (student) => {
      try {
        // Get all assessments for this student's section and subject
        const assessmentsResponse = await axios.get('http://localhost:8000/api/assessments', {
          params: {
            teacherId: store.state.auth.user?._id,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });

        // Map the assessments to include scores
        const studentAssessments = assessmentsResponse.data.map(assessment => ({
          id: assessment._id,
          type: assessment.type,
          number: assessment.number,
          maxScore: assessment.maxScore,
          date: assessment.date,
          scores: assessment.scores || {},
        }));

        // Update the selected student with the fetched assessments
        selectedStudent.value = {
          ...student,
          assessments: studentAssessments
        };

        // Set default date range to today
        const today = new Date().toISOString().split('T')[0];
        chartDateRange.value = {
          start: today,
          end: today
        };

        // Filter assessments for today by default
        const todaysAssessments = studentAssessments.filter(assessment => {
          const assessmentDate = new Date(assessment.date).toISOString().split('T')[0];
          return assessmentDate === today;
        });

        // Group today's assessments by type for charts
        const assessmentsByType = {
          Quiz: [],
          Activity: [],
          'Performance Task': []
        };

        todaysAssessments.forEach(assessment => {
          const score = assessment.scores[student.studentNumber];
          if (assessment.type in assessmentsByType) {
            assessmentsByType[assessment.type].push({
              number: assessment.number,
              score: score || 0,
              maxScore: assessment.maxScore,
              date: assessment.date,
              type: assessment.type
            });
          }
        });

        // Destroy existing charts
        [quizChart, activityChart, performanceChart].forEach(chartRef => {
          if (chartRef.value) {
            const existingChart = Chart.getChart(chartRef.value);
            if (existingChart) {
              existingChart.destroy();
            }
          }
        });

        // Wait for the next tick to ensure the canvases are mounted
        await nextTick();

        // Create new charts with today's data
        Object.entries(assessmentsByType).forEach(([type, data]) => {
          if (data.length > 0) {
            const chartRef = type === 'Quiz' ? quizChart :
                            type === 'Activity' ? activityChart :
                            performanceChart;

            const sortedData = data.sort((a, b) => a.number - b.number);
            
            if (chartRef.value) {
              createChart(chartRef, {
                type,
                labels: sortedData.map(a => `#${a.number}`),
                scores: sortedData.map(a => (a.score / a.maxScore * 100))
              });
            }
          }
        });

      } catch (error) {
        console.error('Error fetching student details:', error);
        alert('Failed to load student details. Please try again.');
      }
    };

    // Format date
    const formatDate = (date) => {
      return moment(date).format('MMM D, YYYY')
    }

    // Function to update teacher subjects
    const updateTeacherSubjects = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id || user.value?._id

        if (!teacherId || !selectedYear.value || !selectedSection.value) {
          teacherSubjects.value = []
          return
        }

        const response = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: { 
            teacherId,
            year: selectedYear.value,
            section: selectedSection.value
          },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        // Extract unique subjects from teacher's records
        const subjects = new Set(response.data.map(record => record.subject))
        teacherSubjects.value = Array.from(subjects).sort()

        // If no subject is selected but we have subjects available, select the first one
        if (!selectedSubject.value && teacherSubjects.value.length > 0) {
          selectedSubject.value = teacherSubjects.value[0]
        }
      } catch (error) {
        console.error('Failed to fetch teacher subjects:', error)
      }
    }

    // Handle adding new student record
    const handleAddStudentRecord = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id || user.value?._id

        if (!teacherId) {
          console.error('Teacher ID is not available')
          alert('Teacher information is not available. Please try logging in again.')
          store.dispatch('logout')
          router.push('/login')
          return
        }

        console.log('Starting to add student record with:', {
          year: newStudentRecord.value.year,
          section: newStudentRecord.value.section,
          subject: newStudentRecord.value.subject
        });

        // First, fetch students from the selected year and section
        const studentsResponse = await axios.get('http://localhost:8000/api/students/by-section', {
          params: {
            year: newStudentRecord.value.year,
            section: newStudentRecord.value.section
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('Students fetched:', studentsResponse.data);

        if (!studentsResponse.data || studentsResponse.data.length === 0) {
          alert('No students found in the selected year and section.')
          return
        }

        // Create basic class record entries for the teacher
        const classRecordData = {
          teacherId,
          year: newStudentRecord.value.year,
          section: newStudentRecord.value.section,
          subject: newStudentRecord.value.subject,
          students: studentsResponse.data.map(student => ({
            studentId: student._id,
            studentNumber: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            year: student.year,
            section: student.section
          }))
        }

        console.log('Creating class record with data:', classRecordData);

        // Save the class record
        const createResponse = await axios.post('http://localhost:8000/api/teacher-class-records/create', 
          classRecordData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (createResponse.data.success) {
          showAddStudentRecordModal.value = false
          newStudentRecord.value = { year: '', section: '', subject: '' }
          await updateTeacherSubjects() // Update the subjects list
          await fetchClassData()
          alert('Student records have been added successfully!')
        } else {
          throw new Error('Failed to create class records')
        }
      } catch (error) {
        console.error('Failed to add class records:', error)
        alert('Failed to add class records. ' + (error.response?.data?.message || error.message || 'Please try again.'))
      }
    }

    // Watch for changes in year selection
    watch(selectedYear, async (newYear) => {
      selectedSection.value = ''
      selectedSubject.value = ''
      localStorage.setItem('selectedYear', newYear)
      if (newYear) {
        await fetchAvailableSections()
      } else {
        availableSections.value = []
        teacherSubjects.value = []
      }
    })

    // Watch for changes in section selection
    watch(selectedSection, async (newSection) => {
      selectedSubject.value = ''
      localStorage.setItem('selectedSection', newSection)
      if (newSection) {
        await updateTeacherSubjects()
      } else {
        teacherSubjects.value = []
      }
    })

    // Watch for changes in subject selection
    watch(selectedSubject, async (newSubject) => {
      localStorage.setItem('selectedSubject', newSubject)
      if (newSubject) {
        await Promise.all([
          fetchClassData(),
          fetchAssessments()
        ])
      }
    })

    // Add clearFilters function
    const clearFilters = () => {
      selectedYear.value = ''
      selectedSection.value = ''
      selectedSubject.value = ''
      availableSections.value = []
      teacherSubjects.value = []
      localStorage.removeItem('selectedYear')
      localStorage.removeItem('selectedSection')
      localStorage.removeItem('selectedSubject')
      // Refetch available years after clearing
      fetchAvailableYears()
    }

    // Add onMounted hook to fetch initial data
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
        try {
          const token = store.state.auth.token
          const response = await axios.get('http://localhost:8000/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.data && response.data.role === 'teacher') {
            user.value = response.data
            console.log('Teacher data loaded:', user.value)
            
            // Fetch available years first
            await fetchAvailableYears()
            
            // If year is selected, fetch sections
            if (selectedYear.value) {
              await fetchAvailableSections()
              
              // If section is selected, fetch subjects
              if (selectedSection.value) {
                await updateTeacherSubjects()
                
                // If subject is selected, fetch class data and assessments
                if (selectedSubject.value) {
                  await Promise.all([
                    fetchClassData(),
                    fetchAssessments()
                  ])
                }
              }
            }
          } else {
            console.error('User is not a teacher')
            router.push('/login')
          }
        } catch (error) {
          console.error('Failed to fetch teacher data:', error)
          if (error.response?.status === 401) {
            store.dispatch('logout')
            router.push('/login')
          }
        }
      } else {
        router.push('/login')
      }
    })

    // Add these new methods in the setup function
    const getAssessmentBadgeClass = (type) => {
      switch (type) {
        case 'Quiz': return 'badge-quiz'
        case 'Activity': return 'badge-activity'
        case 'Performance Task': return 'badge-performance'
        default: return ''
      }
    }

    const getScoreClass = (percentage) => {
      if (percentage >= 90) return 'score-excellent'
      if (percentage >= 80) return 'score-good'
      if (percentage >= 70) return 'score-average'
      return 'score-poor'
    }

    // Watch for changes in section or subject
    watch([selectedSection, selectedSubject], async () => {
      if (selectedSection.value && selectedSubject.value) {
        await fetchClassData()
        await fetchAssessments()
      }
    })

    const createChart = (chartRef, data) => {
      // Destroy existing chart if it exists
      if (chartRef.value) {
        const existingChart = Chart.getChart(chartRef.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }

      const chartColors = {
        Quiz: '#4e73df',
        Activity: '#1cc88a',
        'Performance Task': '#f6c23e'
      };

      const chartConfig = {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.scores,
            backgroundColor: chartColors[data.type],
            borderRadius: 6,
            maxBarThickness: 40,
            borderSkipped: false
          }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#203464',
            bodyColor: '#203464',
            borderColor: '#e9ecef',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: '#f8f9fa',
              drawBorder: false
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11
              },
              callback: function(value) {
                return value + '%';
                }
              }
            }
          }
        }
      };

      return new Chart(chartRef.value, chartConfig);
    };

    const updateCharts = () => {
      // Destroy existing charts
      [quizChart, activityChart, performanceChart].forEach(chartRef => {
        if (chartRef.value) {
          const existingChart = Chart.getChart(chartRef.value);
          if (existingChart) {
            existingChart.destroy();
          }
        }
      });

      if (!selectedStudent.value) return;

      const chartTypes = {
        Quiz: quizChart,
        Activity: activityChart,
        'Performance Task': performanceChart
      };

      // Create new charts for each assessment type
      Object.entries(chartTypes).forEach(([type, chartRef]) => {
        const assessments = selectedStudent.value.assessments
          .filter(a => a.type === type)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (assessments.length > 0) {
          const data = {
            type,
            labels: assessments.map(a => formatDate(a.date)),
            scores: assessments.map(a => (a.score / a.maxScore * 100).toFixed(1))
          };

          createChart(chartRef, data);
        }
      });
    };

    // Add these to the setup function
    const showEditAssessmentModal = ref(false)
    const editingAssessment = ref({
      type: '',
      number: '',
      maxScore: ''
    })

    const editAssessment = (assessment) => {
      editingAssessment.value = { ...assessment }
      showEditAssessmentModal.value = true
    }

    const handleEditAssessment = async () => {
      try {
        const token = store.state.auth.token
        const response = await axios.put(
          `http://localhost:8000/api/assessments/${editingAssessment.value._id}`,
          {
            type: editingAssessment.value.type,
            number: editingAssessment.value.number,
            maxScore: editingAssessment.value.maxScore
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.data) {
          // Update the assessment in the local state
          const index = assessments.value.findIndex(a => a._id === editingAssessment.value._id)
          if (index !== -1) {
            assessments.value[index] = {
              ...response.data,
              id: response.data._id
            }
          }

          // Close modal and show success message
          showEditAssessmentModal.value = false
          alert('Assessment updated successfully!')
        }
      } catch (error) {
        console.error('Failed to update assessment:', error)
        alert('Failed to update assessment. Please try again.')
      }
    }

    const handleDeleteAssessment = async () => {
      if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
        return
      }

      try {
        const token = store.state.auth.token
        await axios.delete(
          `http://localhost:8000/api/assessments/${editingAssessment.value._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        // Remove the assessment from the local state
        assessments.value = assessments.value.filter(a => a._id !== editingAssessment.value._id)
        
        // Close modal and show success message
        showEditAssessmentModal.value = false
        alert('Assessment deleted successfully!')
      } catch (error) {
        console.error('Failed to delete assessment:', error)
        alert('Failed to delete assessment. Please try again.')
      }
    }

    // Fetch available years for the teacher
    const fetchAvailableYears = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id || user.value?._id

        if (!teacherId) return

        const response = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        // Extract unique years from teacher's records
        const years = new Set(response.data.map(record => record.year))
        availableYears.value = Array.from(years).sort()

        // If no year is selected but we have years available, select the first one
        if (!selectedYear.value && availableYears.value.length > 0) {
          selectedYear.value = availableYears.value[0]
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error)
      }
    }

    // Fetch available sections for the selected year
    const fetchAvailableSections = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id || user.value?._id

        if (!teacherId || !selectedYear.value) {
          availableSections.value = []
          return
        }

        const response = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: { 
            teacherId,
            year: selectedYear.value
          },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        // Extract unique sections from teacher's records for the selected year
        const sections = new Set(response.data.map(record => record.section))
        availableSections.value = Array.from(sections).sort()

        // If no section is selected but we have sections available, select the first one
        if (!selectedSection.value && availableSections.value.length > 0) {
          selectedSection.value = availableSections.value[0]
        }
      } catch (error) {
        console.error('Failed to fetch available sections:', error)
      }
    }

    // Add computed property for filtered assessments
    const filteredAssessments = computed(() => {
      if (!selectedStudent.value?.assessments) return [];

      return selectedStudent.value.assessments.filter(assessment => {
        let passesTypeFilter = true;
        let passesDateFilter = true;

        // Apply assessment type filter
        if (selectedAssessmentType.value) {
          passesTypeFilter = assessment.type === selectedAssessmentType.value;
        }

        // Apply date filter
        if (historyDateRange.value.start && historyDateRange.value.end) {
          const assessmentDate = new Date(assessment.date);
          const startDate = new Date(historyDateRange.value.start);
          const endDate = new Date(historyDateRange.value.end);
          passesDateFilter = assessmentDate >= startDate && assessmentDate <= endDate;
        }

        return passesTypeFilter && passesDateFilter;
      });
    });

    // Add filter handling functions
    const applyChartDateFilter = () => {
      if (chartDateRange.value.start && chartDateRange.value.end) {
        // Destroy existing charts first
        [quizChart, activityChart, performanceChart].forEach(chartRef => {
          if (chartRef.value) {
            const existingChart = Chart.getChart(chartRef.value);
            if (existingChart) {
              existingChart.destroy();
            }
          }
        });

        // Filter assessments by date range
        const filteredAssessments = selectedStudent.value.assessments.filter(assessment => {
          const assessmentDate = new Date(assessment.date);
          const startDate = new Date(chartDateRange.value.start);
          const endDate = new Date(chartDateRange.value.end);
          return assessmentDate >= startDate && assessmentDate <= endDate;
        });

        // Group assessments by type
        const assessmentsByType = {
          Quiz: [],
          Activity: [],
          'Performance Task': []
        };

        filteredAssessments.forEach(assessment => {
          const score = assessment.scores[selectedStudent.value.studentNumber];
          if (assessment.type in assessmentsByType) {
            assessmentsByType[assessment.type].push({
              number: assessment.number,
              score: score || 0,
              maxScore: assessment.maxScore,
              date: assessment.date,
              type: assessment.type
            });
          }
        });

        // Wait for the next tick to ensure the canvases are ready
        nextTick(() => {
          // Update charts with filtered data
          Object.entries(assessmentsByType).forEach(([type, data]) => {
            if (data.length > 0) {
              const chartRef = type === 'Quiz' ? quizChart :
                              type === 'Activity' ? activityChart :
                              performanceChart;

              const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
              
              if (chartRef.value) {
                createChart(chartRef, {
                  type,
                  labels: sortedData.map(a => formatDate(a.date)),
                  scores: sortedData.map(a => (a.score / a.maxScore * 100).toFixed(1))
                });
              }
            }
          });
        });
      }
      showChartDateFilter.value = false;
    };

    const clearChartDateFilter = () => {
      chartDateRange.value = { start: '', end: '' };
      // Destroy existing charts first
      [quizChart, activityChart, performanceChart].forEach(chartRef => {
        if (chartRef.value) {
          const existingChart = Chart.getChart(chartRef.value);
          if (existingChart) {
            existingChart.destroy();
          }
        }
      });
      // Wait for the next tick before recreating charts
      nextTick(() => {
        updateCharts();
      });
      showChartDateFilter.value = false;
    };

    const applyHistoryDateFilter = () => {
      showHistoryDateFilter.value = false;
    };

    const clearHistoryDateFilter = () => {
      historyDateRange.value = { start: '', end: '' };
      showHistoryDateFilter.value = false;
    };

    // Watch for assessment type changes
    watch(selectedAssessmentType, () => {
      // The computed filteredAssessments will automatically update
    });

    const handleLogout = async () => {
      try {
        await store.dispatch('logout')
        router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    return {
      selectedYear,
      selectedSection,
      selectedSubject,
      searchQuery,
      students,
      assessments,
      filteredStudents,
      teacherSubjects,
      availableYears,
      availableSections,
      showAddAssessmentModal,
      newAssessment,
      selectedStudent,
      quizChart,
      activityChart,
      performanceChart,
      handleAddAssessment,
      updateScore,
      viewStudentDetails,
      formatDate,
      user,
      showAddStudentRecordModal,
      newStudentRecord,
      canAddStudentRecord,
      handleAddStudentRecord,
      clearFilters,
      sortField,
      sortOrder,
      sortBy,
      getSortIcon,
      sortedStudents,
      showSearch,
      toggleSearch,
      handleSearch,
      applyFilters,
      getAssessmentBadgeClass,
      getScoreClass,
      updateCharts,
      showEditAssessmentModal,
      editingAssessment,
      editAssessment,
      handleEditAssessment,
      handleDeleteAssessment,
      selectedAssessmentType,
      showChartDateFilter,
      showHistoryDateFilter,
      chartDateRange,
      historyDateRange,
      filteredAssessments,
      applyChartDateFilter,
      clearChartDateFilter,
      applyHistoryDateFilter,
      clearHistoryDateFilter,
      handleLogout
    }
  }
}
</script>

<style scoped>
/* Remove the top-navbar styles */
.class-records {
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  min-height: calc(100vh - 70px);
}

.card {
  background: white;
  border: none;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table {
  margin-bottom: 0;
}

.table th {
  background-color: #f8f9fa;
  color: #666;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-top: none;
  white-space: nowrap;
  text-align: left;
}

.table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  border-color: #eee;
  text-align: left;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn i {
  font-size: 0.875rem;
}

.btn-outline-secondary {
  border: 1px solid #dee2e6;
  color: #6c757d;
  background-color: white;
}

.btn-outline-secondary:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
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

.table-controls {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  position: relative;
  min-width: 200px;
}

.search-input .form-control {
  border: 1px solid #dee2e6;
  padding-right: 2rem;
}

.dropdown-menu {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: none;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #495057;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  margin-left: 0.5rem;
  color: #6c757d;
}

.form-select-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}

.empty-state-message {
  padding: 2rem 0;
}

.empty-state-message i {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-state-message p {
  margin: 0;
  color: #6c757d;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: rgba(0, 51, 102, 0.05) !important;
}

.form-control:focus,
.form-select:focus {
  border-color: #003366;
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.25);
}

.gap-2 {
  gap: 0.5rem;
}

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  cursor: pointer;
}

.modal-dialog {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 1.75rem;
  pointer-events: auto;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #203464;
  color: #fff;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 1.5rem;
  max-height: calc(100vh - 210px);
  overflow-y: auto;
}

.btn-close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  padding: 0.5rem;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.2s;
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
}

.btn-close:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.3);
}

.btn-close::before {
  content: "×";
  position: absolute;
  font-size: 24px;
  line-height: 1;
  color: white;
}

/* Ensure form-check elements are clickable in the modal */
.modal .form-check {
  position: relative;
  z-index: 1061;
}

/* Student Details Modal Styles */
.student-info-card,
.performance-card,
.history-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  height: 100%;
}

.student-info-header,
.performance-header,
.history-header {
  background: #203464;
  padding: 1.25rem;
  font-weight: 600;
  color: #fff;
  border-bottom: none;
  display: flex;
  align-items: center;
}

.student-info-content,
.performance-content,
.history-content {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(32, 52, 100, 0.15);
  border-color: #203464;
}

.info-item label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.info-item span {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
}

.chart-container {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  height: 300px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.chart-container:hover {
  border-color: #203464;
}

.chart-container h6 {
  color: #203464;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.badge {
  padding: 0.5em 0.75em;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 6px;
}

.badge-quiz {
  background: linear-gradient(135deg, #4e73df 0%, #3867d6 100%);
  color: white;
}

.badge-activity {
  background: linear-gradient(135deg, #1cc88a 0%, #16a085 100%);
  color: white;
}

.badge-performance {
  background: linear-gradient(135deg, #f6c23e 0%, #f39c12 100%);
  color: white;
}

.history-card .table {
  margin: 0;
}

.history-card .table th {
  background: #203464;
  font-weight: 600;
  color: #fff;
  padding: 1rem;
  border: none;
}

.history-card .table td {
  padding: 1rem;
  vertical-align: middle;
  border-color: #f8f9fa;
}

.history-card .table tr:hover {
  background: rgba(32, 52, 100, 0.05);
}

.modal-content {
  border: none;
  border-radius: 15px;
  overflow: hidden;
}

.modal-header {
  background-color: #203464 !important;
  color: #fff !important;
  border-bottom: none;
}

.btn-close {
  color: #fff !important;
  opacity: 0.75;
}

.btn-close:hover {
  opacity: 1;
}

.score-input {
  width: 60px !important;
  padding: 0.25rem !important;
  text-align: center;
  font-size: 0.875rem;
  height: auto !important;
  min-height: 30px;
  margin: 0 auto;
  display: block;
}

.score-input::-webkit-inner-spin-button,
.score-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.score-input[type=number] {
  -moz-appearance: textfield;
}

/* Table alignment styles */
.table th, .table td {
  text-align: center !important;
  vertical-align: middle !important;
  padding: 0.75rem 0.5rem !important;
}

.table td:nth-child(-n+3),
.table th:nth-child(-n+3) {
  text-align: left !important;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}

.assessment-header {
  text-align: center;
  cursor: pointer;
  padding: 0.25rem;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  min-width: 100px;
  max-width: 120px;
  margin: 0 auto;
  display: block;
}

.assessment-header:hover {
  background-color: rgba(0, 51, 102, 0.05);
}

.assessment-header small {
  display: block;
  color: #6c757d;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  text-align: center;
}

td:has(.score-input) {
  text-align: center !important;
  vertical-align: middle !important;
  padding: 0.5rem 0.25rem !important;
}

/* Add styles for filters */
.date-filter button {
  font-size: 0.875rem;
  padding: 0.375rem 1rem;
  border-radius: 6px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  transition: all 0.2s ease;
}

.date-filter button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.assessment-filter .form-select {
  font-size: 0.875rem;
  padding: 0.25rem 2rem 0.25rem 0.75rem;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  min-width: 120px;
}

.assessment-filter .form-select:focus {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.1);
}

.assessment-filter .form-select option {
  background-color: #203464;
  color: #fff;
}

.performance-header,
.history-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
}

.modal-dialog {
  margin: 1.75rem auto;
}

.modal-content {
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  background-color: #203464;
  color: #fff;
  border-bottom: none;
  padding: 1rem 1.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-control[type="date"] {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.form-control[type="date"]:focus {
  border-color: #203464;
  box-shadow: 0 0 0 0.2rem rgba(32, 52, 100, 0.25);
}

.btn-close {
  color: #fff;
  opacity: 0.75;
}

.btn-close:hover {
  opacity: 1;
}

/* Add specific class for date filter modals */
.modal-dialog.date-filter-dialog {
  max-width: 400px;
}

/* Update modal styles */
.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 1.5rem;
  max-height: calc(100vh - 210px);
  overflow-y: auto;
}

/* Date filter specific styles */
.date-filter button {
  font-size: 0.875rem;
  padding: 0.375rem 1rem;
  border-radius: 6px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  transition: all 0.2s ease;
}

.date-filter button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* Form control styles for date inputs */
input[type="date"].form-control {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  width: 100%;
  font-size: 0.9rem;
}

input[type="date"].form-control:focus {
  border-color: #203464;
  box-shadow: 0 0 0 0.2rem rgba(32, 52, 100, 0.25);
}

/* Update modal styles */
.modal-sm {
  max-width: 400px !important;
  margin: 1.75rem auto;
}

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  cursor: pointer;
}

.modal-dialog {
  position: relative;
  width: 100%;
  pointer-events: auto;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}
</style> 