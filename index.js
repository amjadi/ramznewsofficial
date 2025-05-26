/**
 * RamzNews Gen 2 - Main Entry Point
 * 
 * This file serves as the main router for the Cloudflare Worker,
 * handling different types of requests and scheduled events.
 */

import { fetchFeeds } from './fetchFeeds.js';
import { formatWithAI } from './aiFormatter.js';
import { sendToTelegram } from './sendTelegram.js';
import { setupWebhook, getWebhookInfo, deleteWebhook } from './setupWebhook.js';
import { triggerFetchFeeds, checkQueueStatus, initializeQueue, processQueue } from './manual-trigger.js';
import { CONFIG } from './config.js';

/**
 * Main worker event handler
 */
export default {
  // Handle all incoming HTTP requests
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Admin dashboard or health check endpoints can be added here
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle webhook from Telegram
    if (path === '/webhook') {
      return handleTelegramWebhook(request, env);
    }
    
    // Setup webhook endpoint
    if (path === '/setup-webhook') {
      return handleSetupWebhook(request, url, env);
    }
    
    // Get webhook info endpoint
    if (path === '/webhook-info') {
      const info = await getWebhookInfo();
      return new Response(JSON.stringify(info), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete webhook endpoint
    if (path === '/delete-webhook') {
      const result = await deleteWebhook();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Manual trigger endpoints
    if (path === '/trigger-fetch') {
      const result = await triggerFetchFeeds(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/check-queue') {
      const result = await checkQueueStatus(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/init-queue') {
      const result = await initializeQueue(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/process-queue') {
      const result = await processQueue(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default response
    return new Response('RamzNews Gen 2 is running!', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  // Handle scheduled events (cron triggers)
  async scheduled(event, env, ctx) {
    try {
      console.log(`Scheduled worker triggered at ${new Date().toISOString()}`);
      
      // Determine which cron job is running based on cron expression
      const cronExpression = event.cron;
      
      if (cronExpression === '*/10 * * * *') {
        // Every 10 minutes: Fetch RSS feeds
        await fetchFeeds(env);
      } else {
        // Every minute: Process queue and send to Telegram
        
        // Step 1: Get pending items from the queue
        const pendingItems = await getPendingItems(env);
        
        if (pendingItems.length === 0) {
          console.log('No pending items in queue');
          return new Response('No pending items in queue');
        }
        
        console.log(`Processing ${pendingItems.length} pending items`);
        
        for (const item of pendingItems) {
          try {
            // Step 2: Format with AI
            console.log(`Formatting item: ${item.id}`);
            const formattedPost = await formatWithAI(item, env);
            
            // Step 3: Send to Telegram
            if (formattedPost) {
              console.log(`Sending item to Telegram: ${item.id}`);
              await sendToTelegram(formattedPost, env);
            }
          } catch (itemError) {
            console.error(`Error processing item: ${JSON.stringify(item)}`, itemError);
          }
        }
      }
      
      return new Response('Scheduled task completed');
    } catch (error) {
      console.error('Error in scheduled event:', error);
      return new Response('Error in scheduled task', { status: 500 });
    }
  }
};

/**
 * Handle incoming webhook requests from Telegram
 */
async function handleTelegramWebhook(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    // Parse the request body
    const update = await request.json();
    console.log('Received update from Telegram:', update);
    
    // Here you could process commands or interact with users
    // For now we'll just acknowledge the update
    
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

/**
 * Handle setting up the webhook
 */
async function handleSetupWebhook(request, url, env) {
  try {
    // Get the base URL (without the path)
    const baseUrl = url.origin;
    
    // Set up the webhook
    const result = await setupWebhook(baseUrl);
    
    return new Response(JSON.stringify({
      status: 'success',
      webhook_url: `${baseUrl}/webhook`,
      result: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error setting up webhook:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get pending items from the queue for processing
 */
async function getPendingItems(env) {
  try {
    // Get queue key from config
    const queueKey = CONFIG.STORAGE.QUEUE_KEY;
    const queueData = await env.POST_TRACKER.get(queueKey, { type: 'json' });
    
    if (!queueData || !Array.isArray(queueData.items) || queueData.items.length === 0) {
      return [];
    }
    
    // Get items for processing (limited by batch size from config)
    const batchSize = CONFIG.PROCESSING.BATCH_SIZE;
    const itemsToProcess = queueData.items.slice(0, batchSize);
    
    // Update the queue by removing the items we're processing
    await env.POST_TRACKER.put(
      queueKey, 
      JSON.stringify({ 
        items: queueData.items.slice(batchSize),
        lastUpdated: new Date().toISOString()
      })
    );
    
    return itemsToProcess;
  } catch (error) {
    console.error('Error getting pending items:', error);
    return [];
  }
} 