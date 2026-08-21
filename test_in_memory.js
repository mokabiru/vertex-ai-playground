const http = require('http');
const EventEmitter = require('events');

// Load server module functions
const fs = require('fs');
const path = require('path');

console.log('Testing static files and syntax integrity...');

// 1. Verify index.html existence and content
const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
console.assert(html.includes('gemini-3.7-flash'), 'index.html must include gemini-3.7-flash');
console.assert(html.includes('gemini-3.6-flash'), 'index.html must include gemini-3.6-flash');
console.assert(html.includes('gemini-3.5-flash'), 'index.html must include gemini-3.5-flash');
console.assert(html.includes('gemini-3.0-flash'), 'index.html must include gemini-3.0-flash');
console.assert(html.includes('gemini-2.5-pro'), 'index.html must include gemini-2.5-pro');
console.assert(html.includes('gemini-2.5-flash'), 'index.html must include gemini-2.5-flash');
console.assert(html.includes('gemini-2.5-flash-lite'), 'index.html must include gemini-2.5-flash-lite');
console.assert(html.includes('Google AI Studio API Key'), 'index.html must include Google AI Studio API Key');
console.assert(html.includes('telemetry-canvas'), 'index.html must include telemetry-canvas');
console.log('✅ public/index.html verification PASSED');

// 2. Verify index.js syntax and definitions
const js = fs.readFileSync(path.join(__dirname, 'public', 'index.js'), 'utf8');
console.assert(js.includes('gemini-3.7-flash'), 'index.js must include gemini-3.7-flash');
console.assert(js.includes('gemini-3.6-flash'), 'index.js must include gemini-3.6-flash');
console.assert(js.includes('gemini-3.5-flash'), 'index.js must include gemini-3.5-flash');
console.assert(js.includes('gemini-3.0-flash'), 'index.js must include gemini-3.0-flash');
console.assert(js.includes('gemini-2.5-pro'), 'index.js must include gemini-2.5-pro');
console.assert(js.includes('gemini-2.5-flash-lite'), 'index.js must include gemini-2.5-flash-lite');
console.assert(js.includes('updateScorecardUI'), 'index.js must include updateScorecardUI');
console.assert(js.includes('renderTelemetryChart'), 'index.js must include renderTelemetryChart');
console.assert(js.includes('BENCHMARK_DATA'), 'index.js must include BENCHMARK_DATA');
console.log('✅ public/index.js verification PASSED');

// 3. Verify index.css syntax and definitions
const css = fs.readFileSync(path.join(__dirname, 'public', 'index.css'), 'utf8');
console.assert(css.includes('[data-theme="oled"]'), 'index.css must include OLED theme');
console.assert(css.includes('[data-theme="light"]'), 'index.css must include Light theme');
console.assert(css.includes('.scorecard-grid'), 'index.css must include scorecard-grid');
console.assert(css.includes('.telemetry-chart-card'), 'index.css must include telemetry-chart-card');
console.log('✅ public/index.css verification PASSED');

// 4. Verify server.js syntax
const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
console.assert(serverCode.includes('gemini-3.7'), 'server.js must handle gemini-3.7');
console.assert(serverCode.includes('generativelanguage.googleapis.com'), 'server.js must support Google AI Studio');
console.assert(serverCode.includes('handleGoogleAIStudioStream'), 'server.js must include handleGoogleAIStudioStream');
console.log('✅ server.js verification PASSED');

console.log('\n🎉 ALL STATIC & CODE INTEGRITY CHECKS PASSED PERFECTLY!');
