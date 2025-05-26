/**
 * setupWebhook.js - Telegram Webhook Setup for RamzNews Gen 2
 * 
 * This script sets up a webhook for the Telegram bot to receive updates directly
 * from Telegram servers to the Cloudflare Worker endpoint.
 */

import { CONFIG } from './config.js';

// Telegram API Base URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Set up a webhook for the Telegram bot
 * @param {string} workerUrl - The URL of the deployed worker
 * @returns {Promise<object>} - Result of the webhook setup
 */
export async function setupWebhook(workerUrl) {
  try {
    console.log(`Setting up webhook to ${workerUrl}`);
    
    // Get Telegram bot token from config
    const botToken = CONFIG.TELEGRAM.BOT_TOKEN;
    
    // Construct webhook URL (appending /webhook to the worker URL)
    const webhookUrl = `${workerUrl}/webhook`;
    
    // Set up the webhook parameters
    const params = {
      url: webhookUrl,
      allowed_updates: ['message', 'channel_post'],
      drop_pending_updates: true
    };
    
    // Send the request to set up the webhook
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }
    
    console.log('Webhook set up successfully:', result);
    return result;
  } catch (error) {
    console.error('Error setting up webhook:', error);
    throw error;
  }
}

/**
 * Get current webhook info for the Telegram bot
 * @returns {Promise<object>} - Current webhook info
 */
export async function getWebhookInfo() {
  try {
    // Get Telegram bot token from config
    const botToken = CONFIG.TELEGRAM.BOT_TOKEN;
    
    // Send the request to get webhook info
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/getWebhookInfo`);
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }
    
    console.log('Current webhook info:', result);
    return result;
  } catch (error) {
    console.error('Error getting webhook info:', error);
    throw error;
  }
}

/**
 * Delete current webhook for the Telegram bot
 * @returns {Promise<object>} - Result of the webhook deletion
 */
export async function deleteWebhook() {
  try {
    // Get Telegram bot token from config
    const botToken = CONFIG.TELEGRAM.BOT_TOKEN;
    
    // Send the request to delete webhook
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ drop_pending_updates: true })
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }
    
    console.log('Webhook deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    throw error;
  }
} 