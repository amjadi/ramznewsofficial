/**
 * identifier.js - Unique Post Identifier Generator
 * 
 * This module provides functions to create unique identifiers for posts
 * to ensure we don't process or send the same content multiple times.
 */

/**
 * Generate a unique identifier for a post based on title and link
 * 
 * @param {string} title - The post title
 * @param {string} link - The post URL
 * @returns {string} A unique identifier hash
 */
export function generatePostIdentifier(title, link) {
  try {
    // Basic sanitization
    const cleanTitle = (title || '').trim();
    const cleanLink = (link || '').trim();
    
    // If we have a link, extract domain and path
    let linkPart = '';
    if (cleanLink) {
      try {
        const url = new URL(cleanLink);
        // Use domain and pathname only, ignore query parameters
        linkPart = `${url.hostname}${url.pathname}`;
      } catch (e) {
        // If URL parsing fails, just use the raw link
        linkPart = cleanLink;
      }
    }
    
    // Combine title and link part
    const source = cleanTitle + linkPart;
    
    // Generate a hash using string concatenation
    // In a real implementation, you might use a more robust hashing algorithm
    const hash = simpleHash(source);
    
    return `post_${hash}`;
  } catch (error) {
    console.error('Error generating post identifier:', error);
    // Fallback to a timestamp-based identifier
    return `fallback_${Date.now()}`;
  }
}

/**
 * Simple string hashing function
 * 
 * @param {string} str - The string to hash
 * @returns {string} A hash of the string
 */
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString(16);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's positive
  return (hash >>> 0).toString(16);
}

/**
 * Check if two posts are likely duplicates by comparing their content
 * 
 * @param {Object} post1 - First post to compare
 * @param {Object} post2 - Second post to compare
 * @returns {boolean} True if posts appear to be duplicates
 */
export function areSimilarPosts(post1, post2) {
  if (!post1 || !post2) return false;
  
  // Exact match on identifiers
  if (post1.id === post2.id) return true;
  
  // Title similarity check
  const title1 = (post1.title || '').toLowerCase();
  const title2 = (post2.title || '').toLowerCase();
  
  // If titles are very similar
  if (title1 && title2 && (
    title1 === title2 || 
    title1.includes(title2) || 
    title2.includes(title1) ||
    calculateSimilarity(title1, title2) > 0.8
  )) {
    return true;
  }
  
  // Check if links are the same (excluding query parameters)
  const link1 = post1.link ? new URL(post1.link).pathname : '';
  const link2 = post2.link ? new URL(post2.link).pathname : '';
  
  if (link1 && link2 && link1 === link2) {
    return true;
  }
  
  return false;
}

/**
 * Calculate text similarity using a simple Levenshtein distance
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Calculate Levenshtein distance
  const editDistance = levenshteinDistance(longer, shorter);
  
  return (1.0 - editDistance / longer.length);
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Create a matrix of size (m+1) x (n+1)
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Fill the first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
} 