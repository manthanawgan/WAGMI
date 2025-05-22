const http = require('http');

const TARGET_RPS = 2000;
const TEST_DURATION = 5;
const TOTAL_REQUESTS = TARGET_RPS * TEST_DURATION;
const BATCH_SIZE = 100;

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

const TEST_SCENARIOS = [
  { name: 'Ping', data: {}, weight: 70 },
  { name: 'Valid Addition', data: { a: 25, b: 30 }, weight: 20 },
  { name: 'Invalid Addition', data: { a: 60, b: 50 }, weight: 10 }
];

let stats = {
  total: 0,
  success: 0,
  errors: 0,
  timeouts: 0,
  responseTimes: [],
  startTime: null,
  endTime: null
};

const agent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 500,
  maxFreeSockets: 100,
  timeout: 5000
});

function makeRequest(testData, callback) {
  const postData = JSON.stringify(testData);
  const startTime = Date.now();
  
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/wagmi',
    method: 'POST',
    agent: agent,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Connection': 'keep-alive'
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const responseTime = Date.now() - startTime;
      stats.responseTimes.push(responseTime);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        stats.success++;
      } else {
        stats.errors++;
      }
      
      callback(null, { statusCode: res.statusCode, responseTime, body: responseData });
    });
  });

  req.on('error', (err) => {
    stats.errors++;
    callback(err);
  });
  
  req.on('timeout', () => {
    stats.timeouts++;
    req.destroy();
    callback(new Error('Request timeout'));
  });

  req.setTimeout(5000);
  req.write(postData);
  req.end();
}

function getRandomTestData() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const scenario of TEST_SCENARIOS) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario.data;
    }
  }
  
  return TEST_SCENARIOS[0].data;
}

function sendBatch(batchSize, callback) {
  let completed = 0;
  const batchStart = Date.now();
  
  for (let i = 0; i < batchSize; i++) {
    const testData = getRandomTestData();
    
    makeRequest(testData, (err, result) => {
      stats.total++;
      completed++;
      
      if (completed === batchSize) {
        const batchTime = Date.now() - batchStart;
        callback(null, { batchTime, completed });
      }
    });
  }
}

function runLoadTest() {
  console.log('Starting WAGMI-9000 Load Test');
  console.log(`Target: ${TARGET_RPS} requests/second for ${TEST_DURATION} seconds`);
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Target: ${HOST}:${PORT}/wagmi`);
  console.log('─'.repeat(60));
  
  stats.startTime = Date.now();
  
  const intervalMs = (1000 / TARGET_RPS) * BATCH_SIZE; 
  const totalBatches = Math.ceil(TOTAL_REQUESTS / BATCH_SIZE);
  let batchesSent = 0;
  
  const interval = setInterval(() => {
    if (batchesSent >= totalBatches) {
      clearInterval(interval);
      return;
    }
    
    const remainingRequests = TOTAL_REQUESTS - (batchesSent * BATCH_SIZE);
    const currentBatchSize = Math.min(BATCH_SIZE, remainingRequests);
    
    sendBatch(currentBatchSize, (err, result) => {
      if (!err) {
        const elapsed = (Date.now() - stats.startTime) / 1000;
        const currentRPS = Math.round(stats.total / elapsed);
        
        process.stdout.write(`\r⚡ Progress: ${stats.total}/${TOTAL_REQUESTS} | RPS: ${currentRPS} | Success: ${stats.success} | Errors: ${stats.errors}`);

        if (stats.total >= TOTAL_REQUESTS) {
          setTimeout(showResults, 1000);
        }
      }
    });
    
    batchesSent++;
  }, intervalMs);
}

function showResults() {
  stats.endTime = Date.now();
  const totalTime = (stats.endTime - stats.startTime) / 1000;
  const actualRPS = Math.round(stats.total / totalTime);

  stats.responseTimes.sort((a, b) => a - b);
  const avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
  const p50 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.5)];
  const p95 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.95)];
  const p99 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.99)];
  const maxResponseTime = Math.max(...stats.responseTimes);
  
  console.log('\n\n LOAD TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(` Total Requests: ${stats.total}`);
  console.log(` Successful: ${stats.success} (${((stats.success/stats.total)*100).toFixed(1)}%)`);
  console.log(` Errors: ${stats.errors} (${((stats.errors/stats.total)*100).toFixed(1)}%)`);
  console.log(` Timeouts: ${stats.timeouts}`);
  console.log(` Total Time: ${totalTime.toFixed(2)}s`);
  console.log(` Actual RPS: ${actualRPS} (Target: ${TARGET_RPS})`);
  console.log('');
  console.log(' RESPONSE TIMES:');
  console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   Median (P50): ${p50}ms`);
  console.log(`   P95: ${p95}ms`);
  console.log(`   P99: ${p99}ms`);
  console.log(`   Max: ${maxResponseTime}ms`);
 
  console.log('\n PERFORMANCE ASSESSMENT:');
  if (actualRPS >= TARGET_RPS * 0.9 && stats.errors < stats.total * 0.05) {
    console.log(' EXCELLENT! Server handled the load test successfully!');
  } else if (actualRPS >= TARGET_RPS * 0.7 && stats.errors < stats.total * 0.1) {
    console.log(' GOOD! Server performed well under load.');
  } else {
    console.log(' NEEDS IMPROVEMENT! Consider optimization.');
  }
  
  agent.destroy(); 
  process.exit(0);
}

function checkServer() {
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/',
    method: 'GET',
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    console.log(` Server is running at ${HOST}:${PORT}`);
    setTimeout(runLoadTest, 1000);
  });
  
  req.on('error', (err) => {
    console.error(`Server not reachable at ${HOST}:${PORT}`);
    console.error('Please start your server first with: npm start');
    process.exit(1);
  });
  
  req.setTimeout(5000);
  req.end();
}

console.log('🔍 Checking server availability...');
checkServer();