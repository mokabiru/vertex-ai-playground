const http = require('http');

const postData = JSON.stringify({
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  prompt: 'Hi',
  sandboxMode: true,
  temperature: 0.7,
  maxTokens: 512,
  systemPrompt: 'You are a professional software engineer.'
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });
  res.on('end', () => {
    console.log('--- RAW RESPONSE BODY ---');
    console.log(body);
    console.log('--- END RAW RESPONSE BODY ---');
    console.log('Contains "usageMetadata"?', body.includes('usageMetadata'));
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
