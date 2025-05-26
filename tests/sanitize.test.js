import { describe, it, expect } from 'vitest';
import { sanitizeHtml, getTextPreview } from '../shared/sanitize.js';

describe('sanitizeHtml', () => {
  it('should remove HTML tags', () => {
    const html = '<p>This is a <strong>test</strong>.</p>';
    const result = sanitizeHtml(html);
    expect(result).toBe('This is a test.');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('should remove script tags and their content', () => {
    const html = '<p>Text</p><script>alert("bad");</script><p>More text</p>';
    const result = sanitizeHtml(html);
    expect(result).toBe('Text\n\nMore text');
  });

  it('should convert HTML entities', () => {
    const html = 'This &amp; that &lt;tag&gt;';
    const result = sanitizeHtml(html);
    expect(result).toBe('This & that <tag>');
  });

  it('should preserve bullet points', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeHtml(html);
    expect(result).toBe('• Item 1\n• Item 2');
  });

  it('should remove ads and promotions', () => {
    const html = '<p>Good content</p><div class="ad-banner">Buy now!</div><p>More content</p>';
    const result = sanitizeHtml(html);
    expect(result).toBe('Good content\n\nMore content');
  });
});

describe('getTextPreview', () => {
  it('should create a preview of the specified length', () => {
    const html = '<p>This is a very long text that should be truncated for the preview.</p>';
    const result = getTextPreview(html, 20);
    expect(result).toBe('This is a very long ...');
  });

  it('should not truncate text shorter than the limit', () => {
    const html = '<p>Short text</p>';
    const result = getTextPreview(html, 20);
    expect(result).toBe('Short text');
  });
}); 