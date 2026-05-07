const { getConnection, sql } = require('../config/database');

class AttendanceModel {
    // Save attendance log from device
    static async saveAttendanceLog(logData) {
        try {
            const pool = await getConnection();
            
            // Parse ZKTeco format: "20260410 08:30:00,1,EMP001,0,0,0,0"
            // Format: [DateTime, UserID, EmployeeCode, Status, ...]
            const parts = logData.rawLine.split(',');
            
            if (parts.length < 3) {
                throw new Error('Invalid log format');
            }
            
            const dateTimeStr = `${parts[0]} ${parts[1]}`;
            const attendanceTime = new Date(dateTimeStr);
            const employeeCode = parts[2];
            const status = parseInt(parts[3]) || 0;
            const verifyMode = parseInt(parts[4]) || 0;
            
            // Check for duplicate
            const checkDuplicate = await pool.request()
                .input('deviceSN', sql.NVarChar, logData.deviceSN)
                .input('employeeCode', sql.NVarChar, employeeCode)
                .input('attendanceTime', sql.DateTime, attendanceTime)
                .query(`
                    SELECT LogID FROM AttendanceLogs 
                    WHERE DeviceSN = @deviceSN 
                    AND EmployeeCode = @employeeCode 
                    AND AttendanceTime = @attendanceTime
                `);
            
            if (checkDuplicate.recordset.length > 0) {
                console.log(`⚠️ Duplicate log ignored: ${employeeCode} at ${attendanceTime}`);
                return { success: false, message: 'Duplicate log' };
            }
            
            // Insert new log
            const result = await pool.request()
                .input('deviceSN', sql.NVarChar, logData.deviceSN)
                .input('employeeCode', sql.NVarChar, employeeCode)
                .input('attendanceTime', sql.DateTime, attendanceTime)
                .input('attendanceDate', sql.Date, attendanceTime)
                .input('status', sql.Int, status)
                .input('verifyMode', sql.Int, verifyMode)
                .query(`
                    INSERT INTO AttendanceLogs (DeviceSN, EmployeeCode, AttendanceTime, AttendanceDate, Status, VerifyMode)
                    VALUES (@deviceSN, @employeeCode, @attendanceTime, @attendanceDate, @status, @verifyMode)
                `);
            
            console.log(`✅ Log saved: ${employeeCode} - ${attendanceTime}`);
            return { success: true, message: 'Log saved', employeeCode, attendanceTime };
        } catch (error) {
            console.error('Save log error:', error);
            throw error;
        }
    }
    
    // Get attendance logs with filters
    static async getAttendanceLogs(filters = {}) {
        try {
            const pool = await getConnection();
            let query = `
                SELECT a.*, e.FullName, e.Department, e.Designation, d.DeviceName
                FROM AttendanceLogs a
                LEFT JOIN Employees e ON a.EmployeeCode = e.EmployeeCode
                LEFT JOIN Devices d ON a.DeviceSN = d.DeviceSN
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            if (filters.startDate) {
                query += ` AND a.AttendanceDate >= @startDate`;
                request.input('startDate', sql.Date, filters.startDate);
            }
            
            if (filters.endDate) {
                query += ` AND a.AttendanceDate <= @endDate`;
                request.input('endDate', sql.Date, filters.endDate);
            }
            
            if (filters.employeeCode) {
                query += ` AND a.EmployeeCode = @employeeCode`;
                request.input('employeeCode', sql.NVarChar, filters.employeeCode);
            }
            
            if (filters.deviceSN) {
                query += ` AND a.DeviceSN = @deviceSN`;
                request.input('deviceSN', sql.NVarChar, filters.deviceSN);
            }
            
            query += ` ORDER BY a.AttendanceTime DESC`;
            
            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
    
    // Get today's attendance summary
    static async getTodaySummary() {
        try {
            const pool = await getConnection();
            const today = new Date().toISOString().split('T')[0];
            
            const result = await pool.request()
                .input('today', sql.Date, today)
                .query(`
                    SELECT 
                        COUNT(DISTINCT EmployeeCode) as TotalPresents,
                        COUNT(*) as TotalLogs,
                        COUNT(CASE WHEN Status = 0 THEN 1 END) as CheckIns,
                        COUNT(CASE WHEN Status = 1 THEN 1 END) as CheckOuts
                    FROM AttendanceLogs
                    WHERE AttendanceDate = @today
                `);
            
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AttendanceModel;