# Ramz News Cloudflare Worker

A Cloudflare Worker that fetches content from various RSS feeds, processes and sanitizes the content, and posts it to a Telegram channel.

## Features

- Automatically fetches content from multiple RSS feeds
- Extracts full content from article pages
- Cleans and sanitizes HTML content
- Detects and prevents duplicate posts
- Posts content to a Telegram channel
- Runs on a scheduled basis via Cloudflare Workers

## RSS Feeds

The worker currently fetches news from:
- BBC Persian
- DW Persian
- Euronews Persian
- Crypto Asriran
- Tejarat News

## Setup & Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account
- Telegram Bot Token (obtained from BotFather)

### Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

3. Login to Cloudflare with Wrangler:
   ```
   npx wrangler login
   ```

4. Create a KV namespace for storing post tracking information:
   ```
   npx wrangler kv:namespace create "POST_TRACKER"
   ```

5. Update the `wrangler.toml` file with the KV namespace ID from the previous step.

6. Optional: Create a preview KV namespace for development:
   ```
   npx wrangler kv:namespace create "POST_TRACKER" --preview
   ```

### Deployment

To deploy the worker to Cloudflare:

```
npm run deploy
```

### Development

To run the worker locally for development:

```
npm run dev
```

## API Endpoints

The worker exposes several HTTP endpoints:

- `/manual-run`: Manually trigger the RSS processing
- `/status`: Check the worker status
- `/clear-old`: Clear old post records from KV storage

## Configuration

Main configuration variables are at the top of `src/index.js`:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `CHANNEL_USERNAME`: Your Telegram channel username (e.g., @ramznewsofficial)
- `MAX_SAVED_MESSAGES`: Maximum number of message IDs to store
- `DELAY_BETWEEN_POSTS`: Delay between posting messages (in milliseconds)
- `STORAGE_TTL_DAYS`: How long to keep message IDs in storage
- `RSS_FEEDS`: Array of RSS feed URLs and their sources

## License

MIT 