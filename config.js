/**
 * config.js - تنظیمات و مقادیر ثابت پروژه رمزنیوز نسل ۲
 * 
 * این فایل شامل تمام مقادیر ثابت و تنظیمات مورد نیاز پروژه است
 * به جای استفاده از متغیرهای محیطی، مقادیر به صورت مستقیم در کد قرار گرفته‌اند
 */

export const CONFIG = {
  // تنظیمات تلگرام
  TELEGRAM: {
    BOT_TOKEN: "7901847454:AAHiID4x5SDdZCNbwgYd3vVLmRnKVl10J78",
    CHANNEL_USERNAME: "@ramznewsofficial",
    SIGNATURE: "@ramznewsofficial | اخبار رمزی"
  },

  // منابع RSS
  RSS_FEEDS: [
    // منابع خبری سیاسی (متن از تگ description استخراج می‌شود)
    "https://feeds.bbci.co.uk/persian/rss.xml",     // BBC Persian
    "https://rss.dw.com/rdf/rss-per-iran",          // DW Persian
    "https://per.euronews.com/rss",                 // Euronews Persian
    
    // منابع خبری رمزارزی (متن از تگ content:encoded استخراج می‌شود)
    "https://ramzarz.news/feed/"                    // Ramzarz News
  ],
  
  // تعیین نوع منابع خبری
  RSS_FEED_TYPES: {
    "https://feeds.bbci.co.uk/persian/rss.xml": "political",
    "https://rss.dw.com/rdf/rss-per-iran": "political",
    "https://per.euronews.com/rss": "political",
    "https://ramzarz.news/feed/": "crypto"
  },

  // تنظیمات ذخیره‌سازی و کش
  STORAGE: {
    // کلید پیش‌فرض برای صف پردازش
    QUEUE_KEY: "feed_queue",
    
    // پیشوند کلید برای موارد ارسال شده
    SENT_KEY_PREFIX: "sent:",
    
    // پیشوند کلید برای آیتم‌های دیده شده
    ITEM_KEY_PREFIX: "item:",
    
    // مدت زمان نگهداری آیتم‌ها (30 روز به ثانیه)
    TTL_SECONDS: 30 * 24 * 60 * 60
  },

  // تنظیمات پردازش
  PROCESSING: {
    // حداکثر تعداد آیتم‌های پردازش شده در هر اجرا
    BATCH_SIZE: 5,
    
    // فعال بودن حالت دیباگ
    DEBUG_MODE: false,
    
    // استفاده از پست پشتیبان در صورت خطا در تولید محتوا
    USE_BACKUP_ON_FAILURE: true,
    
    // محدودیت کاراکتر تلگرام برای پست‌ها
    TELEGRAM_CHAR_LIMIT: 1000,
    
    // حداکثر تعداد پاراگراف برای منابع رمزارزی
    MAX_CRYPTO_PARAGRAPHS: 3
  }
}; 