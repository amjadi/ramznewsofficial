/**
 * manual-trigger.js - Manual Trigger for RamzNews Gen 2
 * 
 * This script provides endpoints to manually trigger the RSS feed fetching
 * and processing functions for testing and debugging.
 */

import { fetchFeeds } from './fetchFeeds.js';
import { formatPost } from './formatter.js';
import { sendToTelegram } from './sendTelegram.js';
import { CONFIG } from './config.js';

/**
 * Manually trigger feed fetching
 */
export async function triggerFetchFeeds(env) {
  try {
    console.log('Manually triggering feed fetch...');
    const result = await fetchFeeds(env);
    return {
      status: 'success',
      message: 'Feed fetch triggered successfully',
      result: result
    };
  } catch (error) {
    console.error('Error triggering feed fetch:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Manually process queue
 */
export async function processQueue(env) {
  try {
    console.log('Manually processing queue...');
    
    // Get pending items from the queue
    const queueKey = CONFIG.STORAGE.QUEUE_KEY;
    const queueData = await env.POST_TRACKER.get(queueKey, { type: 'json' });
    
    if (!queueData || !Array.isArray(queueData.items) || queueData.items.length === 0) {
      return {
        status: 'empty',
        message: 'Queue is empty, nothing to process'
      };
    }
    
    // Get items for processing
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
    
    console.log(`Processing ${itemsToProcess.length} items from queue`);
    
    // Process each item
    const results = [];
    for (const item of itemsToProcess) {
      try {
        console.log(`Formatting item: ${item.id}`);
        const formattedPost = await formatPost(item, env);
        
        if (formattedPost) {
          // Enhanced validation before sending
          console.log(`Validating content before sending: ${item.id}`);
          
          // Additional custom validation for incomplete content
          const contentText = formattedPost.telegram_text || '';
          const hasSuspiciousPatterns = /\[\.\.\.\]|\[…\]|The post|wp-content|Read more|\bPost:/.test(contentText);
          const endsWithEllipsis = contentText.trim().endsWith('...');
          const lastParagraph = contentText.split('\n\n').pop() || '';
          const endsAbruptly = lastParagraph.trim().match(/[^\.\?!]$/) && !lastParagraph.includes('@ramznewsofficial');
          
          if (hasSuspiciousPatterns || endsWithEllipsis || endsAbruptly) {
            console.error(`Item ${item.id} has suspicious content patterns, skipping sending`);
            results.push({
              id: item.id,
              status: 'error',
              message: 'Post contains incomplete content patterns'
            });
            continue;
          }
          
          console.log(`Sending item to Telegram: ${item.id}`);
          const sendResult = await sendToTelegram(formattedPost, env);
          results.push({
            id: item.id,
            status: 'success',
            telegram_result: sendResult
          });
        } else {
          results.push({
            id: item.id,
            status: 'error',
            message: 'Formatting failed'
          });
        }
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        results.push({
          id: item.id,
          status: 'error',
          message: error.message
        });
      }
    }
    
    return {
      status: 'success',
      processed_count: itemsToProcess.length,
      results: results
    };
  } catch (error) {
    console.error('Error processing queue:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Test post formatting without sending
 */
export async function testFormatPost(env, testItem) {
  try {
    console.log('Testing post formatting...');
    
    // If no test item provided, create one
    if (!testItem) {
      testItem = {
        id: 'test-item-' + Date.now(),
        title: 'تست بررسی قیمت بیت‌کوین و تحلیل روند بازار ارزهای دیجیتال',
        description: 'در تازه‌ترین تحولات بازار ارزهای دیجیتال، قیمت بیت‌کوین امروز با افزایش ۵ درصدی همراه بود و به مرز ۶۸ هزار دلار رسید. تحلیلگران معتقدند این افزایش قیمت پس از هفته‌ها نوسان می‌تواند نشانه‌ای از آغاز روند صعودی جدید باشد. همزمان، حجم معاملات در صرافی‌های بزرگ نیز افزایش یافته است.',
        link: 'https://example.com/crypto-news',
        pubDate: new Date().toISOString(),
        source: 'تست خبر رمزارز'
      };
    }
    
    // Process the item with AI formatter
    console.log(`Formatting test item: ${testItem.id}`);
    const formattedPost = await formatPost(testItem, env);
    
    // Perform detailed validation
    const validationResults = validateFormattedPost(formattedPost);
    
    return {
      status: 'success',
      original_item: testItem,
      formatted_post: formattedPost,
      validation: validationResults,
      would_be_sent: validationResults.isValid
    };
  } catch (error) {
    console.error('Error testing post formatting:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Helper function to validate a formatted post with detailed diagnostics
 */
function validateFormattedPost(post) {
  if (!post || !post.telegram_text) {
    return {
      isValid: false,
      reasons: ['Post is missing or has no text content']
    };
  }
  
  const text = post.telegram_text;
  const reasons = [];
  
  // Check structure
  const hasTitle = text.includes('<b>') && text.includes('</b>');
  if (!hasTitle) reasons.push('Missing bold title (should use <b> tags)');
  
  // Check bullet points
  const hasBulletPoints = text.includes('•') || text.includes('-') || text.includes('*');
  if (!hasBulletPoints) reasons.push('Missing bullet points (should use • character)');
  
  // Check hashtags
  const hasHashtags = text.includes('#');
  if (!hasHashtags) reasons.push('Missing hashtags');
  
  // Check signature
  const hasSignature = text.includes('@ramznewsofficial');
  if (!hasSignature) reasons.push('Missing signature (@ramznewsofficial)');
  
  // Check for incomplete content
  const endsWithIncomplete = text.endsWith('...') || 
                            text.includes('[...]') ||
                            text.includes('[…]');
  if (endsWithIncomplete) reasons.push('Content ends with incomplete marker (...)');
  
  // Check for WordPress artifacts
  const hasWordPressArtifacts = text.includes('The post') || 
                               text.includes('Read more') ||
                               text.includes('wp-') ||
                               text.includes('Post:');
  if (hasWordPressArtifacts) reasons.push('Contains WordPress/RSS artifacts');
  
  // Check for abruptly ending sentences
  const lastParagraph = text.split('\n\n').pop() || '';
  const endsAbruptly = lastParagraph.trim().match(/[^\.\?!]$/) && 
                      !lastParagraph.includes('@ramznewsofficial');
  if (endsAbruptly) reasons.push('Content ends abruptly without proper punctuation');
  
  // Check for HTML balance
  const htmlTagCount = (text.match(/<[^>]+>/g) || []).length;
  if (htmlTagCount % 2 !== 0) reasons.push('Unbalanced HTML tags');
  
  // Check for promotional content
  const hasPromotion = text.includes('http://') || 
                      text.includes('https://') ||
                      text.includes('www.');
  if (hasPromotion) reasons.push('Contains URLs or promotional content');
  
  return {
    isValid: reasons.length === 0,
    reasons: reasons,
    contentLength: text.length,
    hasTitle,
    hasBulletPoints,
    hasHashtags,
    hasSignature,
    hasIncompleteMarkers: endsWithIncomplete,
    hasWordPressArtifacts,
    endsAbruptly,
    hasPromotion
  };
}

/**
 * Check queue status
 */
export async function checkQueueStatus(env) {
  try {
    // Get queue key from config
    const queueKey = CONFIG.STORAGE.QUEUE_KEY;
    const queueData = await env.POST_TRACKER.get(queueKey, { type: 'json' });
    
    if (!queueData) {
      return {
        status: 'empty',
        message: 'Queue is empty or does not exist'
      };
    }
    
    return {
      status: 'success',
      queue_length: queueData.items?.length || 0,
      last_updated: queueData.lastUpdated,
      data: queueData
    };
  } catch (error) {
    console.error('Error checking queue status:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Initialize queue with a test item
 */
export async function initializeQueue(env) {
  try {
    // Get queue key from config
    const queueKey = CONFIG.STORAGE.QUEUE_KEY;
    
    // Create a test item with real news content
    const testItem = {
      id: 'test-item-' + Date.now(),
      title: 'افزایش قیمت بیت‌کوین پس از یک هفته نوسان در بازار ارزهای دیجیتال',
      description: 'در تازه‌ترین تحولات بازار ارزهای دیجیتال، قیمت بیت‌کوین امروز با افزایش ۵ درصدی همراه بود و به مرز ۶۸ هزار دلار رسید. تحلیلگران معتقدند این افزایش قیمت پس از هفته‌ها نوسان می‌تواند نشانه‌ای از آغاز روند صعودی جدید باشد. همزمان، حجم معاملات در صرافی‌های بزرگ نیز افزایش یافته است. برخی کارشناسان این رشد را با تحولات اخیر در سیاست‌های بانک‌های مرکزی مرتبط می‌دانند، در حالی که دیگران بر تأثیر عوامل تکنیکال تاکید دارند.',
      link: 'https://example.com/crypto-news',
      pubDate: new Date().toISOString(),
      source: 'تست خبر رمزارز'
    };
    
    // Create the queue with the test item
    await env.POST_TRACKER.put(
      queueKey, 
      JSON.stringify({ 
        items: [testItem],
        lastUpdated: new Date().toISOString()
      })
    );
    
    return {
      status: 'success',
      message: 'Queue initialized with test item',
      test_item: testItem
    };
  } catch (error) {
    console.error('Error initializing queue:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
} 