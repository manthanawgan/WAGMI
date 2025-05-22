const http = require('http');

const HOST = 'localhost';
const PORT = 3000;
const URL = `http://${HOST}:${PORT}/wagmi`;

function makeRequest(data, callback) {
  const postData = JSON.stringify(data);
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/wagmi',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    res.on('end', () => {
      callback(null, {
        statusCode: res.statusCode,
        body: JSON.parse(responseData)
      });
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.write(postData);
  req.end();
}

const tests = [
  {
    name: "Ping Test (Empty Object)",
    data: {},
    expected: { message: "wagmi", timestamp: "ISO_STRING", lang: "Node.js" }
  },
  {
    name: "Addition Test (Valid)",
    data: { a: 40, b: 55 },
    expected: { result: 95, a: 40, b: 55, status: "success" }
  },
  {
    name: "Addition Test (Sum > 100)",
    data: { a: 50, b: 60 },
    expected: { error: "Invalid input" }
  },
  {
    name: "Addition Test (Invalid Type)",
    data: { a: "hello", b: 20 },
    expected: { error: "Invalid input" }
  },
  {
    name: "Addition Test (Negative Number)",
    data: { a: -5, b: 10 },
    expected: { error: "Invalid input" }
  },
  {
    name: "Addition Test (Missing Field)",
    data: { a: 10 },
    expected: { error: "Invalid input" }
  }
];

console.log('Starting WAGMI-9000 Tests...\n');

let testIndex = 0;
function runNextTest() {
  if (testIndex >= tests.length) {
    console.log('All tests completed!');
    return;
  }

  const test = tests[testIndex];
  console.log(`🔍 Running: ${test.name}`);
  
  makeRequest(test.data, (err, response) => {
    if (err) {
      console.log(`Error: ${err.message}`);
    } else {
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response:`, JSON.stringify(response.body, null, 2));

      if (test.name.includes('Ping')) {
        if (response.body.message === 'wagmi' && response.body.lang === 'Node.js') {
          console.log('Ping test passed!');
        } else {
          console.log('Ping test failed!');
        }
      } else if (test.name.includes('Addition Test (Valid)')) {
        if (response.body.result === 95 && response.body.status === 'success') {
          console.log('Addition test passed!');
        } else {
          console.log('Addition test failed!');
        }
      } else if (test.name.includes('Invalid') || test.name.includes('Sum > 100') || test.name.includes('Negative') || test.name.includes('Missing')) {
        if (response.body.error === 'Invalid input') {
          console.log('Error handling test passed!');
        } else {
          console.log('Error handling test failed!');
        }
      }
    }
    
    console.log('─'.repeat(50));
    testIndex++;
    setTimeout(runNextTest, 500); // Small delay between tests
  });
}

console.log('Make sure your server is running on port 3000 first!');
console.log('Run: node server.js');
console.log('Then run this test script in another terminal.\n');

runNextTest();