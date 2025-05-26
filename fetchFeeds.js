/**
 * fetchFeeds.js - RSS Feed Fetcher for RamzNews Gen 2
 * 
 * This module is responsible for:
 * 1. Fetching RSS feeds from configured sources
 * 2. Parsing the feeds (both RSS and Atom formats)
 * 3. Extracting key information
 * 4. Storing the items in a queue for processing
 */

import { generatePostIdentifier } from './shared/identifier.js';
import { sanitizeHtml } from './shared/sanitize.js';
import { CONFIG } from './config.js';

/**
 * Main function to fetch all configured RSS feeds
 */
export async function fetchFeeds(env) {
  try {
    console.log('Starting feed fetch process');
    
    // Get feed URLs from config
    const feedUrls = CONFIG.RSS_FEEDS;
    
    console.log(`Processing ${feedUrls.length} feeds`);
    
    // Process each feed in parallel
    const results = await Promise.allSettled(
      feedUrls.map(url => processFeed(url, env))
    );
    
    // Count successful and failed feeds
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Feed processing complete. Success: ${successful}, Failed: ${failed}`);
    
    return { successful, failed };
  } catch (error) {
    console.error('Error in fetchFeeds:', error);
    throw error;
  }
}

/**
 * Process a single RSS feed
 */
async function processFeed(feedUrl, env) {
  try {
    console.log(`Fetching feed: ${feedUrl}`);
    
    // Fetch the feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'RamzNews-Bot/2.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'
      },
      cf: {
        cacheTtl: 300, // Cache for 5 minutes
        cacheEverything: true
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Determine feed type and extract items using regex
    let items = [];
    if (text.includes('<rss') || text.includes('<channel>')) {
      // RSS feed
      items = extractRssItemsWithRegex(text, feedUrl);
    } else if (text.includes('<feed')) {
      // Atom feed
      items = extractAtomItemsWithRegex(text, feedUrl);
    } else if (text.includes('<rdf:RDF')) {
      // RDF feed (DW)
      items = extractRdfItemsWithRegex(text, feedUrl);
    } else {
      throw new Error('Unknown feed format');
    }
    
    console.log(`Extracted ${items.length} items from feed`);
    
    // Filter out items we've already processed
    const newItems = await filterNewItems(items, env);
    console.log(`${newItems.length} new items to queue`);
    
    // Add new items to the processing queue
    if (newItems.length > 0) {
      await addItemsToQueue(newItems, env);
    }
    
    return { processed: items.length, new: newItems.length };
  } catch (error) {
    console.error(`Error processing feed ${feedUrl}:`, error);
    throw error;
  }
}

/**
 * Extract RSS feed items using regex
 */
function extractRssItemsWithRegex(text, feedUrl) {
  try {
    // Extract source/title
    const sourceMatch = text.match(/<channel>[\s\S]*?<title>(.*?)<\/title>/);
    const source = sourceMatch ? sourceMatch[1] : new URL(feedUrl).hostname;
    
    // Extract all items
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const itemMatches = text.match(itemRegex) || [];
    
    return itemMatches.map(itemText => {
      // Extract item properties
      const titleMatch = itemText.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemText.match(/<link>(.*?)<\/link>/);
      const descMatch = itemText.match(/<description>([\s\S]*?)<\/description>/);
      const dateMatch = itemText.match(/<pubDate>(.*?)<\/pubDate>/);
      
      const title = titleMatch ? titleMatch[1] : '';
      const link = linkMatch ? linkMatch[1] : '';
      const description = descMatch ? sanitizeHtml(descMatch[1]) : '';
      const pubDate = dateMatch ? dateMatch[1] : '';
      
      // Generate a unique identifier for this item
      const id = generatePostIdentifier(title, link);
      
      return {
        id,
        title,
        link,
        description,
        pubDate,
        source,
        timestamp: new Date().toISOString(),
        feedType: 'rss'
      };
    });
  } catch (error) {
    console.error('Error extracting RSS items with regex:', error);
    return [];
  }
}

/**
 * Extract Atom feed items using regex
 */
function extractAtomItemsWithRegex(text, feedUrl) {
  try {
    // Extract source/title
    const sourceMatch = text.match(/<feed[\s\S]*?<title>(.*?)<\/title>/);
    const source = sourceMatch ? sourceMatch[1] : new URL(feedUrl).hostname;
    
    // Extract all entries
    const entryRegex = /<entry>[\s\S]*?<\/entry>/g;
    const entryMatches = text.match(entryRegex) || [];
    
    return entryMatches.map(entryText => {
      // Extract entry properties
      const titleMatch = entryText.match(/<title>(.*?)<\/title>/);
      const linkMatch = entryText.match(/<link[^>]*href="([^"]*)"[^>]*>/);
      const contentMatch = entryText.match(/<content[^>]*>([\s\S]*?)<\/content>/) || 
                          entryText.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
      const dateMatch = entryText.match(/<published>(.*?)<\/published>/) || 
                       entryText.match(/<updated>(.*?)<\/updated>/);
      
      const title = titleMatch ? titleMatch[1] : '';
      const link = linkMatch ? linkMatch[1] : '';
      const content = contentMatch ? sanitizeHtml(contentMatch[1]) : '';
      const published = dateMatch ? dateMatch[1] : '';
      
      // Generate a unique identifier for this item
      const id = generatePostIdentifier(title, link);
      
      return {
        id,
        title,
        link,
        description: content,
        pubDate: published,
        source,
        timestamp: new Date().toISOString(),
        feedType: 'atom'
      };
    });
  } catch (error) {
    console.error('Error extracting Atom items with regex:', error);
    return [];
  }
}

/**
 * Extract RDF feed items using regex
 */
function extractRdfItemsWithRegex(text, feedUrl) {
  try {
    // Extract source/title
    const sourceMatch = text.match(/<title>(.*?)<\/title>/);
    const source = sourceMatch ? sourceMatch[1] : new URL(feedUrl).hostname;
    // Extract all items
    const itemRegex = /<item[\s\S]*?<\/item>/g;
    const itemMatches = text.match(itemRegex) || [];
    return itemMatches.map(itemText => {
      const titleMatch = itemText.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemText.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = itemText.match(/<description>([\s\S]*?)<\/description>/);
      const dateMatch = itemText.match(/<dc:date>([\s\S]*?)<\/dc:date>/);
      const subjectMatch = itemText.match(/<dc:subject>([\s\S]*?)<\/dc:subject>/);
      const langMatch = itemText.match(/<dc:language>([\s\S]*?)<\/dc:language>/);
      const idMatch = itemText.match(/<dwsyn:contentID>([\s\S]*?)<\/dwsyn:contentID>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const description = descMatch ? sanitizeHtml(descMatch[1]) : '';
      const pubDate = dateMatch ? dateMatch[1].trim() : '';
      const category = subjectMatch ? subjectMatch[1].trim() : '';
      const language = langMatch ? langMatch[1].trim() : '';
      const id = idMatch ? idMatch[1].trim() : generatePostIdentifier(title, link);
      // فقط اگر موضوع سیاست یا ایران بود نگه دار
      if (category !== 'سیاست' && category !== 'ایران') return null;
      return {
        id,
        title,
        link,
        description,
        pubDate,
        category,
        language,
        source,
        timestamp: new Date().toISOString(),
        feedType: 'rdf'
      };
    }).filter(item => item !== null);
  } catch (error) {
    console.error('Error extracting RDF items with regex:', error);
    return [];
  }
}

/**
 * Filter out items that have already been processed
 */
async function filterNewItems(items, env) {
  const newItems = [];
  
  for (const item of items) {
    const itemKey = `${CONFIG.STORAGE.ITEM_KEY_PREFIX}${item.id}`;
    const exists = await env.POST_TRACKER.get(itemKey);
    
    if (!exists) {
      newItems.push(item);
    }
  }
  
  return newItems;
}

/**
 * Add new items to the processing queue
 */
async function addItemsToQueue(newItems, env) {
  try {
    // Get the current queue
    const queueKey = CONFIG.STORAGE.QUEUE_KEY;
    const currentQueue = await env.POST_TRACKER.get(queueKey, { type: 'json' }) || { items: [] };
    
    // Add new items to the queue
    const updatedQueue = {
      items: [...currentQueue.items, ...newItems],
      lastUpdated: new Date().toISOString()
    };
    
    // Save the updated queue
    await env.POST_TRACKER.put(queueKey, JSON.stringify(updatedQueue));
    
    // Also mark each item as seen to avoid re-processing
    for (const item of newItems) {
      const itemKey = `${CONFIG.STORAGE.ITEM_KEY_PREFIX}${item.id}`;
      await env.POST_TRACKER.put(itemKey, 'seen', {
        expirationTtl: CONFIG.STORAGE.TTL_SECONDS
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error adding items to queue:', error);
    throw error;
  }
}

/**
 * Filter and clean up a feed item before adding to the queue
 */
function processFeedItem(item, feedSource) {
  try {
    // Extract key fields
    const processedItem = {
      id: item.id || item.guid || generateItemId(item.title, item.link),
      title: cleanText(item.title),
      link: item.link,
      description: cleanText(item.description || item.summary || item.content),
      pubDate: item.pubDate || item.published || item.date || new Date().toISOString(),
      source: feedSource,
      category: item.category || ''
    };
    // فقط اگر موضوع سیاست یا ایران بود نگه دار
    if (processedItem.category && processedItem.category !== 'سیاست' && processedItem.category !== 'ایران') {
      console.log(`Skipping item with non-political/economic category: ${processedItem.id}`);
      return null;
    }
    
    // Skip items without essential data
    if (!processedItem.title || !processedItem.description) {
      console.log(`Skipping item with missing title or description: ${processedItem.id}`);
      return null;
    }
    
    // Skip very short content
    if (processedItem.description.length < 100) {
      console.log(`Skipping item with very short description: ${processedItem.id}`);
      return null;
    }
    
    // Skip items that appear to be purely promotional
    if (isPromotionalContent(processedItem.title, processedItem.description)) {
      console.log(`Skipping promotional content: ${processedItem.id}`);
      return null;
    }
    
    // Skip items that appear to be non-news content (e.g., website announcements)
    if (isNonNewsContent(processedItem.title, processedItem.description)) {
      console.log(`Skipping non-news content: ${processedItem.id}`);
      return null;
    }
    
    return processedItem;
  } catch (error) {
    console.error(`Error processing feed item:`, error);
    return null;
  }
}

/**
 * Check if content appears to be promotional rather than news
 */
function isPromotionalContent(title, description) {
  const promotionalPatterns = [
    /تخفیف\s+ویژه/i,
    /فروش\s+ویژه/i,
    /خرید\s+کنید/i,
    /ثبت\s+نام\s+کنید/i,
    /اشتراک\s+بخرید/i,
    /همین\s+الان\s+خرید\s+کنید/i,
    /مشاهده\s+محصولات/i,
    /\d+٪\s+تخفیف/i,
    /پیشنهاد\s+ویژه/i,
    /حراج/i
  ];
  
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Check for promotional patterns
  return promotionalPatterns.some(pattern => pattern.test(combinedText));
}

/**
 * Check if content appears to be non-news (website announcements, etc.)
 */
function isNonNewsContent(title, description) {
  const nonNewsPatterns = [
    /تعمیرات\s+سایت/i,
    /بروزرسانی\s+سایت/i,
    /قوانین\s+سایت/i,
    /درباره\s+ما/i,
    /تماس\s+با\s+ما/i,
    /^سوال\s+و\s+جواب/i,
    /^پرسش\s+و\s+پاسخ/i,
    /نظرسنجی/i
  ];
  
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Check for non-news patterns
  return nonNewsPatterns.some(pattern => pattern.test(combinedText));
}

/**
 * Clean up text content
 */
function cleanText(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // Convert HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ')
                  .replace(/&quot;/g, '"')
                  .replace(/&apos;/g, "'")
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>');
  
  // Remove HTML tags while preserving content
  cleaned = cleaned.replace(/<\/?(p|div|span|br|strong|b|i|em|u|ul|ol|li|h[1-6])[^>]*>/g, ' ')
                  .replace(/<\/?(a|img|iframe|script|style|link)[^>]*>/g, ' ');
  
  // Remove inline styles and classes
  cleaned = cleaned.replace(/\s+(style|class|id|width|height)=["'][^"']*["']/g, '');
  
  // Fix common UTF-8 issues
  cleaned = cleaned.replace(/â€œ/g, '"')
                  .replace(/â€/g, '"')
                  .replace(/â€™/g, "'")
                  .replace(/â€"/g, '—')
                  .replace(/â€"/g, '–');
  
  // Fix spacing issues
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove common feed clutter
  cleaned = cleaned.replace(/^مشاهده مطلب در سایت.*$|^ادامه مطلب.*$|^Read more.*$/gm, '');
  cleaned = cleaned.replace(/برای مشاهده کامل خبر اینجا کلیک کنید.*/g, '');
  cleaned = cleaned.replace(/The post.*appeared first on.*/g, '');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  
  return cleaned.trim();
}

/**
 * Process feed items and add them to the queue
 */
async function processFeedItems(items, feedSource, env) {
  try {
    console.log(`Processing ${items.length} items from ${feedSource}`);
    
    const queueKey = CONFIG.STORAGE.QUEUE_KEY;
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const item of items) {
      // Process and clean the item
      const processedItem = processFeedItem(item, feedSource);
      
      // Skip invalid or filtered items
      if (!processedItem) {
        skippedCount++;
        continue;
      }
      
      // Check if we've already seen this item
      const itemKey = `${CONFIG.STORAGE.ITEM_KEY_PREFIX}${processedItem.id}`;
      const existingItem = await env.POST_TRACKER.get(itemKey);
      
      if (existingItem) {
        console.log(`Item ${processedItem.id} already in tracker, skipping`);
        skippedCount++;
        continue;
      }
      
      // Get current queue
      let queue = [];
      const existingQueue = await env.POST_TRACKER.get(queueKey);
      
      if (existingQueue) {
        try {
          queue = JSON.parse(existingQueue);
        } catch (error) {
          console.error('Error parsing existing queue:', error);
          queue = [];
        }
      }
      
      // Add to queue
      queue.push(processedItem);
      
      // Mark as seen to prevent duplicate processing
      await env.POST_TRACKER.put(itemKey, 'seen', {
        expirationTtl: CONFIG.STORAGE.TTL_SECONDS
      });
      
      addedCount++;
    }
    
    // Save updated queue
    if (addedCount > 0) {
      const existingQueue = await env.POST_TRACKER.get(queueKey);
      let queue = [];
      
      if (existingQueue) {
        try {
          queue = JSON.parse(existingQueue);
        } catch (error) {
          console.error('Error parsing existing queue:', error);
          queue = [];
        }
      }
      
      // Get the newly processed items to add
      const processedItems = items
        .map(item => processFeedItem(item, feedSource))
        .filter(item => item !== null);
      
      // Filter out any items already in the queue (by ID)
      const queueIds = new Set(queue.map(item => item.id));
      const newItems = processedItems.filter(item => !queueIds.has(item.id));
      
      // Add new items to queue
      queue = [...queue, ...newItems];
      
      // Limit queue size if it gets too large
      if (queue.length > 100) {
        queue = queue.slice(-100); // Keep only the 100 most recent items
      }
      
      await env.POST_TRACKER.put(queueKey, JSON.stringify(queue));
    }
    
    console.log(`Feed ${feedSource} processed: ${addedCount} added, ${skippedCount} skipped`);
    return { added: addedCount, skipped: skippedCount };
  } catch (error) {
    console.error(`Error processing feed items from ${feedSource}:`, error);
    throw error;
  }
} 