<template>
  <div class="student-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Student Management</h2>
      <button class="btn btn-primary" @click="showAddStudentModal = true">
        <i class="fas fa-plus"></i> Add Student List
      </button>
    </div>

    <!-- Students Table with Controls -->
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
                  <a class="dropdown-item" href="#" @click="sortBy('studentId')">
                    ID Number <i :class="getSortIcon('studentId')"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('lastName')">
                    Name <i :class="getSortIcon('lastName')"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('year')">
                    Year <i :class="getSortIcon('year')"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click="sortBy('section')">
                    Section <i :class="getSortIcon('section')"></i>
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
                    <option value="">All Years</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Section</label>
                  <select class="form-select form-select-sm" v-model="selectedSection" @change="applyFilters">
                    <option value="">All Sections</option>
                    <option value="South 1">South 1</option>
                    <option value="South 2">South 2</option>
                    <option value="South 3">South 3</option>
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
                  placeholder="Search..."
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
                <th>Student ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="sortedStudents.length > 0">
                <tr 
                  v-for="student in sortedStudents" 
                  :key="student.studentId"
                  @click="viewStudent(student)"
                  class="clickable-row"
                >
                  <td>{{ student.studentId }}</td>
                  <td>{{ student.lastName }}</td>
                  <td>{{ student.firstName }}</td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.year }}</td>
                  <td>{{ student.section }}</td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6" class="text-center py-4">
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

    <!-- Add Student Modal -->
    <div v-if="showAddStudentModal" class="modal-wrapper">
      <div class="modal-backdrop" @click="showAddStudentModal = false"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Student List</h5>
            <button type="button" class="btn-close" @click="showAddStudentModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleFileUpload">
              <!-- Year Selection -->
              <div class="mb-3">
                <label class="form-label">Year</label>
                <select class="form-select" v-model="uploadYear" required>
                  <option value="">Select Year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>

              <!-- Section Selection -->
              <div class="mb-3">
                <label class="form-label">Section</label>
                <select class="form-select" v-model="uploadSection" required>
                  <option value="">Select Section</option>
                  <option value="South 1">South 1</option>
                  <option value="South 2">South 2</option>
                  <option value="South 3">South 3</option>
                </select>
              </div>

              <!-- File Upload -->
              <div class="mb-3">
                <label class="form-label">CSV File</label>
                <input 
                  type="file" 
                  class="form-control" 
                  accept=".csv"
                  @change="handleFileChange"
                  required
                >
                <small class="text-muted">
                  File must contain: StudentID, Last Name, First Name, Email
                </small>
              </div>

              <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" @click="showAddStudentModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="isUploading">
                  {{ isUploading ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Details Modal -->
    <div v-if="selectedStudent" class="modal fade show" style="display: block">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-user-graduate me-2"></i>
              Student Details
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="selectedStudent = null"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Student Information -->
              <div class="col-md-12 mb-4">
                <div class="student-info-card">
                  <div class="student-info-header">
                    <i class="fas fa-info-circle me-2"></i>
                    Student Information
                  </div>
                  <div class="student-info-content">
                    <div class="info-grid">
                      <div class="info-item">
                        <label>Student ID</label>
                        <span>{{ selectedStudent.studentId }}</span>
                      </div>
                      <div class="info-item">
                        <label>Name</label>
                        <span>{{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</span>
                      </div>
                      <div class="info-item">
                        <label>Email</label>
                        <span>{{ selectedStudent.email }}</span>
                      </div>
                      <div class="info-item">
                        <label>Year</label>
                        <span>{{ selectedStudent.year }}</span>
                      </div>
                      <div class="info-item">
                        <label>Section</label>
                        <span>{{ selectedStudent.section }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Performance Overview -->
              <div class="col-md-12 mb-4">
                <div class="performance-card">
                  <div class="performance-header">
                    <i class="fas fa-chart-line me-2"></i>
                    Performance Overview
                  </div>
                  <div class="performance-content">
                    <div class="row g-4">
                      <div class="col-md-6">
                        <div class="chart-container">
                          <h6 class="text-center mb-3">
                            <i class="fas fa-chart-bar me-2"></i>
                            Subject Performance
                          </h6>
                          <canvas ref="subjectChart"></canvas>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="chart-container">
                          <h6 class="text-center mb-3">
                            <i class="fas fa-clock me-2"></i>
                            Attendance Rate
                          </h6>
                          <canvas ref="attendanceChart"></canvas>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Assessment History -->
              <div class="col-md-12">
                <div class="history-card">
                  <div class="history-header">
                    <i class="fas fa-history me-2"></i>
                    Assessment History
                  </div>
                  <div class="history-content">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Score</th>
                            <th>Max Score</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="assessment in selectedStudent.assessments" :key="assessment.id">
                            <td>{{ formatDate(assessment.date) }}</td>
                            <td>{{ assessment.subject }}</td>
                            <td>
                              <span :class="'badge ' + getAssessmentBadgeClass(assessment.type)">
                                {{ assessment.type }}
                              </span>
                            </td>
                            <td>{{ assessment.score }}</td>
                            <td>{{ assessment.maxScore }}</td>
                            <td>
                              <span :class="getScoreClass(assessment.score / assessment.maxScore * 100)">
                                {{ (assessment.score / assessment.maxScore * 100).toFixed(1) }}%
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
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>

    <!-- Edit Student Modal -->
    <div v-if="isEditing" class="modal-wrapper">
      <div class="modal-backdrop" @click="cancelEditing"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Student</h5>
            <button type="button" class="btn-close" @click="cancelEditing"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveStudentChanges">
              <div class="mb-3">
                <label class="form-label">Student ID</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="editingStudent.studentId"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">First Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="editingStudent.firstName"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Last Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="editingStudent.lastName"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input 
                  type="email" 
                  class="form-control" 
                  v-model="editingStudent.email"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Year</label>
                <select class="form-select" v-model="editingStudent.year">
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Section</label>
                <select class="form-select" v-model="editingStudent.section">
                  <option value="South 1">South 1</option>
                  <option value="South 2">South 2</option>
                  <option value="South 3">South 3</option>
                </select>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="cancelEditing">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-wrapper">
      <div class="modal-backdrop" @click="showDeleteModal = false"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this student?</p>
            <p class="text-danger">
              <strong>{{ studentToDelete?.firstName }} {{ studentToDelete?.lastName }}</strong>
            </p>
            <p class="text-muted small">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showDeleteModal = false"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteStudent(studentToDelete)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import Chart from 'chart.js/auto'

// Create axios instance without initial token
const api = axios.create({
  baseURL: 'http://localhost:8000/api/students',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  name: 'StudentManagement',
  setup() {
    const store = useStore()
    const students = ref([])
    const selectedYear = ref('')
    const selectedSection = ref('')
    const searchQuery = ref('')
    const showAddStudentModal = ref(false)
    const uploadYear = ref('')
    const uploadSection = ref('')
    const selectedFile = ref(null)
    const isUploading = ref(false)
    const selectedStudent = ref(null)
    const performanceChart = ref(null)
    const sortField = ref('')
    const sortOrder = ref('asc')
    const showDeleteModal = ref(false)
    const studentToDelete = ref(null)
    const isEditing = ref(false)
    const editingStudent = ref(null)
    const showSearch = ref(false)

    // Update the fetchStudents function to include token in request
    const fetchStudents = async () => {
      try {
        console.log('Fetching students with filters:', {
          year: selectedYear.value,
          section: selectedSection.value
        });
        
        const token = store.state.auth.token;
        const response = await api.get('/', {
          params: {
            year: selectedYear.value || undefined,
            section: selectedSection.value || undefined
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Fetch response:', response);
        students.value = response.data;
      } catch (error) {
        console.error('Failed to fetch students:', error.response || error);
        if (error.response?.status === 401) {
          store.dispatch('logout');
          router.push('/login');
        } else {
          alert('Failed to load students. Please try refreshing the page.');
        }
      }
    };

    // Initialize data on component mount
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
        await fetchStudents();
      }
    });

    // Watch for auth state changes
    watch(() => store.getters.isLoggedIn, async (isLoggedIn) => {
      if (isLoggedIn) {
        await fetchStudents();
      } else {
        students.value = [];
      }
    });

    // Update file upload to include token
    const handleFileUpload = async () => {
      if (!selectedFile.value || !uploadYear.value || !uploadSection.value) {
        alert('Please select a file and choose both year and section');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile.value);
      formData.append('year', uploadYear.value);
      formData.append('section', uploadSection.value);

      isUploading.value = true;

      try {
        const token = store.state.auth.token;
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success || response.status === 200) {
          alert('Students uploaded successfully');
          showAddStudentModal.value = false;
          uploadYear.value = '';
          uploadSection.value = '';
          selectedFile.value = null;
          await fetchStudents();
        } else {
          throw new Error(response.data.message || 'Failed to upload students');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert(error.response?.data?.message || 'Failed to upload student list');
      } finally {
        isUploading.value = false;
      }
    };

    // View student details
    const viewStudent = async (student) => {
      try {
        selectedStudent.value = student
        
        if (performanceChart.value) {
          const existingChart = Chart.getChart(performanceChart.value)
          if (existingChart) {
            existingChart.destroy()
          }
        }

        const token = store.state.auth.token
        // Get the student's performance data from teacher class records
        const response = await axios.get(`http://localhost:8000/api/teacher-class-records/student/${student._id}/performance`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const performanceData = response.data

        // Create performance chart with aggregated data
        new Chart(performanceChart.value, {
          type: 'bar',
          data: {
            labels: ['Quizzes', 'Activities', 'Performance Tasks'],
            datasets: [{
              label: 'Average Score (%)',
              data: [
                performanceData.quizAverage || 0,
                performanceData.activityAverage || 0,
                performanceData.performanceTaskAverage || 0
              ],
              backgroundColor: [
                'rgba(0, 51, 102, 0.7)',
                'rgba(0, 51, 102, 0.5)',
                'rgba(0, 51, 102, 0.3)'
              ]
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Average Score (%)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              title: {
                display: true,
                text: 'Student Performance Summary',
                font: {
                  size: 16
                }
              }
            }
          }
        })
      } catch (error) {
        console.error('Failed to fetch student performance:', error)
        // Don't show the error alert since we still want to show the modal
        // Just log the error and continue showing the student details
        selectedStudent.value = student // Ensure the student details are still shown
      }
    }

    // Filter students
    const filteredStudents = computed(() => {
      return students.value.filter(student => {
        const searchLower = searchQuery.value.toLowerCase();
        return (
          student.studentId.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        );
      });
    });

    // File upload handlers
    const handleFileChange = (event) => {
      selectedFile.value = event.target.files[0]
    }

    // Student actions
    const closeStudentModal = () => {
      if (performanceChart.value) {
        const existingChart = Chart.getChart(performanceChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      selectedStudent.value = null;
    };

    const confirmDelete = (student) => {
      if (confirm('Are you sure you want to delete this student? This will remove them from all teacher class records as well.')) {
        deleteStudent(student)
      }
    }

    const deleteStudent = async (student) => {
      try {
        const token = store.state.auth.token

        // First, remove student from all teacher class records using student number
        const teacherRecordResponse = await axios.delete(
          `http://localhost:8000/api/teacher-class-records/remove-all-records/${student.studentId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (teacherRecordResponse.data.success) {
          // Then delete the student from students collection using MongoDB _id
          const studentResponse = await axios.delete(
            `http://localhost:8000/api/students/${student._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )

          if (studentResponse.data.success || studentResponse.status === 200) {
            // Update local state
            students.value = students.value.filter(s => s._id !== student._id)
            selectedStudent.value = null
            showDeleteModal.value = false
            studentToDelete.value = null
            alert('Student deleted successfully')
          } else {
            throw new Error('Failed to delete student')
          }
        } else {
          throw new Error('Failed to remove student from class records')
        }
      } catch (error) {
        console.error('Failed to delete student:', error.response?.data || error)
        alert('Failed to delete student. Please try again.')
      }
    }

    const startEditing = () => {
      isEditing.value = true
    }

    const cancelEditing = () => {
      editingStudent.value = { ...selectedStudent.value }
      isEditing.value = false
    }

    const saveStudentChanges = async () => {
      try {
        const token = store.state.auth.token
        
        // First, update student information
        const studentResponse = await axios.put(
          `http://localhost:8000/api/students/${editingStudent.value._id}`,
          {
            studentId: editingStudent.value.studentId,
            firstName: editingStudent.value.firstName,
            lastName: editingStudent.value.lastName,
            email: editingStudent.value.email,
            year: editingStudent.value.year,
            section: editingStudent.value.section
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (studentResponse.data) {
          // Then update all teacher class records containing this student
          const teacherUpdateResponse = await axios.put(
            `http://localhost:8000/api/teacher-class-records/update-all-records`,
            {
              oldStudentNumber: selectedStudent.value.studentId,  // Original student number
              newStudentNumber: editingStudent.value.studentId,   // New student number
              firstName: editingStudent.value.firstName,
              lastName: editingStudent.value.lastName,
              year: editingStudent.value.year,
              section: editingStudent.value.section,
              studentId: editingStudent.value._id  // Include MongoDB ObjectId reference
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )

          if (teacherUpdateResponse.data.success) {
            // Update local state
            const index = students.value.findIndex(s => s._id === editingStudent.value._id)
            if (index !== -1) {
              students.value[index] = { ...editingStudent.value }
            }
            
            selectedStudent.value = null
            editingStudent.value = null
            isEditing.value = false
            alert('Student information updated successfully')
          } else {
            throw new Error('Failed to update teacher class records')
          }
        } else {
          throw new Error('Failed to update student information')
        }
      } catch (error) {
        console.error('Failed to update student:', error.response?.data || error)
        alert('Failed to update student information. Please try again.')
      }
    }

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

    const sortedStudents = computed(() => {
      let students = filteredStudents.value

      if (sortField.value) {
        students = [...students].sort((a, b) => {
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

      return students
    })

    const toggleSearch = () => {
      showSearch.value = !showSearch.value
      if (!showSearch.value) {
        searchQuery.value = ''
      }
    }

    const handleSearch = () => {
      // Implement any additional search logic here if needed
      console.log('Searching for:', searchQuery.value)
    }

    const editStudent = (student) => {
      selectedStudent.value = student
      editingStudent.value = { ...student }
      isEditing.value = true
    }

    const applyFilters = () => {
      fetchStudents()
    }

    // Watch for filter changes
    watch([selectedYear, selectedSection], () => {
      fetchStudents()
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

    return {
      students,
      selectedYear,
      selectedSection,
      searchQuery,
      filteredStudents,
      showAddStudentModal,
      uploadYear,
      uploadSection,
      isUploading,
      selectedStudent,
      performanceChart,
      selectedFile,
      handleFileChange,
      handleFileUpload,
      viewStudent,
      closeStudentModal,
      showDeleteModal,
      studentToDelete,
      confirmDelete,
      deleteStudent,
      isEditing,
      editingStudent,
      startEditing,
      cancelEditing,
      saveStudentChanges,
      sortBy,
      getSortIcon,
      sortedStudents,
      showSearch,
      toggleSearch,
      handleSearch,
      editStudent,
      applyFilters,
      getAssessmentBadgeClass,
      getScoreClass
    }
  }
}
</script>

<style scoped>
.student-management {
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

.btn-info {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
}

.btn-info:hover {
  background-color: #138496;
  border-color: #138496;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}

.form-control,
.form-select {
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.15);
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
  z-index: 2000;
  padding: 1rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1999;
}

.modal-dialog {
  position: relative;
  width: 90%;
  max-width: 500px;
  margin: 1.75rem auto;
  z-index: 2001;
}

.modal-dialog.modal-lg {
  max-width: 800px;
}

.modal-content {
  background: white;
  border: none;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.modal-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1.5rem;
  border-bottom: none;
}

.modal-body {
  padding: 2rem;
}

.btn-close {
  color: white;
  opacity: 1;
}

.search-input {
  display: inline-block;
  width: 200px;
  margin-left: 0;
}

.table-controls {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.search-container,
.search-bar {
  position: static;
  margin: 0;
  padding: 0;
}

.student-info p {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.student-info p:last-child {
  border-bottom: none;
}

.student-info strong {
  color: #666;
  display: inline-block;
  width: 100px;
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

/* Student Details Modal Styles */
.student-info-card,
.performance-card,
.history-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.student-info-header,
.performance-header,
.history-header {
  background-color: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
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
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.info-item span {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.chart-container {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.badge {
  padding: 0.5em 0.75em;
  font-weight: 500;
  font-size: 0.875rem;
}

.badge-quiz {
  background-color: #4e73df;
  color: white;
}

.badge-activity {
  background-color: #1cc88a;
  color: white;
}

.badge-performance {
  background-color: #f6c23e;
  color: white;
}

.score-excellent {
  color: #1cc88a;
  font-weight: 600;
}

.score-good {
  color: #4e73df;
  font-weight: 600;
}

.score-average {
  color: #f6c23e;
  font-weight: 600;
}

.score-poor {
  color: #e74a3b;
  font-weight: 600;
}

.modal-header.bg-primary {
  background-color: #003366 !important;
}

.btn-close-white {
  filter: brightness(0) invert(1);
}
</style> 