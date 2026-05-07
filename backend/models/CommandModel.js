const { getConnection, sql } = require('../config/database');

class CommandModel {
    // Add command to queue
    static async addCommand(deviceSN, commandType, commandData = null) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('deviceSN', sql.NVarChar, deviceSN)
                .input('commandType', sql.NVarChar, commandType)
                .input('commandData', sql.NVarChar, commandData)
                .query(`
                    INSERT INTO CommandQueue (DeviceSN, CommandType, CommandData, Status)
                    VALUES (@deviceSN, @commandType, @commandData, 'PENDING')
                `);
            
            return { success: true, commandId: result.recordset[0] };
        } catch (error) {
            throw error;
        }
    }
    
    // Get pending commands for device
    static async getPendingCommands(deviceSN) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('deviceSN', sql.NVarChar, deviceSN)
                .query(`
                    SELECT TOP 1 CommandID, CommandType, CommandData
                    FROM CommandQueue
                    WHERE DeviceSN = @deviceSN AND Status = 'PENDING'
                    ORDER BY CreatedAt ASC
                `);
            
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }
    
    // Update command status
    static async updateCommandStatus(commandId, status, responseText = null) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('commandId', sql.Int, commandId)
                .input('status', sql.NVarChar, status)
                .input('responseText', sql.NVarChar, responseText)
                .input('processedAt', sql.DateTime, new Date())
                .query(`
                    UPDATE CommandQueue
                    SET Status = @status, ResponseText = @responseText, ProcessedAt = @processedAt
                    WHERE CommandID = @commandId
                `);
            
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CommandModel;