/* ==========================================================================
   APP FRONTEND CONTROLLER
   ========================================================================== */

const PRICING = {
  // Input cost per 1M tokens, Output cost per 1M tokens
  'gemini-1.5-flash-001': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro-001': { input: 1.25, output: 5.00 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-3.5-flash': { input: 0.075, output: 0.30 },
  'gemini-3.1-flash-lite': { input: 0.0375, output: 0.15 },
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-opus-4-7': { input: 15.00, output: 75.00 },
  'claude-haiku-4-5@20251001': { input: 0.80, output: 4.00 },
  'claude-3-5-sonnet@20241022': { input: 3.00, output: 15.00 }
};

// --- DOM References ---
const elements = {
  // General UI
  sandboxCheckbox: document.getElementById('sandbox-checkbox'),
  sandboxBadge: document.getElementById('sandbox-badge'),
  toast: document.getElementById('toast'),
  
  // Settings Sliders
  systemPrompt: document.getElementById('system-prompt'),
  tempSlider: document.getElementById('param-temp'),
  tempVal: document.getElementById('temp-val'),
  tokensSlider: document.getElementById('param-tokens'),
  tokensVal: document.getElementById('tokens-val'),
  
  // Arena Layout Tabs
  tabCompare: document.getElementById('tab-compare'),
  tabGemini: document.getElementById('tab-gemini'),
  tabClaude: document.getElementById('tab-claude'),
  arenaGrid: document.getElementById('arena-grid'),
  
  // Model Selectors
  geminiModelSelect: document.getElementById('gemini-model-select'),
  claudeModelSelect: document.getElementById('claude-model-select'),
  
  // Consoles
  geminiConsole: document.getElementById('gemini-console'),
  claudeConsole: document.getElementById('claude-console'),
  
  // Prompt Input Forms
  promptForm: document.getElementById('prompt-form'),
  promptInput: document.getElementById('prompt-input'),
  btnSubmitPrompt: document.getElementById('btn-submit-prompt'),
  btnClearArena: document.getElementById('btn-clear-arena'),
  
  // Config Modal Elements
  configDialog: document.getElementById('config-dialog'),
  btnOpenConfig: document.getElementById('btn-open-config'),
  btnCloseConfig: document.getElementById('btn-close-config'),
  btnSaveConfig: document.getElementById('btn-save-config'),
  btnClearConfig: document.getElementById('btn-clear-config'),
  gcpProjectId: document.getElementById('gcp-project-id'),
  gcpRegion: document.getElementById('gcp-region'),
  gcpAccessToken: document.getElementById('gcp-access-token'),
  gcpSaKey: document.getElementById('gcp-sa-key'),
  authMethodRadio: document.getElementsByName('auth-method'),
  authBoxToken: document.getElementById('auth-box-token'),
  authBoxSa: document.getElementById('auth-box-sa'),
  
  // Real-time Metrics Readouts
  geminiTtft: document.getElementById('gemini-metric-ttft'),
  geminiSpeed: document.getElementById('gemini-metric-speed'),
  geminiCount: document.getElementById('gemini-metric-count'),
  geminiCost: document.getElementById('gemini-metric-cost'),
  
  claudeTtft: document.getElementById('claude-metric-ttft'),
  claudeSpeed: document.getElementById('claude-metric-speed'),
  claudeCount: document.getElementById('claude-metric-count'),
  claudeCost: document.getElementById('claude-metric-cost'),

  // Gemini visual breakdown elements
  geminiBarInput: document.getElementById('gemini-bar-input'),
  geminiBarThinking: document.getElementById('gemini-bar-thinking'),
  geminiBarOutput: document.getElementById('gemini-bar-output'),
  geminiLegendInput: document.getElementById('gemini-legend-input'),
  geminiLegendThinking: document.getElementById('gemini-legend-thinking'),
  geminiLegendOutput: document.getElementById('gemini-legend-output'),

  // Claude visual breakdown elements
  claudeBarInput: document.getElementById('claude-bar-input'),
  claudeBarThinking: document.getElementById('claude-bar-thinking'),
  claudeBarOutput: document.getElementById('claude-bar-output'),
  claudeLegendInput: document.getElementById('claude-legend-input'),
  claudeLegendThinking: document.getElementById('claude-legend-thinking'),
  claudeLegendOutput: document.getElementById('claude-legend-output'),
};

// --- Active Layout State ---
let currentLayout = 'compare'; // 'compare', 'gemini', 'claude'

// ==========================================================================
// CREDENTIAL STORAGE AND RETRIEVAL
// ==========================================================================
function loadSavedCredentials() {
  elements.gcpProjectId.value = localStorage.getItem('gcp_project_id') || '';
  elements.gcpRegion.value = localStorage.getItem('gcp_region') || 'us-central1';
  elements.gcpAccessToken.value = localStorage.getItem('gcp_access_token') || '';
  elements.gcpSaKey.value = localStorage.getItem('gcp_sa_key') || '';
  
  const savedAuthType = localStorage.getItem('gcp_auth_type') || 'token';
  for (const radio of elements.authMethodRadio) {
    if (radio.value === savedAuthType) {
      radio.checked = true;
      break;
    }
  }
  toggleAuthForms(savedAuthType);
}

function saveCredentials() {
  localStorage.setItem('gcp_project_id', elements.gcpProjectId.value.trim());
  localStorage.setItem('gcp_region', elements.gcpRegion.value);
  localStorage.setItem('gcp_access_token', elements.gcpAccessToken.value.trim());
  localStorage.setItem('gcp_sa_key', elements.gcpSaKey.value.trim());
  
  let checkedType = 'token';
  for (const radio of elements.authMethodRadio) {
    if (radio.checked) {
      checkedType = radio.value;
      break;
    }
  }
  localStorage.setItem('gcp_auth_type', checkedType);
  showToast('Credentials saved locally!');
}

function clearCredentials() {
  localStorage.removeItem('gcp_project_id');
  localStorage.removeItem('gcp_region');
  localStorage.removeItem('gcp_access_token');
  localStorage.removeItem('gcp_sa_key');
  localStorage.removeItem('gcp_auth_type');
  
  elements.gcpProjectId.value = '';
  elements.gcpRegion.value = 'us-central1';
  elements.gcpAccessToken.value = '';
  elements.gcpSaKey.value = '';
  elements.authMethodRadio[0].checked = true;
  toggleAuthForms('token');
  showToast('Credentials cleared successfully.');
}

function getCredentialsConfig() {
  let authType = 'token';
  for (const radio of elements.authMethodRadio) {
    if (radio.checked) {
      authType = radio.value;
      break;
    }
  }

  return {
    projectId: elements.gcpProjectId.value.trim(),
    region: elements.gcpRegion.value,
    authType: authType,
    accessToken: elements.gcpAccessToken.value.trim(),
    serviceAccount: elements.gcpSaKey.value.trim()
  };
}

// ==========================================================================
// LIGHTWEIGHT MARKDOWN PARSER (Vibrant rendering of streamed blocks)
// ==========================================================================
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // Escape html characters to prevent script injections
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Codeblocks ``` [lang] \n [code] ```
  html = html.replace(/```(\w*)\n([\s\S]*?)(```|$)/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // 2. Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 3. Headers (###, ####)
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');

  // 4. Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Italics *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 6. Lists
  // Simple bullet point conversion
  html = html.replace(/^[\s]*[-*] (.*?)$/gm, '<li>$1</li>');
  
  // Wrap sequential <li> tags with <ul>...</ul>
  // Look for sequences of <li>...</li> and replace them
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
    return `<ul>\n${match}</ul>`;
  });

  // 7. Newlines to breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3500);
}

// ==========================================================================
// INTERACTIVE EVENT BINDINGS
// ==========================================================================

// Synchronize Sliders Digital Readout
elements.tempSlider.addEventListener('input', (e) => {
  elements.tempVal.textContent = e.target.value;
});
elements.tokensSlider.addEventListener('input', (e) => {
  elements.tokensVal.textContent = e.target.value;
});

// Sandbox Switch Toggle Status Updates
elements.sandboxCheckbox.addEventListener('change', (e) => {
  const isSandbox = e.target.checked;
  if (isSandbox) {
    elements.sandboxBadge.className = 'badge-status sandbox-active';
    elements.sandboxBadge.querySelector('.badge-text').textContent = 'SANDBOX MODE ACTIVE';
  } else {
    elements.sandboxBadge.className = 'badge-status live-active';
    elements.sandboxBadge.querySelector('.badge-text').textContent = 'LIVE MODEL MODE';
    
    // Quick warning if live is enabled without project parameters
    const credentials = getCredentialsConfig();
    if (!credentials.projectId) {
      showToast('⚠️ No GCP Project ID configured! Click GCP Credentials to setup.');
    }
  }
});

// Modal Dialog Overlay Controls
elements.btnOpenConfig.addEventListener('click', () => {
  elements.configDialog.showModal();
});
elements.btnCloseConfig.addEventListener('click', () => {
  elements.configDialog.close();
});
elements.btnSaveConfig.addEventListener('click', () => {
  saveCredentials();
  elements.configDialog.close();
});
elements.btnClearConfig.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear your local GCP credentials?')) {
    clearCredentials();
  }
});

// Radios inside Config dialog toggling fields
function toggleAuthForms(authType) {
  if (authType === 'token') {
    elements.authBoxToken.classList.add('visible');
    elements.authBoxSa.classList.remove('visible');
  } else {
    elements.authBoxSa.classList.add('visible');
    elements.authBoxToken.classList.remove('visible');
  }
}
for (const radio of elements.authMethodRadio) {
  radio.addEventListener('change', (e) => {
    toggleAuthForms(e.target.value);
  });
}

// Workspace tab switching logic
function updateLayoutUI(layout) {
  currentLayout = layout;
  elements.tabCompare.classList.remove('active');
  elements.tabGemini.classList.remove('active');
  elements.tabClaude.classList.remove('active');
  
  elements.arenaGrid.className = 'arena-grid';

  if (layout === 'compare') {
    elements.tabCompare.classList.add('active');
    elements.arenaGrid.classList.add('split-layout');
  } else if (layout === 'gemini') {
    elements.tabGemini.classList.add('active');
    elements.arenaGrid.classList.add('single-gemini-layout');
  } else if (layout === 'claude') {
    elements.tabClaude.classList.add('active');
    elements.arenaGrid.classList.add('single-claude-layout');
  }
}
elements.tabCompare.addEventListener('click', () => updateLayoutUI('compare'));
elements.tabGemini.addEventListener('click', () => updateLayoutUI('gemini'));
elements.tabClaude.addEventListener('click', () => updateLayoutUI('claude'));

// Clear Consoles Button
elements.btnClearArena.addEventListener('click', () => {
  clearConsoles();
  showToast('Consoles cleared.');
});

function clearConsoles() {
  elements.geminiConsole.innerHTML = `
    <div class="placeholder-msg">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <p>Enter a prompt below to stream Gemini's response.</p>
    </div>`;
  elements.claudeConsole.innerHTML = `
    <div class="placeholder-msg">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <p>Enter a prompt below to stream Claude's response.</p>
    </div>`;
  
  // Clear metrics
  resetMetricsReadout('gemini');
  resetMetricsReadout('claude');
}

function resetMetricsReadout(provider) {
  if (provider === 'gemini') {
    elements.geminiTtft.textContent = '--';
    elements.geminiSpeed.textContent = '--';
    elements.geminiCount.textContent = '0';
    elements.geminiCost.textContent = '$0.00000';
    
    if (elements.geminiBarInput) {
      elements.geminiBarInput.style.width = '0%';
      elements.geminiBarThinking.style.width = '0%';
      elements.geminiBarOutput.style.width = '0%';
      elements.geminiLegendInput.textContent = '0';
      elements.geminiLegendThinking.textContent = '0';
      elements.geminiLegendOutput.textContent = '0';
    }
  } else {
    elements.claudeTtft.textContent = '--';
    elements.claudeSpeed.textContent = '--';
    elements.claudeCount.textContent = '0';
    elements.claudeCost.textContent = '$0.00000';
    
    if (elements.claudeBarInput) {
      elements.claudeBarInput.style.width = '0%';
      elements.claudeBarThinking.style.width = '0%';
      elements.claudeBarOutput.style.width = '0%';
      elements.claudeLegendInput.textContent = '0';
      elements.claudeLegendThinking.textContent = '0';
      elements.claudeLegendOutput.textContent = '0';
    }
  }
}

// ==========================================================================
// CORE STREAMING API CALLS (DUEL ORCHESTRATION)
// ==========================================================================

async function streamModel(provider, prompt) {
  const isSandbox = elements.sandboxCheckbox.checked;
  const config = getCredentialsConfig();
  
  // Live validation
  if (!isSandbox) {
    if (!config.projectId) {
      showToast(`⚠️ GCP Project ID required to stream ${provider} live!`);
      return;
    }
    if (config.authType === 'token' && !config.accessToken) {
      showToast(`⚠️ OAuth Access Token required to stream ${provider} live!`);
      return;
    }
    if (config.authType === 'serviceAccount' && !config.serviceAccount) {
      showToast(`⚠️ Service Account JSON key required to stream ${provider} live!`);
      return;
    }
  }

  const model = provider === 'gemini' 
    ? elements.geminiModelSelect.value 
    : elements.claudeModelSelect.value;

  const sysPrompt = elements.systemPrompt.value.trim();
  const temp = parseFloat(elements.tempSlider.value);
  const maxTokens = parseInt(elements.tokensSlider.value);

  // Setup visual containers
  const consoleEl = provider === 'gemini' ? elements.geminiConsole : elements.claudeConsole;
  
  // Clear placeholder if it exists
  const placeholder = consoleEl.querySelector('.placeholder-msg');
  if (placeholder) {
    consoleEl.innerHTML = '';
  }

  // Create User message card
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user-bubble';
  userBubble.textContent = prompt;
  consoleEl.appendChild(userBubble);

  // Create Model response card
  const responseBubble = document.createElement('div');
  responseBubble.className = `chat-bubble model-bubble ${provider}-model-theme streaming-token`;
  consoleEl.appendChild(responseBubble);
  consoleEl.scrollTop = consoleEl.scrollHeight;

  // --- Metrics initialization ---
  let startTime = performance.now();
  let firstTokenReceived = false;
  let tokenCount = 0;

  // Real-time tracking of token types
  let thinkingText = '';
  let outputText = '';
  let thinkingTokens = 0;
  let outputTokens = 0;
  let actualInputTokens = estimatedInputTokens;

  // Reset readings
  resetMetricsReadout(provider);

  function updateResponseUI() {
    let html = '';
    if (thinkingText) {
      html += `
        <div class="thinking-container">
          <div class="thinking-header">
            <svg class="thinking-brain-icon animate-pulse" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z"/></svg>
            <span>Thinking Process</span>
          </div>
          <div class="thinking-content">${parseMarkdown(thinkingText)}</div>
        </div>
      `;
    }
    if (outputText) {
      html += `<div class="output-content">${parseMarkdown(outputText)}</div>`;
    }
    responseBubble.innerHTML = html;
    consoleEl.scrollTop = consoleEl.scrollHeight;

    // Update real-time metrics
    tokenCount = thinkingTokens + outputTokens;
    const countLabel = provider === 'gemini' ? elements.geminiCount : elements.claudeCount;
    if (countLabel) countLabel.textContent = tokenCount;

    // Live speeds: tokens / elapsed seconds
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const speed = (tokenCount / Math.max(elapsedSeconds, 0.1)).toFixed(1);
    const speedLabel = provider === 'gemini' ? elements.geminiSpeed : elements.claudeSpeed;
    if (speedLabel) speedLabel.textContent = speed;

    // Estimate costs
    const modelRates = PRICING[model] || { input: 0.1, output: 0.4 };
    const inputCost = (actualInputTokens / 1000000) * modelRates.input;
    const outputCost = ((thinkingTokens + outputTokens) / 1000000) * modelRates.output;
    const totalCost = (inputCost + outputCost).toFixed(5);
    const costLabel = provider === 'gemini' ? elements.geminiCost : elements.claudeCost;
    if (costLabel) costLabel.textContent = `$${totalCost}`;

    // Update graphical segmented bar & legends
    const barInput = provider === 'gemini' ? elements.geminiBarInput : elements.claudeBarInput;
    const barThinking = provider === 'gemini' ? elements.geminiBarThinking : elements.claudeBarThinking;
    const barOutput = provider === 'gemini' ? elements.geminiBarOutput : elements.claudeBarOutput;

    const legendInput = provider === 'gemini' ? elements.geminiLegendInput : elements.claudeLegendInput;
    const legendThinking = provider === 'gemini' ? elements.geminiLegendThinking : elements.claudeLegendThinking;
    const legendOutput = provider === 'gemini' ? elements.geminiLegendOutput : elements.claudeLegendOutput;

    if (legendInput) legendInput.textContent = actualInputTokens;
    if (legendThinking) legendThinking.textContent = thinkingTokens;
    if (legendOutput) legendOutput.textContent = outputTokens;

    const totalBarTokens = actualInputTokens + thinkingTokens + outputTokens;
    if (totalBarTokens > 0 && barInput && barThinking && barOutput) {
      const inPct = (actualInputTokens / totalBarTokens) * 100;
      const thinkPct = (thinkingTokens / totalBarTokens) * 100;
      const outPct = (outputTokens / totalBarTokens) * 100;

      barInput.style.width = `${inPct}%`;
      barThinking.style.width = `${thinkPct}%`;
      barOutput.style.width = `${outPct}%`;
    }
  }

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider,
        model: model,
        prompt: prompt,
        systemPrompt: sysPrompt,
        temperature: temp,
        maxTokens: maxTokens,
        sandboxMode: isSandbox,
        config: config
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    // Stream reading loop
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunkStr = decoder.decode(value, { stream: !done });
        // Server sends Server-Sent Events (SSE). Chunk format:
        // data: {"text": "something"} \n\n
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.done) {
                // Done event
                done = true;
                break;
              }
              
              if (parsed.usageMetadata) {
                if (parsed.usageMetadata.promptTokenCount !== undefined) {
                  actualInputTokens = parsed.usageMetadata.promptTokenCount;
                }
                if (parsed.usageMetadata.candidatesTokenCount !== undefined) {
                  const rawThinking = parsed.usageMetadata.candidatesTokenDetails?.[0]?.thinkingTokenCount || 0;
                  thinkingTokens = rawThinking;
                  outputTokens = parsed.usageMetadata.candidatesTokenCount - rawThinking;
                }
                updateResponseUI();
              } else if (parsed.text !== undefined) {
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  const ttftMs = (performance.now() - startTime).toFixed(0);
                  const ttftLabel = provider === 'gemini' ? elements.geminiTtft : elements.claudeTtft;
                  if (ttftLabel) ttftLabel.textContent = `${ttftMs} ms`;
                }

                if (parsed.thinking) {
                  thinkingText += parsed.text;
                  thinkingTokens = Math.ceil(thinkingText.length / 4);
                } else {
                  outputText += parsed.text;
                  outputTokens = Math.ceil(outputText.length / 4);
                }
                updateResponseUI();
              }
            } catch(e) {
              // Ignore split JSON lines across TCP packets
            }
          }
        }
      }
    }

  } catch (err) {
    let errMsg = err.message;
    let errorHTML = `<span style="color: var(--color-danger); font-weight:600;">⚠️ Error Stream Interrupted:</span><br><span class="mono-font">${errMsg}</span>`;
    
    // Check if it is a 404/access error for Claude or partner models
    const errMsgLower = errMsg.toLowerCase();
    if (errMsgLower.includes('not found') && errMsgLower.includes('project does not have access') && errMsgLower.includes('anthropic')) {
      const activeProjId = elements.gcpProjectId.value.trim() || 'mokabir-project-argolis';
      const isHaiku = model.includes('haiku');
      const targetModelTitle = isHaiku ? 'Claude Haiku 4.5' : 'Claude 3.5 Sonnet';
      const targetModelSearch = isHaiku ? 'Claude Haiku 4.5' : 'Claude 3.5 Sonnet';
      
      errorHTML += `
        <div class="error-troubleshooting-box" style="margin-top: 15px; padding: 15px; border-left: 4px solid var(--color-claude, #e05a47); background: rgba(224, 90, 71, 0.08); border-radius: 8px;">
          <h4 style="color: var(--color-claude, #e05a47); margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            💡 Partner Model Activation Required in Google Cloud
          </h4>
          <p style="margin: 0 0 10px 0; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary, #b4bcd0);">
            Anthropic models are third-party partner models on Google Cloud. Unlike Gemini, they <strong>must</strong> be explicitly enabled on a per-project basis in the <strong>Vertex AI Model Garden</strong>. If the terms of service are not accepted or enabled, Google Cloud returns a <code>404 NOT_FOUND</code> error.
          </p>
          <div style="font-size: 0.82rem; margin: 0; padding-left: 15px; color: var(--text-primary, #e2e8f0); line-height: 1.5;">
            <div style="margin-bottom: 8px;">
              <strong>1. Open Google Cloud Console:</strong><br>
              Go to the <a href="https://console.cloud.google.com/vertex-ai/model-garden?project=${activeProjId}" target="_blank" style="color: #ff8b75; text-decoration: underline; font-weight: 600;">Vertex AI Model Garden for "${activeProjId}"</a>.
            </div>
            <div style="margin-bottom: 8px;">
              <strong>2. Locate & Select Model:</strong><br>
              Search for <strong>"${targetModelSearch}"</strong> and click the card.
            </div>
            <div style="margin-bottom: 8px;">
              <strong>3. Accept Terms & Enable:</strong><br>
              Click the <strong>Enable</strong> (or <strong>Agree</strong>) button on the model detail page to accept the third-party terms for <strong>${targetModelTitle}</strong>.
            </div>
            <div>
              <strong>4. Enable Commerce Procurement API:</strong><br>
              Ensure the <a href="https://console.cloud.google.com/apis/library/cloudcommerceconsumerprocurement.googleapis.com?project=${activeProjId}" target="_blank" style="color: #ff8b75; text-decoration: underline; font-weight: 600;">Cloud Commerce Consumer Procurement API</a> is enabled (required by Google Cloud to bill partner models).
            </div>
          </div>
        </div>
      `;
    }
    responseBubble.innerHTML = errorHTML;
  } finally {
    responseBubble.classList.remove('streaming-token');
  }
}

// Form Submission Orchestration
elements.promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const prompt = elements.promptInput.value.trim();
  if (!prompt) return;

  // Clear input box
  elements.promptInput.value = '';

  // Resize prompt textarea back to default height
  elements.promptInput.style.height = '48px';

  // Fire requests depending on active tabs layout selection
  if (currentLayout === 'compare') {
    // Concurrent dual-execution stream
    streamModel('gemini', prompt);
    streamModel('claude', prompt);
  } else if (currentLayout === 'gemini') {
    streamModel('gemini', prompt);
  } else if (currentLayout === 'claude') {
    streamModel('claude', prompt);
  }
});

// Expand/Shrink textarea based on prompt length
elements.promptInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// Support Shift+Enter as newlines, Enter key as submit
elements.promptInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    elements.promptForm.dispatchEvent(new Event('submit'));
  }
});

// ==========================================================================
// INITIAL SETUP ON WINDOW LOAD
// ==========================================================================

async function loadServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const config = await res.json();
    
    // Override or populate with server-side config if local values are empty
    if (config.projectId) {
      if (!localStorage.getItem('gcp_project_id')) {
        elements.gcpProjectId.value = config.projectId;
      }
    }
    if (config.region) {
      if (!localStorage.getItem('gcp_region')) {
        elements.gcpRegion.value = config.region;
      }
    }
    
    // Auth type fallback
    if (config.authType && !localStorage.getItem('gcp_auth_type')) {
      for (const radio of elements.authMethodRadio) {
        if (radio.value === config.authType) {
          radio.checked = true;
          break;
        }
      }
      toggleAuthForms(config.authType);
    }

    // Set placeholders for credentials loaded on server
    if (config.hasAccessToken) {
      if (!localStorage.getItem('gcp_access_token')) {
        elements.gcpAccessToken.placeholder = "• • • • • (Loaded from Server .env)";
      }
    }
    if (config.hasServiceAccount) {
      if (!localStorage.getItem('gcp_sa_key')) {
        elements.gcpSaKey.placeholder = "• • • • • (Loaded from Server Service Account)";
      }
    }

    // Sandbox toggle
    if (config.sandboxMode === false) {
      elements.sandboxCheckbox.checked = false;
      elements.sandboxCheckbox.dispatchEvent(new Event('change'));
    }
  } catch (err) {
    console.error('Failed to load server configuration:', err);
  }
}

window.addEventListener('load', async () => {
  loadSavedCredentials();
  await loadServerConfig();
});

