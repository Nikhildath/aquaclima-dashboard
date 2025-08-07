import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AquaclimaDashboard() {
  const [sensorData, setSensorData] = useState(null);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('');

  // Mock sensor data for demo purposes
  const mockSensorData = {
    temperature: 23.5,
    ph: 7.2,
    dissolved_oxygen: 8.4,
    turbidity: 2.1,
    water_level: 85,
    flow_rate: 12.3,
    conductivity: 450,
    timestamp: new Date().toLocaleString()
  };

  const fetchSensorData = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSensorData(mockSensorData);
      setPumpStatus(Math.random() > 0.5); // Random pump status for demo
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      // Fallback to mock data
      setSensorData(mockSensorData);
      setLoading(false);
    }
  };

  const togglePump = async () => {
    try {
      const newStatus = !pumpStatus;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setPumpStatus(newStatus);
    } catch (error) {
      console.error('Error updating pump status:', error);
      // Still toggle for demo purposes
      setPumpStatus(!pumpStatus);
    }
  };

  const handleAskBot = async () => {
    try {
      setChatOutput("Thinking...");
      const res = await axios.post(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
        { inputs: { text: chatInput } },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
      );
      setChatOutput(res.data.generated_text || "Sorry, I couldn't understand.");
    } catch (err) {
      setChatOutput("Error reaching assistant.");
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(() => {
      // Update mock data with slight variations
      setSensorData(prev => ({
        ...prev,
        temperature: (23 + Math.random() * 4).toFixed(1),
        ph: (7 + Math.random() * 0.8).toFixed(1),
        dissolved_oxygen: (8 + Math.random() * 2).toFixed(1),
        turbidity: (2 + Math.random()).toFixed(1),
        water_level: Math.floor(80 + Math.random() * 20),
        flow_rate: (12 + Math.random() * 2).toFixed(1),
        conductivity: Math.floor(400 + Math.random() * 100),
        timestamp: new Date().toLocaleString()
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Remove the loading screen that was causing issues
  // if (loading) {
  //   return (
  //     <div className="loading">
  //       <div className="loading-spinner"></div>
  //       Loading AQUACLIMA Dashboard...
  //     </div>
  //   );
  // }

  return (
    <div className="container">
      <div className="header">
        <h1 className="logo">🌊 AQUACLIMA</h1>
        <p className="subtitle">Advanced Water Quality Monitoring System</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">📊 Sensor Readings</h2>
          <div className="sensor-grid">
            <div className="sensor-item">
              <div className="sensor-label">Temperature</div>
              <div className="sensor-value">{sensorData?.temperature || '--'}°C</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">pH Level</div>
              <div className="sensor-value">{sensorData?.ph || '--'}</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">Dissolved Oxygen</div>
              <div className="sensor-value">{sensorData?.dissolved_oxygen || '--'} mg/L</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">Turbidity</div>
              <div className="sensor-value">{sensorData?.turbidity || '--'} NTU</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">Water Level</div>
              <div className="sensor-value">{sensorData?.water_level || '--'} cm</div>
            </div>
            <div className="sensor-item">
              <div className="sensor-label">Flow Rate</div>
              <div className="sensor-value">{sensorData?.flow_rate || '--'} L/min</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">⚙️ Pump Control</h2>
          <div className="pump-control">
            <div className={`pump-status ${pumpStatus ? 'on' : 'off'}`}>
              <div className="status-indicator"></div>
              Pump {pumpStatus ? 'ON' : 'OFF'}
            </div>
            <button className="pump-button" onClick={togglePump}>
              {pumpStatus ? 'Stop Pump' : 'Start Pump'}
            </button>
          </div>
        </div>
      </div>

      <div className="card chat-section">
        <h2 className="card-title">🤖 AQUACLIMA Assistant</h2>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleAskBot()}
            placeholder="Ask about water temperature, pH levels, pump operations..."
            disabled={chatLoading}
          />
          <button 
            className="chat-button" 
            onClick={handleAskBot}
            disabled={chatLoading || !chatInput.trim()}
          >
            {chatLoading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
        <div className="chat-output">
          {chatOutput || "👋 Hi! I'm your AQUACLIMA assistant. Ask me about your water system parameters!"}
        </div>
      </div>
    </div>
  );
}
