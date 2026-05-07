import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Dashboard stats
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// Devices
export const getDevices = () => api.get('/api/devices');
export const getDevice = (sn) => api.get(`/api/devices/${sn}`);
export const sendCommand = (sn, command, data = null) => 
    api.post(`/api/devices/${sn}/command`, { command, data });

// Attendance
export const getAttendance = (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/api/attendance?${params}`);
};

export default api;