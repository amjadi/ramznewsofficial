/**
 * aiFormatter.js - AI-based Content Formatter for RamzNews Gen 2
 * 
 * This module is responsible for:
 * 1. Taking raw RSS feed items
 * 2. Using LLM to format them into engaging Telegram posts
 * 3. Extracting images from article URLs
 * 4. Generating appropriate hashtags
 * 5. Creating the final formatted post
 */

import { categorizeContent } from './shared/category.js';
import { CONFIG } from './config.js';
import { extractHashtags } from './shared/hashtags.js';

/**
 * Format a news item with AI for Telegram posting
 */
export async function formatWithAI(item, env) {
  try {
    console.log(`Formatting item: ${item.title}`);
    
    // Process with LLM to get formatted text
    let formattedText = await processWithLLM(item, env);
    
    // Extract image URL from the original article
    const imageUrl = await extractImageUrl(item.link);
    
    // بعد از ساخت متن پست:
    const hashtags = extractHashtags({
      title: item.title,
      description: item.description,
      source: item.source
    });
    
    // خروجی کامل و استاندارد
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
    // اگر پست قابل اصلاح بود، پست پشتیبان بساز
    if (CONFIG.PROCESSING.USE_BACKUP_ON_FAILURE) {
      const backupText = createBackupPost(item.title, item.description);
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
    } else {
      throw error;
    }
  }
}

/**
 * Process an item with the Language Model
 */
async function processWithLLM(item, env) {
  try {
    // Get API key and settings from config
    const apiKey = CONFIG.AI.OPENROUTER_API_KEY;
    const apiUrl = CONFIG.AI.API_URL;
    const model = CONFIG.AI.MODEL;
    const temperature = CONFIG.AI.TEMPERATURE;
    const maxTokens = CONFIG.AI.MAX_TOKENS;
    
    // Get prompt template from config
    const promptTemplate = CONFIG.DEFAULT_PROMPT_TEMPLATE;
    
    // Prepare item data, ensuring it's not too long
    const title = item.title || '';
    
    // Pre-process the description to remove HTML tags and other artifacts
    let description = item.description || '';
    
    // Remove HTML tags
    description = description.replace(/<[^>]+>/g, ' ');
    
    // Remove common WordPress/RSS artifacts
    description = description.replace(/\[\s*…\s*\]|\[\s*\.\.\.\s*\]|The post\b.*$/g, '');
    description = description.replace(/Read more.*$/g, '');
    description = description.replace(/\b(Post|Source):.+/g, '');
    
    // Remove URLs
    description = description.replace(/https?:\/\/\S+|www\.\S+/g, '');
    
    // Normalize whitespace
    description = description.replace(/\s+/g, ' ').trim();
    
    // Truncate description if it's extremely long to avoid token limitations
    if (description.length > 3000) {
      // Find a good breaking point - end of a sentence
      const breakPoint = description.substring(0, 3000).lastIndexOf('.');
      if (breakPoint > 2000) {
        description = description.substring(0, breakPoint + 1);
      } else {
        description = description.substring(0, 3000) + '...';
      }
    }
    
    // Fill in the prompt template with item data
    const prompt = promptTemplate
      .replace('{title}', title)
      .replace('{description}', description);
    
    // Make the API request to OpenRouter
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ramznews.telegram.bot'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'تو متخصص خلاصه‌سازی و فرمت‌دهی حرفه‌ای اخبار به قالب پست‌های تلگرامی هستی. پست‌ها باید کاملاً موبایل‌پسند، خلاصه، زیبا، و بدون لینک یا تبلیغات باشند. هیچ‌گاه پست ناقص یا نیمه‌تمام تولید نکن. هر پست باید شامل عنوان پررنگ (با تگ b)، چند نکته مهم با علامت بولت (•)، چند هشتگ مرتبط، و امضای @ramznewsofficial باشد. از قرار دادن لینک، عبارات ناقص، یا متن WordPress خودداری کن. هر پست باید کامل باشد و با نشانه‌های ناتمام مثل ... یا [...] پایان نیابد.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    // Extract the content from the response
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenRouter');
    }
    
    // Validate the post content before returning
    const formattedContent = cleanupFormattedText(content);
    
    // Log the formatted content for debugging
    console.log('AI formatted content:', formattedContent);
    
    // First attempt validation
    let isValid = validatePostContent(formattedContent);
    
    // If first attempt failed, try up to 2 more times with stronger instructions
    let retryCount = 0;
    let finalContent = formattedContent;
    
    while (!isValid && retryCount < 3) {
      console.warn(`Post validation failed (attempt ${retryCount + 1}), trying again with stronger instructions`);
      
      const retryResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ramznews.telegram.bot'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `تو متخصص خلاصه‌سازی و فرمت‌دهی حرفه‌ای اخبار به قالب پست‌های تلگرامی هستی. اخبار را به شکل پست تلگرامی کامل در می‌آوری.
بسیار مهم: هرگز پست ناقص تولید نکن. هرگز از عبارات "..." یا "[...]" یا "[…]" در انتها استفاده نکن.
هر پست باید دقیقاً شامل این موارد باشد:
۱. یک ایموجی مرتبط در ابتدا
۲. عنوان با تگ <b>عنوان</b>
۳. چند نکته مهم با علامت بولت (•)
۴. چند هشتگ مرتبط به فارسی
۵. امضای کانال: @ramznewsofficial | اخبار رمزی
پست باید کاملاً تمیز و بدون لینک، نام سایت، یا هرگونه تبلیغ باشد.`
            },
            {
              role: 'user',
              content: `لطفاً این خبر را به شکل یک پست تلگرامی کامل و بدون هیچ مطلب ناقص دربیاور. متن کامل باشد و با "..." یا عبارت ناتمام پایان نیابد:

عنوان: ${title}

متن خبر: ${description}`
            }
          ],
          temperature: 0.2, // Lower temperature for more predictable output
          max_tokens: maxTokens
        })
      });
      
      if (retryResponse.ok) {
        const retryResult = await retryResponse.json();
        const retryContent = retryResult.choices[0]?.message?.content;
        
        if (retryContent) {
          finalContent = cleanupFormattedText(retryContent);
          isValid = validatePostContent(finalContent);
          
          if (isValid) {
            console.log('Successfully generated valid content on retry');
            break;
          }
        }
      }
      
      retryCount++;
    }
    
    // If we still couldn't generate valid content, create a backup post or throw an error
    if (!isValid) {
      console.error('Failed to generate valid content after multiple attempts');
      
      // Either create a backup post or reject the item
      if (CONFIG.PROCESSING.USE_BACKUP_ON_FAILURE) {
        return createBackupPost(title, description);
      } else {
        throw new Error('Failed to generate valid content after multiple attempts');
      }
    }
    
    return finalContent;
  } catch (error) {
    console.error('Error processing with LLM:', error);
    
    // Only create a backup post if the config allows it
    if (CONFIG.PROCESSING.USE_BACKUP_ON_FAILURE) {
      return createBackupPost(item.title, item.description);
    } else {
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
}

/**
 * Validate if the post content meets all requirements
 */
function validatePostContent(content) {
  // Detailed validation for post structure and completeness
  
  // Required components
  const hasTitle = content.includes('<b>') && content.includes('</b>');
  const hasBulletPoints = content.includes('•');
  const hasSignature = content.includes('@ramznewsofficial');
  const hasHashtags = content.includes('#');
  
  // Content completeness checks
  const lastParagraph = content.split('\n\n').pop() || '';
  const endsWithIncomplete = content.trim().endsWith('...') || 
                             content.includes('[...]') ||
                             content.includes('[…]') ||
                             content.includes('The post') ||
                             content.includes('wp-content') ||
                             content.includes('Read more') ||
                             content.includes('ادامه مطلب') ||
                             (lastParagraph.trim().match(/[^\.\?!]$/) && !lastParagraph.includes('@ramznewsofficial'));
  
  // HTML tag balance check
  const htmlTags = content.match(/<[^>]+>/g) || [];
  const openingTags = htmlTags.filter(tag => !tag.includes('/'));
  const closingTags = htmlTags.filter(tag => tag.includes('/'));
  const hasUnbalancedHtmlTags = openingTags.length !== closingTags.length;
  
  // WordPress artifacts check
  const hasWordPressArtifacts = content.includes('The post') || 
                               content.includes('Read more') ||
                               content.includes('wp-');
  
  // Incomplete content flag
  const isIncomplete = endsWithIncomplete || hasUnbalancedHtmlTags || hasWordPressArtifacts;
  
  // Promotional content check
  const hasPromotion = content.includes('یورونیوز') || 
                      content.includes('بی‌بی‌سی') || 
                      content.includes('مشاهده بیشتر') ||
                      content.includes('http') ||
                      content.includes('www.');
  
  // Length check (minimum content length)
  const isTooShort = content.length < 150;
  
  // Log validation results for debugging
  console.log('Validation results:', {
    hasTitle,
    hasBulletPoints,
    hasSignature,
    hasHashtags,
    endsWithIncomplete,
    hasUnbalancedHtmlTags,
    hasWordPressArtifacts,
    isIncomplete,
    hasPromotion,
    isTooShort,
    contentLength: content.length
  });
  
  return hasTitle && hasBulletPoints && hasSignature && hasHashtags && !isIncomplete && !hasPromotion && !isTooShort;
}

/**
 * Create a backup post when AI formatting fails
 */
function createBackupPost(title, description) {
  // Extract a short summary from the description
  let summary = description;
  if (summary.length > 300) {
    // Find a good breaking point - end of a sentence
    const breakPoint = summary.substring(0, 300).lastIndexOf('.');
    if (breakPoint > 150) {
      summary = summary.substring(0, breakPoint + 1);
    } else {
      summary = summary.substring(0, 300) + '...';
    }
  }
  // Remove any WordPress artifacts or HTML from the summary
  summary = summary.replace(/\[\s*…\s*\]|\[\s*\.\.\.\s*\]|The post\b.*$/g, '');
  summary = summary.replace(/<[^>]+>/g, '');
  summary = summary.replace(/https?:\/\/\S+|www\.\S+/g, '');
  // Extract key points - try to break into sentences
  const sentences = summary.split(/\.|\?|\!/).filter(s => s.trim().length > 20).slice(0, 3);
  const bulletPoints = sentences.map(s => `• ${s.trim()}`).join('\n');
  // Get hashtags based on content (فقط منطق جدید)
  const hashtagsArr = require('./shared/hashtags.js').extractHashtags({ title, description, source: '' });
  const hashtagString = hashtagsArr.map(tag => `#${tag}`).join(' ');
  // ایموجی: فقط اگر خواستی، از LLM یا منطق جدید (در صورت وجود) استفاده کن، نه categorizeContent
  // در اینجا فعلاً بدون ایموجی یا با یک ایموجی ثابت (مثلاً 📰)
  const emoji = '📰';
  // Construct the post
  return `${emoji} <b>${title}</b>\n\n${bulletPoints}\n\n${hashtagString}\n@ramznewsofficial | اخبار رمزی`;
}

/**
 * Clean up the formatted text from LLM
 */
function cleanupFormattedText(text) {
  // Remove any potential code block markers
  let cleaned = text.replace(/```/g, '');
  
  // Ensure proper HTML tag formatting for Telegram
  cleaned = cleaned.replace(/<b>/g, '<b>').replace(/<\/b>/g, '</b>');
  
  // Remove any accidental markdown formatting that might have been added
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  
  // Ensure bullet points are consistent
  cleaned = cleaned.replace(/•/g, '•');
  cleaned = cleaned.replace(/\*/g, '•');
  cleaned = cleaned.replace(/- /g, '• ');
  
  // Ensure double newlines between sections
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  
  // Ensure there's space after bullet points
  cleaned = cleaned.replace(/•(?!\s)/g, '• ');
  
  // Make sure signature is properly formatted
  if (!cleaned.includes('@ramznewsofficial | اخبار رمزی')) {
    cleaned = cleaned.replace(/@ramznewsofficial\s*$/i, '@ramznewsofficial | اخبار رمزی');
    // If signature is missing entirely, add it
    if (!cleaned.includes('@ramznewsofficial')) {
      cleaned += '\n@ramznewsofficial | اخبار رمزی';
    }
  }
  
  // Make sure there's proper spacing before hashtags
  const hashtagIndex = cleaned.indexOf('#');
  if (hashtagIndex > 0 && cleaned.charAt(hashtagIndex - 1) !== '\n') {
    cleaned = cleaned.substring(0, hashtagIndex) + '\n' + cleaned.substring(hashtagIndex);
  }
  
  // Remove any WordPress or RSS artifacts
  cleaned = cleaned.replace(/\[\s*…\s*\]|\[\s*\.\.\.\s*\]|The post\b.*$/g, '');
  cleaned = cleaned.replace(/Read more.*$/g, '');
  cleaned = cleaned.replace(/\b(Post|Source):.+/g, '');
  
  // Remove URLs that might have been included
  cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, '');
  
  // Check if the content appears incomplete and try to fix it
  if (cleaned.endsWith('...') || cleaned.endsWith('[...]') || cleaned.endsWith('[…]')) {
    // Remove the trailing ellipsis and add a period if needed
    cleaned = cleaned.replace(/\.\.\.|\[\.\.\.\]|\[…\]$/g, '.');
    // If it still ends with just a period but no space, ensure proper formatting
    if (cleaned.endsWith('.')) {
      cleaned = cleaned.replace(/\.+$/g, '.');
    }
  }
  
  return cleaned.trim();
}

/**
 * Extract an image URL from the article using regex instead of DOMParser
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