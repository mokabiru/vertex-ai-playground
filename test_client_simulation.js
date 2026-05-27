const http = require('http');

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Simple helper to log test sections
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`📡 TEST: ${title}`);
  console.log('='.repeat(60));
}

// 1. GET request helper
function testGet(path) {
  return new Promise((resolve, reject) => {
    console.log(`[GET] Requesting ${path}...`);
    http.get(`${BASE_URL}${path}`, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
      
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 2. POST streaming request helper
function testPostStream(path, payload) {
  return new Promise((resolve, reject) => {
    console.log(`[POST] Requesting ${path}...`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));

    const postData = JSON.stringify(payload);
    
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
      
      let chunkCount = 0;
      let buffer = '';
      let isStreamingThoughts = false;
      let hasReceivedMetadata = false;

      res.on('data', (chunk) => {
        chunkCount++;
        const text = chunk.toString();
        buffer += text;
        
        // Process Server-Sent Events lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial line in buffer

        for (const line of lines) {
          if (line.trim()) console.log('LINE CONTENT:', JSON.stringify(line));
          if (line.trim().startsWith('data: ')) {
            const dataStr = line.trim().substring(6).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              console.log('PARSED KEYS:', Object.keys(parsed));
              if (parsed.text) {
                if (parsed.thinking && !isStreamingThoughts) {
                  isStreamingThoughts = true;
                  console.log('\n🟣 [THINKING] Started streaming thinking tokens...');
                } else if (!parsed.thinking && isStreamingThoughts) {
                  isStreamingThoughts = false;
                  console.log('\n🟢 [OUTPUT] Transitioned to output text stream...');
                }
                process.stdout.write(parsed.text);
              }
              if (parsed.usageMetadata) {
                hasReceivedMetadata = true;
                console.log('\n\n📊 [METADATA] Received usage token breakdown:');
                console.log(JSON.stringify(parsed.usageMetadata, null, 2));
              }
              if (parsed.done) {
                console.log('\n🏁 [DONE] Stream closed gracefully.');
              }
            } catch (err) {
              console.log('\n⚠️ [PARSE ERROR] Failed to parse JSON string:', JSON.stringify(dataStr), err.message);
            }
          }
        }
      });

      res.on('end', () => {
        // Process any leftover content in the buffer
        console.log('LEFTOVER BUFFER:', JSON.stringify(buffer));
        if (buffer.trim()) {
          const lines = (buffer + '\n').split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const dataStr = line.trim().substring(6).trim();
              if (!dataStr) continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.usageMetadata) {
                  hasReceivedMetadata = true;
                  console.log('\n\n📊 [METADATA] Received usage token breakdown (flushed):');
                  console.log(JSON.stringify(parsed.usageMetadata, null, 2));
                }
              } catch (err) {}
            }
          }
        }
        console.log(`\nStream ended successfully after ${chunkCount} packet chunks.`);
        resolve({
          statusCode: res.statusCode,
          hasReceivedMetadata: hasReceivedMetadata
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Run Main Verification Suit
async function runVerification() {
  try {
    // -------------------------------------------------------------
    // Test 1: Static HTML Page Request
    // -------------------------------------------------------------
    logSection('Loading static index.html and checking assets');
    const indexResult = await testGet('/');
    if (indexResult.statusCode === 200 && indexResult.body.includes('<title>Agent Platform Playground</title>')) {
      console.log('✅ PASS: Home page index.html resolved correctly with proper titles!');
    } else {
      console.log('Index body is:', indexResult.body.substring(0, 500));
      throw new Error('❌ FAIL: Index page resolution failed or has invalid tags.');
    }

    // -------------------------------------------------------------
    // Test 2: Active API Configuration Query
    // -------------------------------------------------------------
    logSection('Reading active environment config JSON');
    const configResult = await testGet('/api/config');
    const config = JSON.parse(configResult.body);
    if (configResult.statusCode === 200 && 'sandboxMode' in config) {
      console.log('✅ PASS: Config API working seamlessly. Active Server State:');
      console.log(`         - Sandbox Mode: ${config.sandboxMode}`);
      console.log(`         - Project ID: ${config.projectId || '(None - Running Local Env Only)'}`);
      console.log(`         - Region: ${config.region}`);
    } else {
      throw new Error('❌ FAIL: Config API returned invalid payload or error codes.');
    }

    // -------------------------------------------------------------
    // Test 3: Gemini Sandbox Stream Generation (Submit Prompt Button)
    // -------------------------------------------------------------
    logSection('Simulating Gemini submit button streaming in Sandbox Mode');
    const geminiPayload = {
      provider: 'gemini',
      model: 'gemini-3.5-flash',
      prompt: 'Hi',
      sandboxMode: true,
      temperature: 0.7,
      maxTokens: 512,
      systemPrompt: 'You are a professional software engineer.'
    };
    const geminiStream = await testPostStream('/api/generate', geminiPayload);
    if (geminiStream.statusCode === 200 && geminiStream.hasReceivedMetadata) {
      console.log('✅ PASS: Gemini Sandbox Stream simulation completed successfully with usage metrics!');
    } else {
      throw new Error('❌ FAIL: Gemini Stream simulation failed.');
    }

    // -------------------------------------------------------------
    // Test 4: Claude Sandbox Stream Generation (Submit Prompt Button)
    // -------------------------------------------------------------
    logSection('Simulating Claude submit button streaming in Sandbox Mode');
    const claudePayload = {
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      prompt: 'Hello',
      sandboxMode: true,
      temperature: 0.7,
      maxTokens: 512,
      systemPrompt: 'You are a technology analyst.'
    };
    const claudeStream = await testPostStream('/api/generate', claudePayload);
    if (claudeStream.statusCode === 200 && claudeStream.hasReceivedMetadata) {
      console.log('✅ PASS: Claude Sandbox Stream simulation completed successfully with usage metrics!');
    } else {
      throw new Error('❌ FAIL: Claude Stream simulation failed.');
    }

    console.log('\n🚀 ALL INTEGRATION AND BUTTON TESTS PASSED SUCCESSFULLY! 🚀\n');

  } catch (err) {
    console.error(`\n❌ VERIFICATION TEST ENCOUNTERED AN ERROR:`, err.message);
    process.exit(1);
  }
}

runVerification();
