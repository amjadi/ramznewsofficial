/**
 * category.js - Content Categorization Utilities
 * 
 * This module provides functionality to categorize news content
 * and suggest appropriate emojis and hashtags.
 */

// Category definitions with keywords, emojis, and hashtags
const CATEGORIES = [
  {
    name: 'crypto',
    keywords: [
      'بیت کوین', 'بیت‌کوین', 'bitcoin', 'btc', 'ارز دیجیتال', 'رمزارز', 'اتریوم',
      'ethereum', 'eth', 'کریپتو', 'blockchain', 'بلاکچین', 'دیفای', 'defi',
      'آلت کوین', 'آلتکوین', 'altcoin', 'توکن', 'token', 'کوین', 'صرافی'
    ],
    emojis: ['💰', '📈', '📉', '💸', '🪙'],
    hashtags: ['#رمزارز', '#بیت_کوین', '#ارز_دیجیتال', '#بلاکچین']
  },
  {
    name: 'economic',
    keywords: [
      'اقتصاد', 'دلار', 'یورو', 'طلا', 'بورس', 'سکه', 'ارز', 'تورم',
      'قیمت', 'بانک', 'مرکزی', 'بازار', 'سهام', 'نفت', 'یارانه'
    ],
    emojis: ['💵', '📊', '📉', '📈', '🏦', '💹'],
    hashtags: ['#اقتصاد', '#بازار', '#دلار', '#قیمت']
  },
  {
    name: 'tech',
    keywords: [
      'فناوری', 'تکنولوژی', 'هوش مصنوعی', 'اپل', 'گوگل', 'مایکروسافت',
      'اندروید', 'آیفون', 'موبایل', 'اینترنت', 'نرم افزار', 'سخت افزار'
    ],
    emojis: ['💻', '📱', '🤖', '🔌', '🛰️', '📡'],
    hashtags: ['#فناوری', '#تکنولوژی', '#هوش_مصنوعی', '#دیجیتال']
  },
  {
    name: 'politics',
    keywords: [
      'سیاسی', 'انتخابات', 'مجلس', 'دولت', 'رهبر', 'رئیس جمهور',
      'سیاست', 'بین الملل', 'جنگ', 'تحریم', 'وزیر', 'پارلمان'
    ],
    emojis: ['🏛️', '🗳️', '🔴', '⚖️', '🌍', '🇮🇷'],
    hashtags: ['#سیاست', '#انتخابات', '#دولت', '#مجلس']
  },
  {
    name: 'sports',
    keywords: [
      'فوتبال', 'ورزش', 'استقلال', 'پرسپولیس', 'لیگ', 'جام',
      'باشگاه', 'المپیک', 'قهرمانی', 'مسابقه', 'تیم ملی'
    ],
    emojis: ['⚽', '🏆', '🏅', '🏟️', '🥇', '🎯'],
    hashtags: ['#ورزش', '#فوتبال', '#لیگ', '#قهرمانی']
  },
  {
    name: 'urgent',
    keywords: [
      'فوری', 'مهم', 'هشدار', 'اخطار', 'خبر فوری', 'اعلام',
      'لحظاتی پیش', 'خبر مهم', 'سریع', 'اضطراری'
    ],
    emojis: ['⚡', '🚨', '🔴', '‼️', '⚠️', '📢'],
    hashtags: ['#فوری', '#خبر_فوری', '#مهم']
  }
];

// Default category for fallback
const DEFAULT_CATEGORY = {
  name: 'general',
  emojis: ['📌', '🔷', '🔶', '📰', '🗞️', '📄'],
  hashtags: ['#خبر', '#تازه', '#گزارش']
};

/**
 * Categorize content based on title and description
 * 
 * @param {string} title - The article title
 * @param {string} description - The article description
 * @returns {Object} Category information with emojis and hashtags
 */
export function categorizeContent(title, description) {
  try {
    // Combine title and description for analysis
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // Calculate score for each category
    const scores = CATEGORIES.map(category => {
      const score = calculateCategoryScore(combinedText, category.keywords);
      return { ...category, score };
    });
    
    // Sort by score, highest first
    scores.sort((a, b) => b.score - a.score);
    
    // If highest score is 0, return default category
    if (scores[0].score === 0) {
      return {
        ...DEFAULT_CATEGORY,
        emoji: getRandomItem(DEFAULT_CATEGORY.emojis),
        suggestedHashtags: DEFAULT_CATEGORY.hashtags.slice(0, 3)
      };
    }
    
    // Get top categories (up to 2)
    const topCategories = scores
      .filter(c => c.score > 0)
      .slice(0, 2);
    
    // Select emoji from the top category
    const emoji = getRandomItem(topCategories[0].emojis);
    
    // Collect hashtags from top categories (up to 5 total)
    let allHashtags = [];
    topCategories.forEach(category => {
      allHashtags = [...allHashtags, ...category.hashtags];
    });
    
    // Remove duplicates and limit to 5
    const suggestedHashtags = [...new Set(allHashtags)].slice(0, 5);
    
    return {
      category: topCategories[0].name,
      secondaryCategory: topCategories.length > 1 ? topCategories[1].name : null,
      emoji,
      suggestedHashtags
    };
  } catch (error) {
    console.error('Error categorizing content:', error);
    
    // Return default category in case of error
    return {
      ...DEFAULT_CATEGORY,
      emoji: getRandomItem(DEFAULT_CATEGORY.emojis),
      suggestedHashtags: DEFAULT_CATEGORY.hashtags.slice(0, 3)
    };
  }
}

/**
 * Calculate a score for a category based on keyword matches
 * 
 * @param {string} text - The text to analyze
 * @param {Array<string>} keywords - Keywords to check
 * @returns {number} Score representing relevance
 */
function calculateCategoryScore(text, keywords) {
  let score = 0;
  
  for (const keyword of keywords) {
    // Check if keyword appears in the text
    if (text.includes(keyword.toLowerCase())) {
      // Keywords at the beginning are more important
      if (text.indexOf(keyword.toLowerCase()) < 50) {
        score += 2;
      } else {
        score += 1;
      }
      
      // Extra points for multiple occurrences
      const occurrences = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      if (occurrences > 1) {
        score += Math.min(occurrences - 1, 3); // Cap at 3 extra points
      }
    }
  }
  
  return score;
}

/**
 * Get a random item from an array
 * 
 * @param {Array<any>} array - The array to select from
 * @returns {any} A random element from the array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate hashtags for a post based on its content
 * 
 * @param {string} title - The post title
 * @param {string} description - The post description
 * @returns {Array<string>} List of suggested hashtags
 */
export function generateHashtags(title, description) {
  const { suggestedHashtags } = categorizeContent(title, description);
  return suggestedHashtags;
}

/**
 * Suggest an appropriate emoji for a post
 * 
 * @param {string} title - The post title
 * @param {string} description - The post description
 * @returns {string} A suitable emoji
 */
export function suggestEmoji(title, description) {
  const { emoji } = categorizeContent(title, description);
  return emoji;
} 