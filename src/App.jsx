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
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>🌊 AQUACLIMA Dashboard</h1>
      
      <div style={{ background: '#f0f8ff', padding: 20, borderRadius: 8 }}>
        <h2>📊 Sensor Data</h2>
        {sensorData && Object.entries(sensorData).map(([key, value]) => (
          key !== 'pump' ? (
            <div key={key} style={{ marginBottom: 10 }}>
              <strong>{key.replace(/_/g, ' ')}:</strong> {value}
            </div>
          ) : null
        ))}
        <div>
          <strong>Pump Status:</strong> {pumpStatus ? 'ON' : 'OFF'}
          <button onClick={togglePump} style={{ marginLeft: 10 }}>
            Toggle Pump
          </button>
        </div>
      </div>

      <div style={{ marginTop: 40, background: '#fff', padding: 20, borderRadius: 8 }}>
        <h2>🤖 AQUACLIMA Assistant</h2>
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Ask something about your water system..."
          style={{ padding: 10, width: '80%' }}
        />
        <button onClick={handleAskBot} style={{ marginLeft: 10 }}>Ask</button>
        <p style={{ marginTop: 10 }}><strong>Assistant:</strong> {chatOutput}</p>
      </div>
    </div>
  );
}
