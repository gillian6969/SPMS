<template>
  <div class="attendance-view">
    <!-- Title -->
    <div class="top-nav-title mb-4" v-if="selectedYear && selectedSection && selectedSubject">
      <h4 class="mb-0">
        Attendance Record of {{ selectedYear }} - {{ selectedSection }} | {{ selectedSubject }}
      </h4>
    </div>
    
    <!-- Controls -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <!-- Filter Controls -->
      <div class="d-flex gap-2">
        <div class="dropdown">
          <button class="btn btn-control" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-filter me-2"></i> Filter
          </button>
          <div class="dropdown-menu control-menu p-3" style="width: 280px">
            <h6 class="dropdown-header mb-2">Filter Options</h6>
            <div class="mb-3">
              <label class="form-label">Year Level</label>
              <select class="form-select form-select-sm" v-model="selectedYear" @change="applyFilters">
                <option value="">Select Year</option>
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Section</label>
              <select class="form-select form-select-sm" v-model="selectedSection" :disabled="!selectedYear" @change="applyFilters">
                <option value="">Select Section</option>
                <option v-for="section in filteredSections" :key="section" :value="section">{{ section }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Subject</label>
              <select class="form-select form-select-sm" v-model="selectedSubject" :disabled="!selectedSection" @change="applyFilters">
                <option value="">Select Subject</option>
                <option v-for="subject in teacherSubjects" :key="subject" :value="subject">{{ subject }}</option>
              </select>
            </div>
            <div class="d-flex justify-content-end">
              <button class="btn btn-sm btn-secondary" @click="clearFilters">Clear Filters</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Date Navigation -->
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-primary" @click="navigateDate(-1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="date-display" @click="openCalendarPopup" role="button">
          {{ formatDate(currentDate) }}
        </div>
        <button 
          class="btn btn-outline-primary" 
          @click="navigateDate(1)"
          :disabled="isNextDayDisabled"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
        <button 
          class="btn btn-outline-secondary" 
          @click="refreshAttendance"
          title="Refresh attendance data from database"
        >
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Calendar Popup -->
    <div class="calendar-popup" v-if="showCalendarPopup" @click.self="showCalendarPopup = false">
      <div class="calendar-container">
        <div class="calendar-header">
          <h6 class="mb-0">Select Date</h6>
          <button type="button" class="btn-close" @click="showCalendarPopup = false"></button>
        </div>
        <div class="calendar-body">
          <div class="input-group">
            <span class="input-group-text"><i class="fas fa-calendar-day"></i></span>
        <input 
          type="date" 
          class="form-control" 
              :value="formatDateForInput(currentDate)"
              :max="formatDateForInput(new Date())"
              @change="setCurrentDate($event.target.value); showCalendarPopup = false"
            >
          </div>
          
          <!-- Quick Date Buttons -->
          <div class="quick-date-buttons mt-3">
            <button class="btn btn-sm btn-outline-secondary" @click="navigateDate(-7); showCalendarPopup = false">
              <i class="fas fa-angle-double-left me-1"></i> Last Week
            </button>
            <button class="btn btn-sm btn-outline-secondary" @click="navigateDate(-1); showCalendarPopup = false">
              <i class="fas fa-angle-left me-1"></i> Yesterday
            </button>
            <button class="btn btn-sm btn-primary" @click="setCurrentDate(formatDateForInput(new Date())); showCalendarPopup = false">
              Today
        </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Table -->
    <div class="card">
      <div class="card-body">
        <!-- Table Controls -->
        <div class="table-controls mb-4">
          <div class="d-flex gap-3 align-items-center">
            <!-- Sort Dropdown -->
            <div class="dropdown">
              <button class="btn btn-control" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-sort me-2"></i> Sort by
              </button>
              <ul class="dropdown-menu control-menu">
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('studentNumber')">
                    Student Number
                    <i :class="getSortIcon('studentNumber')" class="ms-auto"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('lastName')">
                    Name
                    <i :class="getSortIcon('lastName')" class="ms-auto"></i>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Search -->
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
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-responsive">
          <div class="table-slide-container" :class="slideDirection">
          <table class="table table-hover">
            <thead>
              <tr>
            <th>Student Number</th>
                <th>Last Name</th>
                <th>First Name</th>
                  <th>Status</th>
              </tr>
            </thead>
            <tbody>
            <tr 
              v-for="student in sortedStudents" 
                  :key="student.studentNumber" 
                  class="clickable-row" 
                  @click="viewStudentDetails(student)"
                  :class="{
                    'status-row-present': student.currentStatus === 'present',
                    'status-row-absent': student.currentStatus === 'absent',
                    'status-row-late': student.currentStatus === 'late'
                  }"
            >
              <td>{{ student.studentNumber }}</td>
                  <td>{{ student.lastName }}</td>
                  <td>{{ student.firstName }}</td>
                  <td>
                    <div class="attendance-status-container">
                      <select 
                        class="form-select form-select-sm attendance-select"
                        :class="{
                          'select-present': student.currentStatus === 'present',
                          'select-absent': student.currentStatus === 'absent',
                          'select-late': student.currentStatus === 'late',
                          'select-none': student.currentStatus === 'none'
                        }"
                        v-model="student.currentStatus"
                        @change="markAttendance(student, student.currentStatus)"
                        @click.stop
                      >
                        <option value="none" disabled>Not marked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                      <div 
                        class="status-indicator" 
                        :class="{
                          'indicator-present': student.currentStatus === 'present',
                          'indicator-absent': student.currentStatus === 'absent',
                          'indicator-late': student.currentStatus === 'late',
                          'indicator-none': student.currentStatus === 'none'
                        }"
                      >
                        <i 
                          class="fas" 
                          :class="{
                            'fa-check-circle': student.currentStatus === 'present',
                            'fa-times-circle': student.currentStatus === 'absent',
                            'fa-exclamation-circle': student.currentStatus === 'late',
                            'fa-question-circle': student.currentStatus === 'none'
                          }"
                        ></i>
                </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Details Modal -->
    <div v-if="selectedStudent" class="modal-overlay" @click="selectedStudent = null">
      <div class="modal-wrapper" style="max-width: 1200px;" @click.stop>
        <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
              <h4 class="modal-title mb-0">
                <i class="fas fa-user-graduate me-2"></i>
                Student Attendance Details
              </h4>
            <button type="button" class="btn-close" @click="selectedStudent = null"></button>
          </div>
          <div class="modal-body">
              <!-- Student Information -->
              <div class="student-info-card mb-4">
                <div class="student-info-header">
                  <h6 class="mb-0">Student Information</h6>
              </div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Student Number</label>
                    <span>{{ selectedStudent.studentNumber }}</span>
              </div>
                  <div class="info-item">
                    <label>Name</label>
                    <span>{{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Section</label>
                    <span>{{ selectedSection }}</span>
                  </div>
                </div>
              </div>

              <!-- Performance Card with Attendance Overview -->
              <div class="performance-card mb-4">
                <div class="performance-header d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">Attendance Overview</h6>
                  <div class="date-filter">
                    <button class="btn btn-sm btn-outline-light" type="button" @click="openHistoryDatePicker">
                      <i class="fas fa-calendar-alt me-2"></i> Filter Dates
                    </button>
                  </div>
                </div>
                
                <!-- Calendar Popup for Date Filter -->
                <div class="calendar-popup" v-if="showHistoryDatePicker" @click.self="showHistoryDatePicker = false">
                  <div class="calendar-container">
                    <div class="calendar-header">
                      <h6 class="mb-0">Select Date Range</h6>
                      <button type="button" class="btn-close" @click="showHistoryDatePicker = false"></button>
                    </div>
                    <div class="calendar-body">
                      <div class="row g-3">
                        <div class="col-md-6">
                          <label class="form-label">From Date</label>
                          <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-calendar-day"></i></span>
                            <input 
                              type="date" 
                              class="form-control" 
                              v-model="historyStartDate"
                              :max="formatDateForInput(historyEndDate || new Date())"
                            >
                          </div>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label">To Date</label>
                          <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-calendar-day"></i></span>
                            <input 
                              type="date" 
                              class="form-control" 
                              v-model="historyEndDate"
                              :max="formatDateForInput(new Date())"
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="calendar-footer">
                      <button 
                        class="btn btn-secondary" 
                        @click="resetHistoryDateFilter"
                      >
                        <i class="fas fa-redo-alt me-1"></i> Reset
                      </button>
                      <button 
                        class="btn btn-primary" 
                        @click="applyHistoryDateFilter"
                      >
                        <i class="fas fa-check me-1"></i> Apply Filter
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="chart-container">
                  <canvas id="attendanceChart"></canvas>
                </div>
              </div>

              <!-- Attendance History -->
              <div class="history-card">
                <div class="history-header d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">Attendance History</h6>
                </div>
                
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Last Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="record in selectedStudent.attendanceHistory" :key="record._id">
                        <td>{{ formatDate(record.date) }}</td>
                        <td>
                          <span :class="'status-' + record.status">
                            {{ record.status }}
                          </span>
                        </td>
                        <td>{{ formatDate(record.lastModified) }}</td>
                      </tr>
                      <tr v-if="!selectedStudent.attendanceHistory || selectedStudent.attendanceHistory.length === 0">
                        <td colspan="3" class="text-center py-3">No attendance records found for the selected date range.</td>
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
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import moment from 'moment-timezone'
import Chart from 'chart.js/auto'

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  name: 'Attendance',
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const students = ref([])
    const searchQuery = ref('')
    const sortField = ref('lastName')
    const sortOrder = ref('asc')
    const selectedStudent = ref(null)
    const currentDate = ref(moment().tz('Asia/Manila').startOf('day').toDate())
    const slideDirection = ref('')
    let attendanceChart = null
    let dateUpdateInterval = null
    
    // Date filter for attendance history
    const historyStartDate = ref(moment().tz('Asia/Manila').subtract(30, 'days').format('YYYY-MM-DD'))
    const historyEndDate = ref(moment().tz('Asia/Manila').format('YYYY-MM-DD'))
    const showHistoryDatePicker = ref(false)
    const showCalendarPopup = ref(false)

    // Add refs for query parameters
    const selectedYear = ref(route.query.year || localStorage.getItem('selectedYear') || '')
    const selectedSection = ref(route.query.section || localStorage.getItem('selectedSection') || '')
    const selectedSubject = ref(route.query.subject || localStorage.getItem('selectedSubject') || '')
    
    // Add refs for available options
    const availableYears = ref([])
    const availableSections = ref([])
    const sectionsByYear = ref({})
    const teacherSubjects = ref([])
    
    // Computed property for filtered sections based on selected year
    const filteredSections = computed(() => {
      if (!selectedYear.value) return []
      return sectionsByYear.value[selectedYear.value] || []
    })
    
    // Function to fetch available years and sections
    const fetchAvailableYearsAndSections = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id
        
        if (!teacherId) {
          console.error('Teacher ID not available')
          return
        }

        console.log('Fetching available years and sections for teacher:', teacherId)
        
        // Use the teacher-specific endpoint to get only years and sections for this teacher
        const response = await api.get('/teacher-class-records/available-years-sections', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(error => {
          console.error('Error fetching teacher-specific years and sections:', error)
          
          // Fall back to the general endpoint if teacher-specific one fails
          return api.get('/students/available-years-sections', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        })

        console.log('API Response for years and sections:', response.data)

        if (response.data) {
          // Set available years and sections from the response
          availableYears.value = response.data.years || []
          availableSections.value = response.data.sections || []
          
          // Use sectionsByYear from the API response
          if (response.data.sectionsByYear) {
            sectionsByYear.value = response.data.sectionsByYear
          } else {
            sectionsByYear.value = {}
            
            // If we have years and sections but no sectionsByYear mapping,
            // create a simple mapping where each year has all sections
            if (availableYears.value.length > 0 && availableSections.value.length > 0) {
              availableYears.value.forEach(year => {
                sectionsByYear.value[year] = [...availableSections.value]
              })
            }
          }
          
          console.log('Available years:', availableYears.value)
          console.log('Available sections:', availableSections.value)
          console.log('Sections by year mapping:', sectionsByYear.value)
          
          // If no years are available, don't add default values
          // This ensures teachers only see years they've added
          if (availableYears.value.length === 0) {
            console.log('No years found for this teacher')
          }
          
          // If no sections are available, don't add default values
          if (availableSections.value.length === 0) {
            console.log('No sections found for this teacher')
          }
        }
      } catch (error) {
        console.error('Failed to fetch available years and sections:', error)
        // Don't set default values - teacher should only see what they've added
        availableYears.value = []
        availableSections.value = []
        sectionsByYear.value = {}
      }
    }
    
    // Function to fetch teacher subjects
    const fetchTeacherSubjects = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id

        if (!teacherId) {
          console.error('Teacher ID not available')
          return
        }

        // Try to fetch subjects from the teacher class records
        try {
          const response = await api.get('/teacher-class-records/available-years-sections', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        })

          if (response.data && response.data.subjects && response.data.subjects.length > 0) {
            teacherSubjects.value = response.data.subjects
            console.log('Subjects loaded from teacher class records:', teacherSubjects.value)
          } else {
            // If no subjects found in class records, try the user endpoint
            const userResponse = await api.get(`/users/${teacherId}/subjects`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (userResponse.data && userResponse.data.subjects && userResponse.data.subjects.length > 0) {
              teacherSubjects.value = userResponse.data.subjects
              console.log('Subjects loaded from user profile:', teacherSubjects.value)
            } else {
              // If still no subjects, use default subjects
              console.log('No subjects found, using default subjects')
            }
          }
        } catch (error) {
          console.error('Failed to fetch teacher subjects from class records:', error)
          
          // Try the user endpoint as fallback
          try {
            const userResponse = await api.get(`/users/${teacherId}/subjects`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (userResponse.data && userResponse.data.subjects && userResponse.data.subjects.length > 0) {
              teacherSubjects.value = userResponse.data.subjects
              console.log('Subjects loaded from user profile (fallback):', teacherSubjects.value)
            } else {
              teacherSubjects.value = ['Math', 'Science', 'English', 'History']
              console.log('No subjects found in user profile, using default subjects')
            }
          } catch (userError) {
            console.error('Failed to fetch teacher subjects from user profile:', userError)
            teacherSubjects.value = ['Math', 'Science', 'English', 'History']
            console.log('Using default subjects due to API errors')
          }
        }
      } catch (error) {
        console.error('Error in fetchTeacherSubjects:', error)
        teacherSubjects.value = ['Math', 'Science', 'English', 'History']
      }
    }
    
    // Function to apply filters
    const applyFilters = async () => {
      console.log('Applying filters:', {
          year: selectedYear.value,
        section: selectedSection.value,
        subject: selectedSubject.value
      })
      
      // Save selected values to localStorage
      if (selectedYear.value) localStorage.setItem('selectedYear', selectedYear.value)
      if (selectedSection.value) localStorage.setItem('selectedSection', selectedSection.value)
      if (selectedSubject.value) localStorage.setItem('selectedSubject', selectedSubject.value)
      
      // Update URL query parameters
      router.replace({
        query: {
          ...route.query,
          year: selectedYear.value || undefined,
          section: selectedSection.value || undefined,
          subject: selectedSubject.value || undefined
        }
      })
      
      // Fetch students and attendance if all filters are selected
      if (selectedYear.value && selectedSection.value && selectedSubject.value) {
        await fetchStudentRecords()
      }
    }
    
    // Function to clear filters
    const clearFilters = () => {
      selectedYear.value = ''
      selectedSection.value = ''
      selectedSubject.value = ''
      localStorage.removeItem('selectedYear')
      localStorage.removeItem('selectedSection')
      localStorage.removeItem('selectedSubject')
      
      // Update URL query parameters
      router.replace({
        query: {}
      })
    }

    // Function to fetch students and their attendance
    const fetchStudentRecords = async () => {
      try {
        if (!selectedYear.value || !selectedSection.value || !selectedSubject.value) {
          console.log('Missing required filters for fetchStudentRecords', {
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          });
          return;
        }

        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id

        if (!teacherId) {
          console.error('Teacher ID not available');
          return;
        }

        console.log('Fetching student records with filters:', {
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value
        });

        // Use the dedicated endpoint for attendance students
        try {
          const response = await api.get('/teacher-class-records/students-for-attendance', {
          params: {
              teacherId,
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: {
              'Authorization': `Bearer ${token}`
          }
        });

        console.log('Students API response:', response.data);

          if (response.data) {
            let studentList = [];
            
            if (Array.isArray(response.data)) {
              // If response is an array, use it directly
              studentList = response.data;
            } else if (response.data.students && Array.isArray(response.data.students)) {
              // If response has a students property that is an array
              studentList = response.data.students;
            }
            
            students.value = studentList.map(student => ({
              ...student,
              attendance: [],
              currentStatus: 'none' // Initialize currentStatus property
            }));
            
            console.log(`Loaded ${students.value.length} students`);
            
            // Fetch attendance for current date if we have students
            if (students.value.length > 0) {
              await fetchAttendance();
        } else {
              console.warn('No students found in the response');
          }
          } else {
            console.error('Invalid or empty response from students API');
          students.value = [];
        }
      } catch (error) {
          console.error('Failed to fetch student records:', error);
          
          if (error.response && error.response.status === 404) {
            console.warn('Students endpoint not found. Check if the API endpoint is implemented.');
          }
          
        students.value = [];
      }
      } catch (error) {
        console.error('Error in fetchStudentRecords:', error);
        students.value = [];
      }
    }

    // Function to fetch attendance for current date
    const fetchAttendance = async () => {
      try {
        if (!selectedSection.value || !selectedSubject.value) {
          console.log('fetchAttendance: Missing required data', {
            section: selectedSection.value,
            subject: selectedSubject.value,
            studentsCount: students.value?.length || 0
          });
          return;
        }

        console.log('fetchAttendance: Fetching attendance data with filters', {
          section: selectedSection.value,
          subject: selectedSubject.value,
          date: moment(currentDate.value).tz('Asia/Manila').format('YYYY-MM-DD')
        });

        // Store the current date in a format that can be compared
        const currentDateFormatted = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');

        // Create a map of existing attendance records by student ID
        // This will help us preserve attendance data across date changes
        const existingAttendanceMap = new Map();
        
        // First, store all existing attendance data from students
        if (students.value && students.value.length > 0) {
          students.value.forEach(student => {
            if (student.attendance && Array.isArray(student.attendance)) {
              existingAttendanceMap.set(student.studentId, [...student.attendance]);
            }
          });
        }

        try {
          // Use moment.tz to ensure correct timezone handling
          const date = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD')
          const response = await api.get(`/attendance/date/${date}`, {
            params: {
              subject: selectedSubject.value,
              section: selectedSection.value
            },
            headers: { 'Authorization': `Bearer ${store.state.auth.token}` }
          })

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log('Attendance records found:', response.data.length);
            
            // Create a map of attendance records by student ID for the current date
            const currentDateAttendanceMap = new Map(response.data
              .filter(record => record.studentId && record.studentId._id) // Filter out records with null studentId
              .map(record => [
                record.studentId._id,
                record
              ]));

            // If we have students, update them with attendance data
            if (students.value && students.value.length > 0) {
              students.value = students.value.map(student => {
                // Get the attendance record for the current date
                const currentDateRecord = currentDateAttendanceMap.get(student.studentId);
                
                // Get existing attendance records for this student (from other dates)
                let existingAttendance = existingAttendanceMap.get(student.studentId) || [];
                
                // Filter out any records for the current date (to avoid duplicates)
                existingAttendance = existingAttendance.filter(record => {
                  if (!record || !record.date) return false;
                  const recordDate = moment(record.date).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
                  return recordDate !== currentDateFormatted;
                });
                
                // If we have an attendance record for this student on the current date, add it
                if (currentDateRecord) {
                  // Set the currentStatus based on the current date's record
                  return {
                    ...student,
                    attendance: [currentDateRecord, ...existingAttendance],
                    currentStatus: currentDateRecord.status || 'none'
                  };
                } else {
                  // If no attendance record for this student on the current date,
                  // just keep the existing attendance records and reset currentStatus to 'none'
                  return {
                    ...student,
                    attendance: existingAttendance,
                    currentStatus: 'none'
                  };
                }
              });
              console.log('Updated students with attendance data:', students.value.length);
            } else {
              console.log('No students available to update with attendance data');
              // Try to fetch students if they're not available
              await fetchStudentRecords();
            }
          } else {
            console.log('No attendance records found for the selected date');
            
            // Keep the existing attendance records for all students
            if (students.value && students.value.length > 0) {
              students.value = students.value.map(student => {
                // Get existing attendance records for this student
                const existingAttendance = existingAttendanceMap.get(student.studentId) || [];
                
                // Return student with existing attendance records (excluding any for current date)
                // This ensures we don't have stale records for the current date
                return {
                  ...student,
                  attendance: existingAttendance.filter(record => {
                    if (!record || !record.date) return false;
                    const recordDate = moment(record.date).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
                    return recordDate !== currentDateFormatted;
                  }),
                  currentStatus: 'none' // Reset currentStatus to 'none' for the new date
                };
              });
              
              // Force a UI update
              nextTick(() => {
                students.value = [...students.value];
              });
            }
          }
        } catch (error) {
          console.error('Error fetching attendance data:', error);
          
          if (error.response && error.response.status === 404) {
            console.warn('Attendance API endpoint not found. Check if the API endpoint is implemented.');
          }
          
          // Reset currentStatus to 'none' for all students on error
          if (students.value && students.value.length > 0) {
            students.value.forEach(student => {
              student.currentStatus = 'none';
            });
            
            // Force a UI update
            nextTick(() => {
              students.value = [...students.value];
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchAttendance:', error);
      }
    }

    // Create attendance chart
    const createPerformanceChart = () => {
      if (!selectedStudent.value) return;
      
      // Create a unique chart ID for each student
      const chartId = `attendanceChart-${selectedStudent.value.studentId}`;
      const chartElement = document.getElementById('attendanceChart');
      
      // Set a unique ID to the chart element
      if (chartElement) {
        chartElement.id = chartId;
      }
      
      const ctx = document.getElementById(chartId)?.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (attendanceChart) {
        attendanceChart.destroy();
        attendanceChart = null;
      }

      // Get the chart container
      const chartContainer = document.querySelector('.chart-container');
      if (!chartContainer) return;

      // Check if we have valid attendance statistics and records
      const stats = selectedStudent.value.attendanceStats;
      const hasAttendanceRecords = selectedStudent.value.attendanceHistory && 
                                  selectedStudent.value.attendanceHistory.length > 0;
      
      if (!hasAttendanceRecords || 
          !stats || 
          (stats.presentPercentage === 0 && stats.absentPercentage === 0 && stats.latePercentage === 0)) {
        // If no attendance data, display a message instead of an empty chart
        chartContainer.innerHTML = '';
        const noDataMessage = document.createElement('div');
        noDataMessage.className = 'text-center py-5 text-muted';
        noDataMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>No attendance data available for this student in the selected date range.';
        chartContainer.appendChild(noDataMessage);
        return;
      }

      // Clear the container and add canvas back
      chartContainer.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.id = chartId;
      chartContainer.appendChild(canvas);

      // Get the context from the new canvas
      const newCtx = document.getElementById(chartId)?.getContext('2d');
      if (!newCtx) return;

      // Create the chart
      attendanceChart = new Chart(newCtx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent', 'Late'],
          datasets: [{
            data: [stats.presentPercentage, stats.absentPercentage, stats.latePercentage],
            backgroundColor: ['#4CAF50', '#f44336', '#FFC107']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value.toFixed(1)}%`;
                }
              }
            }
          }
        }
      });
    }

    // View student details
    const viewStudentDetails = async (student) => {
      try {
        // Reset any existing chart before showing a new student
        if (attendanceChart) {
          attendanceChart.destroy();
          attendanceChart = null;
        }
        
        selectedStudent.value = {
          ...student,
          attendanceHistory: [],
          attendanceStats: { presentPercentage: 0, absentPercentage: 0, latePercentage: 0 }
        }
        
        // Fetch attendance history with the current date filters
        await fetchStudentAttendanceHistory(selectedStudent.value);
      } catch (error) {
        console.error('Error fetching student details:', error)
        alert('Failed to load student details. Please try again.')
      }
    }
    
    // Fetch student attendance history with date filters
    const fetchStudentAttendanceHistory = async (student) => {
      if (!student) return;
      
      try {
        console.log(`Fetching attendance history for student ${student.studentNumber} with date range:`, {
          startDate: historyStartDate.value,
          endDate: historyEndDate.value
        });
        
        const response = await api.get(
          `/attendance/${student.studentId}/history`,
          {
            params: {
              subject: selectedSubject.value,
              startDate: historyStartDate.value,
              endDate: historyEndDate.value
            },
            headers: { 'Authorization': `Bearer ${store.state.auth.token}` }
          }
        )
        
        if (response.data) {
          // Make sure we're updating the correct student
          if (selectedStudent.value && selectedStudent.value.studentId === student.studentId) {
            // Only include records that have a valid status (not null, undefined, or empty string)
            const validRecords = Array.isArray(response.data.records) 
              ? response.data.records.filter(record => record && record.status && record.status !== '')
              : [];
            
            selectedStudent.value.attendanceHistory = validRecords;
            
            // Only calculate statistics based on valid records
            if (validRecords.length > 0) {
              // Count occurrences of each status
              const statusCounts = {
                present: 0,
                absent: 0,
                late: 0
              };
              
              validRecords.forEach(record => {
                if (record.status in statusCounts) {
                  statusCounts[record.status]++;
                }
              });
              
              // Calculate percentages
              const total = validRecords.length;
              const presentPercentage = total > 0 ? (statusCounts.present / total) * 100 : 0;
              const absentPercentage = total > 0 ? (statusCounts.absent / total) * 100 : 0;
              const latePercentage = total > 0 ? (statusCounts.late / total) * 100 : 0;
              
              selectedStudent.value.attendanceStats = {
                presentPercentage,
                absentPercentage,
                latePercentage
              };
      } else {
              // If no valid records, set all percentages to 0
              selectedStudent.value.attendanceStats = {
                presentPercentage: 0,
                absentPercentage: 0,
                latePercentage: 0
              };
            }
            
            console.log(`Loaded ${selectedStudent.value.attendanceHistory.length} attendance records for student ${student.studentNumber}`);
            
            // Create attendance chart on next tick to ensure DOM is ready
            nextTick(() => {
              // Reset any existing chart before creating a new one
              if (attendanceChart) {
                attendanceChart.destroy();
                attendanceChart = null;
              }
              createPerformanceChart();
            });
          } else {
            console.log('Selected student changed, not updating attendance history');
          }
        }
      } catch (error) {
        console.error('Error fetching student attendance history:', error);
        selectedStudent.value.attendanceHistory = [];
        selectedStudent.value.attendanceStats = { 
          presentPercentage: 0, 
          absentPercentage: 0, 
          latePercentage: 0 
        };
        
        // Create chart with empty data
        nextTick(() => {
          if (attendanceChart) {
            attendanceChart.destroy();
            attendanceChart = null;
          }
          createPerformanceChart();
        });
      }
    }

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

    // Sort students
    const sortedStudents = computed(() => {
      if (!Array.isArray(students.value)) {
        return []
      }

      let sortedList = [...students.value]
      if (sortField.value) {
        sortedList.sort((a, b) => {
          let aVal = a[sortField.value]
          let bVal = b[sortField.value]
          if (typeof aVal === 'string') aVal = aVal.toLowerCase()
          if (typeof bVal === 'string') bVal = bVal.toLowerCase()
          if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
          if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
          return 0
        })
      }

      if (!searchQuery.value) {
      return sortedList
      }
      
      const searchLower = searchQuery.value.toLowerCase()
      return sortedList.filter(student => {
        return (
          student.studentNumber.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        )
      })
    })

    // Update attendance status
    const markAttendance = async (student, status) => {
      try {
        // Skip if status is 'none' or not provided
        if (!status || status === 'none') {
          console.log('No valid status selected');
          return;
        }
        
        console.log('Marking attendance for student:', student.studentNumber, 'with status:', status);
        
        // Update the student's currentStatus property immediately for better UI responsiveness
        student.currentStatus = status;
        
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id;
        
        if (!teacherId) {
          console.error('Teacher ID not available');
          alert('Teacher information is not available. Please try logging in again.');
          store.dispatch('logout');
          router.push('/login');
          return;
        }
        
        // Format the current date for consistency
        const formattedDate = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
        
        // Prepare the attendance data for the API request
        const attendanceData = {
          studentId: student.studentId,
          teacherId: teacherId,
          date: formattedDate,
          subject: selectedSubject.value,
          section: selectedSection.value,
          status: status
        };
        
        console.log('Sending attendance update with data:', attendanceData);
        
        // Update the student's attendance in the local state immediately
        // This ensures the UI updates even if the API call fails
        const studentIndex = students.value.findIndex(s => s.studentId === student.studentId);
        if (studentIndex !== -1) {
          // Get existing attendance records for this student
          const existingAttendance = [...(students.value[studentIndex].attendance || [])];
          
          // Find if there's already an attendance record for the current date
          const currentDateRecordIndex = existingAttendance.findIndex(record => {
            if (!record || !record.date) return false;
            const recordDate = moment(record.date).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
            return recordDate === formattedDate;
          });
          
          if (currentDateRecordIndex !== -1) {
            // Update existing attendance record for the current date
            existingAttendance[currentDateRecordIndex].status = status;
            existingAttendance[currentDateRecordIndex].lastModified = new Date();
          } else {
            // Create new attendance record for the current date
            const newRecord = {
              studentId: { 
                _id: student.studentId, 
                firstName: student.firstName, 
                lastName: student.lastName, 
                studentNumber: student.studentNumber 
              },
              status,
              date: new Date(formattedDate),
              subject: selectedSubject.value,
              section: selectedSection.value,
              lastModified: new Date()
            };
            
            // Add the new record to the beginning of the array
            existingAttendance.unshift(newRecord);
          }
          
          // Update the student's attendance array
          students.value[studentIndex].attendance = existingAttendance;
          
          // Force a UI update to ensure the row color changes immediately
          nextTick(() => {
            // This will trigger a re-render of the component
            students.value = [...students.value];
          });
          
          console.log(`Updated student ${student.studentNumber} attendance status to ${status} in local state for date ${formattedDate}`);
        }
        
        // Try to update on the server
        try {
          const response = await api.post('/attendance', attendanceData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Attendance update response:', response.data);
        } catch (error) {
          console.error('API error when marking attendance:', error);
          
          // If it's a 404 error (endpoint not found), show a more helpful message
          if (error.response && error.response.status === 404) {
            console.warn('Attendance API endpoint not found. The server may need to be restarted after adding the attendance routes.');
            alert('The attendance service is not responding. Please restart the server to enable attendance tracking.');
          } else {
            // For other errors, show an alert with more details
            alert(`Failed to save attendance for ${student.firstName} ${student.lastName}. The change is shown in the UI but not saved to the server. Error: ${error.response?.data?.message || error.message}`);
          }
        }
      } catch (error) {
        console.error('Failed to update attendance:', error);
        alert(`An unexpected error occurred while updating attendance. Please try again.`);
      }
    };

    // Handle search
    const handleSearch = () => {
      // The sortedStudents computed property will automatically filter based on searchQuery
    }

    // Watch for query parameter changes
    watch([selectedYear, selectedSection, selectedSubject], () => {
      // Save selected values to localStorage
      if (selectedYear.value) localStorage.setItem('selectedYear', selectedYear.value)
      if (selectedSection.value) localStorage.setItem('selectedSection', selectedSection.value)
      if (selectedSubject.value) localStorage.setItem('selectedSubject', selectedSubject.value)
      
      fetchStudentRecords()
      
      // Update navigation title
      if (selectedYear.value && selectedSection.value && selectedSubject.value) {
        try {
          if (router.currentRoute.value.matched[0].components.default.props) {
            router.currentRoute.value.matched[0].components.default.props.selectedInfo = 
              `${selectedYear.value} - ${selectedSection.value} | ${selectedSubject.value}`
          }
        } catch (error) {
          console.error('Error updating navigation title:', error)
        }
      }
    })

    // Watch for date changes
    watch(currentDate, async () => {
      console.log('Current date changed, updating attendance status');
      
      // Reset currentStatus for all students
      if (students.value && students.value.length > 0) {
        students.value.forEach(student => {
          student.currentStatus = 'none';
        });
      }
      
      // Fetch attendance data for the new date
      await fetchAttendance();
    });

    // Clean up chart when component unmounts
    onUnmounted(() => {
      if (attendanceChart) {
        attendanceChart.destroy()
        attendanceChart = null
      }
      
      if (dateUpdateInterval) {
        clearInterval(dateUpdateInterval)
      }
    })

    // Clean up chart when student modal closes
    watch(() => selectedStudent.value, (newValue, oldValue) => {
      if (!newValue && attendanceChart) {
        attendanceChart.destroy();
        attendanceChart = null;
        
        // Reset the chart element ID back to the default
        if (oldValue) {
          const chartElement = document.getElementById(`attendanceChart-${oldValue.studentId}`);
          if (chartElement) {
            chartElement.id = 'attendanceChart';
          }
        }
      }
    });

    // Format date for display
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return moment(date).tz('Asia/Manila').format('MMMM D, YYYY')
    }
    
    // Format date for input fields (YYYY-MM-DD)
    const formatDateForInput = (date) => {
      if (!date) return ''
      return moment(date).tz('Asia/Manila').format('YYYY-MM-DD')
    }

    // Add isNextDayDisabled computed property
    const isNextDayDisabled = computed(() => {
      const now = moment().tz('Asia/Manila').startOf('day')
      const selected = moment(currentDate.value).tz('Asia/Manila').startOf('day')
      return selected.isSameOrAfter(now, 'day')
    })

    // Add navigateDate function
    const navigateDate = (direction) => {
      const now = moment().tz('Asia/Manila').startOf('day')
      const newDate = moment(currentDate.value).tz('Asia/Manila').startOf('day').add(direction, 'days')
      
      // Only allow navigation to past dates or current date
      if (direction < 0 || (direction > 0 && !newDate.isAfter(now, 'day'))) {
        slideDirection.value = direction > 0 ? 'slide-left' : 'slide-right'
        currentDate.value = newDate.toDate()
        
        // Refresh attendance data
        fetchAttendance()
        
        setTimeout(() => {
          slideDirection.value = ''
        }, 300)
      }
    }

    // Setup date auto-update to handle timezone correctly
    const setupDateAutoUpdate = () => {
      const checkAndUpdateDate = () => {
        const now = moment().tz('Asia/Manila').startOf('day')
        const current = moment(currentDate.value).tz('Asia/Manila').startOf('day')
        
        // If it's past midnight and we're showing yesterday's date
        if (now.isAfter(current, 'day')) {
          currentDate.value = now.toDate()
          fetchAttendance()
        }
      }

      // Clear existing interval if any
      if (dateUpdateInterval) {
        clearInterval(dateUpdateInterval)
      }

      // Check every minute
      dateUpdateInterval = setInterval(checkAndUpdateDate, 60000)
    }

    // Add watchers for filter changes
    watch(selectedYear, (newValue) => {
      if (newValue) {
        selectedSection.value = '';
        selectedSubject.value = '';
      }
    });

    watch(selectedSection, (newValue) => {
      if (newValue) {
        selectedSubject.value = '';
      }
    });

    // Get attendance status for display
    const getAttendanceStatus = (student) => {
      // If student has a currentStatus property and it's not 'none', use it
      if (student.currentStatus && student.currentStatus !== 'none') {
        return student.currentStatus;
      }
      
      // Format the current date for comparison
      const currentDateFormatted = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
      
      // Check if the student has attendance records from the database
      if (student.attendance && student.attendance.length > 0) {
        // Find the attendance record for the current date
        const attendanceRecord = student.attendance.find(record => {
          if (!record || !record.date) return false;
          // Format the record date to match the current date format
          const recordDate = moment(record.date).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
          return recordDate === currentDateFormatted;
        });
        
        // If we found an attendance record for the current date, return its status
        if (attendanceRecord && attendanceRecord.status) {
          // Update the student's currentStatus property
          student.currentStatus = attendanceRecord.status;
          return attendanceRecord.status;
        }
      }
      
      // If no attendance record found for the current date, return 'none'
      student.currentStatus = 'none';
      return 'none';
    }

    // Add setCurrentDate function
    const setCurrentDate = (dateString) => {
      if (!dateString) return;
      
      const newDate = moment(dateString).tz('Asia/Manila').startOf('day');
      const now = moment().tz('Asia/Manila').startOf('day');
      
      // Only allow setting dates up to the current date
      if (newDate.isAfter(now, 'day')) {
        return;
      }
      
      // Set animation direction based on whether we're going forward or backward in time
      const currentMoment = moment(currentDate.value).tz('Asia/Manila').startOf('day');
      slideDirection.value = newDate.isAfter(currentMoment) ? 'slide-left' : 'slide-right';
      
      // Update the current date
      currentDate.value = newDate.toDate();
      
      // Refresh attendance data
      fetchAttendance();
      
      // Reset animation after transition completes
      setTimeout(() => {
        slideDirection.value = '';
      }, 300);
    };

    // Reset history date filter to default (last 30 days)
    const resetHistoryDateFilter = () => {
      historyStartDate.value = moment().tz('Asia/Manila').subtract(30, 'days').format('YYYY-MM-DD');
      historyEndDate.value = moment().tz('Asia/Manila').format('YYYY-MM-DD');
      
      // Fetch attendance history with the reset date range
      if (selectedStudent.value) {
        fetchStudentAttendanceHistory(selectedStudent.value);
      }
    };

    // Set history date range based on preset
    const setHistoryDateRange = (preset) => {
      const now = moment().tz('Asia/Manila');
      
      switch (preset) {
        case 'week':
          historyStartDate.value = now.clone().subtract(7, 'days').format('YYYY-MM-DD');
          break;
        case 'month':
          historyStartDate.value = now.clone().subtract(30, 'days').format('YYYY-MM-DD');
          break;
        case 'quarter':
          historyStartDate.value = now.clone().subtract(90, 'days').format('YYYY-MM-DD');
          break;
        case 'semester':
          // Approximately 6 months
          historyStartDate.value = now.clone().subtract(180, 'days').format('YYYY-MM-DD');
          break;
        default:
          historyStartDate.value = now.clone().subtract(30, 'days').format('YYYY-MM-DD');
      }
      
      historyEndDate.value = now.format('YYYY-MM-DD');
      
      // Fetch attendance history with the new date range
      if (selectedStudent.value) {
        fetchStudentAttendanceHistory(selectedStudent.value);
      }
    };

    // Initialize component
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
        try {
          // Fetch available years, sections, and subjects
          await Promise.all([
            fetchAvailableYearsAndSections(),
            fetchTeacherSubjects()
          ]);
          
          // Apply filters if they are set
          if (selectedYear.value && selectedSection.value && selectedSubject.value) {
            await fetchStudentRecords();
          }
          
          // Set up date auto-update
          setupDateAutoUpdate();
      } catch (error) {
          console.error('Error during component initialization:', error);
        }
      } else {
        router.push('/login');
      }
    });
    
    // Function to refresh attendance data
    const refreshAttendance = async () => {
      console.log('Refreshing attendance data');
      
      if (students.value && students.value.length > 0) {
        // Reset currentStatus for all students
        students.value.forEach(student => {
          student.currentStatus = 'none';
        });
      }
      
      // Fetch fresh attendance data from the server
      await fetchAttendance();
      
      // Force a UI update to ensure the changes are reflected
      nextTick(() => {
        students.value = [...students.value];
      });
    };
    
    // Add a watch for currentDate to refresh attendance data when date changes
    watch(currentDate, async () => {
      console.log('Current date changed, refreshing attendance data');
      await fetchAttendance();
    });

    // Function to load attendance status from localStorage
    const loadAttendanceFromLocalStorage = () => {
      if (!students.value || students.value.length === 0) return;
      
      const currentDateFormatted = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
      console.log('Loading attendance from localStorage for date:', currentDateFormatted);
      
      // Loop through all students and check if they have attendance status in localStorage
      students.value.forEach(student => {
        const localStorageKey = `attendance_${student.studentId}_${currentDateFormatted}`;
        const savedStatus = localStorage.getItem(localStorageKey);
        
        if (savedStatus && ['present', 'absent', 'late'].includes(savedStatus)) {
          console.log(`Found saved status for student ${student.studentNumber}: ${savedStatus}`);
          
          // Update the student's currentStatus property
          student.currentStatus = savedStatus;
          
          // Check if the student already has an attendance record for this date
          const hasExistingRecord = student.attendance && student.attendance.some(record => {
            if (!record || !record.date) return false;
            const recordDate = moment(record.date).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
            return recordDate === currentDateFormatted;
          });
          
          // If no existing record, create one from the localStorage data
          if (!hasExistingRecord) {
            if (!student.attendance) student.attendance = [];
            
            student.attendance.unshift({
              studentId: { 
                _id: student.studentId, 
                firstName: student.firstName, 
                lastName: student.lastName, 
                studentNumber: student.studentNumber 
              },
              status: savedStatus,
              date: new Date(currentDateFormatted),
              subject: selectedSubject.value,
              section: selectedSection.value,
              lastModified: new Date()
            });
            
            console.log(`Created attendance record from localStorage for student ${student.studentNumber}`);
          }
        }
      });
      
      // Force a UI update to ensure the changes are reflected
      nextTick(() => {
        students.value = [...students.value];
      });
    };

    // Add watch for currentDate to refresh attendance data when date changes
    watch(currentDate, () => {
      fetchAttendance();
    });

    // Add openDatePicker function
    const openDatePicker = () => {
      const datePicker = document.querySelector('.date-picker-hidden');
      if (datePicker) {
        datePicker.click();
      }
    }

    // Add openHistoryDatePicker function
    const openHistoryDatePicker = () => {
      showHistoryDatePicker.value = true;
    }
    
    // Add applyHistoryDateFilter function
    const applyHistoryDateFilter = () => {
      if (selectedStudent.value) {
        fetchStudentAttendanceHistory(selectedStudent.value);
      }
      showHistoryDatePicker.value = false;
    }

    // Add openCalendarPopup function
    const openCalendarPopup = () => {
      showCalendarPopup.value = true;
    }

    return {
      students,
      searchQuery,
      sortedStudents,
      selectedStudent,
      currentDate,
      formatDate,
      formatDateForInput,
      navigateDate,
      isNextDayDisabled,
      markAttendance,
      slideDirection,
      selectedYear,
      selectedSection,
      selectedSubject,
      sortBy,
      getSortIcon,
      handleSearch,
      viewStudentDetails,
      fetchStudentAttendanceHistory,
      historyStartDate,
      historyEndDate,
      availableYears,
      availableSections,
      sectionsByYear,
      teacherSubjects,
      filteredSections,
      fetchAvailableYearsAndSections,
      fetchTeacherSubjects,
      applyFilters,
      clearFilters,
      getAttendanceStatus,
      setCurrentDate,
      resetHistoryDateFilter,
      setHistoryDateRange,
      openDatePicker,
      showHistoryDatePicker,
      openHistoryDatePicker,
      applyHistoryDateFilter,
      showCalendarPopup,
      openCalendarPopup,
      refreshAttendance
    }
  }
}
</script>

<style scoped>
/* Import shared styles from ClassRecords.vue */
.attendance-view {
  padding: 1.5rem 2rem;
  background:rgb(255, 255, 255);
  min-height: calc(100vh - 70px);
}

/* Date Navigation Styles */
.date-navigation {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.date-nav-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-nav-btn {
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.date-nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.date-display {
  background: #f8f9fa;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  min-width: 200px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.date-display:hover {
  background-color: #e9ecef;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.date-display:active {
  transform: translateY(0);
}

.date-display::after {
  content: '\f073';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  margin-left: 8px;
  font-size: 0.875rem;
  color: #6c757d;
  transition: all 0.2s ease;
}

.date-display:hover::after {
  color: #495057;
  transform: scale(1.1);
}

.date-quick-nav {
  display: flex;
  gap: 0.5rem;
}

/* Table Slide Animation */
.table-slide-container {
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.5s ease;
}

.slide-left {
  animation: enhancedSlideLeft 0.5s forwards;
}

.slide-right {
  animation: enhancedSlideRight 0.5s forwards;
}

@keyframes enhancedSlideLeft {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  40% {
    transform: translateX(-30px);
    opacity: 0;
  }
  60% {
    transform: translateX(30px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes enhancedSlideRight {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  40% {
    transform: translateX(30px);
    opacity: 0;
  }
  60% {
    transform: translateX(-30px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Top Nav Title */
.top-nav-title {
  background: #203464;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.top-nav-title h4 {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
}

/* Attendance Status Styles */
.status-present {
  background-color: #4CAF50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-absent {
  background-color: #f44336;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-late {
  background-color: #FFC107;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-none {
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* Attendance Dropdown Styles */
.attendance-select {
  min-width: 120px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  border-width: 2px;
}

.attendance-select:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.select-present {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
  color: #2E7D32;
  font-weight: 500;
}

.select-absent {
  border-color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
  color: #C62828;
  font-weight: 500;
}

.select-late {
  border-color: #FFC107;
  background-color: rgba(255, 193, 7, 0.1);
  color: #F57F17;
  font-weight: 500;
}

.select-none {
  border-color: #9e9e9e;
  background-color: #f8f9fa;
  color: #6c757d;
}

/* Row status styling */
.status-row-present {
  background-color: rgba(76, 175, 80, 0.15) !important;
}

.status-row-absent {
  background-color: rgba(244, 67, 54, 0.15) !important;
}

.status-row-late {
  background-color: rgba(255, 193, 7, 0.15) !important;
}

.status-row-present:hover {
  background-color: rgba(76, 175, 80, 0.25) !important;
}

.status-row-absent:hover {
  background-color: rgba(244, 67, 54, 0.25) !important;
}

.status-row-late:hover {
  background-color: rgba(255, 193, 7, 0.25) !important;
}

/* Attendance Dropdown Option Styles - these will be visible when dropdown is open */
.attendance-select option[value="present"] {
  background-color: rgba(76, 175, 80, 0.2);
  color: #2E7D32;
  font-weight: 500;
  padding: 8px;
}

.attendance-select option[value="absent"] {
  background-color: rgba(244, 67, 54, 0.2);
  color: #C62828;
  font-weight: 500;
  padding: 8px;
}

.attendance-select option[value="late"] {
  background-color: rgba(255, 193, 7, 0.2);
  color: #F57F17;
  font-weight: 500;
  padding: 8px;
}

.attendance-select option[value="none"] {
  background-color: #f8f9fa;
  color: #6c757d;
  padding: 8px;
}

/* Clickable Row Styles */
.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f8f9fa;
}

/* Button Group Styles */
.btn-group .btn {
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}

.btn-group .btn:hover {
  background-color: #f8f9fa;
}

.btn-group .btn.active {
  color: white;
}

.btn-group .btn.active.btn-success {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.btn-group .btn.active.btn-warning {
  background-color: #FFC107;
  border-color: #FFC107;
}

.btn-group .btn.active.btn-danger {
  background-color: #f44336;
  border-color: #f44336;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  max-width: 90%;
  max-height: 90vh;
  width: 100%;
}

.modal-dialog {
  margin: 0;
  max-width: none;
  width: 100%;
}

.modal-content {
  border: none;
  border-radius: 12px;
}

.modal-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 1.5rem;
}

.modal-body {
  padding: 1.5rem;
  max-height: calc(90vh - 70px);
  overflow-y: auto;
}

/* Student Info Card */
.student-info-card {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.student-info-header {
  background: #203464;
  color: white;
  padding: 0.75rem 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.info-item span {
  font-weight: 500;
}

/* Performance Card */
.performance-card {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.performance-header {
  background: #203464;
  color: white;
  padding: 0.75rem 1rem;
}

.chart-container {
  height: 300px;
  padding: 1rem;
}

/* History Card */
.history-card {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.history-header {
  background: #203464;
  color: white;
  padding: 0.75rem 1rem;
}

/* Table Controls */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-control {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-control:hover {
  background: #e9ecef;
}

.control-menu {
  padding: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.search-control {
  flex: 1;
  max-width: 300px;
}

.search-control .input-group-text {
  background: #f8f9fa;
  border-right: none;
}

.search-control .form-control {
  border-left: none;
}

.search-control .form-control:focus {
  box-shadow: none;
  border-color: #ced4da;
}

/* Attendance Status Container */
.attendance-status-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Status Indicator */
.status-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

.indicator-present {
  color: #4CAF50;
  animation: pulse-green 2s infinite;
}

.indicator-absent {
  color: #f44336;
  animation: pulse-red 2s infinite;
}

.indicator-late {
  color: #FFC107;
  animation: pulse-yellow 2s infinite;
}

.indicator-none {
  color: #9e9e9e;
}

/* Enhanced Date Filter Styles */
.date-filter .btn-outline-light {
  border-color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.date-filter .btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
}

#historyDateFilter {
  transition: all 0.3s ease;
}

#historyDateFilter .form-label {
  color: #6c757d;
  font-weight: 500;
}

#historyDateFilter .btn-outline-secondary {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
}

#historyDateFilter .btn-outline-secondary:hover {
  background-color: #e9ecef;
}

/* Date Filter Dropdown Styles */
.dropdown-menu.control-menu {
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
  opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-green {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse-red {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse-yellow {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

#chartDateFilter {
  transition: all 0.3s ease;
  border-bottom: 1px solid #dee2e6;
}

#chartDateFilter .form-label {
  color: #6c757d;
  font-weight: 500;
}

#chartDateFilter .btn-outline-secondary {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
}

#chartDateFilter .btn-outline-secondary:hover {
  background-color: #e9ecef;
}

/* Calendar Popup Styles */
.calendar-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1060;
  animation: fadeIn 0.2s ease;
}

.calendar-container {
  background: white;
  border-radius: 12px;
  width: 350px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.calendar-header {
  background: #203464;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-header .btn-close {
  filter: invert(1) brightness(200%);
}

.calendar-body {
  padding: 1.5rem;
}

.quick-date-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Date Display Enhancements */
.date-display {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  min-width: 180px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-display:hover {
  background-color: #e9ecef;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.date-display::after {
  content: '\f073';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  margin-left: 8px;
  font-size: 0.875rem;
  color: #6c757d;
  transition: all 0.2s ease;
}

.date-display:hover::after {
  color: #495057;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 
