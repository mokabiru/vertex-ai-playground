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

// Helper to MIME types
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
      const sa = JSON.parse(saKeyJson);
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
 * Simple helper to send JSON errors
 */
function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

/**
 * Mock Stream Generator for Sandbox Mode
 * Emits beautiful educational markdown with a delay to simulate active network streaming
 */
function handleSandboxStream(reqData, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const provider = reqData.provider === 'claude' ? 'Anthropic Claude' : 'Google Gemini';
  const model = reqData.model || 'default-model';
  const prompt = reqData.prompt || '';
  const temp = reqData.temperature !== undefined ? reqData.temperature : 0.7;

  const region = reqData.config?.region || 'us-central1';
  const projectId = reqData.config?.projectId || 'YOUR_PROJECT_ID';
  const simulatedHost = region === 'global' ? 'aiplatform.googleapis.com' : `${region}-aiplatform.googleapis.com`;

  const isClaudeThinking = reqData.provider === 'claude' && (model.includes('claude-sonnet-4-6') || model.includes('claude-opus-4-7'));

  // Let's create a rich, structured markdown response explaining how the app acts
  const paragraphs = [
    `### 🧪 Sandbox Mode Simulation\n\nThis is a real-time streamed response simulating **${provider}** (${model}) on Google Cloud Vertex AI.\n\n`,
    `You asked: *"${prompt}"*\n\n`,
    `Here is a technical walkthrough of how the **Vertex AI Playground** translates this action into a live Google Cloud REST request:\n\n`,
    `#### 1. Endpoint Architecture\n`,
    reqData.provider === 'claude' 
      ? `To call Claude, the application triggers a \`POST\` request to the Vertex AI Anthropic endpoint:\n\`\`\`http\nPOST https://${simulatedHost}/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${model}:streamRawPredict\n\`\`\`\n\n`
      : `To call Gemini, the application triggers a \`POST\` request to the Google Publisher endpoint:\n\`\`\`http\nPOST https://${simulatedHost}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:streamGenerateContent\n\`\`\`\n\n`,
    `#### 2. Authentication Headers\n`,
    `Both APIs require OAuth 2.0 authorization, which is handled seamlessly by this Node.js server:\n`,
    `\`\`\`http\nAuthorization: Bearer ya29.c.Ko0BvQ...[Generated Access Token]\nContent-Type: application/json\n\`\`\`\n\n`,
    `#### 3. Standardized Payload Structure\n`,
    reqData.provider === 'claude'
      ? (isClaudeThinking
         ? `The payload follows the official Anthropic Messages API but enforces the Vertex-specific version parameter and automatically omits the temperature parameter to prevent API errors because Claude Thinking is enabled:\n\`\`\`json\n{\n  "anthropic_version": "vertex-2023-10-16",\n  "max_tokens": ${reqData.maxTokens || 1024},\n  "messages": [\n    { "role": "user", "content": "${prompt.replace(/"/g, '\\"')}" }\n  ],\n  "thinking": {\n    "type": "adaptive"\n  },\n  "output_config": {\n    "effort": "high"\n  }\n}\n\`\`\`\n\n`
         : `The payload follows the official Anthropic Messages API but enforces the Vertex-specific version parameter:\n\`\`\`json\n{\n  "anthropic_version": "vertex-2023-10-16",\n  "max_tokens": ${reqData.maxTokens || 1024},\n  "messages": [\n    { "role": "user", "content": "${prompt.replace(/"/g, '\\"')}" }\n  ],\n  "temperature": ${temp}\n}\n\`\`\`\n\n`)
      : `The Gemini payload formats content as role-based parts arrays:\n\`\`\`json\n{\n  "contents": [\n    {\n      "role": "user",\n      "parts": [{ "text": "${prompt.replace(/"/g, '\\"')}" }]\n    }\n  ],\n  "generationConfig": {\n    "temperature": ${temp},\n    "maxOutputTokens": ${reqData.maxTokens || 1024}\n  }\n}\n\`\`\`\n\n`,
    `#### 4. Model Capabilities Overview\n`,
    reqData.provider === 'claude'
      ? `Anthropic's Claude models on Vertex AI excel at logical reasoning, detailed coding tasks, writing, and displaying high emotional intelligence. Perfect for complex prompt chains.\n`
      : `Google's Gemini models are built natively multimodal from the ground up, offering massive context windows (up to 2M tokens), blinding speed, and incredible performance on structured data.\n\n`,
    `*Note: Once you exit Sandbox Mode and provide actual GCP credentials in the settings panel, these exact REST endpoints and payloads will be activated securely through this backend proxy!*`
  ];

  let simulatedThoughts = [
    `Analyzing prompt string: "${prompt.substring(0, 45)}${prompt.length > 45 ? '...' : ''}"\n`,
    `Detecting routing metrics and query intent for Provider [${reqData.provider.toUpperCase()}] and Model [${model}]...\n`,
    `Checking credentials cache and simulating active secure OAuth token generation...\n`,
    `Formulating generation parameters: temperature=${isClaudeThinking ? 'OMITTED (Thinking Mode)' : temp}, maxTokens=${reqData.maxTokens || 1024}\n`,
    `Preparing beautiful educational roadmap response blueprint...\n`
  ];

  // Dynamically tailor thoughts in Sandbox Mode to reflect selected thinking level/budget
  if (reqData.provider === 'gemini') {
    const clientThinking = reqData.geminiThinking || {};
    const selectedMode = clientThinking.mode || 'HIGH';
    
    if (selectedMode === 'OFF' || selectedMode === 'UNSUPPORTED') {
      simulatedThoughts = [];
    } else if (selectedMode === 'MINIMAL') {
      simulatedThoughts = [
        `[MINIMAL MODE] Bypassing extensive reasoning. Preparing immediate answer layout...\n`
      ];
    } else if (selectedMode === 'LOW') {
      simulatedThoughts = [
        `[LOW MODE] Analyzing query context for Prompt: "${prompt.substring(0, 30)}..."\n`,
        `[LOW MODE] Aligning lightweight generation parameters and routing matrices...\n`
      ];
    } else if (selectedMode === 'MEDIUM') {
      simulatedThoughts = [
        `[MEDIUM MODE] Processing query string input and parsing prompt semantic intention...\n`,
        `[MEDIUM MODE] Resolving region locations list and authenticating secure session routing...\n`,
        `[MEDIUM MODE] Assembling standard API parameters and preparing structure blueprints...\n`
      ];
    } else if (selectedMode === 'DYNAMIC' || selectedMode === 'HIGH' || selectedMode === 'CUSTOM') {
      const budgetLabel = selectedMode === 'CUSTOM' ? `CUSTOM BUDGET: ${clientThinking.budget || 1024} tokens` : `${selectedMode} MODE`;
      simulatedThoughts = [
        `[${budgetLabel}] Initiating deep semantic parse of user prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n`,
        `[${budgetLabel}] Resolving Vertex AI endpoint routing matrix to maximize response execution speed...\n`,
        `[${budgetLabel}] Accessing local server SA credential store and conducting OAuth key verification...\n`,
        `[${budgetLabel}] Constructing optimized API generationConfig body: temperature=${temp}, maxTokens=${reqData.maxTokens || 1024}...\n`,
        `[${budgetLabel}] Simulating reasoning cycles to establish structured response hierarchy...\n`,
        `[${budgetLabel}] Generating educational walkthrough elements and preparing the streamed output...\n`
      ];
    }
  } else if (isClaudeThinking) {
    simulatedThoughts = [
      `[CLAUDE THINKING MODE] Initiating Claude adaptive thinking with high effort level...\n`,
      `[CLAUDE THINKING MODE] Constructing REST payload: temperature parameter is automatically omitted to allow Claude Thinking...\n`,
      `[CLAUDE THINKING MODE] Performing deep hierarchical prompt analysis and multi-step reasoning...\n`,
      `[CLAUDE THINKING MODE] Generating logical trace logs for Claude's intermediate thought process...\n`
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
      // Send final metadata
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
    const chunkSize = event.thinking ? (Math.floor(Math.random() * 8) + 4) : (Math.floor(Math.random() * 5) + 3);
    const token = text.substring(currentCharIndex, currentCharIndex + chunkSize);
    currentCharIndex += chunkSize;

    res.write(`data: ${JSON.stringify({ text: token, thinking: event.thinking })}\n\n`);

    if (currentCharIndex >= text.length) {
      currentEventIndex++;
      currentCharIndex = 0;
      setTimeout(streamNextToken, event.thinking ? 80 : 150);
    } else {
      setTimeout(streamNextToken, event.thinking ? 10 + Math.random() * 15 : 15 + Math.random() * 25);
    }
  }

  // Start streaming
  streamNextToken();
}

/**
 * Main Request Router
 */
const server = http.createServer(async (req, res) => {
  // Set default CORS headers for developer local ease
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET config route to fetch server-side environment credentials
  if (req.method === 'GET' && req.url === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let hasServiceAccount = !!process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (!hasServiceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      hasServiceAccount = fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    
    res.end(JSON.stringify({
      projectId: process.env.GCP_PROJECT_ID || '',
      region: process.env.GCP_REGION || 'us-central1',
      authType: process.env.GCP_AUTH_TYPE || 'token',
      hasAccessToken: !!process.env.GCP_ACCESS_TOKEN,
      hasServiceAccount: hasServiceAccount,
      sandboxMode: process.env.SANDBOX_MODE !== 'false'
    }));
    return;
  }

  // Routing API requests
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

        // 3. For live mode, resolve and validate configuration
        const clientConfig = reqData.config || {};
        const projectId = clientConfig.projectId || process.env.GCP_PROJECT_ID;
        const region = clientConfig.region || process.env.GCP_REGION || 'us-central1';
        const authType = clientConfig.authType || process.env.GCP_AUTH_TYPE || 'token';

        if (!projectId || !region) {
          return sendError(res, 400, 'Live mode requires Google Cloud Project ID and Region (either via UI or server .env).');
        }

        // 4. Resolve Access Token
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
          return sendError(res, 400, 'Invalid authType. Must be "token" or "serviceAccount".');
        }

        // 5. Trigger Streaming Call to Vertex AI REST Endpoint (with self-healing fallback)
        function executeCall(currentRegion, isRetry = false) {
          const currentHost = currentRegion === 'global' ? 'aiplatform.googleapis.com' : `${currentRegion}-aiplatform.googleapis.com`;
          let currentPath = '';
          let payload = {};

          if (reqData.provider === 'gemini') {
            currentPath = `/v1/projects/${projectId}/locations/${currentRegion}/publishers/google/models/${reqData.model}:streamGenerateContent`;
            
            payload = {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: reqData.prompt }]
                }
              ],
              generationConfig: {
                temperature: reqData.temperature !== undefined ? reqData.temperature : 0.2,
                maxOutputTokens: reqData.maxTokens || 2048,
              }
            };

            if (reqData.systemPrompt) {
              payload.systemInstruction = {
                parts: [{ text: reqData.systemPrompt }]
              };
            }

            // Enable thinking/thoughts config for Gemini 2.5 and newer models based on client choices
            if (reqData.model.includes('gemini-2.5') || reqData.model.includes('gemini-3.5')) {
              const clientThinking = reqData.geminiThinking || {};
              const selectedMode = clientThinking.mode || 'HIGH';
              
              if (reqData.model.includes('gemini-3.5')) {
                // Gemini 3.5+ uses thinkingLevel (MINIMAL, LOW, MEDIUM, HIGH)
                let level = 'HIGH';
                if (['HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].includes(selectedMode)) {
                  level = selectedMode;
                }
                
                payload.generationConfig.thinkingConfig = {
                  includeThoughts: true,
                  thinkingLevel: level
                };
              } else if (reqData.model.includes('gemini-2.5')) {
                // Gemini 2.5 uses thinkingBudget (-1, 0, or custom integer)
                let budget = -1; // Default dynamic auto-budget
                
                if (selectedMode === 'OFF') {
                  budget = 0;
                } else if (selectedMode === 'CUSTOM') {
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
            // Anthropic Claude
            currentPath = `/v1/projects/${projectId}/locations/${currentRegion}/publishers/anthropic/models/${reqData.model}:streamRawPredict`;
            
            payload = {
              anthropic_version: 'vertex-2023-10-16',
              max_tokens: reqData.maxTokens || 2048,
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

            // Enable adaptive thinking for Claude Sonnet 4-6 and Opus 4-7 models
            if (reqData.model.includes('claude-sonnet-4-6') || reqData.model.includes('claude-opus-4-7')) {
              payload.thinking = {
                type: 'adaptive'
              };
              payload.output_config = {
                effort: 'high'
              };
              // Temperature is incompatible with Claude Thinking Mode.
              // To prevent 400 API validation errors, we omit it entirely from the payload.
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
            // If we hit a 404 (Model Not Found) on a regional location, auto-retry on global location pool!
            if (apiResponse.statusCode === 404 && currentRegion !== 'global' && !isRetry) {
              apiResponse.resume(); // consume response to avoid memory leaks
              console.log(`[WARN] 404 Model Not Found in region "${currentRegion}". Attempting self-healing fallback to "global" location...`);
              executeCall('global', true);
              return;
            }

            if (apiResponse.statusCode !== 200) {
              let errorBody = '';
              apiResponse.on('data', c => { errorBody += c; });
              apiResponse.on('end', () => {
                sendError(res, apiResponse.statusCode, `Vertex AI API Error: ${errorBody}`);
              });
              return;
            }

            // Open SSE response stream to client
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
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
                          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
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
              sendError(res, 500, `Internal HTTPS request failed: ${err.message}`);
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
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  // Prevent directory traversal attacks
  reqPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Check if file is inside public directory to prevent access to outer files
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

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Vertex AI Playground Local Server Running!`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`👉 Running on Node binary: ${process.execPath}`);
  console.log(`=======================================================`);
});
