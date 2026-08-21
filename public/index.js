/* ==========================================================================
   GEMINI & MULTI-MODEL ARENA CONTROLLER
   ========================================================================== */

const PRICING = {
  // Input cost per 1M tokens, Output cost per 1M tokens ($)
  'gemini-3.7-flash': { input: 0.075, output: 0.30 },
  'gemini-3.6-flash': { input: 0.075, output: 0.30 },
  'gemini-3.5-flash': { input: 0.075, output: 0.30 },
  'gemini-3.0-flash': { input: 0.075, output: 0.30 },
  'gemini-3-flash': { input: 0.075, output: 0.30 },
  'gemini-3.0-pro': { input: 1.25, output: 5.00 },
  'gemini-3-pro': { input: 1.25, output: 5.00 },
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-flash-lite': { input: 0.0375, output: 0.15 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-lite': { input: 0.0375, output: 0.15 },
  'gemini-2.0-pro-exp-02-05': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-opus-4-7': { input: 5.00, output: 25.00 },
  'claude-haiku-4-5@20251001': { input: 1.00, output: 5.00 },
  'claude-3-5-sonnet@20241022': { input: 3.00, output: 15.00 }
};

const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-3.7-flash', text: 'gemini-3.7-flash (Hybrid Reasoning Default)' },
    { value: 'gemini-3.6-flash', text: 'gemini-3.6-flash (3.x Series)' },
    { value: 'gemini-3.5-flash', text: 'gemini-3.5-flash (3.5 Preview)' },
    { value: 'gemini-3.0-flash', text: 'gemini-3.0-flash (3.0 Flash)' },
    { value: 'gemini-3.0-pro', text: 'gemini-3.0-pro (3.0 Pro)' },
    { value: 'gemini-2.5-pro', text: 'gemini-2.5-pro (SOTA Reasoning & Coding)' },
    { value: 'gemini-2.5-flash', text: 'gemini-2.5-flash (Fast Thinking Workhorse)' },
    { value: 'gemini-2.5-flash-lite', text: 'gemini-2.5-flash-lite (Ultra Low Latency)' },
    { value: 'gemini-2.0-flash', text: 'gemini-2.0-flash (High Throughput)' },
    { value: 'gemini-2.0-flash-lite', text: 'gemini-2.0-flash-lite (Lightweight)' },
    { value: 'gemini-2.0-pro-exp-02-05', text: 'gemini-2.0-pro-exp-02-05 (Experimental Pro)' },
    { value: 'gemini-1.5-pro', text: 'gemini-1.5-pro (2M Context Flagship)' },
    { value: 'gemini-1.5-flash', text: 'gemini-1.5-flash (Legacy Fast)' },
    { value: 'custom', text: '⚡ Custom Model ID...' }
  ],
  claude: [
    { value: 'claude-sonnet-4-6', text: 'claude-sonnet-4-6 (Latest Sonnet)' },
    { value: 'claude-opus-4-7', text: 'claude-opus-4-7 (Flagship Opus)' },
    { value: 'claude-haiku-4-5@20251001', text: 'claude-haiku-4-5 (Speed/Cost)' },
    { value: 'claude-3-5-sonnet@20241022', text: 'claude-3-5-sonnet-v2 (Legacy)' },
    { value: 'custom', text: '⚡ Custom Model ID...' }
  ]
};

// System prompt presets
const SYSTEM_PRESETS = {
  coder: "You are an elite principal software engineer and systems architect. Provide highly optimized, correct, idiomatic code with robust error handling and clean architecture. Explain trade-offs concisely.",
  analyst: "You are an executive technology analyst. Deliver concise, high-density structured summaries using crisp bullet points, key takeaways, and quantitative comparisons. Avoid unnecessary fluff.",
  math: "You are a rigorous mathematical reasoning engine. Provide formal, step-by-step proofs and derivations, verifying edge cases and domain constraints thoroughly before concluding with the final answer.",
  json: "You are an automated API backend that outputs ONLY strictly valid RFC-8259 JSON matching user specifications. Do NOT wrap output in markdown fences or include conversational commentary."
};

// --- DOM References ---
const elements = {
  // Theme Buttons
  themeBtnDark: document.getElementById('theme-btn-dark'),
  themeBtnOled: document.getElementById('theme-btn-oled'),
  themeBtnLight: document.getElementById('theme-btn-light'),

  // General UI
  sandboxCheckbox: document.getElementById('sandbox-checkbox'),
  sandboxBadge: document.getElementById('sandbox-badge'),
  toast: document.getElementById('toast'),
  
  // Settings Sliders
  systemPrompt: document.getElementById('system-prompt'),
  sysPromptPresets: document.getElementById('sys-prompt-presets'),
  tempSlider: document.getElementById('param-temp'),
  tempVal: document.getElementById('temp-val'),
  topPSlider: document.getElementById('param-topp'),
  topPVal: document.getElementById('topp-val'),
  topKSlider: document.getElementById('param-topk'),
  topKVal: document.getElementById('topk-val'),
  tokensSlider: document.getElementById('param-tokens'),
  tokensVal: document.getElementById('tokens-val'),
  responseMimeSelect: document.getElementById('param-response-mime'),
  
  // Arena Layout Tabs
  tabCompare: document.getElementById('tab-compare'),
  tabGemini: document.getElementById('tab-gemini'),
  tabClaude: document.getElementById('tab-claude'),
  tabAnalytics: document.getElementById('tab-analytics'),
  arenaGrid: document.getElementById('arena-grid'),
  analyticsPanel: document.getElementById('analytics-panel'),
  
  // Provider Selectors
  paneAProviderSelect: document.getElementById('pane-a-provider-select'),
  paneBProviderSelect: document.getElementById('pane-b-provider-select'),
  
  // Model Selectors
  geminiModelSelect: document.getElementById('gemini-model-select'),
  geminiCustomModelInput: document.getElementById('gemini-custom-model-input'),
  claudeModelSelect: document.getElementById('claude-model-select'),
  claudeCustomModelInput: document.getElementById('claude-custom-model-input'),
  
  // Consoles
  geminiConsole: document.getElementById('gemini-console'),
  claudeConsole: document.getElementById('claude-console'),
  
  // Prompt Input Forms
  promptForm: document.getElementById('prompt-form'),
  promptInput: document.getElementById('prompt-input'),
  btnSubmitPrompt: document.getElementById('btn-submit-prompt'),
  btnClearArena: document.getElementById('btn-clear-arena'),
  btnRunAllSuite: document.getElementById('btn-run-all-suite'),
  benchmarkPills: document.querySelectorAll('.benchmark-pill'),
  benchmarkPromptsList: document.getElementById('benchmark-prompts-list'),
  
  // Config Modal Elements
  configDialog: document.getElementById('config-dialog'),
  btnOpenConfig: document.getElementById('btn-open-config'),
  btnOpenSuite: document.getElementById('btn-open-suite'),
  btnCloseConfig: document.getElementById('btn-close-config'),
  btnSaveConfig: document.getElementById('btn-save-config'),
  btnClearConfig: document.getElementById('btn-clear-config'),
  geminiApiKey: document.getElementById('gemini-api-key'),
  gcpProjectId: document.getElementById('gcp-project-id'),
  gcpRegion: document.getElementById('gcp-region'),
  gcpAccessToken: document.getElementById('gcp-access-token'),
  gcpSaKey: document.getElementById('gcp-sa-key'),
  authMethodRadio: document.getElementsByName('auth-method'),
  authBoxApikey: document.getElementById('auth-box-apikey'),
  authBoxVertexFields: document.getElementById('auth-box-vertex-fields'),
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

  // Segmented Breakdown
  geminiBarInput: document.getElementById('gemini-bar-input'),
  geminiBarThinking: document.getElementById('gemini-bar-thinking'),
  geminiBarOutput: document.getElementById('gemini-bar-output'),
  geminiLegendInput: document.getElementById('gemini-legend-input'),
  geminiLegendThinking: document.getElementById('gemini-legend-thinking'),
  geminiLegendOutput: document.getElementById('gemini-legend-output'),

  claudeBarInput: document.getElementById('claude-bar-input'),
  claudeBarThinking: document.getElementById('claude-bar-thinking'),
  claudeBarOutput: document.getElementById('claude-bar-output'),
  claudeLegendInput: document.getElementById('claude-legend-input'),
  claudeLegendThinking: document.getElementById('claude-legend-thinking'),
  claudeLegendOutput: document.getElementById('claude-legend-output'),

  // Thinking controls
  geminiThinkingContainer: document.getElementById('gemini-thinking-container'),
  geminiThinkingSelect: document.getElementById('gemini-thinking-select'),
  geminiThinkingBadge: document.getElementById('gemini-thinking-badge'),
  thinkingBudgetSliderWrapper: document.getElementById('thinking-budget-slider-wrapper'),
  thinkingBudgetSlider: document.getElementById('gemini-thinking-budget'),
  thinkingBudgetVal: document.getElementById('thinking-budget-val'),

  claudeThinkingContainer: document.getElementById('claude-thinking-container'),
  claudeThinkingSelect: document.getElementById('claude-thinking-select'),
  claudeThinkingBadge: document.getElementById('claude-thinking-badge'),
  claudeThinkingBudgetSliderWrapper: document.getElementById('claude-thinking-budget-slider-wrapper'),
  claudeThinkingBudgetSlider: document.getElementById('claude-thinking-budget'),
  claudeThinkingBudgetVal: document.getElementById('claude-thinking-budget-val'),

  // Scorecard & Analytics
  scorecardTitleA: document.getElementById('scorecard-title-a'),
  scorecardTtftA: document.getElementById('scorecard-ttft-a'),
  scorecardSpeedA: document.getElementById('scorecard-speed-a'),
  scorecardThinkA: document.getElementById('scorecard-think-a'),
  scorecardOutA: document.getElementById('scorecard-out-a'),
  scorecardCostA: document.getElementById('scorecard-cost-a'),

  scorecardTitleB: document.getElementById('scorecard-title-b'),
  scorecardTtftB: document.getElementById('scorecard-ttft-b'),
  scorecardSpeedB: document.getElementById('scorecard-speed-b'),
  scorecardThinkB: document.getElementById('scorecard-think-b'),
  scorecardOutB: document.getElementById('scorecard-out-b'),
  scorecardCostB: document.getElementById('scorecard-cost-b'),

  scorecardVerdictText: document.getElementById('scorecard-verdict-text'),
  scorecardDeltasText: document.getElementById('scorecard-deltas-text'),

  btnExportMd: document.getElementById('btn-export-md'),
  btnExportJson: document.getElementById('btn-export-json'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  telemetryCanvas: document.getElementById('telemetry-canvas'),
  chartLegendA: document.getElementById('chart-legend-a'),
  chartLegendB: document.getElementById('chart-legend-b')
};

// --- Active Layout & Telemetry State ---
let currentLayout = 'compare'; // 'compare', 'gemini', 'claude', 'analytics'
let savedUserTemperature = 0.7;
let isRunningBatch = false;

// History of telemetry data points for live canvas chart
const telemetryHistory = {
  a: [],
  b: []
};

// Summary metrics of the latest duel run
let lastDuelResult = {
  prompt: '',
  modelA: '',
  modelB: '',
  ttftA: 0,
  ttftB: 0,
  speedA: 0,
  speedB: 0,
  thinkA: 0,
  thinkB: 0,
  outA: 0,
  outB: 0,
  costA: 0,
  costB: 0,
  timestamp: new Date()
};

// ==========================================================================
// THEME MANAGEMENT
// ==========================================================================
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('arena_theme', theme);

  elements.themeBtnDark.classList.toggle('active', theme === 'dark');
  elements.themeBtnOled.classList.toggle('active', theme === 'oled');
  elements.themeBtnLight.classList.toggle('active', theme === 'light');

  // Redraw telemetry chart if canvas exists
  if (typeof renderTelemetryChart === 'function') {
    renderTelemetryChart();
  }
}
window.setTheme = setTheme;

function initTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  const saved = themeParam || localStorage.getItem('arena_theme') || 'dark';
  setTheme(saved);

  elements.themeBtnDark.addEventListener('click', () => setTheme('dark'));
  elements.themeBtnOled.addEventListener('click', () => setTheme('oled'));
  elements.themeBtnLight.addEventListener('click', () => setTheme('light'));
}

// ==========================================================================
// CREDENTIAL STORAGE AND RETRIEVAL
// ==========================================================================
function loadSavedCredentials() {
  elements.geminiApiKey.value = localStorage.getItem('gemini_api_key') || '';
  elements.gcpProjectId.value = localStorage.getItem('gcp_project_id') || '';
  elements.gcpRegion.value = localStorage.getItem('gcp_region') || 'us-central1';
  elements.gcpAccessToken.value = localStorage.getItem('gcp_access_token') || '';
  elements.gcpSaKey.value = localStorage.getItem('gcp_sa_key') || '';
  
  const savedAuthType = localStorage.getItem('gcp_auth_type') || (elements.geminiApiKey.value ? 'apiKey' : 'apiKey');
  for (const radio of elements.authMethodRadio) {
    if (radio.value === savedAuthType) {
      radio.checked = true;
      break;
    }
  }
  toggleAuthForms(savedAuthType);
}

function saveCredentials() {
  localStorage.setItem('gemini_api_key', elements.geminiApiKey.value.trim());
  localStorage.setItem('gcp_project_id', elements.gcpProjectId.value.trim());
  localStorage.setItem('gcp_region', elements.gcpRegion.value);
  localStorage.setItem('gcp_access_token', elements.gcpAccessToken.value.trim());
  localStorage.setItem('gcp_sa_key', elements.gcpSaKey.value.trim());
  
  let checkedType = 'apiKey';
  for (const radio of elements.authMethodRadio) {
    if (radio.checked) {
      checkedType = radio.value;
      break;
    }
  }
  localStorage.setItem('gcp_auth_type', checkedType);
  showToast('Authentication settings saved locally!');
  elements.configDialog.close();
}

function clearCredentials() {
  localStorage.removeItem('gemini_api_key');
  localStorage.removeItem('gcp_project_id');
  localStorage.removeItem('gcp_region');
  localStorage.removeItem('gcp_access_token');
  localStorage.removeItem('gcp_sa_key');
  localStorage.removeItem('gcp_auth_type');
  
  elements.geminiApiKey.value = '';
  elements.gcpProjectId.value = '';
  elements.gcpRegion.value = 'us-central1';
  elements.gcpAccessToken.value = '';
  elements.gcpSaKey.value = '';
  elements.authMethodRadio[0].checked = true;
  toggleAuthForms('apiKey');
  showToast('Credentials cleared successfully.');
}

function getCredentialsConfig() {
  let authType = 'apiKey';
  for (const radio of elements.authMethodRadio) {
    if (radio.checked) {
      authType = radio.value;
      break;
    }
  }

  return {
    apiKey: elements.geminiApiKey.value.trim(),
    projectId: elements.gcpProjectId.value.trim(),
    region: elements.gcpRegion.value,
    authType: authType,
    accessToken: elements.gcpAccessToken.value.trim(),
    serviceAccount: elements.gcpSaKey.value.trim()
  };
}

function toggleAuthForms(authType) {
  elements.authBoxApikey.style.display = authType === 'apiKey' ? 'block' : 'none';
  elements.authBoxVertexFields.style.display = authType !== 'apiKey' ? 'grid' : 'none';
  elements.authBoxToken.style.display = authType === 'token' ? 'block' : 'none';
  elements.authBoxSa.style.display = authType === 'serviceAccount' ? 'block' : 'none';
}

// ==========================================================================
// LIGHTWEIGHT MARKDOWN & CODE HIGHLIGHTER
// ==========================================================================
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // Escape html
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Codeblocks with copy button ``` [lang] \n [code] ```
  html = html.replace(/```(\w*)\n([\s\S]*?)(```|$)/g, (match, lang, code) => {
    const cleanLang = (lang || 'code').toLowerCase();
    const encodedCode = encodeURIComponent(code.trim());
    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-lang-tag">${cleanLang}</span>
          <button type="button" class="btn-copy-code" data-code="${encodedCode}" onclick="copySnippet(this)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy</span>
          </button>
        </div>
        <pre><code class="language-${cleanLang}">${code.trim()}</code></pre>
      </div>
    `;
  });

  // 2. Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 3. Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');

  // 4. Bold and Italics
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 5. Bullet Lists
  html = html.replace(/^[\s]*[-*] (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>`);

  // 6. Numbered Lists
  html = html.replace(/^[\s]*\d+\. (.*?)$/gm, '<li>$1</li>');

  // 7. Newlines
  html = html.replace(/\n/g, '<br>');

  return html;
}

window.copySnippet = function(btn) {
  const code = decodeURIComponent(btn.getAttribute('data-code') || '');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      const span = btn.querySelector('span');
      if (span) span.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        if (span) span.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  }
};

window.copyThoughts = function(btn) {
  const text = decodeURIComponent(btn.getAttribute('data-thoughts') || '');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Thinking process copied to clipboard!');
    });
  }
};

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

// Slider Digital Readouts
elements.tempSlider.addEventListener('input', (e) => {
  elements.tempVal.textContent = e.target.value;
});
elements.topPSlider.addEventListener('input', (e) => {
  elements.topPVal.textContent = e.target.value;
});
elements.topKSlider.addEventListener('input', (e) => {
  elements.topKVal.textContent = e.target.value;
});
elements.tokensSlider.addEventListener('input', (e) => {
  elements.tokensVal.textContent = e.target.value;
});
elements.thinkingBudgetSlider.addEventListener('input', (e) => {
  elements.thinkingBudgetVal.textContent = e.target.value;
});
if (elements.claudeThinkingBudgetSlider) {
  elements.claudeThinkingBudgetSlider.addEventListener('input', (e) => {
    elements.claudeThinkingBudgetVal.textContent = e.target.value;
  });
}

// System Prompt Presets
elements.sysPromptPresets.addEventListener('change', (e) => {
  const val = e.target.value;
  if (SYSTEM_PRESETS[val]) {
    elements.systemPrompt.value = SYSTEM_PRESETS[val];
    showToast(`Loaded "${e.target.options[e.target.selectedIndex].text}" preset`);
  }
});

// Populate models dropdown
function populateModels(panel) {
  const providerSelect = panel === 'a' ? elements.paneAProviderSelect : elements.paneBProviderSelect;
  const modelSelect = panel === 'a' ? elements.geminiModelSelect : elements.claudeModelSelect;
  const customInput = panel === 'a' ? elements.geminiCustomModelInput : elements.claudeCustomModelInput;
  const provider = providerSelect.value;
  
  const prevVal = modelSelect.value;
  modelSelect.innerHTML = '';
  
  const models = PROVIDER_MODELS[provider] || [];
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.text;
    modelSelect.appendChild(opt);
  });
  
  const hasPrev = Array.from(modelSelect.options).some(opt => opt.value === prevVal);
  if (hasPrev) {
    modelSelect.value = prevVal;
  } else {
    modelSelect.selectedIndex = 0;
  }

  // Toggle custom model input
  if (customInput) {
    customInput.style.display = modelSelect.value === 'custom' ? 'block' : 'none';
  }
}

// Handle Custom Model Selection
elements.geminiModelSelect.addEventListener('change', (e) => {
  elements.geminiCustomModelInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
  updateThinkingConfigPanel('a');
  updateModelPriceTags();
  updateTabLabels();
});

elements.claudeModelSelect.addEventListener('change', (e) => {
  elements.claudeCustomModelInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
  updateThinkingConfigPanel('b');
  updateModelPriceTags();
  updateTabLabels();
});

// Update Theme / Logos on Provider Change
function updatePanelTheme(panel) {
  const providerSelect = panel === 'a' ? elements.paneAProviderSelect : elements.paneBProviderSelect;
  const provider = providerSelect.value;
  const articleEl = panel === 'a' ? document.getElementById('pane-gemini') : document.getElementById('pane-claude');
  
  if (provider === 'gemini') {
    articleEl.classList.remove('model-pane-claude');
    articleEl.classList.add('model-pane-gemini');
    articleEl.querySelector('.gemini-logo').style.display = 'block';
    articleEl.querySelector('.claude-logo').style.display = 'none';
  } else {
    articleEl.classList.remove('model-pane-gemini');
    articleEl.classList.add('model-pane-claude');
    articleEl.querySelector('.gemini-logo').style.display = 'none';
    articleEl.querySelector('.claude-logo').style.display = 'block';
  }
  
  updateTabLabels();
}

function updateTabLabels() {
  const modelA = getActiveModelName('a');
  document.getElementById('tab-a-label').textContent = `Panel A (${modelA})`;
  const indA = document.getElementById('tab-a-indicator');
  indA.className = elements.paneAProviderSelect.value === 'gemini' ? 'model-color-indicator gemini-glow-small' : 'model-color-indicator claude-glow-small';

  const modelB = getActiveModelName('b');
  document.getElementById('tab-b-label').textContent = `Panel B (${modelB})`;
  const indB = document.getElementById('tab-b-indicator');
  indB.className = elements.paneBProviderSelect.value === 'gemini' ? 'model-color-indicator gemini-glow-small' : 'model-color-indicator claude-glow-small';

  elements.scorecardTitleA.textContent = `Panel A: ${modelA}`;
  elements.scorecardTitleB.textContent = `Panel B: ${modelB}`;
  elements.chartLegendA.textContent = modelA;
  elements.chartLegendB.textContent = modelB;
}

function getActiveModelName(panel) {
  if (panel === 'a') {
    if (elements.geminiModelSelect.value === 'custom') {
      return elements.geminiCustomModelInput.value.trim() || 'custom-model-a';
    }
    return elements.geminiModelSelect.value;
  } else {
    if (elements.claudeModelSelect.value === 'custom') {
      return elements.claudeCustomModelInput.value.trim() || 'custom-model-b';
    }
    return elements.claudeModelSelect.value;
  }
}

// Thinking Config Controls
function updateThinkingConfigPanel(panel) {
  const provider = panel === 'a' ? elements.paneAProviderSelect.value : elements.paneBProviderSelect.value;
  const model = getActiveModelName(panel);
  
  const select = panel === 'a' ? elements.geminiThinkingSelect : elements.claudeThinkingSelect;
  const badge = panel === 'a' ? elements.geminiThinkingBadge : elements.claudeThinkingBadge;
  const sliderWrapper = panel === 'a' ? elements.thinkingBudgetSliderWrapper : elements.claudeThinkingBudgetSliderWrapper;
  const container = panel === 'a' ? elements.geminiThinkingContainer : elements.claudeThinkingContainer;

  if (!container || !select) return;

  container.classList.remove('disabled');
  select.disabled = false;

  if (provider === 'claude') {
    badge.textContent = 'Claude Mode';
    select.innerHTML = `<option value="ADAPTIVE">Adaptive (Effort High)</option>`;
    select.value = 'ADAPTIVE';
    select.disabled = true;
    
    if (model.includes('claude-sonnet-4-6') || model.includes('claude-opus-4-7')) {
      container.style.display = 'inline-flex';
      container.classList.add('disabled');
    } else {
      container.style.display = 'none';
    }
    sliderWrapper.style.display = 'none';
    return;
  }

  // Gemini models
  container.style.display = 'inline-flex';

  if (model.includes('gemini-3.7') || model.includes('gemini-3.6') || model.includes('gemini-3.5') || model.includes('gemini-3.0') || model.includes('gemini-3-')) {
    badge.textContent = 'G3.x Hybrid';
    badge.title = 'Gemini 3.x series supports flexible reasoning budgets & thinking levels';
    
    select.innerHTML = `
      <option value="HIGH" selected>HIGH Reasoning (Default)</option>
      <option value="MEDIUM">MEDIUM Reasoning</option>
      <option value="LOW">LOW Reasoning</option>
      <option value="MINIMAL">MINIMAL Reasoning</option>
      <option value="CUSTOM">Custom Token Budget</option>
      <option value="OFF">OFF (Thinking Disabled)</option>
    `;
    sliderWrapper.style.display = select.value === 'CUSTOM' ? 'block' : 'none';

  } else if (model.includes('gemini-2.5')) {
    badge.textContent = 'G2.5 Budget';
    badge.title = 'Gemini 2.5 series supports token budget reasoning';
    
    select.innerHTML = `
      <option value="DYNAMIC" selected>Auto Dynamic (-1)</option>
      <option value="CUSTOM">Custom Budget Slider</option>
      <option value="OFF">OFF (0 Tokens)</option>
    `;
    sliderWrapper.style.display = select.value === 'CUSTOM' ? 'block' : 'none';

  } else {
    badge.textContent = 'G2.0 / 1.5';
    select.innerHTML = `<option value="UNSUPPORTED">Standard Gen</option>`;
    select.value = 'UNSUPPORTED';
    select.disabled = true;
    container.classList.add('disabled');
    sliderWrapper.style.display = 'none';
  }
}

elements.geminiThinkingSelect.addEventListener('change', (e) => {
  elements.thinkingBudgetSliderWrapper.style.display = e.target.value === 'CUSTOM' ? 'block' : 'none';
});

function updateModelPriceTags() {
  const modelA = getActiveModelName('a');
  const priceA = PRICING[modelA] || { input: 0.15, output: 0.60 };
  document.getElementById('gemini-model-price').textContent = `$${priceA.input}/M in · $${priceA.output}/M out`;

  const modelB = getActiveModelName('b');
  const priceB = PRICING[modelB] || { input: 0.15, output: 0.60 };
  document.getElementById('claude-model-price').textContent = `$${priceB.input}/M in · $${priceB.output}/M out`;
}

// Workspace Layout Toggling
function switchLayout(tabId) {
  elements.tabCompare.classList.toggle('active', tabId === 'compare');
  elements.tabGemini.classList.toggle('active', tabId === 'gemini');
  elements.tabClaude.classList.toggle('active', tabId === 'claude');
  elements.tabAnalytics.classList.toggle('active', tabId === 'analytics');

  currentLayout = tabId;

  if (tabId === 'analytics') {
    elements.arenaGrid.style.display = 'none';
    elements.analyticsPanel.style.display = 'block';
    renderTelemetryChart();
  } else {
    elements.arenaGrid.style.display = 'grid';
    elements.analyticsPanel.style.display = 'none';

    elements.arenaGrid.className = 'arena-grid';
    if (tabId === 'compare') {
      elements.arenaGrid.classList.add('split-layout');
    } else if (tabId === 'gemini') {
      elements.arenaGrid.classList.add('single-gemini');
    } else if (tabId === 'claude') {
      elements.arenaGrid.classList.add('single-claude');
    }
  }
}

elements.tabCompare.addEventListener('click', () => switchLayout('compare'));
elements.tabGemini.addEventListener('click', () => switchLayout('gemini'));
elements.tabClaude.addEventListener('click', () => switchLayout('claude'));
elements.tabAnalytics.addEventListener('click', () => switchLayout('analytics'));

// Credentials Dialog Handlers
elements.btnOpenConfig.addEventListener('click', () => elements.configDialog.showModal());
elements.btnOpenSuite.addEventListener('click', () => switchLayout('analytics'));
elements.btnCloseConfig.addEventListener('click', () => elements.configDialog.close());
elements.btnSaveConfig.addEventListener('click', saveCredentials);
elements.btnClearConfig.addEventListener('click', clearCredentials);

for (const radio of elements.authMethodRadio) {
  radio.addEventListener('change', (e) => toggleAuthForms(e.target.value));
}

// Provider changes
elements.paneAProviderSelect.addEventListener('change', () => {
  populateModels('a');
  updatePanelTheme('a');
  updateThinkingConfigPanel('a');
  updateModelPriceTags();
});

elements.paneBProviderSelect.addEventListener('change', () => {
  populateModels('b');
  updatePanelTheme('b');
  updateThinkingConfigPanel('b');
  updateModelPriceTags();
});

// Clear consoles
elements.btnClearArena.addEventListener('click', () => {
  elements.geminiConsole.innerHTML = `
    <div class="placeholder-msg">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <p>Enter a prompt or select a benchmark to stream responses.</p>
    </div>
  `;
  elements.claudeConsole.innerHTML = `
    <div class="placeholder-msg">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <p>Enter a prompt or select a benchmark to stream responses.</p>
    </div>
  `;
  resetMetricsReadout('gemini');
  resetMetricsReadout('claude');
  telemetryHistory.a = [];
  telemetryHistory.b = [];
  renderTelemetryChart();
  showToast('Consoles cleared.');
});

// Reset metrics readout
function resetMetricsReadout(provider) {
  if (provider === 'gemini') {
    elements.geminiTtft.textContent = '--';
    elements.geminiSpeed.textContent = '--';
    elements.geminiCount.textContent = '0';
    elements.geminiCost.textContent = '$0.00000';
    elements.geminiLegendInput.textContent = '0';
    elements.geminiLegendThinking.textContent = '0';
    elements.geminiLegendOutput.textContent = '0';
    elements.geminiBarInput.style.width = '0%';
    elements.geminiBarThinking.style.width = '0%';
    elements.geminiBarOutput.style.width = '0%';
  } else {
    elements.claudeTtft.textContent = '--';
    elements.claudeSpeed.textContent = '--';
    elements.claudeCount.textContent = '0';
    elements.claudeCost.textContent = '$0.00000';
    elements.claudeLegendInput.textContent = '0';
    elements.claudeLegendThinking.textContent = '0';
    elements.claudeLegendOutput.textContent = '0';
    elements.claudeBarInput.style.width = '0%';
    elements.claudeBarThinking.style.width = '0%';
    elements.claudeBarOutput.style.width = '0%';
  }
}

// Sandbox Badge Toggle
elements.sandboxCheckbox.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  elements.sandboxBadge.className = isChecked ? 'badge-status sandbox-active' : 'badge-status live-active';
  elements.sandboxBadge.querySelector('.badge-text').textContent = isChecked ? 'SANDBOX MODE' : 'LIVE MODEL ACTIVE';
  showToast(isChecked ? 'Switched to Sandbox Mode (Simulated)' : 'Switched to Live Model Mode');
});

// ==========================================================================
// STREAM EXECUTION CONTROLLER
// ==========================================================================
async function streamSingleModel(panelId, promptText) {
  const provider = panelId === 'a' ? elements.paneAProviderSelect.value : elements.paneBProviderSelect.value;
  const model = getActiveModelName(panelId);
  const consoleEl = panelId === 'a' ? elements.geminiConsole : elements.claudeConsole;
  
  const isSandbox = elements.sandboxCheckbox.checked;
  const config = getCredentialsConfig();
  const sysPrompt = elements.systemPrompt.value.trim();
  const temp = parseFloat(elements.tempSlider.value);
  const topP = parseFloat(elements.topPSlider.value);
  const topK = parseInt(elements.topKSlider.value);
  const maxTokens = parseInt(elements.tokensSlider.value);
  const responseMime = elements.responseMimeSelect.value;

  // Clear initial placeholder if present
  const placeholder = consoleEl.querySelector('.placeholder-msg');
  if (placeholder) placeholder.remove();

  // Create User Message Bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user-bubble';
  userBubble.innerHTML = `<div class="user-msg-content">${escapeHtml(promptText)}</div>`;
  consoleEl.appendChild(userBubble);

  // Create Model response card
  const responseBubble = document.createElement('div');
  responseBubble.className = `chat-bubble model-bubble ${provider}-model-theme streaming-token`;
  consoleEl.appendChild(responseBubble);
  consoleEl.scrollTop = consoleEl.scrollHeight;

  // --- Metrics tracking ---
  const startTime = performance.now();
  let firstTokenReceived = false;
  let ttftMs = 0;
  let tokenCount = 0;
  let thinkingText = '';
  let outputText = '';
  let thinkingTokens = 0;
  let outputTokens = 0;
  const estimatedInputTokens = Math.ceil((promptText.length + sysPrompt.length) / 4);
  let actualInputTokens = estimatedInputTokens;

  resetMetricsReadout(panelId === 'a' ? 'gemini' : 'claude');

  // Track telemetry for charting
  const telemetryPoints = [];

  function updateResponseUI() {
    let html = '';
    if (thinkingText) {
      const encodedThoughts = encodeURIComponent(thinkingText);
      html += `
        <details class="thinking-container" open>
          <summary class="thinking-header">
            <div class="thinking-header-left">
              <svg class="thinking-brain-icon animate-pulse" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z"/></svg>
              <span>Reasoning Trace (${thinkingTokens} tokens)</span>
            </div>
            <button type="button" class="btn-copy-thoughts" data-thoughts="${encodedThoughts}" onclick="event.stopPropagation(); copyThoughts(this);">Copy Trace</button>
          </summary>
          <div class="thinking-content">${parseMarkdown(thinkingText)}</div>
        </details>
      `;
    }
    if (outputText) {
      html += `<div class="output-content">${parseMarkdown(outputText)}</div>`;
    }
    responseBubble.innerHTML = html;
    consoleEl.scrollTop = consoleEl.scrollHeight;

    tokenCount = thinkingTokens + outputTokens;
    const countLabel = panelId === 'a' ? elements.geminiCount : elements.claudeCount;
    if (countLabel) countLabel.textContent = tokenCount;

    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const speed = (tokenCount / Math.max(elapsedSeconds, 0.1)).toFixed(1);
    const speedLabel = panelId === 'a' ? elements.geminiSpeed : elements.claudeSpeed;
    if (speedLabel) speedLabel.textContent = speed;

    // Record telemetry point
    telemetryPoints.push({ time: elapsedSeconds, speed: parseFloat(speed) });

    const modelRates = PRICING[model] || { input: 0.15, output: 0.60 };
    const inputCost = (actualInputTokens / 1000000) * modelRates.input;
    const outputCost = ((thinkingTokens + outputTokens) / 1000000) * modelRates.output;
    const totalCost = (inputCost + outputCost).toFixed(5);
    const costLabel = panelId === 'a' ? elements.geminiCost : elements.claudeCost;
    if (costLabel) costLabel.textContent = `$${totalCost}`;

    // Token Breakdown Bar
    const barInput = panelId === 'a' ? elements.geminiBarInput : elements.claudeBarInput;
    const barThinking = panelId === 'a' ? elements.geminiBarThinking : elements.claudeBarThinking;
    const barOutput = panelId === 'a' ? elements.geminiBarOutput : elements.claudeBarOutput;

    const legendInput = panelId === 'a' ? elements.geminiLegendInput : elements.claudeLegendInput;
    const legendThinking = panelId === 'a' ? elements.geminiLegendThinking : elements.claudeLegendThinking;
    const legendOutput = panelId === 'a' ? elements.geminiLegendOutput : elements.claudeLegendOutput;

    if (legendInput) legendInput.textContent = actualInputTokens;
    if (legendThinking) legendThinking.textContent = thinkingTokens;
    if (legendOutput) legendOutput.textContent = outputTokens;

    const totalBarTokens = actualInputTokens + thinkingTokens + outputTokens;
    if (totalBarTokens > 0 && barInput && barThinking && barOutput) {
      barInput.style.width = `${(actualInputTokens / totalBarTokens) * 100}%`;
      barThinking.style.width = `${(thinkingTokens / totalBarTokens) * 100}%`;
      barOutput.style.width = `${(outputTokens / totalBarTokens) * 100}%`;
    }
  }

  // Thinking config
  let thinkingOptions = { mode: 'HIGH', budget: 2048 };
  if (provider === 'gemini') {
    const select = panelId === 'a' ? elements.geminiThinkingSelect : elements.claudeThinkingSelect;
    const slider = panelId === 'a' ? elements.thinkingBudgetSlider : elements.claudeThinkingBudgetSlider;
    thinkingOptions = {
      mode: select ? select.value : 'HIGH',
      budget: slider ? parseInt(slider.value) : 2048
    };
  }

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider,
        model: model,
        prompt: promptText,
        systemPrompt: sysPrompt,
        temperature: temp,
        topP: topP,
        topK: topK,
        maxTokens: maxTokens,
        responseMimeType: responseMime,
        sandboxMode: isSandbox,
        config: config,
        geminiThinking: thinkingOptions
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunkStr = decoder.decode(value, { stream: !done });
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.done) {
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
                  ttftMs = Math.round(performance.now() - startTime);
                  const ttftLabel = panelId === 'a' ? elements.geminiTtft : elements.claudeTtft;
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
            } catch(e) {}
          }
        }
      }
    }

    responseBubble.classList.remove('streaming-token');

    // Save final stats
    const totalElapsed = (performance.now() - startTime) / 1000;
    const finalSpeed = parseFloat((tokenCount / Math.max(totalElapsed, 0.1)).toFixed(1));
    const modelRates = PRICING[model] || { input: 0.15, output: 0.60 };
    const totalCost = ((actualInputTokens / 1e6) * modelRates.input + (tokenCount / 1e6) * modelRates.output);

    if (panelId === 'a') {
      telemetryHistory.a = telemetryPoints;
      lastDuelResult.modelA = model;
      lastDuelResult.ttftA = ttftMs;
      lastDuelResult.speedA = finalSpeed;
      lastDuelResult.thinkA = thinkingTokens;
      lastDuelResult.outA = outputTokens;
      lastDuelResult.costA = totalCost;
    } else {
      telemetryHistory.b = telemetryPoints;
      lastDuelResult.modelB = model;
      lastDuelResult.ttftB = ttftMs;
      lastDuelResult.speedB = finalSpeed;
      lastDuelResult.thinkB = thinkingTokens;
      lastDuelResult.outB = outputTokens;
      lastDuelResult.costB = totalCost;
    }

  } catch (err) {
    responseBubble.classList.remove('streaming-token');
    responseBubble.innerHTML = `<span style="color: var(--color-danger); font-weight:600;">⚠️ Error Stream Interrupted:</span><br><span class="mono-font">${escapeHtml(err.message)}</span>`;
  }
}

// Duel Stream Concurrent Runner
async function runDuelStream(promptText) {
  if (!promptText || !promptText.trim()) return;
  
  lastDuelResult.prompt = promptText;
  lastDuelResult.timestamp = new Date();
  
  elements.btnSubmitPrompt.disabled = true;
  elements.btnSubmitPrompt.innerHTML = `<span>STREAMING...</span>`;

  try {
    if (currentLayout === 'gemini') {
      await streamSingleModel('a', promptText);
    } else if (currentLayout === 'claude') {
      await streamSingleModel('b', promptText);
    } else {
      await Promise.all([
        streamSingleModel('a', promptText),
        streamSingleModel('b', promptText)
      ]);
      updateScorecardUI();
    }
  } finally {
    elements.btnSubmitPrompt.disabled = false;
    elements.btnSubmitPrompt.innerHTML = `
      <span>DUEL STREAM</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    `;
  }
}

// Prompt form submission
elements.promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = elements.promptInput.value.trim();
  if (text) {
    runDuelStream(text);
  }
});

// Keyboard Shortcuts (Cmd/Ctrl + Enter to run, Cmd/Ctrl + K to clear)
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    elements.promptForm.dispatchEvent(new Event('submit'));
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    elements.btnClearArena.click();
  }
  if (e.key === 'Escape' && elements.configDialog.open) {
    elements.configDialog.close();
  }
});

// ==========================================================================
// BENCHMARK SCORECARD & ANALYTICS
// ==========================================================================
function updateScorecardUI() {
  const r = lastDuelResult;

  elements.scorecardTtftA.textContent = r.ttftA ? `${r.ttftA} ms` : '--';
  elements.scorecardSpeedA.textContent = r.speedA ? `${r.speedA} tps` : '--';
  elements.scorecardThinkA.textContent = `${r.thinkA} tokens`;
  elements.scorecardOutA.textContent = `${r.outA} tokens`;
  elements.scorecardCostA.textContent = `$${r.costA.toFixed(5)}`;

  elements.scorecardTtftB.textContent = r.ttftB ? `${r.ttftB} ms` : '--';
  elements.scorecardSpeedB.textContent = r.speedB ? `${r.speedB} tps` : '--';
  elements.scorecardThinkB.textContent = `${r.thinkB} tokens`;
  elements.scorecardOutB.textContent = `${r.outB} tokens`;
  elements.scorecardCostB.textContent = `$${r.costB.toFixed(5)}`;

  // Determine winners
  const deltas = [];
  let winnerText = '';

  if (r.ttftA && r.ttftB) {
    if (r.ttftA < r.ttftB) {
      const speedup = (r.ttftB / r.ttftA).toFixed(1);
      deltas.push(`⚡ <strong>${r.modelA}</strong> was <strong>${speedup}x faster</strong> to first token (-${r.ttftB - r.ttftA}ms TTFT).`);
    } else if (r.ttftB < r.ttftA) {
      const speedup = (r.ttftA / r.ttftB).toFixed(1);
      deltas.push(`⚡ <strong>${r.modelB}</strong> was <strong>${speedup}x faster</strong> to first token (-${r.ttftA - r.ttftB}ms TTFT).`);
    }
  }

  if (r.speedA && r.speedB) {
    if (r.speedA > r.speedB) {
      const diff = (r.speedA - r.speedB).toFixed(1);
      deltas.push(`🚀 <strong>${r.modelA}</strong> generated tokens <strong>+${diff} TPS faster</strong>.`);
    } else if (r.speedB > r.speedA) {
      const diff = (r.speedB - r.speedA).toFixed(1);
      deltas.push(`🚀 <strong>${r.modelB}</strong> generated tokens <strong>+${diff} TPS faster</strong>.`);
    }
  }

  if (r.costA && r.costB) {
    if (r.costA < r.costB) {
      const pct = Math.round(((r.costB - r.costA) / r.costB) * 100);
      deltas.push(`💰 <strong>${r.modelA}</strong> was <strong>${pct}% more cost-efficient</strong>.`);
    } else if (r.costB < r.costA) {
      const pct = Math.round(((r.costA - r.costB) / r.costA) * 100);
      deltas.push(`💰 <strong>${r.modelB}</strong> was <strong>${pct}% more cost-efficient</strong>.`);
    }
  }

  if (r.speedA > r.speedB && r.ttftA <= r.ttftB) {
    winnerText = `🏆 <strong>${r.modelA}</strong> wins on overall performance!`;
  } else if (r.speedB > r.speedA && r.ttftB <= r.ttftA) {
    winnerText = `🏆 <strong>${r.modelB}</strong> wins on overall performance!`;
  } else {
    winnerText = `⚖️ Balanced competition between <strong>${r.modelA}</strong> and <strong>${r.modelB}</strong>.`;
  }

  elements.scorecardVerdictText.innerHTML = winnerText;
  elements.scorecardDeltasText.innerHTML = deltas.join('<br>');

  renderTelemetryChart();
}

function renderTelemetryChart() {
  const canvas = elements.telemetryCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const dataA = telemetryHistory.a || [];
  const dataB = telemetryHistory.b || [];

  if (!dataA.length && !dataB.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No telemetry data recorded yet. Run a prompt to visualize live streaming curves.', w / 2, h / 2);
    return;
  }

  // Find bounds
  const maxSpeed = Math.max(
    ...dataA.map(d => d.speed),
    ...dataB.map(d => d.speed),
    20
  );
  const maxTime = Math.max(
    ...dataA.map(d => d.time),
    ...dataB.map(d => d.time),
    1
  );

  const padLeft = 45;
  const padBottom = 30;
  const padTop = 15;
  const padRight = 15;

  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  // Draw Grid
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (chartH / 4) * i;
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);

    const val = Math.round(maxSpeed - (maxSpeed / 4) * i);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${val}`, padLeft - 6, y + 3);
  }
  ctx.stroke();

  function drawLine(points, color) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    points.forEach((p, idx) => {
      const x = padLeft + (p.time / maxTime) * chartW;
      const y = padTop + chartH - (p.speed / maxSpeed) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawLine(dataA, '#4285F4'); // Gemini blue
  drawLine(dataB, '#E05A47'); // Claude orange
}

// Export Benchmark Results
elements.btnExportMd.addEventListener('click', () => {
  const r = lastDuelResult;
  const md = `# Gemini Arena Benchmark Evaluation Report
**Timestamp:** ${r.timestamp.toISOString()}
**Prompt:** ${r.prompt}

## Head-to-Head Performance Summary

| Metric | ${r.modelA} (Panel A) | ${r.modelB} (Panel B) | Delta / Advantage |
| :--- | :--- | :--- | :--- |
| **TTFT (Latency)** | ${r.ttftA} ms | ${r.ttftB} ms | ${r.ttftA < r.ttftB ? `${r.modelA} -${r.ttftB - r.ttftA}ms` : `${r.modelB} -${r.ttftA - r.ttftB}ms`} |
| **Tokens / sec (TPS)** | ${r.speedA} | ${r.speedB} | ${r.speedA > r.speedB ? `${r.modelA} +${(r.speedA - r.speedB).toFixed(1)} TPS` : `${r.modelB} +${(r.speedB - r.speedA).toFixed(1)} TPS`} |
| **Thinking Tokens** | ${r.thinkA} | ${r.thinkB} | - |
| **Output Tokens** | ${r.outA} | ${r.outB} | - |
| **Estimated Cost** | $${r.costA.toFixed(5)} | $${r.costB.toFixed(5)} | ${r.costA < r.costB ? `${r.modelA} cheaper` : `${r.modelB} cheaper`} |

*Generated via Vertex AI & Google AI Studio Gemini Arena Playground.*
`;
  downloadFile(md, `gemini-benchmark-${Date.now()}.md`, 'text/markdown');
});

elements.btnExportJson.addEventListener('click', () => {
  const jsonStr = JSON.stringify(lastDuelResult, null, 2);
  downloadFile(jsonStr, `gemini-benchmark-${Date.now()}.json`, 'application/json');
});

elements.btnExportCsv.addEventListener('click', () => {
  const r = lastDuelResult;
  const csv = `Model,TTFT_ms,Speed_TPS,Thinking_Tokens,Output_Tokens,Cost_USD\n"${r.modelA}",${r.ttftA},${r.speedA},${r.thinkA},${r.outA},${r.costA.toFixed(5)}\n"${r.modelB}",${r.ttftB},${r.speedB},${r.thinkB},${r.outB},${r.costB.toFixed(5)}`;
  downloadFile(csv, `gemini-benchmark-${Date.now()}.csv`, 'text/csv');
});

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${fileName}`);
}

// ==========================================================================
// BENCHMARK CATALOG & BATCH RUNNER
// ==========================================================================
const BENCHMARK_DATA = {
  reasoning: [
    {
      title: "Knights, Knaves & Logic Grid",
      preview: "Deduce truthfulness and identities in a complex logic island...",
      prompt: "On an island, each inhabitant is either a Knight (who always speaks truth) or a Knave (who always lies). You meet three people: Alice, Bob, and Charlie.\nAlice says: 'Bob is a knave.'\nBob says: 'Alice and Charlie are the same type.'\nCharlie says: 'Exactly one of us is a knight.'\nDetermine with rigorous logical proof what Alice, Bob, and Charlie are."
    },
    {
      title: "Counterfactual Physics",
      preview: "Analyze satellite orbits if gravitational constant halved instantly...",
      prompt: "Suppose the universal gravitational constant G were instantaneously reduced to half its current value right now. Describe step-by-step the physical consequences on: (1) Earth's orbit around the Sun, (2) the Moon's orbit around Earth, (3) artificial satellites in low Earth orbit vs geostationary orbit, and (4) Earth's atmosphere."
    },
    {
      title: "Wood Stain Sequence",
      preview: "Physical causality and optimal multi-step woodworking prep...",
      prompt: "A person is preparing to stain a piece of open-grain red oak wood. They have sanded the board with 80, 120, and 220 grit sandpaper, wiped away all the dust, and have a can of oil-based penetrating stain, pre-stain wood conditioner, foam brushes, and lint-free rags. Detail the exact optimal sequence of physical steps to prevent blotching."
    },
    {
      title: "ARC-AGI Pattern Shift",
      preview: "Grid abstraction and cellular transformation logic...",
      prompt: "You are given a 5x5 grid of colors where row 1 has a single yellow pixel at (0, 0), row 2 has two cyan pixels at (1, 1) and (1, 2), row 3 has three red pixels centered at (2, 1), (2, 2), (2, 3). If the pattern rule rotates 90 degrees clockwise and inverts parity, derive the exact coordinates and values of the 4th and 5th states."
    }
  ],
  swebench: [
    {
      title: "Python Sibling Imports",
      preview: "Resolve sibling package ModuleNotFoundError in modern Python...",
      prompt: "Debug a relative import issue in a Python project where importing from a sibling package fails with 'ModuleNotFoundError: No module named...'. Show the exact directory structure, `__init__.py` configuration, `pyproject.toml` layout, and how to execute tests via `python -m pytest` correctly."
    },
    {
      title: "Async Memory Leak in Node.js",
      preview: "Analyze and repair a memory leak in Node.js stream pipelines...",
      prompt: "Analyze and fix a memory leak in a Node.js custom stream pipeline. The pipeline uses circular buffers for caching chunks but fails to release references on stream backpressure, causing Heap Out Of Memory. Show the implementation of a memory-efficient circular buffer class."
    },
    {
      title: "Concurrent MongoDB Balance Race",
      preview: "Implement Optimistic Concurrency Control (OCC) with atomic operators...",
      prompt: "Identify and resolve a race condition in a high-concurrency Node.js Express endpoint that increments a user's digital wallet balance in MongoDB. Show the complete Mongoose / Native Driver implementation using optimistic concurrency control (OCC) with version attributes and atomic `$inc` operators."
    },
    {
      title: "Cyclic Dependency Detection",
      preview: "Graph coloring algorithm in TypeScript for package managers...",
      prompt: "Write a high-performance algorithm in TypeScript to detect cyclic dependencies in a large-scale software package management graph. Given an adjacency list of package dependencies, find and return all circular dependency cycles using depth-first search (DFS) with three-color node marking (WHITE, GRAY, BLACK)."
    }
  ],
  ifeval: [
    {
      title: "Renewable Energy (Letter Prohibition)",
      preview: "3 paragraphs, exactly 3 sentences each, omitting 'e' in paragraph 3...",
      prompt: "Write a three-paragraph evaluation comparing solar and wind energy. Each paragraph must be exactly 3 sentences long. In the third paragraph, you are completely prohibited from using the letter 'e' anywhere in any of the words."
    },
    {
      title: "AI Platform Pitch (Exact Word Count)",
      preview: "Exactly 150 words, 3 action-verb bullets, 1 closing sentence...",
      prompt: "Write an executive pitch about 'Agentic AI Platforms' that is EXACTLY 150 words long. The pitch must contain exactly 3 bullet points, each starting with an action verb (e.g. Accelerate, Unify, Streamline), and must conclude with a single sentence call to action."
    },
    {
      title: "Quantum Computing (Taboo Words)",
      preview: "Explain quantum computing without words like physics, computer...",
      prompt: "Explain quantum computing to a high school student in exactly two paragraphs. You are strictly forbidden from using any of the following words anywhere in your explanation: 'physics', 'mechanics', 'computer', 'science', 'math'."
    },
    {
      title: "Strict RFC-8259 JSON Schema",
      preview: "Output complex Kubernetes Pod spec JSON with zero markdown wrapping...",
      prompt: "Generate a Kubernetes multi-container Pod deployment spec with init-containers, resource limits (CPU/Memory), and liveness probes. Output ONLY raw JSON matching RFC-8259. Do NOT wrap in markdown code blocks and do NOT output any conversational text."
    }
  ],
  math: [
    {
      title: "Bayesian Spam Probability",
      preview: "Derive posterior probability using Bayes' Theorem with steps...",
      prompt: "Suppose 1% of all emails are phishing spam. A spam detector correctly flags phishing emails 98% of the time (true positive rate), but has a 4% false positive rate on legitimate emails. If an email is flagged as spam, calculate the exact posterior probability that it is truly phishing spam. Show full algebraic steps."
    },
    {
      title: "Combinatorial Graph Proof",
      preview: "Prove that every simple graph with n >= 2 vertices has equal degrees...",
      prompt: "Prove formally using the Pigeonhole Principle that in any simple connected graph with n >= 2 vertices, there must exist at least two vertices that have the exact same degree."
    },
    {
      title: "Matrix Eigenvalue Stability",
      preview: "Derive stability eigenvalues for a 3x3 coupled differential system...",
      prompt: "Given the 3x3 matrix A = [[-2, 1, 0], [1, -2, 1], [0, 1, -2]], find all eigenvalues and eigenvectors analytically. Prove whether the dynamical system dx/dt = Ax is asymptotically stable at the origin."
    }
  ],
  stress: [
    {
      title: "Throughput Burst Test",
      preview: "Rapid-fire 50-line sorted dictionary generation...",
      prompt: "Generate a dictionary of 50 technical software engineering terms from A to Z with their exact one-sentence definitions formatted as a clean Markdown table."
    },
    {
      title: "High-Density Code Golf",
      preview: "Implement a fully working Huffman Compression tree in minimal code...",
      prompt: "Write a complete, working Huffman Coding compression and decompression implementation in JavaScript. Include frequency mapping, binary tree construction, and bit encoding/decoding functions."
    }
  ]
};

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
      elements.promptInput.focus();
      
      elements.promptInput.classList.remove('pulse-highlight');
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
  
  renderBenchmarkPrompts('reasoning');

  // Batch runner
  elements.btnRunAllSuite.addEventListener('click', async () => {
    if (isRunningBatch) return;
    const activePill = document.querySelector('.benchmark-pill.active');
    const category = activePill ? activePill.getAttribute('data-benchmark') : 'reasoning';
    const prompts = BENCHMARK_DATA[category] || [];
    
    if (!prompts.length) return;

    isRunningBatch = true;
    elements.btnRunAllSuite.disabled = true;
    elements.btnRunAllSuite.innerHTML = `<span>Running Batch (0/${prompts.length})...</span>`;
    showToast(`Starting automated benchmark suite for "${category}"...`);

    for (let i = 0; i < prompts.length; i++) {
      elements.btnRunAllSuite.innerHTML = `<span>Running Batch (${i + 1}/${prompts.length})...</span>`;
      await runDuelStream(prompts[i].prompt);
      await new Promise(r => setTimeout(r, 600));
    }

    isRunningBatch = false;
    elements.btnRunAllSuite.disabled = false;
    elements.btnRunAllSuite.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Run Benchmark Batch
    `;
    showToast(`Benchmark suite completed! Check Scorecard in Benchmark Analytics tab.`);
    switchLayout('analytics');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Load Server Config on startup
async function loadServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const config = await res.json();
    
    if (config.hasApiKey && !localStorage.getItem('gemini_api_key')) {
      elements.geminiApiKey.placeholder = 'Configured via server .env (GEMINI_API_KEY)';
    }
    if (config.projectId && !elements.gcpProjectId.value) {
      elements.gcpProjectId.value = config.projectId;
    }
    if (config.region && !elements.gcpRegion.value) {
      elements.gcpRegion.value = config.region;
    }
  } catch (e) {}
}

// Initializer
window.addEventListener('load', async () => {
  initTheme();
  loadSavedCredentials();
  await loadServerConfig();
  
  populateModels('a');
  populateModels('b');
  updatePanelTheme('a');
  updatePanelTheme('b');
  
  updateThinkingConfigPanel('a');
  updateThinkingConfigPanel('b');
  
  updateModelPriceTags();
  initBenchmarks();
});
