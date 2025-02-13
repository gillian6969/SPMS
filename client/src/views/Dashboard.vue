<template>
  <div class="dashboard" ref="dashboardContainer">
    <div class="d-flex justify-content-between align-items-center mb-4 sticky-top bg-white py-3">
      <h2>Dashboard</h2>
      
      <!-- Year Filter for CIT Head -->
      <div v-if="isCITHead" class="d-flex gap-3 align-items-center">
        <div class="filter-group">
          <label class="me-2">Academic Year:</label>
          <select class="form-select" v-model="selectedYear" @change="handleYearChange">
            <option value="">All Years</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>
        </div>
        <button class="btn btn-outline-secondary" @click="refreshDashboard">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Quick Stats Navigation -->
    <div v-if="isCITHead" class="quick-stats-nav mb-4">
      <div class="nav-item" @click="scrollToSection('analytics')">
        <i class="fas fa-chart-bar"></i>
        <span>Analytics</span>
      </div>
      <div class="nav-item" @click="scrollToSection('performance')">
        <i class="fas fa-chart-line"></i>
        <span>Performance</span>
      </div>
      <div class="nav-item" @click="scrollToSection('assessments')">
        <i class="fas fa-tasks"></i>
        <span>Assessments</span>
      </div>
      <div class="nav-item" @click="scrollToSection('attendance')">
        <i class="fas fa-user-check"></i>
        <span>Attendance</span>
      </div>
      <div class="nav-item" @click="scrollToSection('sections')">
        <i class="fas fa-users"></i>
        <span>Sections</span>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div id="analytics" class="row mb-4 section">
      <div class="col-md-3">
        <div class="analytics-card">
          <div class="card-body">
            <div class="analytics-icon">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="analytics-content">
              <h5 class="card-title">Total Students</h5>
              <h2 class="card-text">{{ totalStudents }}</h2>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="analytics-card">
          <div class="card-body">
            <div class="analytics-icon">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="analytics-content">
              <h5 class="card-title">Total Teachers</h5>
              <h2 class="card-text">{{ totalTeachers }}</h2>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="analytics-card">
          <div class="card-body">
            <div class="analytics-icon">
              <i class="fas fa-user-tie"></i>
            </div>
            <div class="analytics-content">
              <h5 class="card-title">SSP Advisers</h5>
              <h2 class="card-text">{{ totalAdvisers }}</h2>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="analytics-card">
          <div class="card-body">
            <div class="analytics-icon">
              <i class="fas fa-users-class"></i>
            </div>
            <div class="analytics-content">
              <h5 class="card-title">Active Sections</h5>
              <h2 class="card-text">{{ activeSections }}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary Stats Row -->
    <div id="performance" class="row mb-4 section">
      <div class="col-md-6">
        <div class="analytics-card">
          <div class="card-body">
            <div class="analytics-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="analytics-content">
              <h5 class="card-title">Average Attendance</h5>
              <h2 class="card-text" v-if="hasAttendanceData">{{ averageAttendance }}%</h2>
              <p class="no-data-text" v-else>No attendance data available</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="analytics-card">
          <div class="card-body">
            <div class="analytics-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="analytics-content">
              <h5 class="card-title">Average Score</h5>
              <h2 class="card-text" v-if="hasScoreData">{{ averageScore }}%</h2>
              <p class="no-data-text" v-else>No score data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div id="assessments" class="row mb-4 section">
      <!-- Performance Chart -->
      <div class="col-md-6">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">Performance Distribution</h5>
            <div class="chart-container">
              <canvas ref="performanceChart"></canvas>
              <p v-if="!hasPerformanceData" class="no-data-message">No performance data available</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Assessment Type Chart -->
      <div class="col-md-6">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">Assessment Type Distribution</h5>
            <div class="chart-container">
              <canvas ref="assessmentTypeChart"></canvas>
              <p v-if="!data?.assessmentTypeDistribution" class="no-data-message">No assessment type data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Chart -->
    <div id="attendance" class="row mb-4 section">
      <div class="col-md-12">
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

    <!-- Section Performance -->
    <div id="sections" class="chart-card mb-4 section">
      <div class="card-body">
        <h5 class="card-title">Section Performance</h5>
        <div class="chart-container">
          <canvas ref="sectionChart"></canvas>
          <p v-if="!hasSectionData" class="no-data-message">No section performance data available</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()
    const performanceChart = ref(null)
    const attendanceChart = ref(null)
    const sectionChart = ref(null)
    const assessmentTypeChart = ref(null)
    const selectedYear = ref('')

    // Computed properties
    const isCITHead = computed(() => store.getters.isCITHead)
    const token = computed(() => store.state.auth.token)

    // Set auth token for all requests
    watch(token, (newToken) => {
      if (newToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }
    }, { immediate: true });

    // Dashboard stats
    const totalStudents = ref(0)
    const totalTeachers = ref(0)
    const totalAdvisers = ref(0)
    const averageAttendance = ref(0)
    const averageScore = ref(0)
    const activeSections = ref(0)

    // Add computed properties for data availability
    const hasAttendanceData = computed(() => {
      return data.value?.attendanceTrends?.length > 0;
    });

    const hasScoreData = computed(() => {
      return data.value?.averageScore > 0;
    });

    const hasPerformanceData = computed(() => {
      return data.value?.performanceDistribution && 
             Array.isArray(data.value.performanceDistribution) && 
             data.value.performanceDistribution.some(value => value >= 0);
    });

    const hasSectionData = computed(() => {
      return data.value?.sections?.length > 0;
    });

    const data = ref(null);

    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats', {
          params: {
            year: selectedYear.value
          }
        });

        data.value = response.data;
        
        // Debug logging
        console.log('Raw Dashboard Data:', {
          performanceDistribution: {
            data: data.value.performanceDistribution,
            isArray: Array.isArray(data.value.performanceDistribution),
            length: data.value.performanceDistribution?.length
          },
          assessmentTypeDistribution: {
            data: data.value.assessmentTypeDistribution,
            hasDatasets: Boolean(data.value.assessmentTypeDistribution?.datasets),
            datasetsLength: data.value.assessmentTypeDistribution?.datasets?.length,
            labels: data.value.assessmentTypeDistribution?.labels
          }
        });

        totalStudents.value = data.value.totalStudents || 0;
        totalTeachers.value = data.value.totalTeachers || 0;
        totalAdvisers.value = data.value.totalAdvisers || 0;
        averageAttendance.value = data.value.averageAttendance || 0;
        averageScore.value = data.value.averageScore || 0;
        activeSections.value = data.value.activeSections || 0;

        // Update charts with new data
        if (data.value) {
          updateCharts(data.value);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    };

    const updateCharts = (data) => {
      // Destroy existing charts if they exist
      if (performanceChart.value) {
        const existingChart = Chart.getChart(performanceChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      if (attendanceChart.value) {
        const existingChart = Chart.getChart(attendanceChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      if (sectionChart.value) {
        const existingChart = Chart.getChart(sectionChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      if (assessmentTypeChart.value) {
        const existingChart = Chart.getChart(assessmentTypeChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }

      // Create performance distribution chart (Grade Distribution)
      if (data.performanceDistribution && Array.isArray(data.performanceDistribution)) {
        console.log('Creating performance chart with data:', data.performanceDistribution);
        
        // Ensure we have valid numbers
        const validData = data.performanceDistribution.map(value => Number(value) || 0);
        
        new Chart(performanceChart.value, {
          type: 'pie',
          data: {
            labels: ['90-100', '80-89', '70-79', '60-69', 'Below 60'],
            datasets: [{
              data: validData,
              backgroundColor: [
                '#4CAF50', // Green for highest range
                '#2196F3', // Blue
                '#FFC107', // Yellow
                '#FF9800', // Orange
                '#F44336'  // Red for lowest range
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'right',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${context.label}: ${value} students (${percentage}%)`;
                  }
                }
              },
              title: {
                display: true,
                text: 'Student Grade Distribution',
                font: {
                  size: 16
                }
              }
            }
          }
        });
      }

      // Create assessment type distribution chart
      if (data.assessmentTypeDistribution) {
        console.log('Creating assessment type chart with data:', data.assessmentTypeDistribution);
        
        const colors = {
          'Quiz': 'rgba(76, 175, 80, 0.7)',
          'Activity': 'rgba(33, 150, 243, 0.7)',
          'Performance Task': 'rgba(255, 193, 7, 0.7)'
        };
        
        const borderColors = {
          'Quiz': '#4CAF50',
          'Activity': '#2196F3',
          'Performance Task': '#FFC107'
        };
        
        // Transform the data structure
        const datasets = data.assessmentTypeDistribution.datasets.map(dataset => ({
          label: dataset.type,
          data: dataset.data.map(value => Number(value) || 0),
          backgroundColor: colors[dataset.type],
          borderColor: borderColors[dataset.type],
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: borderColors[dataset.type],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }));

        new Chart(assessmentTypeChart.value, {
          type: 'line',
          data: {
            labels: data.assessmentTypeDistribution.labels || [],
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10
              }
            },
            interaction: {
              mode: 'index',
              intersect: false
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Month/Year'
                },
                grid: {
                  display: false
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Assessments'
                },
                ticks: {
                  stepSize: 1,
                  precision: 0
                },
                grid: {
                  color: 'rgba(0,0,0,0.05)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: '#000',
                bodyColor: '#000',
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y} assessments`;
                  }
                }
              }
            }
          }
        });
      }

      // Only create attendance chart if there's data
      if (data.attendanceTrends && data.attendanceTrends.length > 0) {
        new Chart(attendanceChart.value, {
          type: 'line',
          data: {
            labels: data.attendanceTrends.map(d => {
              const date = new Date(d.date);
              return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            }),
            datasets: [{
              label: 'Attendance Rate',
              data: data.attendanceTrends.map(d => d.rate),
              borderColor: '#2196F3',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Attendance: ${context.parsed.y.toFixed(1)}%`;
                  }
                }
              },
              title: {
                display: true,
                text: 'Monthly Attendance Trends',
                font: {
                  size: 16
                }
              }
            }
          }
        });
      }

      // Create section chart with year information
      if (data.sections && data.sections.length > 0) {
        new Chart(sectionChart.value, {
          type: 'bar',
          data: {
            labels: data.sections.map(s => `${s.year} - ${s.name}`),
            datasets: [{
              label: 'Average Performance',
              data: data.sections.map(s => s.performance),
              backgroundColor: data.sections.map(s => {
                // Different colors for different year levels
                switch(s.year) {
                  case '1st': return '#4CAF50';
                  case '2nd': return '#2196F3';
                  case '3rd': return '#FFC107';
                  case '4th': return '#FF5722';
                  default: return '#9E9E9E';
                }
              }),
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 5,
                callbacks: {
                  label: function(context) {
                    const section = data.sections[context.dataIndex];
                    return [
                      `Performance: ${context.parsed.x.toFixed(1)}%`,
                      `Students: ${section.studentCount}`
                    ];
                  }
                }
              },
              title: {
                display: true,
                text: 'Section Performance by Year Level',
                font: {
                  size: 16
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: '#666',
                  callback: function(value) {
                    return value + '%';
                  }
                },
                title: {
                  display: true,
                  text: 'Performance (%)'
                }
              },
              y: {
                grid: {
                  display: false
                },
                ticks: {
                  color: '#666'
                }
              }
            }
          }
        });
      }
    }

    const dashboardContainer = ref(null)
    const isLoading = ref(false)
    const lastUpdate = ref(null)
    const autoRefreshInterval = ref(null)

    // Scroll handling
    const scrollToSection = (sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    // Handle year change
    const handleYearChange = async () => {
      isLoading.value = true
      try {
        await fetchDashboardData()
        // Save selected year to localStorage
        if (selectedYear.value) {
          localStorage.setItem('selectedYear', selectedYear.value)
        } else {
          localStorage.removeItem('selectedYear')
        }
      } catch (error) {
        console.error('Error updating dashboard:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Refresh dashboard
    const refreshDashboard = async () => {
      isLoading.value = true
      try {
        await fetchDashboardData()
        lastUpdate.value = new Date()
      } catch (error) {
        console.error('Error refreshing dashboard:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Auto refresh setup
    const setupAutoRefresh = () => {
      // Clear any existing interval
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value)
      }
      
      // Set up new auto-refresh interval (every 5 minutes)
      autoRefreshInterval.value = setInterval(refreshDashboard, 5 * 60 * 1000)
    }

    // Initialize dashboard with saved filters
    onMounted(() => {
      // Restore saved year filter
      const savedYear = localStorage.getItem('selectedYear')
      if (savedYear) {
        selectedYear.value = savedYear
      }

      fetchDashboardData()
      setupAutoRefresh()
      lastUpdate.value = new Date()
    })

    // Clean up on component unmount
    onUnmounted(() => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value)
      }
    })

    return {
      performanceChart,
      attendanceChart,
      sectionChart,
      assessmentTypeChart,
      selectedYear,
      isCITHead,
      totalStudents,
      totalTeachers,
      totalAdvisers,
      averageAttendance,
      averageScore,
      activeSections,
      hasAttendanceData,
      hasScoreData,
      hasPerformanceData,
      hasSectionData,
      dashboardContainer,
      isLoading,
      lastUpdate,
      scrollToSection,
      handleYearChange,
      refreshDashboard
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.analytics-card {
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  margin-bottom: 1rem;
  height: 100%;
  min-height: 120px;
}

.analytics-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.analytics-card .card-body {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  height: 100%;
}

.analytics-icon {
  min-width: 50px;
  min-height: 50px;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #003366 0%, #004d99 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.analytics-icon i {
  font-size: 1.5rem;
  color: white;
}

.analytics-content {
  flex: 1;
  min-width: 0; /* Prevents flex item from overflowing */
}

.analytics-content .card-title {
  font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  color: #666;
  margin-bottom: 0.3rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.analytics-content .card-text {
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  color: #003366;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background: white;
  margin-bottom: 1.5rem;
  height: 100%;
  min-height: 400px;
}

.chart-card .card-body {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-card .card-title {
  font-size: clamp(1rem, 1.8vw, 1.1rem);
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 350px;
  height: 350px;
  width: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 0 1rem;
}

.no-data-text {
  color: #666;
  font-style: italic;
  margin: 0;
  font-size: clamp(0.8rem, 1.5vw, 0.9rem);
}

canvas {
  max-height: 350px !important;
  height: 100% !important;
  width: 100% !important;
}

/* Responsive Breakpoints */
@media (max-width: 1200px) {
  .analytics-card {
    min-height: 100px;
  }
  
  .analytics-icon {
    min-width: 40px;
    min-height: 40px;
    width: 40px;
    height: 40px;
  }
  
  .analytics-icon i {
    font-size: 1.2rem;
  }

  .chart-card {
    min-height: 350px;
  }
  
  .chart-container {
    min-height: 300px;
    height: 300px;
  }
  
  canvas {
    max-height: 300px !important;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }

  .analytics-card {
    margin-bottom: 1rem;
    min-height: 90px;
  }
  
  .analytics-card .card-body {
    padding: 1rem;
  }
  
  .chart-container {
    min-height: 250px;
    height: 250px;
  }
  
  canvas {
    max-height: 250px !important;
  }
}

@media (max-width: 576px) {
  .analytics-card {
    min-height: 80px;
  }
  
  .analytics-icon {
    min-width: 35px;
    min-height: 35px;
    width: 35px;
    height: 35px;
  }
  
  .analytics-icon i {
    font-size: 1rem;
  }
  
  .chart-container {
    min-height: 200px;
  }
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-stats-nav {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
}

.nav-item i {
  font-size: 1.2rem;
  color: #003366;
  margin-bottom: 0.5rem;
}

.nav-item span {
  font-size: 0.9rem;
  color: #666;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-group label {
  color: #666;
  font-weight: 500;
  margin-bottom: 0;
}

.section {
  scroll-margin-top: 100px;
}

/* Loading state styles */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #003366;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Last update indicator */
.last-update {
  font-size: 0.8rem;
  color: #666;
  text-align: right;
  margin-top: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .quick-stats-nav {
    overflow-x: auto;
    justify-content: flex-start;
    padding: 1rem 0.5rem;
  }

  .nav-item {
    flex: 0 0 auto;
    padding: 0.5rem;
    margin: 0 0.5rem;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-group label {
    margin-bottom: 0.5rem;
  }
}
</style> 