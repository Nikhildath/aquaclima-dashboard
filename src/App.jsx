import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AquaclimaDashboard() {
  const [sensorData, setSensorData] = useState(null);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('');

  const FIREBASE_URL = "https://your-project-id.firebaseio.com";
  const HF_API_KEY = "your_huggingface_api_key";

  const fetchSensorData = async () => {
    try {
      const response = await axios.get(`${FIREBASE_URL}/sensor_data.json`);
      setSensorData(response.data);
      setPumpStatus(response.data.pump || false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  const togglePump = async () => {
    try {
      const newStatus = !pumpStatus;
      await axios.put(`${FIREBASE_URL}/actuators.json`, { pump: newStatus });
      setPumpStatus(newStatus);
    } catch (error) {
      console.error('Error updating pump status:', error);
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
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading AQUACLIMA data...</p>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, background: '#e0f7fa', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 32, fontWeight: 'bold' }}>🌿 AQUACLIMA Dashboard</h1>

      <div style={{ marginTop: 20 }}>
        {Object.entries(sensorData).map(([key, value]) => (
          key !== 'pump' && (
            <div key={key} style={{ marginBottom: 10 }}>
              <strong>{key.replace(/_/g, ' ')}:</strong> {value}
            </div>
          )
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
