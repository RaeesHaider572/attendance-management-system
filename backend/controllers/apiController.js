const DeviceModel = require('../models/DeviceModel');
const AttendanceModel = require('../models/AttendanceModel');
const CommandModel = require('../models/CommandModel');

// Get all devices
const getDevices = async (req, res) => {
    try {
        const devices = await DeviceModel.getAllDevices();
        res.json({
            success: true,
            data: devices,
            total: devices.length
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get device by SN
const getDevice = async (req, res) => {
    try {
        const { sn } = req.params;
        const device = await DeviceModel.getDeviceBySN(sn);
        
        if (!device) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        
        res.json({ success: true, data: device });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get attendance logs
const getAttendance = async (req, res) => {
    try {
        const { startDate, endDate, employeeCode, deviceSN } = req.query;
        
        const logs = await AttendanceModel.getAttendanceLogs({
            startDate,
            endDate,
            employeeCode,
            deviceSN
        });
        
        const summary = await AttendanceModel.getTodaySummary();
        
        res.json({
            success: true,
            data: logs,
            summary: summary,
            total: logs.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Send command to device
const sendCommand = async (req, res) => {
    try {
        const { sn } = req.params;
        const { command, data } = req.body;
        
        // Validate command
        const validCommands = ['SYNCTIME', 'RESTART', 'CLEAR_LOGS', 'GET_LOGS'];
        if (!validCommands.includes(command)) {
            return res.status(400).json({ success: false, error: 'Invalid command' });
        }
        
        // Add command to queue
        const result = await CommandModel.addCommand(sn, command, data);
        
        res.json({
            success: true,
            message: `Command ${command} queued for device ${sn}`,
            commandId: result.commandId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const devices = await DeviceModel.getAllDevices();
        const todaySummary = await AttendanceModel.getTodaySummary();
        const recentLogs = await AttendanceModel.getAttendanceLogs({ limit: 10 });
        
        const onlineDevices = devices.filter(d => d.Status === 'ONLINE').length;
        const offlineDevices = devices.filter(d => d.Status === 'OFFLINE').length;
        
        res.json({
            success: true,
            data: {
                totalDevices: devices.length,
                onlineDevices: onlineDevices,
                offlineDevices: offlineDevices,
                todayPresents: todaySummary.TotalPresents || 0,
                todayLogs: todaySummary.TotalLogs || 0,
                recentLogs: recentLogs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getDevices,
    getDevice,
    getAttendance,
    sendCommand,
    getDashboardStats
};