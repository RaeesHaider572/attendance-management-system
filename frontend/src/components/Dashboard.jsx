import React, { useState, useEffect } from 'react';
import { getDashboardStats, getDevices, getAttendance } from '../services/api';
import './Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState({
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        todayPresents: 0,
        todayLogs: 0
    });
    const [devices, setDevices] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, devicesRes, attendanceRes] = await Promise.all([
                getDashboardStats(),
                getDevices(),
                getAttendance({ limit: 10 })
            ]);

            setStats(statsRes.data.data);
            setDevices(devicesRes.data.data);
            setRecentLogs(attendanceRes.data.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const sendCommandToDevice = async (deviceSN, command) => {
        try {
            await sendCommand(deviceSN, command);
            alert(`Command ${command} sent to device ${deviceSN}`);
        } catch (err) {
            alert(`Failed to send command: ${err.message}`);
        }
    };

    if (loading) {
        return <div className="loading">Loading Dashboard...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={fetchDashboardData}>Retry</button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <h1>Attendance System Dashboard</h1>
            
            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Devices</h3>
                    <div className="stat-value">{stats.totalDevices}</div>
                    <div className="stat-sub">
                        <span className="online">🟢 Online: {stats.onlineDevices}</span>
                        <span className="offline">⚫ Offline: {stats.offlineDevices}</span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <h3>Today's Attendance</h3>
                    <div className="stat-value">{stats.todayPresents}</div>
                    <div className="stat-sub">Total Logs: {stats.todayLogs}</div>
                </div>
            </div>
            
            {/* Devices Table */}
            <div className="devices-section">
                <h2>Registered Devices ({stats.totalDevices})</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Device SN</th>
                            <th>Device Name</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Last Activity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map(device => (
                            <tr key={device.DeviceSN}>
                                <td>{device.DeviceSN}</td>
                                <td>{device.DeviceName}</td>
                                <td>{device.Location || 'Not set'}</td>
                                <td>
                                    <span className={`status-badge ${device.Status}`}>
                                        {device.Status}
                                    </span>
                                </td>
                                <td>
                                    {device.LastActivity ? 
                                        new Date(device.LastActivity).toLocaleString() : 
                                        'Never'
                                    }
                                </td>
                                <td>
                                    <button 
                                        className="btn-small"
                                        onClick={() => sendCommandToDevice(device.DeviceSN, 'SYNCTIME')}
                                    >
                                        Sync Time
                                    </button>
                                    <button 
                                        className="btn-small btn-danger"
                                        onClick={() => sendCommandToDevice(device.DeviceSN, 'RESTART')}
                                    >
                                        Restart
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Recent Logs */}
            <div className="logs-section">
                <h2>Recent Attendance Logs</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Employee Code</th>
                            <th>Name</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Device</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentLogs.map(log => (
                            <tr key={log.LogID}>
                                <td>{log.EmployeeCode}</td>
                                <td>{log.FullName || 'Unknown'}</td>
                                <td>{new Date(log.AttendanceTime).toLocaleString()}</td>
                                <td>
                                    {log.Status === 0 ? '✅ Check-In' : 
                                     log.Status === 1 ? '❌ Check-Out' : 
                                     'Other'}
                                </td>
                                <td>{log.DeviceName || log.DeviceSN}</td>
                            </tr>
                        ))}
                        {recentLogs.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center'}}>
                                    No attendance logs found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;