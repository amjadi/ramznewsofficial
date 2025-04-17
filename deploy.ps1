# PowerShell script for deploying the Ramz News worker

# Check if wrangler is installed
$wranglerInstalled = $null
try {
    $wranglerInstalled = Get-Command npx wrangler -ErrorAction SilentlyContinue
} catch {
    $wranglerInstalled = $null
}

if (-not $wranglerInstalled) {
    Write-Host "Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
}

# Check if already logged in
Write-Host "Checking Cloudflare login status..."
$loggedIn = $null
try {
    $output = npx wrangler whoami 2>&1
    $loggedIn = $output | Select-String -Pattern "You are logged in" -Quiet
} catch {
    $loggedIn = $false
}

if (-not $loggedIn) {
    Write-Host "Not logged in to Cloudflare. Please login:"
    npx wrangler login
}

# Ensure KV namespace exists
Write-Host "Checking if KV namespace exists..."
$kvExists = $null
try {
    $output = npx wrangler kv:namespace list
    $kvExists = $output | Select-String -Pattern "POST_TRACKER" -Quiet
} catch {
    $kvExists = $false
}

if (-not $kvExists) {
    Write-Host "Creating KV namespace for POST_TRACKER..."
    $namespaceOutput = npx wrangler kv:namespace create "POST_TRACKER"
    
    Write-Host "Updating wrangler.toml with KV namespace ID..."
    # Extract the ID from the output
    $namespaceOutput -match 'id = "([^"]+)"' | Out-Null
    $namespaceId = $Matches[1]
    
    # Update the wrangler.toml file
    $wranglerConfig = Get-Content "wrangler.toml" -Raw
    $wranglerConfig = $wranglerConfig -replace "POST_TRACKER_ID", $namespaceId
    
    Write-Host "Creating preview KV namespace..."
    $previewOutput = npx wrangler kv:namespace create "POST_TRACKER" --preview
    
    # Extract the preview ID from the output
    $previewOutput -match 'id = "([^"]+)"' | Out-Null
    $previewId = $Matches[1]
    
    # Update the wrangler.toml file with preview ID
    $wranglerConfig = $wranglerConfig -replace "POST_TRACKER_PREVIEW_ID", $previewId
    
    # Write updated config back to file
    Set-Content -Path "wrangler.toml" -Value $wranglerConfig
    
    Write-Host "KV namespaces created and wrangler.toml updated!"
} else {
    Write-Host "KV namespace already exists."
}

# Deploy the worker
Write-Host "Deploying Ramz News worker to Cloudflare..."
npx wrangler deploy

Write-Host "Deployment complete! Your worker is now running."
Write-Host "You can trigger a manual run by visiting: https://ramznews-worker.your-subdomain.workers.dev/manual-run"
Write-Host "Check worker status at: https://ramznews-worker.your-subdomain.workers.dev/status" 