const { getConnection, sql } = require('../config/database');

class PushLogModel {
    static async savePushLog(deviceSN, rawData, status, errorMessage = null) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('deviceSN', sql.NVarChar, deviceSN)
                .input('rawData', sql.NVarChar, rawData.substring(0, 1000)) // Limit length
                .input('status', sql.NVarChar, status)
                .input('errorMessage', sql.NVarChar, errorMessage)
                .query(`
                    INSERT INTO PushLogs (DeviceSN, RawData, Status, ErrorMessage)
                    VALUES (@deviceSN, @rawData, @status, @errorMessage)
                `);
            return { success: true };
        } catch (error) {
            console.error('Save push log error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = PushLogModel;