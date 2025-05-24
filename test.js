const http = require('http');

const HOST = 'localhost';
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

const testCases = [
    {
        name: 'Ping Test (Empty Body)',
        path: '/wagmi',
        method: 'POST',
        body: {},
        expectedStatus: 200,
        expectedKeys: ['message', 'timestamp', 'lang']
    },
    {
        name: 'Ping Test (No Body)',
        path: '/wagmi',
        method: 'POST',
        body: null,
        expectedStatus: 200,
        expectedKeys: ['message', 'timestamp', 'lang']
    },
    {
        name: 'Addition Test (Valid)',
        path: '/wagmi',
        method: 'POST',
        body: { a: 40, b: 55 },
        expectedStatus: 200,
        expectedKeys: ['result', 'a', 'b', 'status']
    },
    {
        name: 'Addition Test (Edge Case - Sum = 100)',
        path: '/wagmi',
        method: 'POST',
        body: { a: 50, b: 50 },
        expectedStatus: 200,
        expectedKeys: ['result', 'a', 'b', 'status']
    },
    {
        name: 'Addition Test (Invalid - Sum > 100)',
        path: '/wagmi',
        method: 'POST',
        body: { a: 60, b: 50 },
        expectedStatus: 400,
        expectedKeys: ['error']
    },
    {
        name: 'Addition Test (Invalid - Negative)',
        path: '/wagmi',
        method: 'POST',
        body: { a: -5, b: 20 },
        expectedStatus: 400,
        expectedKeys: ['error']
    },
    {
        name: 'Addition Test (Invalid - Missing b)',
        path: '/wagmi',
        method: 'POST',
        body: { a: 20 },
        expectedStatus: 400,
        expectedKeys: ['error']
    }
];

function makeRequest(testCase) {
    return new Promise((resolve, reject) => {
        const postData = testCase.body ? JSON.stringify(testCase.body) : '';
        
        const options = {
            hostname: HOST,
            port: PORT,
            path: testCase.path,
            method: testCase.method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({
                        statusCode: res.statusCode,
                        body: response,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        body: body,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting WAGMI-9000 Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        try {
            console.log(`Running: ${testCase.name}`);
            const response = await makeRequest(testCase);

            if (response.statusCode !== testCase.expectedStatus) {
                console.log(`FAIL: Expected status ${testCase.expectedStatus}, got ${response.statusCode}`);
                failed++;
                continue;
            }
            
            const hasAllKeys = testCase.expectedKeys.every(key => 
                response.body && response.body.hasOwnProperty(key)
            );
            
            if (!hasAllKeys) {
                console.log(`FAIL: Missing expected keys. Expected: ${testCase.expectedKeys.join(', ')}`);
                console.log(`Got: ${Object.keys(response.body || {}).join(', ')}`);
                failed++;
                continue;
            }
            
            if (testCase.name.includes('Addition Test (Valid)')) {
                if (response.body.result !== testCase.body.a + testCase.body.b) {
                    console.log(`FAIL: Incorrect calculation. Expected: ${testCase.body.a + testCase.body.b}, got: ${response.body.result}`);
                    failed++;
                    continue;
                }
            }
            
            if (testCase.name.includes('Ping Test')) {
                if (response.body.message !== 'wagmi' || response.body.lang !== 'Node.js') {
                    console.log(`FAIL: Incorrect ping response values`);
                    failed++;
                    continue;
                }
            }
            
            console.log(`PASS`);
            passed++;
            
        } catch (error) {
            console.log(`FAIL: ${error.message}`);
            failed++;
        }
        
        console.log('');
    }
    
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! WAGMI-9000 is ready for deployment.');
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

async function runLoadTest() {
    console.log('🚀 Starting Load Test (100 concurrent requests)...');
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 100; i++) {
        const testCase = i % 2 === 0 
            ? { name: 'Load Test Ping', path: '/wagmi', method: 'POST', body: {} }
            : { name: 'Load Test Add', path: '/wagmi', method: 'POST', body: { a: 10, b: 20 } };
        
        promises.push(makeRequest(testCase));
    }
    
    try {
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const successful = results.filter(r => r.statusCode === 200).length;
        console.log(`Load Test Complete: ${successful}/100 successful in ${duration}ms`);
        console.log(`Average response time: ${duration/100}ms per request`);
        
    } catch (error) {
        console.log(`Load Test Failed: ${error.message}`);
    }
}

async function main() {
    try {
        await runTests();
        await runLoadTest();
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}