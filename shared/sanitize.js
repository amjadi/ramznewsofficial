/**
 * sanitize.js - HTML Sanitization Utilities
 * 
 * This module provides functions to clean HTML content from RSS feeds
 * and prepare it for processing by the AI formatter.
 */

/**
 * Sanitize HTML content from RSS feeds
 * 
 * @param {string} htmlContent - The HTML content to sanitize
 * @returns {string} Cleaned text content
 */
export function sanitizeHtml(htmlContent) {
  if (!htmlContent) return '';
  
  try {
    let content = htmlContent;
    
    // Remove script and style tags and their content
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove iframe, canvas, svg, and form elements
    content = content.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    content = content.replace(/<canvas\b[^<]*(?:(?!<\/canvas>)<[^<]*)*<\/canvas>/gi, '');
    content = content.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
    content = content.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
    
    // Remove common ads and related content
    content = removeAdsAndPromotions(content);
    
    // Fix broken or nested tags
    content = fixBrokenTags(content);
    
    // Convert HTML entities
    content = decodeHtmlEntities(content);
    
    // Remove all HTML tags, but preserve line breaks and paragraphs
    content = content.replace(/<br\s*\/?>/gi, '\n');
    content = content.replace(/<\/p>/gi, '\n\n');
    content = content.replace(/<\/div>/gi, '\n');
    content = content.replace(/<\/h[1-6]>/gi, '\n\n');
    content = content.replace(/<li>/gi, '• ');
    content = content.replace(/<\/li>/gi, '\n');
    
    // Remove all remaining HTML tags
    content = content.replace(/<[^>]*>/g, '');
    
    // Fix UTF-8 encoding issues
    content = fixUtf8Issues(content);
    
    // Remove common promotional phrases and sentences
    content = removePromotionalPhrases(content);
    
    // Remove source attributions and URLs
    content = removeSourcesAndUrls(content);
    
    // Normalize whitespace
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/\n\s+/g, '\n');
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Trim whitespace
    content = content.trim();
    
    return content;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Return a basic cleanup if something went wrong
    return htmlContent.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Fix common UTF-8 encoding issues
 */
function fixUtf8Issues(content) {
  return content
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/Â /g, ' ')
    .replace(/â€¦/g, '…');
}

/**
 * Remove promotional phrases and sentences
 */
function removePromotionalPhrases(content) {
  const patterns = [
    // Patterns for "Read more" or "Continue reading"
    /(?:برای )?(?:مطالعه|مشاهده|خواندن) (?:بیشتر|ادامه|کامل)[^\.\n]*(?:\.|$)/gi,
    /ادامه مطلب را در[^\.\n]*(?:\.|$)/gi,
    /Read more[^\.\n]*(?:\.|$)/gi,
    /Continue reading[^\.\n]*(?:\.|$)/gi,
    
    // Patterns for social media promotion
    /(?:ما را|به ما) در (?:توییتر|اینستاگرام|تلگرام|فیسبوک)[^\.\n]*(?:\.|$)/gi,
    /Follow us on[^\.\n]*(?:\.|$)/gi,
    
    // Patterns for newsletter and subscription
    /(?:برای|جهت) (?:اشتراک|عضویت|دریافت)[^\.\n]*(?:\.|$)/gi,
    /Subscribe to our newsletter[^\.\n]*(?:\.|$)/gi,
    
    // Patterns for external site referrals
    /(?:برای|جهت) (?:اطلاعات|جزییات) بیشتر[^\.\n]*(?:\.|$)/gi,
    /For more information[^\.\n]*(?:\.|$)/gi,
    
    // News agencies' promotional material
    /یورونیوز [^\.]*خبرگزاری[^\.\n]*(?:\.|$)/gi,
    /به گزارش (?:یورونیوز|بی‌بی‌سی|ایرنا|ایسنا)[^\.\n]*(?:\.|$)/gi,
    
    // Common incomplete phrases at the end of text (ending without punctuation)
    /برای کسب اطلاعات بیشتر\.?$/gi,
    /جهت مشاهده کامل\.?$/gi,
    /برای دانلود\.?$/gi,
    /ادامه دارد\.?$/gi
  ];
  
  let cleaned = content;
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned;
}

/**
 * Remove source attributions and URLs
 */
function removeSourcesAndUrls(content) {
  let cleaned = content;
  
  // Remove sentences that are purely source attribution
  cleaned = cleaned.replace(/منبع:?\s*[^\.]+\.?/gi, '');
  cleaned = cleaned.replace(/Source:?\s*[^\.]+\.?/gi, '');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
  cleaned = cleaned.replace(/www\.\S+/gi, '');
  
  // Remove specific phrases that often introduce external links
  cleaned = cleaned.replace(/(?:اینجا|این لینک) (?:کلیک|مراجعه) کنید/gi, '');
  cleaned = cleaned.replace(/click (?:here|this link)/gi, '');
  
  return cleaned;
}

/**
 * Remove ads, promotions, and related content from HTML
 * 
 * @param {string} content - The HTML content to clean
 * @returns {string} HTML content without ads
 */
function removeAdsAndPromotions(content) {
  // Remove common ad-related divs
  let cleaned = content;
  
  // Remove ad-related elements by class or id
  const adPatterns = [
    /<div[^>]*class="[^"]*(?:ad|ads|advert|advertisement|banner|promo|promotion|sponsor|sponsored)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<div[^>]*id="[^"]*(?:ad|ads|advert|advertisement|banner|promo|promotion|sponsor|sponsored)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*class="[^"]*(?:ad|ads|advert|advertisement|banner|promo|promotion|sponsor|sponsored)[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    /<aside[^>]*>[\s\S]*?<\/aside>/gi,
    /<ins[^>]*>[\s\S]*?<\/ins>/gi,
    /<div[^>]*class="[^"]*(?:share|social|follow)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<div[^>]*class="[^"]*(?:comment|comments|disqus)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<div[^>]*class="[^"]*(?:related|more|suggested)[^"]*"[^>]*>[\s\S]*?<\/div>/gi
  ];
  
  adPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove "read more" or "continue reading" links
  cleaned = cleaned.replace(/<a[^>]*>[^<]*(?:بیشتر بخوانید|ادامه مطلب|read more|continue reading|more|بیشتر)[^<]*<\/a>/gi, '');
  
  // Remove social media links
  cleaned = cleaned.replace(/<a[^>]*>[^<]*(?:facebook|twitter|instagram|telegram|linkedin)[^<]*<\/a>/gi, '');
  
  // Remove footer sections
  cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  
  // Remove newsletter signup
  cleaned = cleaned.replace(/<[^>]*class="[^"]*newsletter[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, '');
  
  return cleaned;
}

/**
 * Fix broken or incorrectly nested HTML tags
 * 
 * @param {string} content - HTML content to fix
 * @returns {string} Fixed HTML content
 */
function fixBrokenTags(content) {
  let fixed = content;
  
  // Fix unclosed paragraph tags
  const openP = (fixed.match(/<p[^>]*>/gi) || []).length;
  const closeP = (fixed.match(/<\/p>/gi) || []).length;
  
  if (openP > closeP) {
    for (let i = 0; i < openP - closeP; i++) {
      fixed += '</p>';
    }
  }
  
  // Fix unclosed div tags
  const openDiv = (fixed.match(/<div[^>]*>/gi) || []).length;
  const closeDiv = (fixed.match(/<\/div>/gi) || []).length;
  
  if (openDiv > closeDiv) {
    for (let i = 0; i < openDiv - closeDiv; i++) {
      fixed += '</div>';
    }
  }
  
  return fixed;
}

/**
 * Decode HTML entities to their character equivalents
 * 
 * @param {string} content - HTML content with entities
 * @returns {string} Decoded content
 */
function decodeHtmlEntities(content) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&ndash;': '–',
    '&mdash;': '—',
    '&bull;': '•',
    '&hellip;': '…'
  };
  
  let decoded = content;
  
  // Replace known entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Replace numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  return decoded;
}

/**
 * Extract text content from HTML for debugging purposes
 * 
 * @param {string} htmlContent - HTML content
 * @returns {string} Plain text preview
 */
export function getTextPreview(htmlContent, maxLength = 100) {
  const text = sanitizeHtml(htmlContent);
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
} 