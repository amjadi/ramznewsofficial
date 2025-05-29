/**
 * formatter.js - Content Formatter for RamzNews Gen 2
 * 
 * This module replaces the AI-based formatter with a simpler rule-based formatter
 * that creates standardized Telegram posts without using LLM/AI.
 */

import { CONFIG } from './config.js';
import { extractHashtags } from './shared/hashtags.js';
import { categorizeContent } from './shared/category.js';

/**
 * Format a news item for Telegram posting (non-AI version)
 * 
 * @param {Object} item - The news item to format
 * @param {Object} env - Environment variables
 * @returns {Object} Formatted post ready for sending to Telegram
 */
export async function formatPost(item, env) {
  try {
    console.log(`Formatting item: ${item.title}`);
    
    // Format text without LLM
    const formattedText = createFormattedPost(item.title, item.description, item.source);
    
    // Extract image URL from the original article
    const imageUrl = await extractImageUrl(item.link);
    
    // Extract hashtags using the existing logic
    const hashtags = extractHashtags({
      title: item.title,
      description: item.description,
      source: item.source
    });
    
    // Create the final formatted post
    const post = {
      id: item.id,
      title: item.title,
      telegram_text: formattedText.trim(),
      image_url: imageUrl,
      hashtags,
      summary: '',
      source: item.source,
      original_link: item.link,
      processed_at: new Date().toISOString()
    };
    
    console.log(`Successfully formatted item: ${item.id}`);
    return post;
  } catch (error) {
    console.error(`Error formatting item ${item.id}:`, error);
    
    // Create a backup post if formatting fails
    const backupText = createBackupPost(item.title, item.description, item.source);
    return {
      id: item.id,
      title: item.title,
      telegram_text: backupText.trim(),
      image_url: null,
      hashtags: [],
      summary: '',
      source: item.source,
      original_link: item.link,
      processed_at: new Date().toISOString()
    };
  }
}

/**
 * Create a formatted post without using AI
 * 
 * @param {string} title - The news item title
 * @param {string} description - The news item description
 * @param {string} source - The source of the news
 * @returns {string} Formatted text for Telegram
 */
function createFormattedPost(title, description, source) {
  try {
    // Get a suitable emoji for the content
    const { emoji } = categorizeContent(title, description);
    
    // Clean up the description
    let cleanedDescription = description || '';
    
    // Remove HTML tags
    cleanedDescription = cleanedDescription.replace(/<[^>]+>/g, ' ');
    
    // Remove common artifacts
    cleanedDescription = cleanedDescription.replace(/\[\s*…\s*\]|\[\s*\.\.\.\s*\]|The post\b.*$/g, '');
    cleanedDescription = cleanedDescription.replace(/Read more.*$/g, '');
    cleanedDescription = cleanedDescription.replace(/\b(Post|Source):.+/g, '');
    cleanedDescription = cleanedDescription.replace(/https?:\/\/\S+|www\.\S+/g, '');
    
    // Normalize whitespace
    cleanedDescription = cleanedDescription.replace(/\s+/g, ' ').trim();
    
    // Extract key points from the description
    const sentences = extractSentences(cleanedDescription, 3);
    const bulletPoints = sentences.map(s => `• ${s.trim()}`).join('\n');
    
    // Get hashtags based on content
    const hashtagsArr = extractHashtags({ title, description: cleanedDescription, source });
    const hashtagString = hashtagsArr.map(tag => `#${tag}`).join(' ');
    
    // Construct the post with the standard format
    return `${emoji} <b>${title}</b>\n\n${bulletPoints}\n\n${hashtagString}\n@ramznewsofficial | اخبار رمزی`;
  } catch (error) {
    console.error('Error creating formatted post:', error);
    return createBackupPost(title, description, source);
  }
}

/**
 * Create a simple backup post when formatting fails
 * 
 * @param {string} title - The news item title
 * @param {string} description - The news item description
 * @param {string} source - The source of the news
 * @returns {string} A basic formatted post
 */
function createBackupPost(title, description, source) {
  // Extract a short summary from the description
  let summary = description || '';
  if (summary.length > 300) {
    // Find a good breaking point - end of a sentence
    const breakPoint = summary.substring(0, 300).lastIndexOf('.');
    if (breakPoint > 150) {
      summary = summary.substring(0, breakPoint + 1);
    } else {
      summary = summary.substring(0, 300) + '...';
    }
  }
  
  // Clean the summary
  summary = summary.replace(/\[\s*…\s*\]|\[\s*\.\.\.\s*\]|The post\b.*$/g, '');
  summary = summary.replace(/<[^>]+>/g, '');
  summary = summary.replace(/https?:\/\/\S+|www\.\S+/g, '');
  
  // Extract key points
  const sentences = extractSentences(summary, 3);
  const bulletPoints = sentences.map(s => `• ${s.trim()}`).join('\n');
  
  // Get hashtags
  const hashtagsArr = extractHashtags({ title, description: summary, source });
  const hashtagString = hashtagsArr.map(tag => `#${tag}`).join(' ');
  
  // Use a standard emoji for backup posts
  const emoji = '📰';
  
  // Construct the post
  return `${emoji} <b>${title}</b>\n\n${bulletPoints}\n\n${hashtagString}\n@ramznewsofficial | اخبار رمزی`;
}

/**
 * Extract sentences from text
 * 
 * @param {string} text - The text to extract sentences from
 * @param {number} maxSentences - Maximum number of sentences to extract
 * @returns {Array<string>} Array of extracted sentences
 */
function extractSentences(text, maxSentences = 3) {
  // Split by sentence terminators and filter out empty or very short sentences
  const sentences = text.split(/\.|\?|!|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  
  // Return up to maxSentences sentences
  return sentences.slice(0, maxSentences);
}

/**
 * Extract an image URL from the article
 * 
 * @param {string} articleUrl - The URL of the article to extract image from
 * @returns {Promise<string|null>} The extracted image URL or null
 */
async function extractImageUrl(articleUrl) {
  try {
    console.log(`Extracting image from: ${articleUrl}`);
    
    // Fetch the article HTML
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'RamzNews-Bot/2.0'
      },
      cf: {
        cacheTtl: 3600, // Cache for 1 hour
        cacheEverything: true
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch article: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Try to find Open Graph image using regex
    let ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (ogMatch && ogMatch[1]) {
      return ensureAbsoluteUrl(ogMatch[1], articleUrl);
    }
    
    // Try to find Twitter image using regex
    let twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (twitterMatch && twitterMatch[1]) {
      return ensureAbsoluteUrl(twitterMatch[1], articleUrl);
    }
    
    // Try to find a large image in the content
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/ig;
    let imgMatch;
    let potentialImages = [];
    
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imgSrc = imgMatch[1];
      // Filter out icons, avatars, and other small images
      if (!imgSrc.includes('icon') && !imgSrc.includes('avatar') && !imgSrc.includes('logo') && !imgSrc.includes('thumb')) {
        potentialImages.push(imgSrc);
      }
    }
    
    if (potentialImages.length > 0) {
      return ensureAbsoluteUrl(potentialImages[0], articleUrl);
    }
    
    console.log(`Image extraction result: No image found`);
    return null;
  } catch (error) {
    console.error(`Error extracting image from ${articleUrl}:`, error);
    return null;
  }
}

/**
 * Ensure URL is absolute
 * 
 * @param {string} url - The URL to process
 * @param {string} baseUrl - The base URL to use for relative URLs
 * @returns {string|null} Absolute URL or null
 */
function ensureAbsoluteUrl(url, baseUrl) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  try {
    const base = new URL(baseUrl);
    
    if (url.startsWith('//')) {
      return `${base.protocol}${url}`;
    } else if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    } else {
      return `${base.protocol}//${base.host}/${url}`;
    }
  } catch (error) {
    console.error(`Error making URL absolute: ${error}`);
    return url;
  }
} 