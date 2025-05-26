import { describe, it, expect } from 'vitest';
import { generatePostIdentifier, areSimilarPosts } from '../shared/identifier.js';

describe('generatePostIdentifier', () => {
  it('should generate a unique identifier for a post', () => {
    const title = 'Test Title';
    const link = 'https://example.com/test-article';
    
    const id = generatePostIdentifier(title, link);
    
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^post_[a-f0-9]+$/);
  });
  
  it('should generate consistent identifiers for the same inputs', () => {
    const title = 'Test Title';
    const link = 'https://example.com/test-article';
    
    const id1 = generatePostIdentifier(title, link);
    const id2 = generatePostIdentifier(title, link);
    
    expect(id1).toBe(id2);
  });
  
  it('should generate different identifiers for different inputs', () => {
    const title1 = 'Test Title 1';
    const link1 = 'https://example.com/test-article-1';
    
    const title2 = 'Test Title 2';
    const link2 = 'https://example.com/test-article-2';
    
    const id1 = generatePostIdentifier(title1, link1);
    const id2 = generatePostIdentifier(title2, link2);
    
    expect(id1).not.toBe(id2);
  });
  
  it('should handle empty or undefined inputs', () => {
    expect(generatePostIdentifier('', '')).toBeDefined();
    expect(generatePostIdentifier(undefined, undefined)).toBeDefined();
  });
  
  it('should ignore query parameters in URLs', () => {
    const title = 'Test Title';
    const link1 = 'https://example.com/test-article';
    const link2 = 'https://example.com/test-article?param=value';
    
    const id1 = generatePostIdentifier(title, link1);
    const id2 = generatePostIdentifier(title, link2);
    
    expect(id1).toBe(id2);
  });
});

describe('areSimilarPosts', () => {
  it('should identify identical posts', () => {
    const post1 = {
      id: 'post_123',
      title: 'Test Title',
      link: 'https://example.com/test'
    };
    
    const post2 = {
      id: 'post_123',
      title: 'Test Title',
      link: 'https://example.com/test'
    };
    
    expect(areSimilarPosts(post1, post2)).toBe(true);
  });
  
  it('should identify posts with the same title but different IDs', () => {
    const post1 = {
      id: 'post_123',
      title: 'Test Title',
      link: 'https://example.com/test1'
    };
    
    const post2 = {
      id: 'post_456',
      title: 'Test Title',
      link: 'https://example.com/test2'
    };
    
    expect(areSimilarPosts(post1, post2)).toBe(true);
  });
  
  it('should identify posts with similar titles', () => {
    const post1 = {
      id: 'post_123',
      title: 'Bitcoin Price Rises to $60,000',
      link: 'https://example.com/test1'
    };
    
    const post2 = {
      id: 'post_456',
      title: 'Bitcoin Price Rises to $60K',
      link: 'https://example.com/test2'
    };
    
    expect(areSimilarPosts(post1, post2)).toBe(true);
  });
  
  it('should not identify completely different posts as similar', () => {
    const post1 = {
      id: 'post_123',
      title: 'Bitcoin Price Rises',
      link: 'https://example.com/bitcoin'
    };
    
    const post2 = {
      id: 'post_456',
      title: 'Ethereum Development Update',
      link: 'https://example.com/ethereum'
    };
    
    expect(areSimilarPosts(post1, post2)).toBe(false);
  });
  
  it('should handle null or undefined inputs', () => {
    const post = {
      id: 'post_123',
      title: 'Test Title',
      link: 'https://example.com/test'
    };
    
    expect(areSimilarPosts(null, post)).toBe(false);
    expect(areSimilarPosts(post, null)).toBe(false);
    expect(areSimilarPosts(null, null)).toBe(false);
    expect(areSimilarPosts(undefined, post)).toBe(false);
  });
}); 