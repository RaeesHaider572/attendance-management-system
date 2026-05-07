const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getConnection } = require('./config/database');
const admsController = require('./controllers/admsController');
const apiController = require('./controllers/apiController');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

// ============================================
// ZKTeco ADMS Endpoints (For Devices)
// ============================================
app.post('/iclock/cdata', admsController.handleCData);
app.get('/iclock/getrequest', admsController.handleGetRequest);
app.post('/iclock/devicecmd', admsController.handleDeviceCmd);
app.get('/health', admsController.healthCheck);

// ============================================
// API Endpoints (For React Frontend)
// ============================================
app.get('/api/devices', apiController.getDevices);
app.get('/api/devices/:sn', apiController.getDevice);
app.get('/api/attendance', apiController.getAttendance);
app.post('/api/devices/:sn/command', apiController.sendCommand);
app.get('/api/dashboard/stats', apiController.getDashboardStats);

// ============================================
// Error handling middleware
// ============================================
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: err.message 
    });
});

// ============================================
// Start server
// ============================================
async function startServer() {
    try {
        // Test database connection
        await getConnection();
        
        app.listen(PORT, () => {
            console.log(`
            ╔══════════════════════════════════════════════════╗
            ║   🚀 ZKTeco ADMS Server Started Successfully    ║
            ╠══════════════════════════════════════════════════╣
            ║   Server: http://localhost:${PORT}                  ║
            ║   Health: http://localhost:${PORT}/health          ║
            ║   Device: http://localhost:${PORT}/iclock/cdata    ║
            ║   API:    http://localhost:${PORT}/api/devices     ║
            ╚══════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();