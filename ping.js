const http = require('http');

const domains = [
    'https://9xanime.fun',
    'https://checkstatus-4pot.onrender.com'
];

const intervalMs = 25 * 1000; // 25 seconds
const port = process.env.PORT || 3000;

// Simple HTTP server to satisfy Render's port requirement
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Pinger is active\n');
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Global error handling to prevent the script from stopping
process.on('uncaughtException', (error) => {
    console.error(`[${new Date().toISOString()}] CRITICAL: Uncaught Exception - ${error.message}`);
    // Keep the process alive
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] CRITICAL: Unhandled Rejection at:`, promise, 'reason:', reason);
    // Keep the process alive
});

async function pingDomain(url) {
    const timestamp = new Date().toISOString();
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'DomainPinger/1.0'
            },
            // Add a timeout to prevent hanging pings
            signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
            console.log(`[${timestamp}] SUCCESS: Pinged ${url} - Status: ${response.status}`);
        } else {
            console.warn(`[${timestamp}] WARNING: Pinged ${url} - Status: ${response.status}`);
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.error(`[${timestamp}] ERROR: Timeout pinging ${url}`);
        } else {
            console.error(`[${timestamp}] ERROR: Failed to ping ${url} - ${error.message}`);
        }
    }
}

function startPinger() {
    console.log(`Starting Domain Pinger... Interval: ${intervalMs / 1000}s`);
    console.log(`Monitoring: ${domains.join(', ')}`);
    console.log('Resilience: Global error handlers active.');
    console.log('--------------------------------------------');

    // Run immediately on start
    const runPings = () => {
        domains.forEach(url => {
            pingDomain(url).catch(err => {
                console.error(`[${new Date().toISOString()}] ERROR: Async ping error for ${url} - ${err.message}`);
            });
        });
    };

    runPings();

    // Set interval to run every 25 seconds
    setInterval(runPings, intervalMs);
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch !== 'function') {
    console.error('Error: Native fetch is not available. Please use Node.js version 18 or higher.');
    process.exit(1);
}

startPinger();
