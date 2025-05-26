/**
 * sendTelegram.js - Telegram Message Sender for RamzNews Gen 2
 * 
 * This module is responsible for:
 * 1. Taking formatted posts
 * 2. Sending them to the Telegram channel
 * 3. Handling media attachments
 * 4. Tracking sent posts to avoid duplicates
 */

import { CONFIG } from './config.js';

// Telegram API Base URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a formatted post to Telegram
 */
export async function sendToTelegram(post, env) {
  try {
    console.log(`Sending post to Telegram: ${post.id}`);
    
    // Get Telegram settings from config
    const botToken = CONFIG.TELEGRAM.BOT_TOKEN;
    const channelUsername = CONFIG.TELEGRAM.CHANNEL_USERNAME;
    
    // Validate post content before sending
    if (!validatePostBeforeSending(post)) {
      console.error(`Post ${post.id} failed validation, not sending`);
      return { success: false, reason: 'invalid_content' };
    }
    
    // Advanced duplicate detection - check both by ID and by content hash
    const isDuplicate = await checkForDuplicatePost(post, env);
    if (isDuplicate) {
      console.log(`Post ${post.id} detected as duplicate, skipping`);
      return { success: false, reason: 'duplicate_content' };
    }
    
    // Set up the message parameters
    let params = {
      chat_id: channelUsername,
      parse_mode: 'HTML',
      disable_web_page_preview: true, // We'll send our own image if available
    };
    
    // Decide whether to send image with caption or just text
    if (post.image_url) {
      // Try to send as photo with caption
      try {
        const result = await sendWithImage(botToken, params, post);
        
        // Mark as sent and save content hash
        await markPostAsSent(post, result.message_id, env);
        
        return { success: true, message_id: result.message_id, type: 'photo' };
      } catch (imageError) {
        console.warn('Failed to send with image, falling back to text only:', imageError);
        // Fall back to text-only
      }
    }
    
    // Send as text-only message
    params.text = post.telegram_text;
    const result = await sendTelegramRequest(botToken, 'sendMessage', params);
    
    // Mark as sent and save content hash
    await markPostAsSent(post, result.message_id, env);
    
    return { success: true, message_id: result.message_id, type: 'text' };
  } catch (error) {
    console.error(`Error sending post ${post.id} to Telegram:`, error);
    throw error;
  }
}

/**
 * Validate post content before sending
 */
function validatePostBeforeSending(post) {
  if (!post.telegram_text || post.telegram_text.length < 10) {
    console.error('Post text too short or missing');
    return false;
  }
  
  // Log the post for debugging
  console.log('Validating post:', post.id);
  console.log('Post content:', post.telegram_text);
  
  // Check if post appears to be complete
  const text = post.telegram_text;
  
  // Must have bold title (relaxed check)
  const hasBoldTitle = text.includes('<b>') && text.includes('</b>');
  console.log('Has bold title:', hasBoldTitle);
  if (!hasBoldTitle) {
    // If no HTML formatting found, automatically add bold formatting to the first line
    if (post.title) {
      const firstLine = post.title.trim();
      post.telegram_text = `<b>${firstLine}</b>\n\n${post.telegram_text}`;
      console.log('Added bold formatting to title');
      console.log('Updated content:', post.telegram_text);
    } else {
      console.error('Post missing bold title formatting and no title to format');
      return false;
    }
  }
  
  // Check for bullet points (relaxed)
  const hasBulletPoints = text.includes('•') || text.includes('-') || text.includes('*');
  console.log('Has bullet points:', hasBulletPoints);
  
  if (!hasBulletPoints) {
    console.error('Post missing bullet points');
    return false;
  }
  
  // Check for hashtags (relaxed)
  const hasHashtags = text.includes('#');
  console.log('Has hashtags:', hasHashtags);
  
  // If missing hashtags, automatically add some based on title
  if (!hasHashtags && post.title) {
    // Extract keywords from title
    const keywords = post.title.split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .map(word => `#${word.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w]/g, '')}`);
    
    // Add hashtags to the post
    if (keywords.length > 0) {
      post.telegram_text += `\n\n${keywords.join(' ')}`;
      console.log('Added hashtags based on title');
      console.log('Updated content:', post.telegram_text);
    }
  }
  
  // Check for signature
  const hasSignature = text.includes('@ramznewsofficial');
  console.log('Has signature:', hasSignature);
  
  // Add signature if missing
  if (!hasSignature) {
    post.telegram_text += '\n@ramznewsofficial | اخبار رمزی';
    console.log('Added missing signature');
    console.log('Updated content:', post.telegram_text);
  }
  
  // *** ENHANCED CHECKS FOR INCOMPLETE CONTENT ***
  
  // Check for incomplete content using various patterns
  const endsWithIncomplete = text.endsWith('...') || 
                            text.includes('[...]') ||
                            text.includes('The post') ||
                            text.includes('Post ') ||
                            text.includes('…'); // Other incomplete markers
  
  // Check for cut-off HTML tags
  const htmlTags = text.match(/<[^>]+>/g) || [];
  const openingTags = htmlTags.filter(tag => !tag.includes('/'));
  const closingTags = htmlTags.filter(tag => tag.includes('/'));
  const hasUnbalancedHtmlTags = openingTags.length !== closingTags.length;
  
  // Check for abruptly ending sentences (no punctuation at the end of last line)
  const lastParagraph = text.split('\n\n').pop() || '';
  const endsAbruptly = lastParagraph.trim().match(/[^\.\?!]$/) && 
                      !lastParagraph.includes('@ramznewsofficial');

  // Check for WordPress artifacts which indicate incomplete content
  const hasWordPressArtifacts = text.includes('The post') || 
                              text.includes('[…]') || 
                              text.includes('Read more') ||
                              text.includes('ادامه مطلب') ||
                              text.includes('wp-');
  
  console.log('Ends with incomplete:', endsWithIncomplete);
  console.log('Has unbalanced HTML tags:', hasUnbalancedHtmlTags);
  console.log('Ends abruptly:', endsAbruptly);
  console.log('Has WordPress artifacts:', hasWordPressArtifacts);
  
  const isIncomplete = endsWithIncomplete || hasUnbalancedHtmlTags || endsAbruptly || hasWordPressArtifacts;
  
  // Check for promotional content
  const hasPromotion = text.includes('یورونیوز') || 
                      text.includes('بی‌بی‌سی') || 
                      text.includes('مشاهده بیشتر') ||
                      text.includes('http://') || 
                      text.includes('https://') ||
                      text.includes('www.');
  console.log('Has promotion:', hasPromotion);
  
  // Check if text is too short to be a complete post
  const isTooShort = text.length < 150;
  console.log('Is too short:', isTooShort);
  
  // FINAL VALIDATION RESULT
  const isValid = hasSignature && !hasPromotion && !isIncomplete && !isTooShort;
  
  if (!isValid) {
    console.error('Post validation failed. Issues detected:', {
      missingSignature: !hasSignature,
      hasPromotion,
      isIncomplete,
      isTooShort
    });
  }
  
  // More relaxed validation for test purposes
  if (post.source === 'تست خبر رمزارز') {
    console.log('Test post detected, relaxing validation');
    return true;
  }
  
  // For real posts, ensure they have at least basic formatting and are complete
  return isValid;
}

/**
 * Check if a post is a duplicate based on ID or content
 */
async function checkForDuplicatePost(post, env) {
  // Check by ID
  const sentKey = `${CONFIG.STORAGE.SENT_KEY_PREFIX}${post.id}`;
  const alreadySent = await env.POST_TRACKER.get(sentKey);
  
  if (alreadySent) {
    return true;
  }
  
  // Generate content hash for fuzzy matching
  const contentHash = await generateContentHash(post.telegram_text);
  const hashKey = `hash:${contentHash}`;
  
  // Check if we've sent something with the same content hash recently
  const hashMatch = await env.POST_TRACKER.get(hashKey);
  
  return !!hashMatch;
}

/**
 * Generate a hash from post content for duplicate detection
 */
async function generateContentHash(text) {
  // Simplify text for comparison - remove formatting, extra spaces, signatures
  let simplified = text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/@ramznewsofficial.*$/m, '') // Remove signature
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Use SubtleCrypto for hashing if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(simplified);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Simple fallback hash for environments without SubtleCrypto
  let hash = 0;
  for (let i = 0; i < simplified.length; i++) {
    const char = simplified.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Mark a post as sent and save its content hash
 */
async function markPostAsSent(post, messageId, env) {
  // Mark the specific post ID as sent
  const sentKey = `${CONFIG.STORAGE.SENT_KEY_PREFIX}${post.id}`;
  await env.POST_TRACKER.put(sentKey, JSON.stringify({
    sent_at: new Date().toISOString(),
    message_id: messageId
  }), {
    expirationTtl: CONFIG.STORAGE.TTL_SECONDS
  });
  
  // Also store the content hash to prevent similar content
  const contentHash = await generateContentHash(post.telegram_text);
  const hashKey = `hash:${contentHash}`;
  
  await env.POST_TRACKER.put(hashKey, JSON.stringify({
    post_id: post.id,
    sent_at: new Date().toISOString()
  }), {
    expirationTtl: 7 * 24 * 60 * 60 // Store hash for 7 days
  });
}

/**
 * Send a post with an image and caption
 */
async function sendWithImage(botToken, params, post) {
  try {
    // First verify the image URL is accessible
    const imageUrlValid = await verifyImageUrl(post.image_url);
    if (!imageUrlValid) {
      console.warn(`Image URL ${post.image_url} is not valid or accessible`);
      // Fall back to text-only message
      const textParams = { ...params, text: post.telegram_text };
      return await sendTelegramRequest(botToken, 'sendMessage', textParams);
    }
    
    // Check if the text is too long for a caption (Telegram limit is 1024 chars)
    if (post.telegram_text.length > 1000) {
      // For long text, we send the image first, then the text as a separate message
      
      // 1. Send the image with a minimal caption
      // Extract the title for short caption
      const titleMatch = post.telegram_text.match(/<b>(.*?)<\/b>/);
      const shortCaption = titleMatch ? 
        titleMatch[0] + '\n\n@ramznewsofficial | اخبار رمزی' : 
        '@ramznewsofficial | اخبار رمزی';
      
      const photoParams = {
        ...params,
        photo: post.image_url,
        caption: shortCaption,
      };
      
      const photoResult = await sendTelegramRequest(botToken, 'sendPhoto', photoParams);
      
      // 2. Send the full text as a reply to the photo
      const textParams = {
        ...params,
        text: post.telegram_text,
        reply_to_message_id: photoResult.message_id
      };
      
      await sendTelegramRequest(botToken, 'sendMessage', textParams);
      
      // Return the photo message ID
      return photoResult;
    } else {
      // If text is short enough, send as single message with caption
      const photoParams = {
        ...params,
        photo: post.image_url,
        caption: post.telegram_text
      };
      
      // Try sending with photo directly from URL
      try {
        return await sendTelegramRequest(botToken, 'sendPhoto', photoParams);
      } catch (directPhotoError) {
        console.warn('Error sending photo directly from URL:', directPhotoError);
        
        // Fall back to downloading and uploading the image via form-data
        // (This would require multipart/form-data support which is not available in Cloudflare Workers)
        // For now, we'll just fall back to text-only message
        console.warn('Falling back to text-only message');
        const textParams = { ...params, text: post.telegram_text };
        return await sendTelegramRequest(botToken, 'sendMessage', textParams);
      }
    }
  } catch (error) {
    console.error('Error sending with image:', error);
    throw error;
  }
}

/**
 * Verify an image URL is valid and accessible
 */
async function verifyImageUrl(url) {
  if (!url) return false;
  
  try {
    // Try a HEAD request first to check if the image is accessible
    const response = await fetch(url, { 
      method: 'HEAD',
      cf: {
        cacheTtl: 300,
        cacheEverything: true
      }
    });
    
    // Check if the response is OK and the content type is an image
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType && contentType.startsWith('image/');
    }
    
    return false;
  } catch (error) {
    console.error(`Error verifying image URL ${url}:`, error);
    return false;
  }
}

/**
 * Send a request to the Telegram API
 */
async function sendTelegramRequest(botToken, method, params) {
  try {
    const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;
    
    const response = await fetch(url, {
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
    
    return result.result;
  } catch (error) {
    console.error(`Error calling Telegram API ${method}:`, error);
    throw error;
  }
} 