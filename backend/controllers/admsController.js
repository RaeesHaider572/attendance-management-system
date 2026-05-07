const DeviceModel = require('../models/DeviceModel');
const AttendanceModel = require('../models/AttendanceModel');
const CommandModel = require('../models/CommandModel');
const PushLogModel = require('../models/PushLogModel');

// Handle device push data (logs)
const handleCData = async (req, res) => {
    const deviceSN = req.query.SN;
    const rawData = req.body;
    const clientIP = req.ip;
    
    console.log(`📡 Received data from device: ${deviceSN}`);
    console.log(`📝 Raw data: ${rawData}`);
    
    try {
        // Save push log
        await PushLogModel.savePushLog(deviceSN, rawData, 'RECEIVED');
        
        // Register or update device
        await DeviceModel.registerDevice(deviceSN, clientIP);
        
        // Parse and save attendance logs
        const lines = rawData.split('\n');
        let savedCount = 0;
        
        for (const line of lines) {
            if (line.trim()) {
                const result = await AttendanceModel.saveAttendanceLog({
                    deviceSN: deviceSN,
                    rawLine: line.trim()
                });
                if (result.success) savedCount++;
            }
        }
        
        console.log(`✅ Saved ${savedCount} attendance logs`);
        
        // Send response to device
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing push data:', error);
        await PushLogModel.savePushLog(deviceSN, rawData, 'FAILED', error.message);
        res.status(500).send('ERROR');
    }
};

// Device checks for pending commands
const handleGetRequest = async (req, res) => {
    const deviceSN = req.query.SN;
    
    console.log(`🔍 Device ${deviceSN} checking for commands`);
    
    try {
        const pendingCommand = await CommandModel.getPendingCommands(deviceSN);
        
        if (pendingCommand) {
            console.log(`📤 Sending command to ${deviceSN}: ${pendingCommand.CommandType}`);
            
            // Mark as sent
            await CommandModel.updateCommandStatus(pendingCommand.CommandID, 'SENT');
            
            // Send command to device
            let commandResponse = pendingCommand.CommandType;
            
            // Add parameters if needed
            if (pendingCommand.CommandType === 'SETTIME') {
                const now = new Date();
                const timeStr = now.toISOString().slice(0,19).replace('T',' ');
                commandResponse = `SETTIME ${timeStr}`;
            }
            
            res.status(200).send(commandResponse);
        } else {
            // No commands pending
            res.status(200).send('');
        }
    } catch (error) {
        console.error('Error getting pending commands:', error);
        res.status(500).send('ERROR');
    }
};

// Device reports command execution result
const handleDeviceCmd = async (req, res) => {
    const deviceSN = req.query.SN;
    const commandResult = req.query;
    
    console.log(`📢 Command result from ${deviceSN}:`, commandResult);
    
    try {
        // Update device status
        await DeviceModel.updateDeviceStatus(deviceSN, 'ONLINE');
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling device command:', error);
        res.status(500).send('ERROR');
    }
};

// Health check endpoint
const healthCheck = async (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        service: 'ZK Tecno ADMS Server'
    });
};

module.exports = {
    handleCData,
    handleGetRequest,
    handleDeviceCmd,
    healthCheck
};