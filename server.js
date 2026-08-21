const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Simple Local .env Parser (Vanilla) ---
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  }
}
loadEnv();

// Helper for MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// In-memory token cache to prevent repeated exchanges for the same service account
// Key: client_email, Value: { token, expiresAt }
const tokenCache = {};

/**
 * Generates Google Cloud OAuth2 Access Token using Service Account Key JSON
 * without any external dependencies, using built-in RSA-SHA256 crypto.
 */
function getAccessTokenFromServiceAccount(saKeyJson) {
  return new Promise((resolve, reject) => {
    try {
      const sa = typeof saKeyJson === 'string' ? JSON.parse(saKeyJson) : saKeyJson;
      if (!sa.client_email || !sa.private_key || !sa.private_key_id) {
        throw new Error('Invalid Service Account JSON. Must contain client_email, private_key, and private_key_id.');
      }

      // Check cache first (buffer 5 minutes)
      const cached = tokenCache[sa.client_email];
      if (cached && cached.expiresAt > Date.now() + 300000) {
        return resolve(cached.token);
      }

      // Header
      const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: sa.private_key_id,
      };

      // Payload
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      // Base64URL encoding helpers
      const base64UrlEncode = (obj) => {
        return Buffer.from(JSON.stringify(obj))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
      };

      const headerB64 = base64UrlEncode(header);
      const payloadB64 = base64UrlEncode(payload);
      const signatureInput = `${headerB64}.${payloadB64}`;

      // Sign using built-in crypto
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(signatureInput);
      const signature = signer.sign(sa.private_key, 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const jwtAssertion = `${signatureInput}.${signature}`;

      // POST to exchange assertion for Access Token
      const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtAssertion}`;

      const req = https.request({
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode !== 200 || !parsed.access_token) {
              return reject(new Error(`Token exchange failed (${res.statusCode}): ${body}`));
            }
            // Cache token
            tokenCache[sa.client_email] = {
              token: parsed.access_token,
              expiresAt: Date.now() + (parsed.expires_in || 3600) * 1000,
            };
            resolve(parsed.access_token);
          } catch (err) {
            reject(new Error(`Failed to parse token response: ${err.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Helper to send JSON errors
 */
function sendError(res, statusCode, message) {
  if (res.headersSent) {
    res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
    res.end();
    return;
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/**
 * Mock Stream Generator for Sandbox Mode
 * Emits high-fidelity markdown with real-time token delays to simulate streaming
 */
function handleSandboxStream(reqData, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const provider = reqData.provider === 'claude' ? 'Anthropic Claude' : 'Google Gemini';
  const model = reqData.model || 'gemini-3.7-flash';
  const prompt = reqData.prompt || '';
  const temp = reqData.temperature !== undefined ? reqData.temperature : 0.7;

  const region = reqData.config?.region || 'us-central1';
  const projectId = reqData.config?.projectId || 'YOUR_GCP_PROJECT';
  const authType = reqData.config?.authType || 'apiKey';
  const simulatedHost = region === 'global' ? 'aiplatform.googleapis.com' : `${region}-aiplatform.googleapis.com`;

  const isClaudeThinking = reqData.provider === 'claude' && (model.includes('claude-sonnet-4-6') || model.includes('claude-opus-4-7'));

  const paragraphs = [
    `### ⚡ Live Benchmark & Model Execution: **${model}**\n\n`,
    `This response is simulated via **Sandbox Mode**, demonstrating how **${provider}** executes in real-time on Google Vertex AI / AI Studio.\n\n`,
    `**Prompt Evaluated:** *"${prompt}"*\n\n`,
    `#### 1. Architecture & Protocol\n`,
    authType === 'apiKey' && reqData.provider === 'gemini'
      ? `Using **Google AI Studio API Key** gateway:\n\`\`\`http\nPOST https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=AIzaSy...&alt=sse\n\`\`\`\n\n`
      : (reqData.provider === 'claude'
        ? `Using **Vertex AI Partner Model Gateway**:\n\`\`\`http\nPOST https://${simulatedHost}/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${model}:streamRawPredict\n\`\`\`\n\n`
        : `Using **Vertex AI Google Publisher Gateway**:\n\`\`\`http\nPOST https://${simulatedHost}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:streamGenerateContent\n\`\`\`\n\n`),
    `#### 2. Model Capabilities & Reasoning Dynamics\n`,
    model.includes('gemini-3.7')
      ? `**Gemini 3.7 Flash** features state-of-the-art hybrid reasoning. It dynamically balances rapid-fire token generation with multi-step reasoning traces, allowing you to fine-tune the thinking budget from 0 tokens up to 64K tokens.\n\n`
      : (model.includes('gemini-2.5-pro') || model.includes('gemini-3.0-pro') || model.includes('gemini-3-pro')
        ? `**${model}** is designed for heavy-duty scientific reasoning, complex algorithmic refactoring, and multi-file code synthesis with deep thinking budgets.\n\n`
        : `**${model}** delivers ultra-low latency, blazing Tokens/sec, and optimal cost-efficiency for interactive applications.\n\n`),
    `#### 3. Payload & Configuration Details\n`,
    `\`\`\`json\n{\n  "model": "${model}",\n  "temperature": ${temp},\n  "maxOutputTokens": ${reqData.maxTokens || 2048},\n  "topP": ${reqData.topP !== undefined ? reqData.topP : 0.95},\n  "thinkingConfig": ${JSON.stringify(reqData.geminiThinking || { mode: 'AUTO', budget: -1 })}\n}\n\`\`\`\n\n`,
    `*Tip: Switch from Sandbox Mode to Live Model Mode in the controls sidebar by adding your API key or GCP credentials to benchmark live endpoints!*`
  ];

  let simulatedThoughts = [];
  if (reqData.provider === 'gemini') {
    const clientThinking = reqData.geminiThinking || {};
    const selectedMode = clientThinking.mode || 'HIGH';
    
    if (selectedMode !== 'OFF' && selectedMode !== 'UNSUPPORTED') {
      simulatedThoughts = [
        `[REASONING TRACE] Analyzing input prompt structure: "${prompt.substring(0, 45)}..."\n`,
        `[REASONING TRACE] Model: ${model} | Target thinking mode: ${selectedMode}\n`,
        `[REASONING TRACE] Synthesizing domain logic, constraints, and optimization targets...\n`,
        `[REASONING TRACE] Constructing formatted response hierarchy and technical telemetry data...\n`
      ];
    }
  } else if (isClaudeThinking) {
    simulatedThoughts = [
      `[CLAUDE ADAPTIVE THINKING] Evaluating prompt constraints and contextual nuance...\n`,
      `[CLAUDE ADAPTIVE THINKING] Planning multi-step structured response...\n`
    ];
  }

  const events = [];
  for (const thought of simulatedThoughts) {
    events.push({ text: thought, thinking: true });
  }
  for (const para of paragraphs) {
    events.push({ text: para, thinking: false });
  }

  let currentEventIndex = 0;
  let currentCharIndex = 0;

  function streamNextToken() {
    if (currentEventIndex >= events.length) {
      const totalTextLen = paragraphs.join("").length;
      const totalThoughtsLen = simulatedThoughts.join("").length;
      const finalThoughtsTokens = Math.ceil(totalThoughtsLen / 4);
      const finalOutputTokens = Math.ceil(totalTextLen / 4);
      const finalInputTokens = Math.ceil((prompt.length + (reqData.systemPrompt || "").length) / 4);

      res.write(`data: ${JSON.stringify({
        usageMetadata: {
          promptTokenCount: finalInputTokens,
          candidatesTokenCount: finalThoughtsTokens + finalOutputTokens,
          totalTokenCount: finalInputTokens + finalThoughtsTokens + finalOutputTokens,
          candidatesTokenDetails: [
            {
              thinkingTokenCount: finalThoughtsTokens
            }
          ]
        }
      })}\n\n`);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    const event = events[currentEventIndex];
    const text = event.text;
    const chunkSize = event.thinking ? (Math.floor(Math.random() * 8) + 4) : (Math.floor(Math.random() * 6) + 4);
    const token = text.substring(currentCharIndex, currentCharIndex + chunkSize);
    currentCharIndex += chunkSize;

    res.write(`data: ${JSON.stringify({ text: token, thinking: event.thinking })}\n\n`);

    if (currentCharIndex >= text.length) {
      currentEventIndex++;
      currentCharIndex = 0;
      setTimeout(streamNextToken, event.thinking ? 40 : 60);
    } else {
      setTimeout(streamNextToken, event.thinking ? 8 + Math.random() * 10 : 10 + Math.random() * 15);
    }
  }

  streamNextToken();
}

/**
 * Handle Google AI Studio Direct API Streaming
 */
function handleGoogleAIStudioStream(reqData, apiKey, res) {
  const model = reqData.model || 'gemini-3.7-flash';
  const urlPath = `/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: reqData.prompt }]
      }
    ],
    generationConfig: {
      temperature: reqData.temperature !== undefined ? reqData.temperature : 0.7,
      maxOutputTokens: reqData.maxTokens || 4096,
      topP: reqData.topP !== undefined ? reqData.topP : 0.95,
      topK: reqData.topK !== undefined ? reqData.topK : 40,
    }
  };

  if (reqData.systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: reqData.systemPrompt }]
    };
  }

  if (reqData.responseMimeType) {
    payload.generationConfig.responseMimeType = reqData.responseMimeType;
  }

  // Thinking Config for Gemini 3.x / 2.5
  const clientThinking = reqData.geminiThinking || {};
  const selectedMode = clientThinking.mode || 'HIGH';

  if (model.includes('gemini-3') || model.includes('gemini-2.5')) {
    if (selectedMode === 'OFF') {
      payload.generationConfig.thinkingConfig = {
        thinkingBudget: 0,
        includeThoughts: false
      };
    } else if (model.includes('gemini-3.7') || model.includes('gemini-3.6') || model.includes('gemini-3.5') || model.includes('gemini-3.0') || model.includes('gemini-3-')) {
      let level = 'HIGH';
      if (['HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].includes(selectedMode)) {
        level = selectedMode;
      }
      
      const thinkingConfig = {
        includeThoughts: true,
      };

      if (selectedMode === 'CUSTOM' && clientThinking.budget) {
        thinkingConfig.thinkingBudget = Number(clientThinking.budget);
      } else {
        thinkingConfig.thinkingLevel = level;
      }
      
      payload.generationConfig.thinkingConfig = thinkingConfig;
    } else if (model.includes('gemini-2.5')) {
      let budget = -1;
      if (selectedMode === 'CUSTOM') {
        budget = typeof clientThinking.budget === 'number' ? clientThinking.budget : 1024;
      }
      payload.generationConfig.thinkingConfig = {
        includeThoughts: true,
        thinkingBudget: budget
      };
    } else {
      payload.generationConfig.thinkingConfig = {
        includeThoughts: true
      };
    }
  }

  const payloadStr = JSON.stringify(payload);

  const apiReq = https.request({
    hostname: 'generativelanguage.googleapis.com',
    path: urlPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadStr)
    }
  }, (apiRes) => {
    if (apiRes.statusCode !== 200) {
      let errorBody = '';
      apiRes.on('data', c => { errorBody += c; });
      apiRes.on('end', () => {
        sendError(res, apiRes.statusCode, `Google AI Studio Error (${apiRes.statusCode}): ${errorBody}`);
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    let buffer = '';

    apiRes.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.substring(5).trim();
          if (!dataContent || dataContent === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.candidates && parsed.candidates[0]?.content?.parts) {
              for (const part of parsed.candidates[0].content.parts) {
                if (part.text) {
                  res.write(`data: ${JSON.stringify({ text: part.text, thinking: !!part.thought })}\n\n`);
                }
              }
            }
            if (parsed.usageMetadata) {
              res.write(`data: ${JSON.stringify({ usageMetadata: parsed.usageMetadata })}\n\n`);
            }
          } catch (e) {}
        }
      }
    });

    apiRes.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
  });

  apiReq.on('error', (err) => {
    const msg = err.code === 'ENOTFOUND'
      ? `Network connection error (${err.message}). The server was unable to reach Google AI Studio endpoints (DNS lookup failed). Please ensure your Node server has internet access (e.g. run 'node server.js' in your terminal). To test immediately without internet or API keys, enable Sandbox Mode in the sidebar!`
      : `AI Studio Network Request Error: ${err.message}`;
    sendError(res, 500, msg);
  });

  apiReq.write(payloadStr);
  apiReq.end();
}

/**
 * Main Request Router
 */
const server = http.createServer(async (req, res) => {
  // Set default CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/config route to fetch server-side environment status
  if (req.method === 'GET' && req.url === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let hasServiceAccount = !!process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (!hasServiceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      hasServiceAccount = fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    
    res.end(JSON.stringify({
      projectId: process.env.GCP_PROJECT_ID || '',
      region: process.env.GCP_REGION || 'us-central1',
      authType: process.env.GCP_AUTH_TYPE || (process.env.GEMINI_API_KEY ? 'apiKey' : 'token'),
      hasApiKey: !!process.env.GEMINI_API_KEY,
      hasAccessToken: !!process.env.GCP_ACCESS_TOKEN,
      hasServiceAccount: hasServiceAccount,
      sandboxMode: process.env.SANDBOX_MODE !== 'false'
    }));
    return;
  }

  // POST /api/generate route
  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const reqData = JSON.parse(body);
        
        // 1. Validate parameters
        if (!reqData.provider || !['gemini', 'claude'].includes(reqData.provider)) {
          return sendError(res, 400, 'Provider must be "gemini" or "claude".');
        }
        if (!reqData.model) {
          return sendError(res, 400, 'Model name is required.');
        }
        if (!reqData.prompt) {
          return sendError(res, 400, 'Prompt string is required.');
        }

        // 2. Check for Sandbox Mode
        if (reqData.sandboxMode) {
          return handleSandboxStream(reqData, res);
        }

        // 3. Resolve Auth & Routing
        const clientConfig = reqData.config || {};
        const authType = clientConfig.authType || process.env.GCP_AUTH_TYPE || (clientConfig.apiKey || process.env.GEMINI_API_KEY ? 'apiKey' : 'token');

        // Direct Google AI Studio API Key path for Gemini
        if (reqData.provider === 'gemini' && authType === 'apiKey') {
          const apiKey = clientConfig.apiKey || process.env.GEMINI_API_KEY;
          if (!apiKey) {
            return sendError(res, 400, 'Google AI Studio API Key is required (set in UI or GEMINI_API_KEY in .env).');
          }
          return handleGoogleAIStudioStream(reqData, apiKey, res);
        }

        // Vertex AI Path
        const projectId = clientConfig.projectId || process.env.GCP_PROJECT_ID;
        const region = clientConfig.region || process.env.GCP_REGION || 'us-central1';

        if (!projectId || !region) {
          return sendError(res, 400, 'Vertex AI mode requires Google Cloud Project ID and Region (either via UI or server .env).');
        }

        let token = '';
        if (authType === 'token') {
          let accessToken = clientConfig.accessToken || process.env.GCP_ACCESS_TOKEN;
          if (!accessToken) {
            return sendError(res, 400, 'OAuth Access Token was not provided (either via UI or server .env).');
          }
          token = accessToken;
        } else if (authType === 'serviceAccount') {
          let serviceAccount = clientConfig.serviceAccount || process.env.GCP_SERVICE_ACCOUNT_KEY;
          
          if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            try {
              const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
              if (fs.existsSync(saPath)) {
                serviceAccount = fs.readFileSync(saPath, 'utf8');
              }
            } catch (err) {
              return sendError(res, 500, `Failed to load GOOGLE_APPLICATION_CREDENTIALS file: ${err.message}`);
            }
          }

          if (!serviceAccount) {
            return sendError(res, 400, 'Service Account JSON Key was not provided (either via UI or server .env).');
          }
          try {
            token = await getAccessTokenFromServiceAccount(serviceAccount);
          } catch (err) {
            return sendError(res, 401, `Failed to generate token from Service Account: ${err.message}`);
          }
        } else {
          return sendError(res, 400, 'Invalid authType for Vertex AI. Must be "token", "serviceAccount", or "apiKey".');
        }

        // Vertex AI Streaming Request
        function executeCall(currentRegion, isRetry = false) {
          const currentHost = currentRegion === 'global' ? 'aiplatform.googleapis.com' : `${currentRegion}-aiplatform.googleapis.com`;
          let currentPath = '';
          let payload = {};

          if (reqData.provider === 'gemini') {
            currentPath = `/v1/projects/${projectId}/locations/${currentRegion}/publishers/google/models/${encodeURIComponent(reqData.model)}:streamGenerateContent`;
            
            payload = {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: reqData.prompt }]
                }
              ],
              generationConfig: {
                temperature: reqData.temperature !== undefined ? reqData.temperature : 0.7,
                maxOutputTokens: reqData.maxTokens || 4096,
                topP: reqData.topP !== undefined ? reqData.topP : 0.95,
                topK: reqData.topK !== undefined ? reqData.topK : 40,
              }
            };

            if (reqData.systemPrompt) {
              payload.systemInstruction = {
                parts: [{ text: reqData.systemPrompt }]
              };
            }

            if (reqData.responseMimeType) {
              payload.generationConfig.responseMimeType = reqData.responseMimeType;
            }

            // Enable thinking for Gemini 3.x / 2.5 models
            const clientThinking = reqData.geminiThinking || {};
            const selectedMode = clientThinking.mode || 'HIGH';
            
            if (reqData.model.includes('gemini-3') || reqData.model.includes('gemini-2.5')) {
              if (selectedMode === 'OFF') {
                payload.generationConfig.thinkingConfig = {
                  thinkingBudget: 0,
                  includeThoughts: false
                };
              } else if (reqData.model.includes('gemini-3.7') || reqData.model.includes('gemini-3.6') || reqData.model.includes('gemini-3.5') || reqData.model.includes('gemini-3.0') || reqData.model.includes('gemini-3-')) {
                let level = 'HIGH';
                if (['HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].includes(selectedMode)) {
                  level = selectedMode;
                }
                
                const thinkingConfig = {
                  includeThoughts: true
                };

                if (selectedMode === 'CUSTOM' && clientThinking.budget) {
                  thinkingConfig.thinkingBudget = Number(clientThinking.budget);
                } else {
                  thinkingConfig.thinkingLevel = level;
                }
                payload.generationConfig.thinkingConfig = thinkingConfig;
              } else if (reqData.model.includes('gemini-2.5')) {
                let budget = -1;
                if (selectedMode === 'CUSTOM') {
                  budget = typeof clientThinking.budget === 'number' ? clientThinking.budget : 1024;
                }
                payload.generationConfig.thinkingConfig = {
                  includeThoughts: true,
                  thinkingBudget: budget
                };
              } else {
                payload.generationConfig.thinkingConfig = {
                  includeThoughts: true
                };
              }
            }
          } else {
            // Anthropic Claude on Vertex AI
            currentPath = `/v1/projects/${projectId}/locations/${currentRegion}/publishers/anthropic/models/${encodeURIComponent(reqData.model)}:streamRawPredict`;
            
            payload = {
              anthropic_version: 'vertex-2023-10-16',
              max_tokens: reqData.maxTokens || 4096,
              stream: true,
              messages: [
                {
                  role: 'user',
                  content: reqData.prompt
                }
              ],
              temperature: reqData.temperature !== undefined ? reqData.temperature : 0.7,
            };

            if (reqData.systemPrompt) {
              payload.system_prompt = reqData.systemPrompt;
            }

            if (reqData.model.includes('claude-sonnet-4-6') || reqData.model.includes('claude-opus-4-7')) {
              payload.thinking = {
                type: 'adaptive'
              };
              payload.output_config = {
                effort: 'high'
              };
              delete payload.temperature;
            }
          }

          const payloadStr = JSON.stringify(payload);

          const apiRequest = https.request({
            hostname: currentHost,
            path: currentPath,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Content-Length': Buffer.byteLength(payloadStr),
            }
          }, (apiResponse) => {
            // Auto-retry on global pool if regional model returns 404
            if (apiResponse.statusCode === 404 && currentRegion !== 'global' && !isRetry) {
              apiResponse.resume();
              console.log(`[WARN] 404 Model Not Found in region "${currentRegion}". Attempting self-healing fallback to "global" location...`);
              executeCall('global', true);
              return;
            }

            if (apiResponse.statusCode !== 200) {
              let errorBody = '';
              apiResponse.on('data', c => { errorBody += c; });
              apiResponse.on('end', () => {
                sendError(res, apiResponse.statusCode, `Vertex AI API Error (${apiResponse.statusCode}): ${errorBody}`);
              });
              return;
            }

            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });

            let buffer = '';
            let braceCount = 0;
            let inString = false;
            let escape = false;
            let startIdx = -1;

            apiResponse.on('data', (chunk) => {
              const chunkStr = chunk.toString('utf8');
              
              if (reqData.provider === 'gemini') {
                buffer += chunkStr;
                let i = 0;
                while (i < buffer.length) {
                  const char = buffer[i];
                  if (inString) {
                    if (escape) {
                      escape = false;
                    } else if (char === '\\') {
                      escape = true;
                    } else if (char === '"') {
                      inString = false;
                    }
                  } else {
                    if (char === '"') {
                      inString = true;
                    } else if (char === '{') {
                      if (braceCount === 0) {
                        startIdx = i;
                      }
                      braceCount++;
                    } else if (char === '}') {
                      braceCount--;
                      if (braceCount === 0 && startIdx !== -1) {
                        const jsonStr = buffer.substring(startIdx, i + 1);
                        try {
                          const parsed = JSON.parse(jsonStr);
                          if (parsed.candidates && parsed.candidates[0]?.content?.parts) {
                            for (const part of parsed.candidates[0].content.parts) {
                              if (part.text) {
                                res.write(`data: ${JSON.stringify({ text: part.text, thinking: !!part.thought })}\n\n`);
                              }
                            }
                          }
                          if (parsed.usageMetadata) {
                            res.write(`data: ${JSON.stringify({ usageMetadata: parsed.usageMetadata })}\n\n`);
                          }
                        } catch (e) {}
                        buffer = buffer.substring(i + 1);
                        i = -1;
                        startIdx = -1;
                      }
                    }
                  }
                  i++;
                }
              } else {
                buffer += chunkStr;
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data:')) {
                    const dataContent = trimmed.substring(5).trim();
                    if (dataContent === '[DONE]') continue;
                    try {
                      const parsed = JSON.parse(dataContent);
                      if (parsed.type === 'content_block_delta' && parsed.delta) {
                        if (parsed.delta.type === 'thinking_delta' && parsed.delta.thinking) {
                          res.write(`data: ${JSON.stringify({ text: parsed.delta.thinking, thinking: true })}\n\n`);
                        } else if (parsed.delta.text) {
                          res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
                        }
                      }
                    } catch (e) {}
                  }
                }
              }
            });

            apiResponse.on('end', () => {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
            });

          });

          apiRequest.on('error', (err) => {
            if (currentRegion !== 'global' && !isRetry) {
              console.log(`[WARN] Connection failed to region "${currentRegion}". Attempting self-healing fallback to "global" location...`);
              executeCall('global', true);
            } else {
              const msg = err.code === 'ENOTFOUND' 
                ? `Network connection error (${err.message}). The server was unable to reach Google Cloud endpoints (DNS lookup failed). Please ensure your Node server has internet access (e.g. run 'node server.js' in your terminal). To test immediately without internet or API keys, enable Sandbox Mode in the sidebar!`
                : `Internal HTTPS request failed: ${err.message}`;
              sendError(res, 500, msg);
            }
          });

          apiRequest.write(payloadStr);
          apiRequest.end();
        }

        executeCall(region);

      } catch (err) {
        sendError(res, 400, `Invalid JSON payload: ${err.message}`);
      }
    });
    return;
  }

  // Routing Static files
  let reqPath = req.url;
  const queryIdx = reqPath.indexOf('?');
  if (queryIdx !== -1) {
    reqPath = reqPath.substring(0, queryIdx);
  }
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }
  reqPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Vertex AI & Gemini Playground Local Server Running!`);
  console.log(`👉 Access URL: http://127.0.0.1:${PORT}`);
  console.log(`👉 Models: Gemini 3.7 / 3.6 / 3.5 / 3.0 / 2.5 / 2.0 / 1.5 Series`);
  console.log(`👉 Node binary: ${process.execPath}`);
  console.log(`=======================================================`);
});
