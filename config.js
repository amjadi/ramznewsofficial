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

  // تنظیمات OpenRouter و هوش مصنوعی
  AI: {
    OPENROUTER_API_KEY: "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",
    API_URL: "https://openrouter.ai/api/v1/chat/completions",
    MODEL: "qwen/qwen3-30b-a3b:free", // Free, high-quality model on OpenRouter (as of 2024)
    TEMPERATURE: 0.2,
    MAX_TOKENS: 800
  },

  // منابع RSS
  RSS_FEEDS: [
    // منابع خبری
    "https://www.bbc.com/persian/iran/rss.xml",
    "https://rss.dw.com/rdf/rss-per-iran",
    "https://per.euronews.com/rss",
    // منابع رمزارز
    "https://ramzarz.news/feed/",
    "https://arzdigital.com/feed/"
  ],

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
    USE_BACKUP_ON_FAILURE: true
  },
  
  // پرامپت پیش‌فرض برای هوش مصنوعی
  DEFAULT_PROMPT_TEMPLATE: `
تو یک متخصص خلاصه‌سازی و فرمت‌دهی اخبار به قالب پست تلگرامی هستی.
خبر زیر را با دقت بخوان و هرچه از آن می‌فهمی را با لحن حرفه‌ای اخبار تلگرامی، خلاصه، مرتب، تمیز و کامل بنویس.
پست باید شامل این اجزا باشد:
- یک ایموجی مرتبط در ابتدای پست
- عنوان بولد
- ۲ تا ۴ نکته مهم به صورت بولت
- در انتهای پست، دقیقاً ۲ تا ۵ هشتگ موضوعی و مرتبط با خبر (بر اساس عنوان و متن) قرار بده. هشتگ‌ها باید فارسی، بدون تکرار و بی‌ربط باشند.
- امضای کانال: @ramznewsofficial | اخبار رمزی
هیچ لینک یا تبلیغی قرار نده و پست را کامل و تمیز بنویس.

خبر ورودی:
عنوان: {title}
متن: {description}
`
}; 