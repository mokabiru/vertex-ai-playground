/* ==========================================================================
   APP FRONTEND CONTROLLER
   ========================================================================== */

const PRICING = {
  // Input cost per 1M tokens, Output cost per 1M tokens
  'gemini-1.5-flash-001': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro-001': { input: 1.25, output: 5.00 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-3.5-flash': { input: 1.50, output: 9.00 },
  'gemini-3.1-flash-lite': { input: 0.0375, output: 0.15 },
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-opus-4-7': { input: 5.00, output: 25.00 },
  'claude-haiku-4-5@20251001': { input: 1.00, output: 5.00 },
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
  benchmarkPills: document.querySelectorAll('.benchmark-pill'),
  benchmarkPromptsList: document.getElementById('benchmark-prompts-list'),
  
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

  // Gemini Thinking controls
  geminiThinkingContainer: document.getElementById('gemini-thinking-container'),
  geminiThinkingSelect: document.getElementById('gemini-thinking-select'),
  geminiThinkingBadge: document.getElementById('gemini-thinking-badge'),
  thinkingBudgetSliderWrapper: document.getElementById('thinking-budget-slider-wrapper'),
  thinkingBudgetSlider: document.getElementById('gemini-thinking-budget'),
  thinkingBudgetVal: document.getElementById('thinking-budget-val'),
};

// --- Active Layout State ---
let currentLayout = 'compare'; // 'compare', 'gemini', 'claude'
let savedUserTemperature = 1.0;
let temperatureSliderLocked = false;

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
  if (!temperatureSliderLocked) {
    savedUserTemperature = parseFloat(e.target.value);
  }
  elements.tempVal.textContent = e.target.value;
});
elements.tokensSlider.addEventListener('input', (e) => {
  elements.tokensVal.textContent = e.target.value;
});

// --- Gemini Thinking Configurations ---
function updateThinkingConfigPanel() {
  const model = elements.geminiModelSelect.value;
  const select = elements.geminiThinkingSelect;
  const badge = elements.geminiThinkingBadge;
  const sliderWrapper = elements.thinkingBudgetSliderWrapper;
  const container = elements.geminiThinkingContainer;

  if (!container || !select) return;

  // Reset container state
  container.classList.remove('disabled');
  select.disabled = false;

  // Check model capability
  if (model.includes('gemini-3.5')) {
    // Gemini 3.5 supports Thinking Levels
    badge.textContent = 'G3.5 Mode';
    badge.title = 'Gemini 3.5+ models configure thinking via levels';
    
    // Save previous selection if it is a level
    const prevVal = select.value;
    select.innerHTML = `
      <option value="HIGH">HIGH (Deep Reasoning - Default)</option>
      <option value="MEDIUM">MEDIUM (Balanced Speed & Logic)</option>
      <option value="LOW">LOW (Fast, Basic Reasoning)</option>
      <option value="MINIMAL">MINIMAL (Lowest latency/overhead)</option>
    `;
    
    if (['HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].includes(prevVal)) {
      select.value = prevVal;
    } else {
      select.value = 'HIGH';
    }
    
    sliderWrapper.style.display = 'none';
  } else if (model.includes('gemini-2.5')) {
    // Gemini 2.5 supports Thinking Budget
    badge.textContent = 'G2.5 Mode';
    badge.title = 'Gemini 2.5 models configure thinking via token budgets';
    
    const prevVal = select.value;
    select.innerHTML = `
      <option value="DYNAMIC">DYNAMIC (Auto-budget - Default)</option>
      <option value="OFF">OFF (Disable Thinking)</option>
      <option value="CUSTOM">CUSTOM (Define token budget slider)</option>
    `;
    
    if (['DYNAMIC', 'OFF', 'CUSTOM'].includes(prevVal)) {
      select.value = prevVal;
    } else {
      select.value = 'DYNAMIC';
    }
    
    toggleBudgetSlider(select.value);
  } else {
    // Other models (e.g. gemini-2.0-flash) do not support thinking configuration
    badge.textContent = 'Unsupported';
    badge.title = 'This Gemini model does not support thinking configuration';
    
    select.innerHTML = `
      <option value="UNSUPPORTED">Disabled for this model</option>
    `;
    select.value = 'UNSUPPORTED';
    select.disabled = true;
    container.classList.add('disabled');
    sliderWrapper.style.display = 'none';
  }
}

function toggleBudgetSlider(mode) {
  const sliderWrapper = elements.thinkingBudgetSliderWrapper;
  if (!sliderWrapper) return;
  if (mode === 'CUSTOM') {
    sliderWrapper.style.display = 'block';
  } else {
    sliderWrapper.style.display = 'none';
  }
}

// Listen to thinking selection changes
elements.geminiThinkingSelect.addEventListener('change', (e) => {
  toggleBudgetSlider(e.target.value);
});

// Sync budget slider digital display
elements.thinkingBudgetSlider.addEventListener('input', (e) => {
  elements.thinkingBudgetVal.textContent = e.target.value;
});

// Connect to Gemini model change event
elements.geminiModelSelect.addEventListener('change', () => {
  updateThinkingConfigPanel();
  updateModelPriceTags();
});

// --- Claude Thinking Temperature Dynamic UI ---
function updateTemperatureUI() {
  const noteEl = document.getElementById('temp-info-note');
  const textEl = document.getElementById('temp-info-text');
  if (!noteEl || !textEl) return;

  const isClaudeThinking = (elements.claudeModelSelect.value.includes('claude-sonnet-4-6') || elements.claudeModelSelect.value.includes('claude-opus-4-7'));

  if (isClaudeThinking && (currentLayout === 'claude' || currentLayout === 'compare')) {
    noteEl.style.display = 'flex';
    if (currentLayout === 'compare') {
      textEl.textContent = 'Claude Thinking is active: its temperature will be auto-set to 1.0 (sampling parameters omitted). Selected temperature still applies to Gemini.';
      
      // If we are in split/compare layout, the temperature slider is shared and should remain enabled for Gemini
      if (temperatureSliderLocked) {
        elements.tempSlider.disabled = false;
        elements.tempSlider.value = savedUserTemperature;
        elements.tempVal.textContent = savedUserTemperature;
        temperatureSliderLocked = false;
      }
    } else {
      textEl.textContent = 'Claude Thinking is active: temperature is auto-set to 1.0 (sampling parameters omitted) to prevent API errors.';
      
      // In single Claude layout, we can lock/disable the slider and auto-set it to 1.0 to show it is auto-managed
      if (!temperatureSliderLocked) {
        savedUserTemperature = parseFloat(elements.tempSlider.value);
        temperatureSliderLocked = true;
      }
      elements.tempSlider.value = 1.0;
      elements.tempVal.textContent = '1.0 (OMITTED)';
      elements.tempSlider.disabled = true;
    }
  } else {
    noteEl.style.display = 'none';
    
    // Unlock and restore previous temperature
    if (temperatureSliderLocked) {
      elements.tempSlider.disabled = false;
      elements.tempSlider.value = savedUserTemperature;
      elements.tempVal.textContent = savedUserTemperature;
      temperatureSliderLocked = false;
    }
  }
}

// Dynamic Model Pricing UI Update
function updateModelPriceTags() {
  const geminiModel = elements.geminiModelSelect.value;
  const claudeModel = elements.claudeModelSelect.value;

  const geminiPriceEl = document.getElementById('gemini-model-price');
  const claudePriceEl = document.getElementById('claude-model-price');

  if (geminiPriceEl) {
    const rate = PRICING[geminiModel];
    if (rate) {
      geminiPriceEl.innerHTML = `In: <strong>$${rate.input.toFixed(2)}</strong>/1M &nbsp;|&nbsp; Out: <strong>$${rate.output.toFixed(2)}</strong>/1M`;
    } else {
      geminiPriceEl.innerHTML = 'Rates unlisted';
    }
  }

  if (claudePriceEl) {
    const rate = PRICING[claudeModel];
    if (rate) {
      claudePriceEl.innerHTML = `In: <strong>$${rate.input.toFixed(2)}</strong>/1M &nbsp;|&nbsp; Out: <strong>$${rate.output.toFixed(2)}</strong>/1M`;
    } else {
      claudePriceEl.innerHTML = 'Rates unlisted';
    }
  }
}

// Connect to Claude model change event
elements.claudeModelSelect.addEventListener('change', () => {
  updateTemperatureUI();
  updateModelPriceTags();
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
  updateTemperatureUI();
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
  const estimatedInputTokens = Math.ceil((prompt.length + sysPrompt.length) / 4);
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
        config: config,
        geminiThinking: {
          mode: elements.geminiThinkingSelect ? elements.geminiThinkingSelect.value : 'HIGH',
          budget: elements.thinkingBudgetSlider ? parseInt(elements.thinkingBudgetSlider.value) : 1024
        }
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

// --- Benchmark Datasets / Prompts ---
const BENCHMARK_DATA = {
  hellaswag: [
    {
      title: "Wood Stain Prep",
      preview: "What is the most logical next step after sanding a wooden board...",
      prompt: "A person is preparing to stain a piece of wood. They have sanded the board down to a smooth finish and wiped away all the dust. They have the wood, the can of stain, and a brush. What is the most logical next physical action they should take to ensure an even stain application?"
    },
    {
      title: "Whipping Cream",
      preview: "Whipping heavy cream by hand in a cold metal bowl...",
      prompt: "A person is making whipped cream by hand. They pour heavy whipping cream into a metal bowl that has been pre-chilled in the freezer. What is the most logical next step to whip the cream effectively to stiff peaks?"
    },
    {
      title: "Tomato Gardener",
      preview: "Watering and nurturing newly sprouted tomato seeds in rich soil...",
      prompt: "A gardener wants to grow healthy tomato plants. They have planted seeds in rich soil inside individual starter pots and watered them thoroughly. What is the most logical next sequence of physical actions to ensure successful germination and seedling growth?"
    },
    {
      title: "Flat Tire Replacement",
      preview: "Retrieving spare parts and logical jack placement on roadside...",
      prompt: "A driver pulls over on the highway with a flat tire. They open the trunk, take out the spare tire, the jack, and the lug wrench. Before raising the vehicle with the jack, what is the most logical next physical safety action they must perform?"
    },
    {
      title: "Drip Coffee Making",
      preview: "Prepping filter basket and water reservoir sequentially...",
      prompt: "A person wants to make fresh drip coffee in a standard coffee maker. They have placed a paper filter into the basket and added ground coffee. What is the most logical next physical action to complete the preparation before turning the machine on?"
    },
    {
      title: "Hanging a Painting",
      preview: "Locating wall studs and inserting heavy nail anchor safely...",
      prompt: "A person wants to hang a heavy framed painting on drywalled wood studs. They have selected the wall spot, located a wooden wall stud using a stud finder, and have a hammer and a sturdy nail. What is the most logical next physical action to secure the painting safely?"
    }
  ],
  swebench: [
    {
      title: "Relative Imports",
      preview: "Resolve sibling package ModuleNotFoundError in a python project structure...",
      prompt: "Debug a relative import issue in a Python project where importing from a sibling package fails with 'ModuleNotFoundError: No module named...'. Show the standard directory structure and how to structure the __init__.py files or run command to resolve it correctly."
    },
    {
      title: "Memory Leak",
      preview: "Analyze and repair a memory leak in a Node.js stream caching system...",
      prompt: "Analyze and fix a memory leak in a Node.js custom stream pipeline. The pipeline uses circular buffers for caching chunks but fails to release references properly, causing Heap Out Of Memory. Show the implementation of a memory-efficient circular buffer class."
    },
    {
      title: "Dependency Cycles",
      preview: "Algorithm to detect cyclic dependencies in package managers...",
      prompt: "Write a high-performance algorithm in JavaScript to detect cyclic dependencies in a large-scale software package management system. Given a list of packages and their dependencies, find and output all circular dependency paths using a depth-first search (DFS) with node coloring."
    },
    {
      title: "SQL Optimization",
      preview: "Analyze and optimize a multi-join query with GROUP BY on 10M rows...",
      prompt: "Analyze and optimize a slow PostgreSQL query containing multiple JOINs, a GROUP BY, and a subquery. The query takes over 5 seconds on a table of 10M rows. Explain the index strategy and how to rewrite it using proper CTEs or window functions."
    },
    {
      title: "React Hydration Fail",
      preview: "Debug and repair client-server markup mismatch in Next.js SSR...",
      prompt: "Debug a Next.js / React SSR mismatch error where the client outputs 'Hydration failed because the initial UI does not match what was rendered on the server'. Show the exact patterns (such as dynamic date/time or window size references) causing the bug and how to fix them."
    },
    {
      title: "Express Race Condition",
      preview: "Implement OCC in MongoDB to safeguard wallet balance in parallel requests...",
      prompt: "Identify and resolve a race condition in a high-concurrency Node.js Express endpoint that increments a user's wallet balance in MongoDB. Show the database transaction implementation using optimistic concurrency control (OCC) with version attributes."
    }
  ],
  ifeval: [
    {
      title: "Renewable Energy",
      preview: "Evaluate renewable energy in three paragraphs, omitting 'e' in the third...",
      prompt: "Write a three-paragraph evaluation comparing solar and wind energy. Each paragraph must be exactly 3 sentences long. In the third paragraph, you are completely prohibited from using the letter 'e' anywhere in any of the words."
    },
    {
      title: "AI Synergy Pitch",
      preview: "150-word synergistic AI pitch with exactly 3 bullets...",
      prompt: "Write a pitch about 'AI Synergy Platforms' that is exactly 150 words long. The pitch must contain exactly 3 bullet points, each starting with an action verb, and must conclude with a single sentence call to action."
    },
    {
      title: "Quantum Explanation",
      preview: "Explain quantum computing without forbidden terms like 'physics'...",
      prompt: "Explain the concept of quantum computing to a high school student in exactly two paragraphs. You are strictly forbidden from using any of the following words anywhere in your explanation: 'physics', 'mechanics', 'computer', 'science', 'math'."
    },
    {
      title: "Public-Key Cryptography",
      preview: "Explain cryptography without using the words 'key' or 'lock'...",
      prompt: "Write an email draft describing public-key cryptography to a colleague. The email must contain exactly two bullet points, use at least 3 uppercase acronyms (e.g. RSA, SSL), and must NOT use the words 'key' or 'lock' anywhere in the message."
    },
    {
      title: "Paris Itinerary",
      preview: "3-day travel itinerary with exact word count and sentence rules...",
      prompt: "Create a 3-day travel itinerary for Paris. Each day must be summarized in exactly one paragraph. The word count of the entire response must be between 180 and 220 words. No sentence in the entire response can start with the letter 'P' or 'T'."
    },
    {
      title: "Python Spec Code",
      preview: "Write clean dictionary-merging function with strict docstring constraints...",
      prompt: "Write a Python function to merge two dictionaries. The entire response must be written in a single code block. The code must include a docstring that contains the word 'antigravity' at least twice, and must not contain any inline comments (starting with #)."
    }
  ]
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderBenchmarkPrompts(category) {
  if (!elements.benchmarkPromptsList) return;
  elements.benchmarkPromptsList.innerHTML = '';
  
  const prompts = BENCHMARK_DATA[category] || [];
  prompts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'benchmark-prompt-card';
    card.setAttribute('data-prompt', p.prompt);
    
    card.innerHTML = `
      <div class="benchmark-prompt-title">${escapeHtml(p.title)}</div>
      <div class="benchmark-prompt-preview">${escapeHtml(p.preview)}</div>
    `;
    
    card.addEventListener('click', () => {
      elements.promptInput.value = p.prompt;
      
      // Auto-resize the textarea
      elements.promptInput.dispatchEvent(new Event('input'));
      elements.promptInput.focus();
      
      // Tactile visual feedback (pulse glow)
      elements.promptInput.classList.remove('pulse-highlight');
      // Trigger reflow to restart animation
      void elements.promptInput.offsetWidth;
      elements.promptInput.classList.add('pulse-highlight');
      
      setTimeout(() => {
        elements.promptInput.classList.remove('pulse-highlight');
      }, 800);
    });
    
    elements.benchmarkPromptsList.appendChild(card);
  });
}

function initBenchmarks() {
  if (!elements.benchmarkPills) return;
  
  elements.benchmarkPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.benchmarkPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      const category = pill.getAttribute('data-benchmark');
      renderBenchmarkPrompts(category);
    });
  });
  
  // Render default benchmark on load
  renderBenchmarkPrompts('hellaswag');
}

window.addEventListener('load', async () => {
  loadSavedCredentials();
  await loadServerConfig();
  updateThinkingConfigPanel();
  updateTemperatureUI();
  updateModelPriceTags();
  initBenchmarks();
});


