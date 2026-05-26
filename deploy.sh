#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
PROJECT_ID="mokabir-project-argolis"
SERVICE_NAME="vertex-ai-playground"
REGION="us-central1"

echo "======================================================="
echo "🚀 Vertex AI Playground — Cloud Run Deployment Script"
echo "======================================================="
echo "This script will deploy your local playground directly to Google Cloud Run."
echo "No local Docker installation is required as we use Google Cloud Build."
echo "-------------------------------------------------------"

# Check if gcloud is installed and auto-locate if missing in PATH
if ! command -v gcloud &> /dev/null; then
    for path_candidate in "$HOME/Documents/google-cloud-sdk/bin" "$HOME/Downloads/google-cloud-sdk/bin" "$HOME/google-cloud-sdk/bin"; do
        if [ -d "$path_candidate" ]; then
            echo "ℹ️ Auto-detected gcloud installation at: $path_candidate"
            export PATH="$path_candidate:$PATH"
            break
        fi
    done
fi

# Select a compatible Python executable (3.10 - 3.14) for gcloud to prevent startup errors
for python_candidate in "$PWD/python/bin/python3" "python3.12" "python3.11" "python3.10" "python3" "/opt/homebrew/bin/python3" "/usr/local/bin/python3"; do
    if command -v "$python_candidate" &> /dev/null; then
        py_ver=$("$python_candidate" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "")
        if [[ "$py_ver" =~ ^3\.(10|11|12|13|14)$ ]]; then
            echo "ℹ️ Auto-detected compatible Python version ($py_ver) at: $(command -v $python_candidate)"
            export CLOUDSDK_PYTHON=$(command -v "$python_candidate")
            break
        fi
    fi
done

if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: 'gcloud' CLI is not installed on your system or found in PATH."
    echo "👉 Please install the Google Cloud SDK first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Ensure user is logged in
echo "🔑 Checking Google Cloud authentication..."
ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
if [ -z "$ACCOUNT" ]; then
    echo "⚠️ Not authenticated. Running 'gcloud auth login'..."
    gcloud auth login
fi

# Set the active project
echo "🎯 Setting active GCP project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Enable required Google APIs
echo "🔌 Enabling required GCP APIs (Cloud Run, Cloud Build, Artifact Registry)..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

# Auto-configure IAM policy for the Compute default service account to resolve Storage 403 errors
echo "🔑 Granting Storage Object Viewer permission to the default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:244382989395-compute@developer.gserviceaccount.com" \
    --role="roles/storage.objectViewer" \
    --quiet || echo "⚠️ Warning: Could not auto-assign IAM role. Proceeding..."

# Auto-configure Cloud Logging access to ensure build logs write correctly
echo "🔑 Granting Logs Writer permission to the default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:244382989395-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter" \
    --quiet || echo "⚠️ Warning: Could not auto-assign Logging IAM role. Proceeding..."

# Auto-configure Artifact Registry access to ensure build images can push successfully
echo "🔑 Granting Artifact Registry Writer permission to the default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:244382989395-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.writer" \
    --quiet || echo "⚠️ Warning: Could not auto-assign Artifact Registry IAM role. Proceeding..."

# Auto-configure Vertex AI User access to allow the service to call live models
echo "🔑 Granting Vertex AI User permission to the default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:244382989395-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user" \
    --quiet || echo "⚠️ Warning: Could not auto-assign Vertex AI IAM role. Proceeding..."

echo "📦 Preparing files..."
# Make sure server.js PORT uses process.env.PORT || 4000
# (Already handled in the latest server.js update)

# Build and deploy using Google Cloud Build (Server-side compilation)
echo "🚀 Deploying to Google Cloud Run..."
echo "-------------------------------------------------------"
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars="SANDBOX_MODE=true"

echo "-------------------------------------------------------"
echo "✅ Deployment Successful!"
echo "👉 You can manage and monitor your service in the Google Cloud Console:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
echo "======================================================="
