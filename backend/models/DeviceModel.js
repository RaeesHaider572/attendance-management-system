const { getConnection, sql } = require('../config/database');

class DeviceModel {
    // Register new device automatically
    static async registerDevice(deviceSN, ipAddress = null) {
        try {
            const pool = await getConnection();
            
            // Check if device exists
            const checkResult = await pool.request()
                .input('deviceSN', sql.NVarChar, deviceSN)
                .query('SELECT * FROM Devices WHERE DeviceSN = @deviceSN');
            
            if (checkResult.recordset.length === 0) {
                // Auto register new device
                const result = await pool.request()
                    .input('deviceSN', sql.NVarChar, deviceSN)
                    .input('deviceName', sql.NVarChar, `Device_${deviceSN}`)
                    .input('deviceModel', sql.NVarChar, 'uFace800')
                    .input('ipAddress', sql.NVarChar, ipAddress)
                    .input('status', sql.NVarChar, 'ONLINE')
                    .query(`
                        INSERT INTO Devices (DeviceSN, DeviceName, DeviceModel, IPAddress, Status, LastActivity)
                        VALUES (@deviceSN, @deviceName, @deviceModel, @ipAddress, @status, GETDATE())
                    `);
                
                console.log(`✅ New device registered: ${deviceSN}`);
                return { success: true, message: 'Device registered', isNew: true };
            } else {
                // Update existing device status
                await pool.request()
                    .input('deviceSN', sql.NVarChar, deviceSN)
                    .input('ipAddress', sql.NVarChar, ipAddress)
                    .query(`
                        UPDATE Devices 
                        SET Status = 'ONLINE', LastActivity = GETDATE(), IPAddress = ISNULL(@ipAddress, IPAddress)
                        WHERE DeviceSN = @deviceSN
                    `);
                
                console.log(`🔄 Device updated: ${deviceSN}`);
                return { success: true, message: 'Device updated', isNew: false };
            }
        } catch (error) {
            console.error('Device registration error:', error);
            throw error;
        }
    }
    
    // Get all devices
    static async getAllDevices() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query('SELECT * FROM Devices ORDER BY CreatedAt DESC');
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
    
    // Get device by SN
    static async getDeviceBySN(deviceSN) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('deviceSN', sql.NVarChar, deviceSN)
                .query('SELECT * FROM Devices WHERE DeviceSN = @deviceSN');
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }
    
    // Update device status
    static async updateDeviceStatus(deviceSN, status) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('deviceSN', sql.NVarChar, deviceSN)
                .input('status', sql.NVarChar, status)
                .query(`
                    UPDATE Devices 
                    SET Status = @status, LastActivity = GETDATE()
                    WHERE DeviceSN = @deviceSN
                `);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = DeviceModel;