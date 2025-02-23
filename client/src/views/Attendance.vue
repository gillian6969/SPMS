<template>
  <div class="attendance">
    <div class="d-flex justify-content-between align-items-center mb-4">
      
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

        <!-- Table Controls -->
        <div class="table-controls mb-4">
          <div class="d-flex gap-3 align-items-center">
            <!-- Sort Dropdown -->
            <div class="dropdown">
              <button class="btn btn-control dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-sort me-2"></i> Sort by
              </button>
              <ul class="dropdown-menu control-menu">
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('studentId')">
                    <i class="fas fa-sort-numeric-down me-2"></i> Student ID
                    <i :class="getSortIcon('studentId')" class="ms-auto"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('lastName')">
                    <i class="fas fa-sort-alpha-down me-2"></i> Name
                    <i :class="getSortIcon('lastName')" class="ms-auto"></i>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Filter Dropdown -->
            <div class="dropdown">
              <button class="btn btn-control dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-filter me-2"></i> Filter
                <span v-if="hasActiveFilters" class="filter-badge">!</span>
              </button>
              <div class="dropdown-menu control-menu p-3" style="width: 280px">
                <h6 class="dropdown-header mb-2">Filter Options</h6>
                <div class="mb-3">
                  <label class="form-label">Year Level</label>
                  <select class="form-select form-select-sm" v-model="selectedYear" @change="applyFilters">
                    <option value="">All Years</option>
                    <option v-for="year in availableYears" :value="year">{{ year }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Section</label>
                  <select class="form-select form-select-sm" v-model="selectedSection" @change="applyFilters">
                    <option value="">All Sections</option>
                    <option v-for="section in availableSections" :value="section">{{ section }}</option>
                  </select>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-3">
                  <button class="btn btn-sm btn-light" @click="clearFilters">
                    Clear All
                  </button>
                  <button class="btn btn-sm btn-primary" @click="applyFilters">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            <!-- Search Control -->
            <div class="search-control">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="searchQuery"
                  placeholder="Search students..."
                  @input="handleSearch"
                >
                <button 
                  v-if="searchQuery"
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="clearSearch"
                >
                  <i class="fas fa-times"></i>
                </button>
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
                <th class="text-center">Attendance</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="sortedStudents.length > 0">
            <tr 
              v-for="student in sortedStudents" 
              :key="student.studentId"
              @click="viewAttendanceHistory(student)"
              class="cursor-pointer"
            >
              <td>{{ student.studentNumber }}</td>
                  <td>{{ student.lastName }}</td>
                  <td>{{ student.firstName }}</td>
                  <td class="text-center">
                <div class="form-check form-check-inline" @click.stop>
                      <input 
                        class="form-check-input" 
                    type="radio"
                    :name="'attendance-' + student.studentId"
                    :checked="isPresent(student) === 'present'"
                    @change="toggleAttendance(student, 'present')"
                        :disabled="!canEditAttendance"
                      >
                  <label class="form-check-label">Present</label>
                    </div>
                <div class="form-check form-check-inline" @click.stop>
                  <input 
                    class="form-check-input"
                    type="radio"
                    :name="'attendance-' + student.studentId"
                    :checked="isPresent(student) === 'late'"
                    @change="toggleAttendance(student, 'late')"
                    :disabled="!canEditAttendance"
                  >
                  <label class="form-check-label">Late</label>
                </div>
                <div class="form-check form-check-inline" @click.stop>
                  <input 
                    class="form-check-input" 
                    type="radio"
                    :name="'attendance-' + student.studentId"
                    :checked="!isPresent(student)"
                    @change="toggleAttendance(student, 'absent')"
                    :disabled="!canEditAttendance"
                  >
                  <label class="form-check-label">Absent</label>
                </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
            <td colspan="4" class="text-center py-4">
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

    <!-- Attendance History Modal -->
    <div v-if="selectedStudent" class="modal-wrapper" @click.self="selectedStudent = null">
      <div class="modal">
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
      </div>
      <div class="modal-backdrop" @click="selectedStudent = null"></div>
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
    const selectedYear = ref(localStorage.getItem('selectedYear') || '')
    const selectedSection = ref(localStorage.getItem('selectedSection') || '')
    const selectedSubject = ref(localStorage.getItem('selectedSubject') || '')
    const searchQuery = ref('')
    const students = ref([])
    const selectedStudent = ref(null)
    const attendanceChart = ref(null)
    const showSearch = ref(false)
    const sortField = ref('')
    const sortOrder = ref('asc')
    const availableYears = ref([])
    const availableSections = ref([])
    const availableSubjects = ref([])

    // Get today's date
    const today = moment().format('YYYY-MM-DD')
    const isToday = computed(() => selectedDate.value === today)

    // Check if attendance can be edited (only allow editing for current day)
    const canEditAttendance = computed(() => selectedDate.value === today)

    // Check if class records exist
    const checkClassRecords = async () => {
      try {
        if (!user.value?._id) {
          console.error('User ID not available')
          return
        }

        const token = store.state.auth.token
        if (!token) {
          console.error('Authentication token not available')
          return
        }

        console.log('Checking class records for teacher:', user.value._id)
        const response = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: {
            teacherId: user.value._id
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Raw class records response:', response.data)
        if (response.data && Array.isArray(response.data)) {
          // Extract subjects from class records
          const subjects = [...new Set(response.data.map(record => record.subject))].filter(Boolean)
          console.log('Subjects extracted from class records:', subjects)
          return subjects.length > 0
        }
        return false
      } catch (error) {
        console.error('Error checking class records:', error)
        if (error.response) {
          console.error('Error response:', error.response.data)
        }
        return false
      }
    }

    // Fetch available years
    const fetchAvailableYears = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = user.value?.id

        if (!teacherId) return

        const response = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        // Extract unique years from teacher's records
        const years = [...new Set(response.data.map(record => record.year))]
        availableYears.value = years.sort()

        // If no year is selected but we have years available, select the first one
        if (!selectedYear.value && availableYears.value.length > 0) {
          selectedYear.value = availableYears.value[0]
          localStorage.setItem('selectedYear', selectedYear.value)
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error)
      }
    }

    // Fetch available sections
    const fetchAvailableSections = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = user.value?.id

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
        const sections = [...new Set(response.data.map(record => record.section))]
        availableSections.value = sections.sort()

        // If no section is selected but we have sections available, select the first one
        if (!selectedSection.value && availableSections.value.length > 0) {
          selectedSection.value = availableSections.value[0]
          localStorage.setItem('selectedSection', selectedSection.value)
        }
      } catch (error) {
        console.error('Failed to fetch available sections:', error)
      }
    }

    // Fetch available subjects
    const fetchAvailableSubjects = async () => {
      try {
        const userId = user.value?.id;
        console.log('Current user ID:', userId);

        if (!userId) {
          console.error('User ID not available:', user.value);
          return;
        }

        if (!selectedYear.value || !selectedSection.value) {
          console.log('Year or section not selected, clearing subjects');
          availableSubjects.value = [];
          selectedSubject.value = '';
          return;
        }

        console.log('Fetching subjects with params:', {
          teacherId: userId,
          year: selectedYear.value,
          section: selectedSection.value
        });

        const token = store.state.auth.token;
        if (!token) {
          console.error('Authentication token not available');
          return;
        }

        const response = await axios.get('http://localhost:8000/api/teacher-class-records/available-subjects', {
          params: {
            teacherId: userId,
            year: selectedYear.value,
            section: selectedSection.value
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && Array.isArray(response.data.subjects)) {
          availableSubjects.value = response.data.subjects.filter(Boolean);
          console.log('Filtered subjects loaded:', availableSubjects.value);
          
          // If we have subjects but none are selected, select the first one
          if (availableSubjects.value.length > 0) {
            if (!selectedSubject.value || !availableSubjects.value.includes(selectedSubject.value)) {
              selectedSubject.value = availableSubjects.value[0];
              localStorage.setItem('selectedSubject', selectedSubject.value);
            }
          } else {
            selectedSubject.value = '';
            localStorage.removeItem('selectedSubject');
          }
        }
      } catch (error) {
        console.error('Error fetching available subjects:', error);
        availableSubjects.value = [];
        selectedSubject.value = '';
      }
    };

    // Fetch students for attendance
    const fetchStudents = async () => {
      try {
        const userId = user.value?.id; // Changed from _id to id
        if (!userId) {
          console.error('User ID not available for fetching students:', user.value);
          return;
        }

        if (!selectedYear.value || !selectedSection.value || !selectedSubject.value) {
          console.log('Missing required filters:', {
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          });
          students.value = [];
          return;
        }

        console.log('Fetching students with params:', {
          teacherId: userId,
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value
        });

        const token = store.state.auth.token;
        if (!token) {
          console.error('Authentication token not available for fetching students');
          return;
        }

        const response = await axios.get('http://localhost:8000/api/teacher-class-records/students-for-attendance', {
          params: {
            teacherId: userId,
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Students API response:', response.data);

        if (response.data && Array.isArray(response.data.students)) {
          students.value = response.data.students;
          console.log('Students loaded:', students.value.length);
        } else {
          console.error('Invalid response format for students:', response.data);
          students.value = [];
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
        students.value = [];
      }
    };

    // Apply filters
    const applyFilters = async () => {
      console.log('Applying filters:', {
        year: selectedYear.value,
        section: selectedSection.value,
        subject: selectedSubject.value
      });

      // Save selected values to localStorage
      if (selectedYear.value) {
        localStorage.setItem('selectedYear', selectedYear.value);
      } else {
        localStorage.removeItem('selectedYear');
      }

      if (selectedSection.value) {
        localStorage.setItem('selectedSection', selectedSection.value);
      } else {
        localStorage.removeItem('selectedSection');
      }

      if (selectedSubject.value) {
        localStorage.setItem('selectedSubject', selectedSubject.value);
      } else {
        localStorage.removeItem('selectedSubject');
      }

      // Fetch available sections when year changes
      if (selectedYear.value) {
        await fetchAvailableSections();
      } else {
        availableSections.value = [];
        selectedSection.value = '';
      }

      // Fetch available subjects when both year and section are selected
      if (selectedYear.value && selectedSection.value) {
        await fetchAvailableSubjects();
      } else {
        availableSubjects.value = [];
        selectedSubject.value = '';
      }

      // Fetch students if all filters are selected
      if (selectedYear.value && selectedSection.value && selectedSubject.value) {
        await fetchStudents();
      }
    }

    // Initial fetch when component mounts
    onMounted(async () => {
      if (user.value?.id && store.state.auth.token) {
        console.log('Component mounted, initializing data...');
        
        // First fetch available years
        await fetchAvailableYears();
        
        // If year is selected, fetch sections
        if (selectedYear.value) {
          await fetchAvailableSections();
          
          // If section is selected, fetch subjects
          if (selectedSection.value) {
            await fetchAvailableSubjects();
            
            // If all filters are selected, fetch students
            if (selectedSubject.value) {
              await fetchStudents();
            }
          }
        }
      }
    })

    // Watch for user authentication
    watch([() => user.value?._id, () => store.state.auth.token], async ([newUserId, newToken]) => {
      if (newUserId && newToken) {
        const hasRecords = await checkClassRecords()
        console.log('Auth changed - Has class records:', hasRecords)
        
        await fetchAvailableSubjects()
        if (selectedYear.value && selectedSection.value && selectedSubject.value) {
          await fetchStudents()
        }
      }
    })

    // Watch for filter changes
    watch(selectedYear, async (newYear) => {
      if (newYear) {
        await fetchAvailableSections();
      } else {
        selectedSection.value = '';
        selectedSubject.value = '';
        availableSections.value = [];
        availableSubjects.value = [];
      }
    });

    watch(selectedSection, async (newSection) => {
      if (newSection) {
        await fetchAvailableSubjects();
      } else {
        selectedSubject.value = '';
        availableSubjects.value = [];
      }
    });

    // Watch for subject changes
    watch(selectedSubject, async (newValue, oldValue) => {
      console.log('Subject changed:', newValue)
      if (user.value?._id && store.state.auth.token && newValue) {
        await fetchStudents()
      }
    })

    // Filter students
    const filteredStudents = computed(() => {
      return students.value.filter(student => {
        if (!searchQuery.value) return true;
        
        const searchLower = searchQuery.value.toLowerCase();
        return (
          student.studentId.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        );
      });
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

    // Check if student is present
    const isPresent = (student) => {
      return student.attendance?.find(a => 
        a.date === selectedDate.value && 
        a.subject === selectedSubject.value
      )?.status
    }

    // Toggle student attendance
    const toggleAttendance = async (student, status) => {
      try {
        const token = store.state.auth.token
        await axios.post('http://localhost:8000/api/attendance', {
          studentId: student.studentId,
          date: selectedDate.value,
          subject: selectedSubject.value,
          status: status
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        fetchStudents()
      } catch (error) {
        console.error('Failed to update attendance:', error)
        alert('Failed to update attendance. Please try again.')
      }
    }

    // View attendance history
    const viewAttendanceHistory = async (student) => {
      selectedStudent.value = student

      try {
        const token = store.state.auth.token
        const response = await axios.get(`http://localhost:8000/api/attendance/${student.studentId}/history`, {
          params: { subject: selectedSubject.value },
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

    // Check if filters are active
    const hasActiveFilters = computed(() => {
      return selectedYear.value || selectedSection.value || selectedSubject.value || searchQuery.value
    })

    return {
      selectedDate,
      selectedYear,
      selectedSection,
      selectedSubject,
      searchQuery,
      students,
      filteredStudents,
      sortedStudents,
      availableYears,
      availableSections,
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
      formatDate,
      showSearch,
      toggleSearch,
      handleSearch,
      sortBy,
      getSortIcon,
      hasActiveFilters,
      applyFilters
    }
  }
}
</script>

<style scoped>
.attendance {
  padding: 20px;
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
  padding: 1rem;
  border-top: none;
  white-space: nowrap;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
  border-color: #eee;
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

.table-controls {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.btn-control {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.btn-control:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #2d3748;
}

.btn-control:focus {
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
}

.control-menu {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
}

.control-menu .dropdown-header {
  color: #4a5568;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.control-menu .dropdown-item {
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-menu .dropdown-item i {
  width: 16px;
  color: #718096;
}

.control-menu .dropdown-item:hover {
  background: #f7fafc;
  color: #2d3748;
}

.control-menu .dropdown-item:hover i {
  color: #4a5568;
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #e53e3e;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.search-control {
  flex: 1;
  max-width: 400px;
}

.search-control .input-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.search-control .input-group-text {
  background: white;
  border: 1px solid #e2e8f0;
  border-right: none;
  color: #718096;
}

.search-control .form-control {
  border: 1px solid #e2e8f0;
  border-left: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.search-control .form-control:focus {
  box-shadow: none;
  border-color: #e2e8f0;
}

.search-control .btn-outline-secondary {
  border: 1px solid #e2e8f0;
  border-left: none;
  color: #718096;
}

.search-control .btn-outline-secondary:hover {
  background: #f8fafc;
  color: #4a5568;
}

/* Form Controls */
.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.3rem;
}

.form-select {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #4a5568;
  background-color: white;
}

.form-select:focus {
  border-color: #90cdf4;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
}

.btn-light {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.btn-light:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #2d3748;
}

.btn-primary {
  background: #4299e1;
  border: none;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

/* Date Navigation Styles */
.date-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.date-navigation input[type="date"] {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;
}

.date-navigation input[type="date"]:focus {
  border-color: #90cdf4;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
  outline: none;
}

.date-navigation .btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.date-navigation .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.badge {
  padding: 0.5em 0.75em;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 6px;
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
  margin: 1.75rem auto;
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

.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cursor-pointer:hover {
  background-color: #f8f9fa !important;
}

.form-check-inline {
  margin-right: 1rem;
}

.form-check-input[type="radio"] {
  cursor: pointer;
}

.form-check-input[type="radio"]:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.form-check-input[type="radio"]:checked[value="late"] {
  background-color: #ffc107;
  border-color: #ffc107;
}

.form-check-label {
  cursor: pointer;
  user-select: none;
}

/* Prevent radio button clicks from triggering row click */
.form-check {
  position: relative;
  z-index: 1;
}

.selected-filters {
  background-color: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.filter-label {
  color: #666;
  font-weight: 500;
  font-size: 0.875rem;
}

.filter-badge {
  background-color: #003366;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Ensure form-check elements are clickable in the modal */
.modal .form-check {
  position: relative;
  z-index: 1061;
}
</style> 