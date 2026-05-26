# Vertex AI Playground — Gemini & Claude Arena

A sleek, premium, and zero-dependency local web playground designed to let you interact, test, and perform side-by-side stream duels between **Google Gemini** and **Anthropic Claude** models hosted on **Google Cloud Vertex AI**. 

It runs on a local lightweight Node server using native Mac capabilities without requiring an `npm install` or any package configuration.

---

## 🎨 Key Features

- **Double-Stream "Duel" Arena**: Put Gemini and Claude side-by-side! A single shared prompt box submits requests concurrently to both endpoints and streams their outputs in real time.
- **Out-of-the-Box "Sandbox Mode"**: Test the interface immediately! Enabled by default, Sandbox Mode streams simulated responses detailing the behind-the-scenes REST configurations, payloads, and protocols.
- **Zero-Dependency Architecture**: Built on pure, vanilla HTML, CSS, JavaScript, and native Node.js core libraries. Zero `node_modules` folders, zero path installation errors.
- **Native GCP Service Account OAuth Signer**: Enter a Service Account JSON key, and the built-in Node `crypto` engine signs JWT assertions and auto-refreshes tokens natively.
- **Comprehensive Live Metrics**:
  - **TTFT**: Time To First Token in milliseconds.
  - **Tokens/sec**: Streaming speed index.
  - **Tokens Count**: Total output tokens generated.
  - **Est. Cost**: Continuous pricing counter matching live Google Cloud rates.

---

## 🚀 Quick Start (Running Locally)

1. Open your terminal in this directory:
   ```bash
   cd /Users/mokabir/.gemini/antigravity/scratch/vertex-ai-playground
   ```

2. Run the server using your native Antigravity Node helper:
   ```bash
   agy-node server.js
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:4000
   ```

4. You will see the **Sandbox Mode** active immediately. Type a prompt (e.g., `Compare your strengths`) and press **Enter** or click **DUEL STREAM** to watch the concurrent, high-fidelity streamed comparison in action!

---

## 🔑 Setting up Google Cloud Credentials

To switch from **Sandbox Mode** to **Live Model Mode**, untoggle the "Sandbox Mode" switch in the sidebar, click the **GCP Credentials** button on the top right, and configure your settings.

### Method 1: Short-Lived OAuth Access Token (Fastest for testing)
Use this if you have the Google Cloud SDK (`gcloud`) installed on your Mac:

1. Open your Mac terminal and print a fresh token:
   ```bash
   gcloud auth print-access-token
   ```
2. Copy the output token string (starts with `ya29.c...`).
3. Paste it in the **OAuth 2.0 Access Token** field, fill in your **GCP Project ID**, select your **GCP Region**, and click **Save Settings**.

> ⚠️ **Note**: Access tokens generated via `gcloud` expire after **1 hour**. You will need to re-print and paste a new token when it expires.

---

### Method 2: Service Account JSON Key (Recommended for long-term use)
This method allows the local server to sign assertions and obtain/refresh tokens automatically behind the scenes.

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Navigate to **IAM & Admin** > **Service Accounts**.
3. Click **Create Service Account**:
   - Provide a name (e.g., `vertex-playground-user`).
   - Grant the role: **Vertex AI User** (`roles/aiplatform.user`).
   - Click Done.
4. Click on your newly created Service Account, go to the **Keys** tab, click **Add Key** > **Create New Key**, select **JSON**, and download the file.
5. Open the downloaded `.json` file in a text editor, copy its entire contents, and paste it into the **Service Account JSON File / Key Contents** textbox in the Playground Credentials panel.
6. Enter your **GCP Project ID**, select your region, and click **Save Settings**.

---

## 📊 Supported Models & Pricing Reference

| Provider | Model ID | Input Rate (per 1M) | Output Rate (per 1M) |
| :--- | :--- | :--- | :--- |
| **Google** | `gemini-2.0-flash-exp` | $0.075 | $0.30 |
| **Google** | `gemini-1.5-flash-001` | $0.075 | $0.30 |
| **Google** | `gemini-1.5-pro-001` | $1.25 | $5.00 |
| **Anthropic** | `claude-3-5-sonnet-v2` | $3.00 | $15.00 |
| **Anthropic** | `claude-3-5-haiku` | $0.80 | $4.00 |
| **Anthropic** | `claude-3-opus` | $15.00 | $75.00 |

*Costs are calculated dynamically on the fly based on these rate specifications as tokens stream down.*
