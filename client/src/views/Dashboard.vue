<template>
  <div class="dashboard">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Dashboard</h2>
      
      <!-- Year Filter for CIT Head -->
      <div v-if="isCITHead" class="d-flex gap-3">
        <select class="form-select" v-model="selectedYear">
          <option value="">All Years</option>
          <option value="1st">1st Year</option>
          <option value="2nd">2nd Year</option>
          <option value="3rd">3rd Year</option>
          <option value="4th">4th Year</option>
        </select>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div class="row mb-4">
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
    <div class="row mb-4">
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
    <div class="row mb-4">
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

    <!-- Section Performance -->
    <div class="chart-card mb-4">
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
import { ref, onMounted, computed, watch } from 'vue'
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
      if (!data.value?.performanceDistribution) return false;
      
      // Check if any year has non-zero values
      return Object.values(data.value.performanceDistribution).some(yearData => 
        yearData.some(value => value > 0)
      );
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
        
        console.log('Dashboard Data:', data.value);
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

      // Create performance chart with year breakdown
      if (data.performanceDistribution) {
        const yearLabels = selectedYear.value ? [selectedYear.value] : ['1st', '2nd', '3rd', '4th'];
        const datasets = yearLabels.map((year, index) => {
          const yearData = data.performanceDistribution[year] || [0, 0, 0, 0, 0];
          return {
            label: `${year} Year`,
            data: yearData,
            backgroundColor: [
              '#4CAF50',
              '#2196F3',
              '#FFC107',
              '#FF5722'
            ][index] || '#9E9E9E',
            borderWidth: 1
          };
        });

        new Chart(performanceChart.value, {
          type: 'bar',
          data: {
            labels: ['90-100', '80-89', '70-79', '60-69', 'Below 60'],
            datasets: datasets
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Students'
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
                text: 'Performance Distribution by Year Level',
                font: {
                  size: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y} students`;
                  }
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

    // Watch for year changes
    watch(selectedYear, () => {
      fetchDashboardData()
    })

    // Initialize dashboard
    onMounted(() => {
      fetchDashboardData()
    })

    return {
      performanceChart,
      attendanceChart,
      sectionChart,
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
      hasSectionData
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
  height: calc(100% - 3rem);
  min-height: 300px;
  margin: 1rem 0;
  width: 100%;
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
  width: 100% !important;
  height: 100% !important;
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
</style> 