const express = require('express');
const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

app.post('/wagmi', (req, res) => {
    try {
        const body = req.body;

        if (!body || Object.keys(body).length === 0) {
            return res.status(200).json({
                message: "wagmi",
                timestamp: new Date().toISOString(),
                lang: "Node.js"
            });
        }

        if (body.hasOwnProperty('a') && body.hasOwnProperty('b')) {
            const { a, b } = body;

            if (typeof a !== 'number' || typeof b !== 'number') {
                return res.status(400).json({
                    error: "Invalid input"
                });
            }

            if (a < 0 || b < 0) {
                return res.status(400).json({
                    error: "Invalid input"
                });
            }

            const result = a + b;
            if (result > 100) {
                return res.status(400).json({
                    error: "Invalid input"
                });
            }

            return res.status(200).json({
                result: result,
                a: a,
                b: b,
                status: "success"
            });
        }

        return res.status(200).json({
            message: "wagmi",
            timestamp: new Date().toISOString(),
            lang: "Node.js"
        });
        
    } catch (error) {
        console.error('Request processing error:', error);
        return res.status(400).json({
            error: "Invalid input"
        });
    }
});

app.all('*', (req, res) => {
    res.status(404).json({
        error: "Route not found. Use POST /wagmi"
    });
});

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: "Internal server error"
    });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`WAGMI-9000 Echo Unit online at port ${PORT}`);
    console.log(`Ready to handle 10k concurrent requests`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.timeout = 120000;
server.maxConnections = 20000;

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = app;