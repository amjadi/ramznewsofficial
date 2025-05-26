# RamzNews Gen2 - Quick Deployment Guide

We've encountered network connectivity issues with Cloudflare. Here's what you need to do once connectivity is restored:

## Deployment Steps

1. Login to Cloudflare:
   ```
   npx wrangler login
   ```

2. Create KV Namespace:
   ```
   npx wrangler kv:namespace create POST_TRACKER
   ```
   Then copy the ID to wrangler.toml

3. (Optional) Create D1 Database:
   ```
   npx wrangler d1 create ramznews-db
   npx wrangler d1 execute ramznews-db --file=./db_schema.sql
   ```

4. Set Secret Values:
   ```
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put OPENROUTER_API_KEY
   ```

5. Deploy:
   ```
   npx wrangler deploy
   ```

## Network Troubleshooting

If you continue to have connectivity issues:
- Check your VPN/proxy settings
- Check firewall rules
- Try setting proxy environment variables:
  ```
  $env:HTTP_PROXY="http://proxy.example.com:8080"
  $env:HTTPS_PROXY="http://proxy.example.com:8080"
  ```

For full instructions, see DEPLOY.md 