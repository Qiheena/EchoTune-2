const http = require('http');

// Simple health check server for Render deployment
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage(),
            version: process.version
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', (err) => {
    if (err) {
        console.log(`⚠️ Health check server could not start on port ${port}:`, err.message);
    } else {
        console.log(`📊 Health check server running on port ${port}`);
    }
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} already in use, skipping health server`);
    } else {
        console.log(`⚠️ Health server error:`, err.message);
    }
});

module.exports = server;