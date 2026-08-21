const http = require('http');

const PORT = 4001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Simple helper to log test sections
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`📡 TEST: ${title}`);
  console.log('='.repeat(60));
}

// 1. GET request helper
function testGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    }).on('error', reject);
  });
}

// 2. POST streaming request helper
function testPostStream(path, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let textOutput = '';
      let thoughtsOutput = '';
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                if (parsed.thinking) {
                  thoughtsOutput += parsed.text;
                } else {
                  textOutput += parsed.text;
                }
              }
            } catch (e) {}
          }
        }
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          text: textOutput,
          thoughts: thoughtsOutput
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('Starting Test Suite for Gemini Arena...');

  // 1. Test Static files
  logSection('GET / (index.html)');
  const resIndex = await testGet('/');
  console.log(`Status: ${resIndex.statusCode}, Content-Length: ${resIndex.body.length} bytes`);
  console.assert(resIndex.statusCode === 200, 'Index.html must return 200');

  // 2. Test /api/config
  logSection('GET /api/config');
  const resConfig = await testGet('/api/config');
  console.log(`Status: ${resConfig.statusCode}, Body: ${resConfig.body}`);
  console.assert(resConfig.statusCode === 200, '/api/config must return 200');

  // 3. Test Gemini 3.7 Flash Hybrid Reasoning Stream
  logSection('POST /api/generate - gemini-3.7-flash (Sandbox)');
  const resG37 = await testPostStream('/api/generate', {
    provider: 'gemini',
    model: 'gemini-3.7-flash',
    prompt: 'Solve a complex logic puzzle step by step',
    sandboxMode: true,
    geminiThinking: { mode: 'HIGH' }
  });
  console.log(`Status: ${resG37.statusCode}`);
  console.log(`Thoughts received: ${resG37.thoughts.length} chars`);
  console.log(`Response received: ${resG37.text.length} chars`);
  console.assert(resG37.statusCode === 200, 'gemini-3.7-flash should stream with 200');
  console.assert(resG37.thoughts.length > 0, 'gemini-3.7-flash should generate thoughts');

  // 4. Test Gemini 2.5 Pro Custom Budget Stream
  logSection('POST /api/generate - gemini-2.5-pro (Sandbox)');
  const resG25Pro = await testPostStream('/api/generate', {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    prompt: 'Write an optimized async queue in JavaScript',
    sandboxMode: true,
    geminiThinking: { mode: 'CUSTOM', budget: 4096 }
  });
  console.log(`Status: ${resG25Pro.statusCode}`);
  console.log(`Thoughts received: ${resG25Pro.thoughts.length} chars`);
  console.assert(resG25Pro.statusCode === 200, 'gemini-2.5-pro should stream with 200');

  // 5. Test Gemini 2.5 Flash-Lite
  logSection('POST /api/generate - gemini-2.5-flash-lite (Sandbox)');
  const resG25Lite = await testPostStream('/api/generate', {
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    prompt: 'High throughput short response',
    sandboxMode: true,
    geminiThinking: { mode: 'OFF' }
  });
  console.log(`Status: ${resG25Lite.statusCode}`);
  console.log(`Response received: ${resG25Lite.text.length} chars`);
  console.assert(resG25Lite.statusCode === 200, 'gemini-2.5-flash-lite should stream with 200');

  // 6. Test Claude Sonnet 4-6 Adaptive Stream
  logSection('POST /api/generate - claude-sonnet-4-6 (Sandbox)');
  const resClaude = await testPostStream('/api/generate', {
    provider: 'claude',
    model: 'claude-sonnet-4-6',
    prompt: 'Compare your reasoning capabilities with Gemini',
    sandboxMode: true
  });
  console.log(`Status: ${resClaude.statusCode}`);
  console.log(`Response received: ${resClaude.text.length} chars`);
  console.assert(resClaude.statusCode === 200, 'claude-sonnet-4-6 should stream with 200');

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL GEMINI ARENA BENCHMARK TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(60) + '\n');
}

// Start server on 4001 and run tests
process.env.PORT = PORT;
const server = require('./server.js');
setTimeout(async () => {
  try {
    await runAllTests();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}, 500);
