#!/bin/bash

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
fi

# Check if already logged in
echo "Checking Cloudflare login status..."
LOGGED_IN=$(wrangler whoami 2>&1 | grep "You are logged in" || echo "")

if [[ -z "$LOGGED_IN" ]]; then
    echo "Not logged in to Cloudflare. Please login:"
    wrangler login
fi

# Ensure KV namespace exists
echo "Checking if KV namespace exists..."
KV_EXISTS=$(wrangler kv:namespace list | grep "POST_TRACKER" || echo "")

if [[ -z "$KV_EXISTS" ]]; then
    echo "Creating KV namespace for POST_TRACKER..."
    NAMESPACE_OUTPUT=$(wrangler kv:namespace create "POST_TRACKER")
    
    echo "Updating wrangler.toml with KV namespace ID..."
    # Extract the ID from the output
    NAMESPACE_ID=$(echo "$NAMESPACE_OUTPUT" | grep -oP 'id = "\K[^"]+')
    
    # Update the wrangler.toml file
    sed -i "s/POST_TRACKER_ID/$NAMESPACE_ID/g" wrangler.toml
    
    echo "Creating preview KV namespace..."
    PREVIEW_OUTPUT=$(wrangler kv:namespace create "POST_TRACKER" --preview)
    
    # Extract the preview ID from the output
    PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+')
    
    # Update the wrangler.toml file
    sed -i "s/POST_TRACKER_PREVIEW_ID/$PREVIEW_ID/g" wrangler.toml
    
    echo "KV namespaces created and wrangler.toml updated!"
else
    echo "KV namespace already exists."
fi

# Deploy the worker
echo "Deploying Ramz News worker to Cloudflare..."
wrangler deploy

echo "Deployment complete! Your worker is now running."
echo "You can trigger a manual run by visiting: https://ramznews-worker.your-subdomain.workers.dev/manual-run"
echo "Check worker status at: https://ramznews-worker.your-subdomain.workers.dev/status" 