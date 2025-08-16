// CLIMANEER Dashboard - Main Application Logic
// This file handles all core functionality including Firebase integration,
// sensor data management, UI interactions, and system controls

// Global variables and configuration
let sensorData = {};
let pumpStatus = false;
let manualOverride = false;
let alertCount = 0;
let currentTheme = 'light';
let isConnected = true;
let lastUpdateTime = null;
let pumpRuntime = 0;
let totalWaterUsed = 0;
let systemUptime = 99.9;
let dataHistory = [];
let alertHistory = [];

// Settings configuration
let settings = {
  soundAlerts: true,
  pushNotifications: true,
  moistureThreshold: 30,
  batteryThreshold: 20,
  autoMode: true,
  refreshInterval: 5000,
  apiUrl: 'YOUR_API_URL_HERE' // Your original API URL
};

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('CLIMANEER Dashboard initializing...');
  
  // Show loading screen
  showLoadingScreen();
  
  // Initialize components with delay for smooth loading
  setTimeout(() => {
    initializeUI();
    initializeEventListeners();
    startDataCollection();
    initializeNotifications();
    loadSavedSettings();
    hideLoadingScreen();
  }, 2000);
});

// Loading screen management
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
    
    // Animate loading progress
    const progressBar = document.querySelector('.progress-bar');
    const statusText = document.querySelector('.loading-status');
    
    if (progressBar && statusText) {
      let progress = 0;
      const statuses = [
        'Connecting to sensors...',
        'Loading dashboard...',
        'Initializing controls...',
        'Ready!'
      ];
      let statusIndex = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        
        progressBar.style.width = progress + '%';
        
        if (progress > statusIndex * 25 && statusIndex < statuses.length) {
          statusText.textContent = statuses[statusIndex];
          statusIndex++;
        }
      }, 200);
    }
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

// UI initialization
function initializeUI() {
  console.log('Initializing UI components...');
  
  // Initialize tab system
  initializeTabs();
  
  // Initialize theme toggle
  initializeThemeToggle();
  
  // Initialize modal system
  initializeModals();
  
  // Initialize progress indicators
  initializeProgressIndicators();
  
  // Set initial UI state
  updateConnectionStatus(true);
  updateSystemUptime();
  
  console.log('UI initialization complete');
}

// Tab system
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      const targetContent = document.getElementById(targetTab + '-tab');
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // Trigger tab-specific initialization
      handleTabSwitch(targetTab);
    });
  });
}

// Handle tab switching logic
function handleTabSwitch(tabName) {
  switch(tabName) {
    case 'analytics':
      if (window.chartManager) {
        setTimeout(() => window.chartManager.refreshCharts(), 100);
      }
      break;
    case 'alerts':
      updateAlertsDisplay();
      break;
    case 'history':
      updateHistoryTable();
      break;
  }
}

// Theme toggle functionality
function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('climaneer-theme') || 'light';
  
  currentTheme = savedTheme;
  applyTheme(currentTheme);
  
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('climaneer-theme', currentTheme);
  });
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const themeIcon = document.querySelector('#theme-toggle i');
  if (themeIcon) {
    themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }
}

// Modal system
function initializeModals() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const cancelSettings = document.getElementById('cancel-settings');
  const saveSettings = document.getElementById('save-settings');
  
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    loadSettingsToModal();
  });
  
  [closeSettings, cancelSettings].forEach(btn => {
    btn.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
  });
  
  saveSettings.addEventListener('click', () => {
    saveSettingsFromModal();
    settingsModal.style.display = 'none';
    showNotification('Settings Saved', 'Your preferences have been updated', 'success');
  });
  
  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });
}

// Settings management
function loadSettingsToModal() {
  document.getElementById('sound-alerts').checked = settings.soundAlerts;
  document.getElementById('push-notifications').checked = settings.pushNotifications;
  document.getElementById('moisture-threshold').value = settings.moistureThreshold;
  document.getElementById('battery-threshold').value = settings.batteryThreshold;
}

function saveSettingsFromModal() {
  settings.soundAlerts = document.getElementById('sound-alerts').checked;
  settings.pushNotifications = document.getElementById('push-notifications').checked;
  settings.moistureThreshold = parseInt(document.getElementById('moisture-threshold').value);
  settings.batteryThreshold = parseInt(document.getElementById('battery-threshold').value);
  
  // Save to localStorage
  localStorage.setItem('climaneer-settings', JSON.stringify(settings));
  
  // Apply new settings
  applySettings();
}

function loadSavedSettings() {
  const savedSettings = localStorage.getItem('climaneer-settings');
  if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) };
  }
  applySettings();
}

function applySettings() {
  // Apply threshold-based logic
  if (sensorData.soil_moisture && sensorData.soil_moisture < settings.moistureThreshold) {
    triggerLowMoistureAlert();
  }
  
  if (sensorData.battery_level && sensorData.battery_level < settings.batteryThreshold) {
    triggerLowBatteryAlert();
  }
}

// Event listeners initialization
function initializeEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', () => {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
    fetchSensorData().then(() => {
      setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      }, 1000);
    });
  });
  
  // Schedule button
  const scheduleBtn = document.getElementById('schedule-btn');
  const schedulePanel = document.getElementById('control-schedule');
  
  scheduleBtn.addEventListener('click', () => {
    const isVisible = schedulePanel.style.display === 'block';
    schedulePanel.style.display = isVisible ? 'none' : 'block';
    scheduleBtn.classList.toggle('active', !isVisible);
  });
  
  // Alert management
  const clearAlertsBtn = document.getElementById('clear-alerts');
  clearAlertsBtn.addEventListener('click', clearAllAlerts);
  
  // Export data
  const exportBtn = document.getElementById('export-data');
  exportBtn.addEventListener('click', exportHistoryData);
  
  // Notification close buttons
  document.getElementById('aqi-confirm-btn').addEventListener('click', () => {
    hideNotification('air-quality-popup');
  });
  
  // Time range buttons for analytics
  const timeRangeBtns = document.querySelectorAll('[data-range]');
  timeRangeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      timeRangeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      if (window.chartManager) {
        window.chartManager.refreshCharts();
      }
    });
  });
}

// Data collection and API integration
function startDataCollection() {
  console.log('Starting data collection...');
  
  // Initial data fetch
  fetchSensorData();
  
  // Set up periodic data fetching
  setInterval(fetchSensorData, settings.refreshInterval);
  
  // Set up pump runtime tracking
  setInterval(updatePumpRuntime, 1000);
  
  // Set up system uptime tracking
  setInterval(updateSystemUptime, 60000);
}

// Fetch sensor data from your API
async function fetchSensorData() {
  try {
    updateConnectionStatus(true);
    
    // Replace this with your actual API call
    // const response = await fetch(settings.apiUrl);
    // const data = await response.json();
    
    // For demo purposes, generate realistic data
    const data = generateRealisticSensorData();
    
    updateSensorData(data);
    updateUI(data);
    checkAlerts(data);
    addToHistory(data);
    
    lastUpdateTime = new Date();
    
  } catch (error) {
    console.error('Failed to fetch sensor data:', error);
    updateConnectionStatus(false);
    showNotification('Connection Error', 'Failed to fetch sensor data', 'error');
  }
}

// Generate realistic sensor data for demo
function generateRealisticSensorData() {
  const now = Date.now();
  const timeOfDay = (now % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000);
  
  // Simulate daily patterns
  const tempVariation = Math.sin(timeOfDay * 2 * Math.PI) * 8;
  const humidityVariation = Math.cos(timeOfDay * 2 * Math.PI) * 15;
  
  return {
    soil_moisture: Math.max(0, Math.min(100, 45 + Math.sin(now / 300000) * 20 + (Math.random() - 0.5) * 8)),
    air_humidity: Math.max(0, Math.min(100, 60 + humidityVariation + (Math.random() - 0.5) * 10)),
    air_temp: 22 + tempVariation + (Math.random() - 0.5) * 4,
    water_temp: 20 + tempVariation * 0.5 + (Math.random() - 0.5) * 2,
    ph_level: Math.max(0, Math.min(14, 6.8 + Math.sin(now / 400000) * 1.2 + (Math.random() - 0.5) * 0.6)),
    water_level: Math.max(0, Math.min(100, 70 + Math.cos(now / 200000) * 25 + (Math.random() - 0.5) * 8)),
    air_quality: Math.max(0, Math.min(500, 85 + Math.sin(now / 250000) * 30 + (Math.random() - 0.5) * 20)),
    flow_rate: pumpStatus ? Math.max(0, 2.5 + Math.sin(now / 50000) * 1.5 + (Math.random() - 0.5) * 0.8) : 0,
    battery_level: Math.max(0, Math.min(100, 85 - (now % (7 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000) * 60)),
    pump_status: pumpStatus,
    system_status: 'operational',
    timestamp: new Date().toISOString()
  };
}

// Update sensor data
function updateSensorData(data) {
  sensorData = { ...sensorData, ...data };
  
  // Update chart data if chart manager is available
  if (window.chartManager) {
    window.chartManager.updateChartData(data);
  }
}

// Update UI with new sensor data
function updateUI(data) {
  // Update sensor values
  updateElement('soilMoisture', data.soil_moisture?.toFixed(1) + '%');
  updateElement('airHumidity', data.air_humidity?.toFixed(1) + '%');
  updateElement('airData', data.air_temp?.toFixed(1) + '°C');
  updateElement('waterTemp', data.water_temp?.toFixed(1) + '°C');
  updateElement('phValue', data.ph_level?.toFixed(2));
  updateElement('waterLevel', data.water_level?.toFixed(0) + '%');
  updateElement('airQuality', data.air_quality?.toFixed(0) + ' AQI');
  updateElement('flowRate', data.flow_rate?.toFixed(2) + ' L/min');
  
  // Update progress indicators
  updateProgressRing('soil-progress', data.soil_moisture);
  updateProgressRing('humidity-progress', data.air_humidity);
  updateProgressBar('water-fill', data.water_level);
  updateProgressBar('battery-level', data.battery_level);
  updateProgressBar('aqi-fill', (data.air_quality / 500) * 100);
  updateProgressBar('temp-gauge', (data.air_temp / 50) * 100);
  
  // Update pH indicator
  updatePHIndicator(data.ph_level);
  
  // Update status indicators
  updatePumpStatus(data.pump_status);
  updateBatteryStatus(data.battery_level);
  updateWaterStatus(data.water_level);
  updatePHStatus(data.ph_level);
  updateAirQualityStatus(data.air_quality);
  updateFlowStatus(data.flow_rate);
  
  // Update trends
  updateTrends(data);
  
  // Update weather (simulated)
  updateWeatherDisplay();
  
  // Update AI recommendations
  updateAIRecommendations(data);
  
  // Update stats
  updateDailyStats();
}

// Helper function to safely update DOM elements
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined) {
    element.textContent = value;
  }
}

// Progress ring updates
function updateProgressRing(id, value) {
  const ring = document.getElementById(id);
  if (ring && value !== undefined) {
    const circumference = 220;
    const offset = circumference - (value / 100) * circumference;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
  }
}

// Progress bar updates
function updateProgressBar(id, value) {
  const bar = document.getElementById(id);
  if (bar && value !== undefined) {
    bar.style.width = Math.max(0, Math.min(100, value)) + '%';
  }
}

// pH indicator update
function updatePHIndicator(phValue) {
  const indicator = document.getElementById('ph-indicator');
  if (indicator && phValue !== undefined) {
    const position = (phValue / 14) * 100;
    indicator.style.left = Math.max(0, Math.min(100, position)) + '%';
  }
}

// Status updates
function updatePumpStatus(status) {
  const indicator = document.getElementById('pump-indicator');
  const statusText = document.getElementById('pump-status-text');
  const animation = document.getElementById('pump-animation');
  
  if (indicator && statusText && animation) {
    pumpStatus = status;
    
    if (status) {
      indicator.className = 'status-indicator active';
      statusText.textContent = 'Running';
      animation.classList.add('active');
    } else {
      indicator.className = 'status-indicator inactive';
      statusText.textContent = 'Stopped';
      animation.classList.remove('active');
    }
  }
}

function updateBatteryStatus(level) {
  const batteryText = document.getElementById('battery-text');
  const batteryTime = document.getElementById('battery-time');
  
  if (batteryText && level !== undefined) {
    batteryText.textContent = level.toFixed(0) + '%';
    
    if (batteryTime) {
      const hoursRemaining = (level / 100) * 24;
      batteryTime.textContent = hoursRemaining.toFixed(1) + 'h';
    }
  }
}

function updateWaterStatus(level) {
  const waterStatus = document.getElementById('water-status');
  
  if (waterStatus && level !== undefined) {
    if (level > 70) {
      waterStatus.textContent = 'High';
      waterStatus.className = 'sensor-status status-good';
    } else if (level > 30) {
      waterStatus.textContent = 'Normal';
      waterStatus.className = 'sensor-status status-normal';
    } else {
      waterStatus.textContent = 'Low';
      waterStatus.className = 'sensor-status status-warning';
    }
  }
}

function updatePHStatus(phValue) {
  const phStatus = document.getElementById('ph-status');
  
  if (phStatus && phValue !== undefined) {
    if (phValue >= 6.0 && phValue <= 7.5) {
      phStatus.textContent = 'Optimal';
      phStatus.className = 'sensor-status status-good';
    } else if (phValue >= 5.5 && phValue <= 8.0) {
      phStatus.textContent = 'Acceptable';
      phStatus.className = 'sensor-status status-normal';
    } else {
      phStatus.textContent = 'Needs Attention';
      phStatus.className = 'sensor-status status-warning';
    }
  }
}

function updateAirQualityStatus(aqi) {
  const aqiStatus = document.getElementById('air-quality-status');
  
  if (aqiStatus && aqi !== undefined) {
    if (aqi <= 50) {
      aqiStatus.textContent = 'Good';
      aqiStatus.className = 'sensor-status status-good';
    } else if (aqi <= 100) {
      aqiStatus.textContent = 'Moderate';
      aqiStatus.className = 'sensor-status status-normal';
    } else {
      aqiStatus.textContent = 'Poor';
      aqiStatus.className = 'sensor-status status-warning';
    }
  }
}

function updateFlowStatus(flowRate) {
  const flowStatus = document.getElementById('flow-status');
  
  if (flowStatus && flowRate !== undefined) {
    if (flowRate > 2.0) {
      flowStatus.textContent = 'Normal Flow';
      flowStatus.className = 'sensor-status status-good';
    } else if (flowRate > 0.5) {
      flowStatus.textContent = 'Low Flow';
      flowStatus.className = 'sensor-status status-normal';
    } else {
      flowStatus.textContent = 'No Flow';
      flowStatus.className = 'sensor-status status-warning';
    }
  }
}

// Trend indicators
function updateTrends(data) {
  // This would compare with previous values to show trends
  // For demo, we'll simulate trends
  updateTrendIndicator('moisture-trend', Math.random() > 0.5 ? 'up' : 'down');
  updateTrendIndicator('humidity-trend', Math.random() > 0.5 ? 'up' : 'stable');
  updateTrendIndicator('water-trend', Math.random() > 0.5 ? 'down' : 'up');
  updateTrendIndicator('ph-trend', Math.random() > 0.5 ? 'up' : 'stable');
  updateTrendIndicator('temp-trend', Math.random() > 0.5 ? 'up' : 'down');
  updateTrendIndicator('water-temp-trend', Math.random() > 0.5 ? 'stable' : 'up');
  updateTrendIndicator('air-quality-trend', Math.random() > 0.5 ? 'down' : 'up');
  updateTrendIndicator('flow-trend', Math.random() > 0.5 ? 'up' : 'stable');
}

function updateTrendIndicator(id, trend) {
  const indicator = document.getElementById(id);
  if (indicator) {
    const icon = indicator.querySelector('i');
    if (icon) {
      icon.className = `fas fa-arrow-${trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'minus'} trend-${trend}`;
    }
  }
}

// Weather display update
function updateWeatherDisplay() {
  const weatherSummary = document.getElementById('weather-summary');
  const weatherDetails = document.getElementById('weather-details');
  
  if (weatherSummary && weatherDetails) {
    // Simulate weather data
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = (22 + (Math.random() - 0.5) * 8).toFixed(1);
    
    weatherSummary.textContent = `${condition}, ${temp}°C`;
    weatherDetails.textContent = `Humidity: ${(60 + Math.random() * 20).toFixed(0)}% | Wind: ${(5 + Math.random() * 10).toFixed(1)} km/h`;
  }
}

// AI recommendations
function updateAIRecommendations(data) {
  const aiRecommendation = document.getElementById('aiRecommendation');
  const aiConfidence = document.getElementById('ai-confidence');
  const confidencePercent = document.getElementById('confidence-percent');
  
  if (aiRecommendation && data) {
    let recommendation = '';
    let confidence = 85;
    
    // Generate AI recommendations based on sensor data
    if (data.soil_moisture < 30) {
      recommendation = 'Soil moisture is low. Consider increasing irrigation frequency.';
      confidence = 92;
    } else if (data.ph_level < 6.0 || data.ph_level > 8.0) {
      recommendation = 'pH levels are outside optimal range. Check nutrient solution.';
      confidence = 88;
    } else if (data.air_quality > 150) {
      recommendation = 'Air quality is poor. Ensure proper ventilation in growing area.';
      confidence = 90;
    } else if (data.water_level < 20) {
      recommendation = 'Water reservoir is low. Refill to maintain consistent irrigation.';
      confidence = 95;
    } else {
      recommendation = 'All systems operating within optimal parameters. Continue current schedule.';
      confidence = 87;
    }
    
    aiRecommendation.textContent = recommendation;
    
    if (aiConfidence && confidencePercent) {
      aiConfidence.style.width = confidence + '%';
      confidencePercent.textContent = confidence + '%';
    }
  }
}

// Daily stats update
function updateDailyStats() {
  updateElement('water-used', totalWaterUsed.toFixed(1) + ' L');
  updateElement('total-runtime', formatRuntime(pumpRuntime));
  updateElement('efficiency', (95 + Math.random() * 5).toFixed(1) + '%');
}

// Pump runtime tracking
function updatePumpRuntime() {
  if (pumpStatus) {
    pumpRuntime += 1; // seconds
    totalWaterUsed += 0.042; // Approximate water usage per second
  }
  
  updateElement('pump-runtime', formatRuntime(pumpRuntime));
}

function formatRuntime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// System uptime tracking
function updateSystemUptime() {
  // Simulate slight variations in uptime
  systemUptime = Math.max(95, Math.min(100, systemUptime + (Math.random() - 0.5) * 0.1));
  updateElement('uptime', systemUptime.toFixed(1) + '%');
}

// Connection status management
function updateConnectionStatus(connected) {
  isConnected = connected;
  const statusDot = document.getElementById('connection-status');
  const statusText = statusDot?.nextElementSibling;
  
  if (statusDot && statusText) {
    if (connected) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Online';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Offline';
    }
  }
}

// Progress indicators initialization
function initializeProgressIndicators() {
  // Initialize all progress rings
  const progressRings = document.querySelectorAll('.progress-ring-fill');
  progressRings.forEach(ring => {
    const circumference = 220;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
  });
}

// Pump control functions
function togglePumpWithManualOverride(shouldStart) {
  manualOverride = true;
  pumpStatus = shouldStart;
  
  // Update control mode indicator
  updateElement('control-mode', 'Manual');
  
  // Send command to your API
  sendPumpCommand(shouldStart);
  
  // Update UI
  updatePumpStatus(shouldStart);
  
  // Show notification
  const action = shouldStart ? 'started' : 'stopped';
  showNotification('Pump Control', `Pump ${action} manually`, 'info');
  
  // Play sound if enabled
  if (settings.soundAlerts) {
    playSound('pump-sound');
  }
}

function resetAutoMode() {
  manualOverride = false;
  updateElement('control-mode', 'Automatic');
  
  showNotification('Auto Mode', 'Pump returned to automatic control', 'success');
}

// Send pump command to your API
async function sendPumpCommand(shouldStart) {
  try {
    // Replace with your actual API endpoint
    // const response = await fetch(`${settings.apiUrl}/pump`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ action: shouldStart ? 'start' : 'stop' })
    // });
    
    console.log('Pump command sent:', shouldStart ? 'start' : 'stop');
  } catch (error) {
    console.error('Failed to send pump command:', error);
    showNotification('Control Error', 'Failed to send pump command', 'error');
  }
}

// Alert system
function checkAlerts(data) {
  // Check for various alert conditions
  if (data.soil_moisture < settings.moistureThreshold) {
    addAlert('Low Soil Moisture', `Soil moisture is ${data.soil_moisture.toFixed(1)}%`, 'warning');
  }
  
  if (data.battery_level < settings.batteryThreshold) {
    addAlert('Low Battery', `Battery level is ${data.battery_level.toFixed(0)}%`, 'error');
  }
  
  if (data.water_level < 15) {
    addAlert('Low Water Level', 'Water reservoir needs refilling', 'warning');
  }
  
  if (data.ph_level < 5.5 || data.ph_level > 8.5) {
    addAlert('pH Alert', `pH level is ${data.ph_level.toFixed(2)}`, 'warning');
  }
  
  if (data.air_quality > 150) {
    addAlert('Poor Air Quality', `AQI is ${data.air_quality.toFixed(0)}`, 'warning');
    showAirQualityPopup();
  }
}

function addAlert(title, message, type) {
  const alert = {
    id: Date.now(),
    title,
    message,
    type,
    timestamp: new Date(),
    acknowledged: false
  };
  
  alertHistory.unshift(alert);
  alertCount++;
  
  updateAlertBadge();
  updateAlertsDisplay();
  
  // Show notification if enabled
  if (settings.pushNotifications) {
    showNotification(title, message, type);
  }
  
  // Play sound if enabled
  if (settings.soundAlerts) {
    playSound('aqi-alert-sound');
  }
}

function updateAlertBadge() {
  const badge = document.getElementById('alert-count');
  if (badge) {
    badge.textContent = alertCount;
    badge.style.display = alertCount > 0 ? 'block' : 'none';
  }
}

function updateAlertsDisplay() {
  const alertsList = document.getElementById('alerts-list');
  if (!alertsList) return;
  
  alertsList.innerHTML = '';
  
  if (alertHistory.length === 0) {
    alertsList.innerHTML = '<div class="no-alerts">No alerts at this time</div>';
    return;
  }
  
  alertHistory.forEach(alert => {
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item alert-${alert.type}`;
    alertElement.innerHTML = `
      <div class="alert-icon">
        <i class="fas fa-${getAlertIcon(alert.type)}"></i>
      </div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-message">${alert.message}</div>
        <div class="alert-time">${formatTime(alert.timestamp)}</div>
      </div>
      <button class="alert-dismiss" onclick="dismissAlert(${alert.id})">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    alertsList.appendChild(alertElement);
  });
}

function getAlertIcon(type) {
  switch(type) {
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    case 'info': return 'info-circle';
    case 'success': return 'check-circle';
    default: return 'bell';
  }
}

function dismissAlert(alertId) {
  alertHistory = alertHistory.filter(alert => alert.id !== alertId);
  alertCount = Math.max(0, alertCount - 1);
  updateAlertBadge();
  updateAlertsDisplay();
}

function clearAllAlerts() {
  alertHistory = [];
  alertCount = 0;
  updateAlertBadge();
  updateAlertsDisplay();
  showNotification('Alerts Cleared', 'All alerts have been dismissed', 'success');
}

// Notification system
function showNotification(title, message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${getAlertIcon(type)}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Position notification
  const notifications = document.querySelectorAll('.notification');
  notification.style.top = `${20 + (notifications.length - 1) * 80}px`;
  notification.style.right = '20px';
  notification.style.display = 'flex';
  
  // Add close functionality
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    hideNotification(notification);
  });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      hideNotification(notification);
    }
  }, 5000);
}

function hideNotification(notification) {
  if (typeof notification === 'string') {
    notification = document.getElementById(notification);
  }
  
  if (notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

function showAirQualityPopup() {
  const popup = document.getElementById('air-quality-popup');
  if (popup) {
    popup.style.display = 'flex';
    
    setTimeout(() => {
      hideNotification('air-quality-popup');
    }, 5000);
  }
}

// Sound management
function playSound(soundId) {
  if (!settings.soundAlerts) return;
  
  const audio = document.getElementById(soundId);
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio play failed:', e));
  }
}

// Data history management
function addToHistory(data) {
  const historyEntry = {
    timestamp: new Date(),
    ...data
  };
  
  dataHistory.unshift(historyEntry);
  
  // Keep only last 100 entries
  if (dataHistory.length > 100) {
    dataHistory = dataHistory.slice(0, 100);
  }
}

function updateHistoryTable() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  dataHistory.slice(0, 20).forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatTime(entry.timestamp)}</td>
      <td>${entry.soil_moisture?.toFixed(1) || '--'}%</td>
      <td>${entry.air_humidity?.toFixed(1) || '--'}%</td>
      <td>${entry.air_temp?.toFixed(1) || '--'}°C</td>
      <td>${entry.ph_level?.toFixed(2) || '--'}</td>
      <td>${entry.water_level?.toFixed(0) || '--'}%</td>
    `;
    tbody.appendChild(row);
  });
}

function exportHistoryData() {
  const csvContent = generateCSVContent();
  downloadCSV(csvContent, `climaneer_data_${new Date().toISOString().split('T')[0]}.csv`);
  showNotification('Export Complete', 'Data has been downloaded', 'success');
}

function generateCSVContent() {
  const headers = ['Timestamp', 'Soil Moisture (%)', 'Air Humidity (%)', 'Temperature (°C)', 'pH Level', 'Water Level (%)', 'Flow Rate (L/min)'];
  const rows = dataHistory.map(entry => [
    entry.timestamp.toISOString(),
    entry.soil_moisture?.toFixed(1) || '',
    entry.air_humidity?.toFixed(1) || '',
    entry.air_temp?.toFixed(1) || '',
    entry.ph_level?.toFixed(2) || '',
    entry.water_level?.toFixed(0) || '',
    entry.flow_rate?.toFixed(2) || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  window.URL.revokeObjectURL(url);
}

// Utility functions
function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

function initializeNotifications() {
  // Request notification permission if supported
  if ('Notification' in window && settings.pushNotifications) {
    Notification.requestPermission();
  }
}

// Trigger specific alert functions
function triggerLowMoistureAlert() {
  if (!manualOverride && settings.autoMode) {
    // Auto-start pump if in auto mode
    pumpStatus = true;
    updatePumpStatus(true);
    sendPumpCommand(true);
  }
}

function triggerLowBatteryAlert() {
  // Could trigger power saving mode or send urgent notification
  showNotification('Critical Battery', 'System battery critically low', 'error');
}

// Make functions globally available for HTML onclick handlers
window.togglePumpWithManualOverride = togglePumpWithManualOverride;
window.resetAutoMode = resetAutoMode;
window.dismissAlert = dismissAlert;

// Initialize progress indicators when page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeProgressIndicators, 500);
});

console.log('CLIMANEER Dashboard main.js loaded successfully');