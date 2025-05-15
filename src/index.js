// Configuration
const TELEGRAM_BOT_TOKEN = "7901847454:AAHiID4x5SDdZCNbwgYd3vVLmRnKVl10J78";
const CHANNEL_USERNAME = "@ramznewsofficial";
const MAX_SAVED_MESSAGES = 1000;
const DELAY_BETWEEN_POSTS = 5000;
const STORAGE_TTL_DAYS = 60;
const RSS_FEEDS = [
  // فیدهای خبری عمومی با اولویت سیاست (اولویت اول)
  { url: "https://feeds.bbci.co.uk/persian/rss.xml", source: "BBC Persian", category: "general", priority: "high" },
  { url: "https://rss.dw.com/xml/rss-per-all_volltext", source: "DW Persian", category: "general", priority: "high" },
  { url: "https://parsi.euronews.com/rss", source: "Euronews Persian", category: "general", priority: "high" },
  
  // فیدهای تخصصی اقتصادی (اولویت دوم)
  { url: "https://tejaratnews.com/feed/", source: "Tejarat News", category: "finance", priority: "medium" },
  
  // فیدهای تخصصی کریپتویی (اولویت سوم)
  { url: "https://crypto.asriran.com/feed/", source: "Crypto Asriran", category: "crypto", priority: "low" },
  { url: "https://ramzarz.news/feed/", source: "Ramzarz News", category: "crypto", priority: "low" },
  { url: "https://arzdigital.com/breaking/feed/", source: "Arz Digital Breaking", category: "crypto", priority: "low" },
  { url: "https://nobitex.ir/mag/feed/", source: "Nobitex Mag", category: "crypto", priority: "low" },
  { url: "https://zoomarz.com/feed", source: "Zoomarz", category: "crypto", priority: "low" },
  { url: "https://coiniran.com/feed/", source: "Coin Iran", category: "crypto", priority: "low" },
  { url: "https://blockchainiran.com/feed/", source: "Blockchain Iran", category: "crypto", priority: "low" }
];

// Utility functions
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(text) {
  if (!text) return "";
  
  text = text.replace(/<[^>]*>/g, "").trim();
  text = decodeHtmlEntities(text);
  text = text.replace(/\]\]>/g, "");
  text = text.replace(/\[\[</g, "");
  text = text.replace(/\\+/g, "+");
  text = text.replace(/\\(\d)/g, "$1");
  text = text.replace(/\\\//g, "/");
  
  // ⚡️ جدید: حذف پیشوندهای شهر-خبرگزاری از ابتدای خبرها
  // مثال: "بجنورد-ایرنا-" یا "تهران - ایسنا -"
  text = text.replace(/^[\u0600-\u06FF\s]+[-–]\s*[\u0600-\u06FF]+\s*[-–]\s*/g, "");
  
  // حذف منابع خبری از انتهای محتوا
  text = text.replace(/\(خبرگزاری [\u0600-\u06FF]+\)$/g, "");
  text = text.replace(/منبع:? خبرگزاری [\u0600-\u06FF]+$/g, "");
  
  // حذف ساختار "به گزارش خبرگزاری..." و مشابه آن
  text = text.replace(/به گزارش (خبرگزاری|خبرنگار) [\u0600-\u06FF\s]+[-،,]/g, "");
  text = text.replace(/به گزارش [\u0600-\u06FF\s]+[-،,]/g, "");
  text = text.replace(/به نقل از [\u0600-\u06FF\s]+[-،,]/g, "");
  
  if (text.includes("نوشته")) {
    text = text.split("نوشته")[0].trim();
  }
  
  // Remove specific phrases identified by the user
  text = text.replace(/End of پربیننده‌ترین‌ها/g, "");
  text = text.replace(/End of مطالب پیشنهادی/g, "");
  text = text.replace(/End of /g, "");
  text = text.replace(/به گزارش تجارت نیوز،/g, "");
  
  // Specifically target and remove the DW promotional phrase - high priority
  text = text.replace(/اینترنت بدون سانسور با سایفون دویچه‌ وله/g, "");
  text = text.replace(/اینترنت بدون سانسور با سایفون/g, "");
  
  // Remove Euronews promotional content
  text = text.replace(/یورونیوز در «سرخط خبرها» مهم‌ترین رویدادهای ایران و جهان را در دو نوبت مرور می‌کند.*/g, "");
  text = text.replace(/«مجله شامگاهی» برنامه‌ای تصویری از یورونیوز است که هر شب.*/g, "");
  text = text.replace(/«سرخط خبرها» مجموعه‌ای است که یورونیوز [^\.]*\./g, "");
  text = text.replace(/در این قسمت مهم‌ترین عناوین خبری.*/g, "");
  
  // Additional cleanup for new RSS feeds
  text = text.replace(/زمان مطالعه:?\s*\d+\s*دقیقه/g, "");
  text = text.replace(/نوشته .* اولین بار در .* پدیدار شد\.?/g, "");
  text = text.replace(/اولین بار در .* پدیدار شد\.?/g, "");
  text = text.replace(/مطلب پیشنهادی:?.*/g, "");
  text = text.replace(/\[\&hellip;\]/g, "...");
  text = text.replace(/\[&#8230;\]/g, "...");
  text = text.replace(/\[\s*…\s*\]/g, "...");
  
  // Remove "Read more" type links and DW specific "بیشتر بخوانید" links
  text = text.replace(/ادامه مطلب را بخوانید.*/g, "");
  text = text.replace(/برای مشاهده متن کامل.*/g, "");
  text = text.replace(/برای مطالعه ادامه خبر.*/g, "");
  text = text.replace(/بیشتر بخوانید:.*/g, "");
  
  // Clean URLs at the end of descriptions
  text = text.replace(/https?:\/\/[^\s]+$/, "");
  
  text = text.replace(/&zwnj;/g, " "); // Replace with space for better readability
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&laquo;/g, "\u00AB");
  text = text.replace(/&raquo;/g, "\u00BB");
  text = text.replace(/&ldquo;/g, "\u00AB");
  text = text.replace(/&rdquo;/g, "\u00BB");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&ndash;/g, "-");
  text = text.replace(/&mdash;/g, "-");
  text = text.replace(/&hellip;/g, "...");
  text = text.replace(/&[a-zA-Z0-9]+;/g, " ");
  
  // First cleanup of spaces
  text = text.replace(/\s+/g, " ").trim();
  
  // Add spaces around Persian punctuation for better readability
  text = text.replace(/([،؛؟!])/g, " $1 ");
  
  text = text.replace(/.*را در اینستاگرام دنبال کنید.*/g, "");
  text = text.replace(/.*را در توییتر دنبال کنید.*/g, "");
  text = text.replace(/.*را در فیسبوک دنبال کنید.*/g, "");
  text = text.replace(/.*را در تلگرام دنبال کنید.*/g, "");
  text = text.replace(/دویچه وله فارسی را در .* دنبال کنید/g, "");
  text = text.replace(/یورونیوز فارسی را در .* دنبال کنید/g, "");
  text = text.replace(/عکس:.*?(?=\n|$)/g, "");
  text = text.replace(/منبع:.*?(?=\n|$)/g, "");
  text = text.replace(/تصویر:.*?(?=\n|$)/g, "");
  text = text.replace(/تبلیغات/g, "");
  text = text.replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "");
  text = text.replace(/دویچه وله فارسی \/ .*/g, "");
  text = text.replace(/بی‌بی‌سی فارسی \/ .*/g, "");
  text = text.replace(/یورونیوز فارسی \/ .*/g, "");
  
  // Ensure proper paragraph formatting with correct line breaks
  text = text.replace(/\.\s+([^a-z])/g, ".\n\n$1"); // Add double line break after periods followed by non-lowercase letter
  text = text.replace(/\n{3,}/g, "\n\n"); // Normalize multiple line breaks to at most two
  
  // Final cleanup of spaces after all replacements
  text = text.replace(/\s+/g, " ").trim();
  
  // Ensure the text ends with a period
  if (text && text.length > 0 && !/[.!?؟،؛]$/.test(text)) {
    text += ".";
  }
  
  return text.trim();
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&zwnj;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

function generatePostIdentifier(post) {
  try {
    let identifierParts = [];
    
    // افزودن منبع به شناسه
    if (post.source) {
      identifierParts.push(post.source.replace(/\s+/g, "").substring(0, 10));
    }
    
    // تشخیص منابع کریپتویی
    const isCryptoSource = post.source && (
      post.source.includes("Crypto") || 
      post.source.includes("Ramzarz") || 
      post.source.includes("Arz Digital") ||
      post.source.includes("Tejarat")
    );
    
    // افزودن عنوان تمیز شده به شناسه
    if (post.title && post.title.trim()) {
      const cleanTitle = post.title
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "")
        .trim();
      identifierParts.push(cleanTitle);
      
      // برای منابع کریپتو، کلمات کلیدی را استخراج کنیم
      if (isCryptoSource) {
        const keywordRegex = /(بیت ?کوین|اتریوم|کاردانو|سولانا|رمزارز|ارز ?دیجیتال|بلاک ?چین|توکن|تتر)/gi;
        const matches = post.title.match(keywordRegex);
        if (matches && matches.length > 0) {
          identifierParts.push(`crypto_keywords_${matches.join("_")}`);
        }
      }
    }
    
    // افزودن لینک به شناسه (برای منابع کریپتو فقط نام دامنه و مسیر)
    if (post.link) {
      try {
        const url = new URL(post.link);
        // برای منابع کریپتو فقط hostname و pathname استفاده شود
        if (isCryptoSource) {
          const pathClean = url.pathname.replace(/\/+$/, ""); // حذف / انتهایی
          identifierParts.push(`domain_${url.hostname}_path_${pathClean}`);
        } else {
          identifierParts.push(url.pathname.replace(/[^a-zA-Z0-9]/g, ""));
        }
      } catch (e) {
        identifierParts.push(post.link.replace(/[^a-zA-Z0-9]/g, ""));
      }
    }
    
    // افزودن تاریخ انتشار به شناسه
    if (post.pubDate) {
      try {
        const pubDate = new Date(post.pubDate);
        if (!isNaN(pubDate.getTime())) {
          const dateStr = pubDate.toISOString().split("T")[0].replace(/-/g, "");
          identifierParts.push(`date${dateStr}`);
        }
      } catch (e) {
        console.log(`خطا در پردازش تاریخ انتشار: ${e.message}`);
      }
    }
    
    // برای منابع کریپتو، اضافه کردن بخشی از محتوا برای تشخیص بهتر تکراری‌ها
    if (isCryptoSource && post.description && post.description.trim()) {
      // استخراج فقط 50 کاراکتر اول توضیحات
      const cleanDesc = post.description
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "")
        .trim()
        .substring(0, 50);
      const descHash = simpleHash(cleanDesc);
      identifierParts.push(`desc_${descHash}`);
      
      // افزودن کلمات کلیدی از توضیحات
      const cryptoKeywords = /(بیت ?کوین|اتریوم|کاردانو|سولانا|رمزارز|ارز ?دیجیتال|بلاک ?چین|توکن|تتر)/gi;
      const matches = post.description.match(cryptoKeywords);
      if (matches && matches.length > 0) {
        const uniqueKeywords = [...new Set(matches)];
        identifierParts.push(`desc_keywords_${uniqueKeywords.join("_")}`);
      }
    } else if (!isCryptoSource && post.description && post.description.trim()) {
      // برای منابع غیر کریپتو، فقط هش توضیحات را اضافه کنیم
      const cleanDesc = post.description
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "")
        .trim()
        .substring(0, 100);
      const descHash = simpleHash(cleanDesc);
      identifierParts.push(descHash);
    }
    
    if (identifierParts.length === 0) {
      return `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    // ایجاد شناسه نهایی
    let identifier = identifierParts.join("-");
    identifier = identifier.replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF_-]/g, "");
    
    // کوتاه کردن شناسه های خیلی طولانی
    if (identifier.length > 128) {
      // حفظ منبع و تاریخ و ایجاد هش برای بقیه
      const sourceAndDate = identifierParts[0] + (identifierParts.find(p => p.startsWith('date')) || '');
      const otherParts = identifier.replace(sourceAndDate, '');
      identifier = `${sourceAndDate}-${simpleHash(otherParts)}`;
      
      // اطمینان از طول مناسب
      if (identifier.length > 128) {
        identifier = simpleHash(identifier);
      }
    }
    
    return identifier;
  } catch (error) {
    console.error(`Error generating post identifier: ${error.message}`);
    return `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Function to extract meaningful hashtags from post content
function extractHashtags(post) {
  // Detect post category
  const detectCategory = (title, content, source) => {
    const fullText = (title + " " + content).toLowerCase();
    
    // Check for crypto/finance content - include all the new crypto feeds
    if (source === "Crypto Asriran" || 
        source === "Tejarat News" || 
        source === "Ramzarz News" || 
        source === "Arz Digital" || 
        source === "Eghtesad News" ||
        source === "TGJU" ||
        source === "IRNA Economy" ||
        fullText.includes("ارز دیجیتال") || 
        fullText.includes("بیت کوین") || 
        fullText.includes("بلاک چین") || 
        fullText.includes("رمزارز") || 
        fullText.includes("کریپتو")) {
      return "finance";
    }
    
    // Check for political content
    const politicalTerms = [
      "مذاکره", "سیاست", "دولت", "وزیر", "مجلس", "رئیس جمهور", "خامنه‌ای", "رهبر", 
      "انتخابات", "تحریم", "دیپلماسی", "سفیر", "سازمان ملل", "شورای امنیت", 
      "کنگره", "پارلمان", "حزب", "سنا", "احضار", "دیپلمات"
    ];
    if (politicalTerms.some(term => fullText.includes(term))) {
      return "politics";
    }
    
    // Check for international news
    const internationalTerms = ["بین‌المللی", "خارجی", "جهانی", "دیپلماتیک", "سازمان ملل"];
    if (internationalTerms.some(term => fullText.includes(term))) {
      return "international";
    }
    
    // تشخیص محتوای اقتصادی
    const economicTerms = [
      "اقتصاد", "بورس", "بانک", "دلار", "یورو", "ارز", "طلا", "سکه", "بازار",
      "تورم", "رکود", "قیمت", "معاملات", "سهام", "صادرات", "واردات"
    ];
    if (economicTerms.some(term => fullText.includes(term))) {
      return "economy";
    }
    
    // حذف دسته "tech" که ممکن است باعث هشتگ‌های نامرتبط شود
    
    // Default
    return source === "BBC Persian" || source === "DW Persian" || source === "Euronews Persian" || source === "Mehr News" || source === "IRNA Politics" || source === "IRNA World" ? 
      "news" : "general";
  };
  
  // Common Persian stop words to exclude
  const stopWords = [
    "از", "به", "در", "با", "را", "که", "این", "است", "و", "برای", "های", "می", "یک",
    "شد", "شده", "کرد", "شود", "دارد", "گفت", "باید", "کند", "بود", "دیگر", "هم", 
    "خود", "آن", "ها", "اند", "نیز", "ای", "تا", "اما", "شده", "کرده", "بر", "او",
    "ما", "من", "تو", "چه", "چرا", "کجا", "کی", "چگونه", "آنها", "پس", "اگر", "یا",
    "هر", "بی", "بیش", "نمی", "می‌شود", "شده‌اند", "کرده‌اند", "داده", "رفت", "شده‌است",
    "نیست", "بود", "شدن", "کردن", "کرده", "کرده‌است", "دهد", "کنند", "بودن", "بودند",
    "شما", "آیا", "بوده", "داشت", "داشته", "خواهد", "خواهند", "روی", "علاوه", "پیدا",
    "کنید", "آنرا", "وی", "بدون", "حتی", "چون", "مثل", "کنم", "باشد", "مورد",
    "البته", "همان", "همین", "همه", "بسیار", "برخی", "ولی", "اینکه", "کدام", "وقتی",
    "همچنین", "زیرا", "اکنون", "شان", "خیلی", "توسط", "پیش", "برخی", "علیه", "سوی",
    "حال", "بین", "چند", "نباید", "همچنان", "زمان", "طور", "درباره", "زمانی"
  ];
  
  // Named entity types that make good hashtags
  const namedEntityPatterns = {
    // Country names
    countries: [
      "ایران", "آمریکا", "روسیه", "چین", "فرانسه", "آلمان", "انگلستان", "بریتانیا", 
      "ترکیه", "ایتالیا", "عراق", "سوریه", "لبنان", "فلسطین", "اسرائیل", "افغانستان", 
      "پاکستان", "هند", "ژاپن", "کره", "کانادا", "ونزوئلا", "برزیل", "ارمنستان", 
      "آذربایجان", "مصر", "عربستان", "امارات", "قطر", "کویت", "عمان", "بحرین",
      "اوکراین", "دانمارک", "سوئد", "نروژ", "اسپانیا", "پرتغال", "یونان"
    ],
    // Organization names
    organizations: [
      "سازمان ملل", "ناتو", "اتحادیه اروپا", "آژانس", "پنتاگون", "کنگره", "کاخ سفید", 
      "وزارت خارجه", "شورای امنیت", "اوپک", "بانک جهانی", "صندوق بین‌المللی"
    ],
    // Crypto terms
    crypto: [
      "بیت‌کوین", "اتریوم", "ارز دیجیتال", "رمزارز", "بلاکچین", "توکن", "تتر", 
      "کاردانو", "سولانا", "دوج کوین", "کوین", "صرافی", "شیبا", "استیبل"
    ],
    // Finance terms
    finance: [
      "بورس", "سهام", "دلار", "یورو", "سکه", "طلا", "نفت", "اقتصاد", "تورم", "بانک مرکزی",
      "بازار", "قیمت", "ارز", "بهادار", "معاملات", "سهامداران", "بازار سرمایه"
    ],
    // Political terms
    politics: [
      "رئیس‌جمهور", "مجلس", "نماینده", "وزیر", "دولت", "انتخابات", "رهبر", "سیاست", 
      "گفتگو", "مذاکره", "دیپلماسی", "سیاسی", "پارلمان", "حزب", "جمهوری", "دموکرات", 
      "سنا", "کنگره", "رأی", "تحریم", "سفیر", "دیپلمات", "بیانیه", "لایحه", "حکم"
    ]
  };
  
  // Get text from title and content
  const title = post.title ? post.title : "";
  const content = post.description ? post.description : "";
  const category = detectCategory(title, content, post.source);
  
  // Extract named entities based on the patterns
  const extractNamedEntities = (text) => {
    const entities = [];
    
    // Check for each named entity type
    Object.keys(namedEntityPatterns).forEach(entityType => {
      namedEntityPatterns[entityType].forEach(entity => {
        const entityRegex = new RegExp(`\\b${entity}\\b`, 'i');
        if (entityRegex.test(text)) {
          entities.push(entity.replace(/\s+/g, "_"));
        }
      });
    });
    
    return entities;
  };
  
  // Important phrases to look for in the title - these make good hashtags
  const extractPhrases = (text) => {
    const phrases = [];
    // Match 2-3 word phrases that don't contain stop words
    const regex = /(\b[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]{3,}(\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]{3,}){1,2}\b)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const phrase = match[0].trim();
      // Ensure no phrase contains stop words
      const phraseWords = phrase.split(/\s+/);
      if (!phraseWords.some(word => stopWords.includes(word)) && phraseWords.length <= 3) {
        phrases.push(phrase);
      }
    }
    return phrases;
  };
  
  // Extract important phrases from title (prioritize these)
  const titlePhrases = extractPhrases(title);
  
  // Extract named entities from both title and content
  const namedEntities = extractNamedEntities(title + " " + content);
  
  // Combine text and split into words
  let text = (title + " " + content).replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, " ");
  let words = text.split(/\s+/).filter(word => word.length > 3);
  
  // Filter out stop words and short words
  words = words.filter(word => !stopWords.includes(word) && word.length >= 4);
  
  // Count word frequencies
  const wordFrequency = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort words by frequency
  let sortedWords = Object.keys(wordFrequency).sort((a, b) => {
    return wordFrequency[b] - wordFrequency[a];
  });
  
  // Get the top words
  sortedWords = sortedWords.slice(0, 8);
  
  // Format phrases into hashtags (replace spaces with underscores)
  const phraseHashtags = titlePhrases.map(phrase => phrase.replace(/\s+/g, "_"));
  
  // Default hashtags based on category
  const defaultHashtags = [];
  
  // Category-specific hashtags - only include 1-2 default hashtags to avoid irrelevancy
  if (category === "finance" || category === "economy" || post.source === "Tejarat News" || post.source === "TGJU" || post.source === "IRNA Economy" || post.source === "Eghtesad News") {
    // بررسی اگر کلمات خاص اقتصادی در متن وجود دارند
    if (title.includes("ارز") || content.includes("ارز")) defaultHashtags.push("ارز");
    if (title.includes("بورس") || content.includes("بورس")) defaultHashtags.push("بورس");
    if (title.includes("اقتصاد") || content.includes("اقتصاد")) defaultHashtags.push("اقتصاد");
    if (title.includes("بانک") || content.includes("بانک")) defaultHashtags.push("بانک");
    
    // اگر هیچ کلمه خاصی نبود، فقط یک هشتگ کلی اضافه کنیم
    if (defaultHashtags.length === 0) defaultHashtags.push("اقتصاد");
  } else if (category === "crypto" || post.source.includes("Crypto") || post.source.includes("Coin") || post.source.includes("Arz")) {
    // بررسی اگر کلمات خاص رمزارزی در متن وجود دارند
    if (title.includes("بیت کوین") || content.includes("بیت کوین")) defaultHashtags.push("بیت_کوین");
    if (title.includes("رمزارز") || content.includes("رمزارز")) defaultHashtags.push("رمزارز");
    
    // اگر هیچ کلمه خاصی نبود، فقط یک هشتگ کلی اضافه کنیم
    if (defaultHashtags.length === 0) defaultHashtags.push("رمزارز");
  } else if (category === "politics") {
    // محتوای سیاسی - بررسی کلمات کلیدی
    if (title.includes("ایران") || content.includes("ایران")) defaultHashtags.push("ایران");
    if (title.includes("آمریکا") || content.includes("آمریکا")) defaultHashtags.push("آمریکا");
    if (title.includes("انتخابات") || content.includes("انتخابات")) defaultHashtags.push("انتخابات");
    if (title.includes("مذاکره") || content.includes("مذاکره")) defaultHashtags.push("مذاکره");
    if (title.includes("تحریم") || content.includes("تحریم")) defaultHashtags.push("تحریم");
    if (title.includes("دولت") || content.includes("دولت")) defaultHashtags.push("دولت");
    
    // اگر هیچ کلمه خاصی نبود، فقط یک هشتگ کلی اضافه کنیم
    if (defaultHashtags.length === 0) defaultHashtags.push("سیاست");
  } else if (category === "international") {
    // اخبار بین‌المللی - بررسی کلمات کلیدی
    const countries = namedEntityPatterns.countries;
    let countryFound = false;
    
    for (const country of countries) {
      const countryRegex = new RegExp(`\\b${country}\\b`, 'i');
      if (countryRegex.test(title) || countryRegex.test(content)) {
        defaultHashtags.push(country);
        countryFound = true;
        // محدود کردن به حداکثر 2 کشور
        if (defaultHashtags.length >= 2) break;
      }
    }
    
    // اگر هیچ کشوری نبود، هشتگ کلی
    if (!countryFound) defaultHashtags.push("بین_الملل");
  } else {
    // اخبار عمومی - بررسی محتوا
    if (text.includes("ایران")) defaultHashtags.push("ایران");
    if (text.includes("اخبار")) defaultHashtags.push("اخبار");
  }
  
  // Combine all hashtag types, removing duplicates
  const allHashtags = [...new Set([
    ...namedEntities, 
    ...phraseHashtags, 
    ...sortedWords,
    ...defaultHashtags
  ])];
  
  // Score and prioritize hashtags
  const scoreHashtag = (hashtag) => {
    let score = 0;
    
    // بررسی اگر هشتگ در عنوان وجود دارد (امتیاز بالا)
    const hashtagRegex = new RegExp(`\\b${hashtag.replace(/_/g, "[_ ]")}\\b`, 'i');
    if (hashtagRegex.test(title)) {
      score += 100;
    } else if (hashtagRegex.test(content.substring(0, 200))) {
      // اگر در 200 کاراکتر اول محتوا باشد
      score += 80;
    } else if (hashtagRegex.test(content)) {
      // اگر در ادامه محتوا باشد
      score += 50;
    }
    
    // Named entities get high priority
    if (namedEntities.includes(hashtag)) score += 90;
    // Phrases from title get next priority
    if (phraseHashtags.includes(hashtag)) score += 70;
    // Top frequency words get scores based on frequency
    const freq = wordFrequency[hashtag] || 0;
    score += freq * 5;
    // Default hashtags get a small boost if they're actually in the content
    if (defaultHashtags.includes(hashtag)) {
      if (hashtagRegex.test(title) || hashtagRegex.test(content)) {
        score += 30;
      } else {
        score += 10; // کمتر اگر در متن نیست
      }
    }
    
    // Length bonus/penalty - not too short, not too long
    if (hashtag.length < 3) score -= 50; // قویاً رد کردن هشتگ‌های خیلی کوتاه
    if (hashtag.length > 20) score -= 40; // قویاً رد کردن هشتگ‌های خیلی بلند
    if (hashtag.length > 12) score -= 20;
    
    // اگر هشتگ نامربوط تشخیص داده شود، امتیاز منفی جدی
    const irrelevantHashtags = ["هند", "پاکستان", "طلا", "نفت", "گاز"];
    
    // اگر هشتگ در لیست نامربوط‌ها باشد و در متن اصلی نباشد، امتیاز منفی
    if (irrelevantHashtags.includes(hashtag) && !hashtagRegex.test(title) && !hashtagRegex.test(content.substring(0, 500))) {
      score -= 500; // امتیاز منفی شدید
    }
    
    return score;
  };
  
  // Prioritize hashtags based on scoring
  const finalHashtags = allHashtags
    .sort((a, b) => scoreHashtag(b) - scoreHashtag(a))
    .slice(0, 5);  // Limit to 5 hashtags
  
  // Format hashtags as string with # prefix
  if (finalHashtags.length > 0) {
    return `\n\n${finalHashtags.map(tag => `#${tag}`).join(" ")}`;
  }
  
  return "";
}

// KV Storage functions
async function hasPostBeenSent(postIdentifier, env) {
  try {
    if (!env || !env.POST_TRACKER) {
      console.error("POST_TRACKER KV binding is not available");
      return false;
    }
    
    const safeIdentifier = postIdentifier
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF_-]/g, "")
      .substring(0, 128);
    
    const storedValue = await env.POST_TRACKER.get(safeIdentifier);
    let hasBeenSent = false;
    
    if (storedValue) {
      try {
        const parsedValue = JSON.parse(storedValue);
        hasBeenSent = true;
        
        // اطلاعات بیشتری را لاگ کنیم
        if (parsedValue.data && typeof parsedValue.data === 'object') {
          const source = parsedValue.data.source || "نامشخص";
          console.log(`پست "${safeIdentifier}" از منبع "${source}" در تاریخ ${parsedValue.sentAt} ارسال شده است`);
          
          // اگر این یک شناسه ارجاع است، اطلاعات آن را نمایش دهیم
          if (parsedValue.data.referenceId) {
            console.log(`  این شناسه به پست اصلی "${parsedValue.data.referenceId}" ارجاع می‌دهد`);
          }
        } else {
          console.log(`پست "${safeIdentifier}" قبلاً در تاریخ ${parsedValue.sentAt} ارسال شده است`);
        }
      } catch (e) {
        hasBeenSent = storedValue === "sent";
        console.log(`پست "${safeIdentifier}" قبلاً ارسال شده است (فرمت قدیمی)`);
      }
    }
    
    return hasBeenSent;
  } catch (error) {
    console.error(`Error checking if post has been sent: ${error.message}`);
    return false;
  }
}

async function isContentDuplicate(post, env) {
  try {
    if (!env || !env.POST_TRACKER || !post.title) {
      return false;
    }

    // اگر توضیحات خالی باشد، نمی‌توانیم تکراری بودن را بررسی کنیم
    if (!post.description || post.description.trim().length < 50) {
      return false;
    }

    // بهبود: تمیزسازی و نرمال‌سازی متن‌ها
    const cleanTitle = post.title
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
      .trim()
      .toLowerCase(); // تبدیل به حروف کوچک برای مقایسه بهتر
    
    const cleanDescription = post.description
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
      .substring(0, 500) // افزایش به 500 کاراکتر برای تشخیص بهتر
      .trim()
      .toLowerCase();

    // استخراج کلیدواژه‌های مهم از عنوان
    const titleWords = cleanTitle
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // استخراج کلیدواژه‌های مهم از توضیحات
    const descWords = cleanDescription
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 20); // افزایش به 20 کلمه برای مقایسه دقیق‌تر

    // بدون کلمات کلیدی کافی نمی‌توان مقایسه کرد
    if (titleWords.length < 2 && descWords.length < 4) {
      return false;
    }

    // بررسی 300 پست اخیر برای تشخیص دقیق‌تر
    const keys = await env.POST_TRACKER.list({ limit: 300 });
    if (!keys || !keys.keys || keys.keys.length === 0) {
      return false;
    }

    // برای فیدهای کریپتویی آستانه تطابق را بالاتر می‌بریم
    const isCryptoSource = post.source && (
      post.source.includes("Crypto") || 
      post.source.includes("Ramzarz") || 
      post.source.includes("Arz Digital") ||
      post.source.includes("Tejarat")
    );
    
    // برای اخبار مهم و فوری آستانه را بالاتر می‌بریم تا به اشتباه فیلتر نشوند
    const isHighPriority = post.isBreakingNews || post.isHighPriorityContent;
    
    // آستانه‌های متفاوت براساس نوع منبع و اهمیت خبر
    const titleThreshold = isHighPriority ? 0.85 : isCryptoSource ? 0.75 : 0.65;
    const descThreshold = isHighPriority ? 0.70 : isCryptoSource ? 0.55 : 0.45;

    // استفاده از استراتژی‌های مختلف برای تشخیص تکراری
    for (const key of keys.keys) {
      try {
        const storedValueStr = await env.POST_TRACKER.get(key.name);
        if (!storedValueStr) continue;

        let storedValue;
        try {
          storedValue = JSON.parse(storedValueStr);
        } catch (e) {
          continue;
        }

        if (storedValue.data && typeof storedValue.data === "object") {
          const storedTitle = storedValue.data.title || "";
          const storedSource = storedValue.data.source || "";
          
          // اگر منبع یکسان و زمان ارسال کمتر از 48 ساعت است، حتی با عناوین متفاوت هم دقت بیشتری به خرج دهیم
          const isSameSource = post.source === storedSource;
          let isRecentFromSameSource = false;
          
          if (isSameSource && storedValue.sentAt) {
            const sentTime = new Date(storedValue.sentAt).getTime();
            const currentTime = new Date().getTime();
            const hoursDiff = (currentTime - sentTime) / (1000 * 60 * 60);
            isRecentFromSameSource = hoursDiff < 48;
          }
          
          // اگر از یک منبع در 48 ساعت گذشته پست مشابه داشته‌ایم، آستانه را پایین‌تر بیاوریم
          const adjustedTitleThreshold = isRecentFromSameSource ? titleThreshold * 0.85 : titleThreshold;
          
          // برای فیدهای کریپتو فقط با فیدهای کریپتو مقایسه کنیم (مگر اینکه خبر خیلی مهم باشد)
          if (isCryptoSource && !isHighPriority && !(
            storedSource.includes("Crypto") || 
            storedSource.includes("Ramzarz") || 
            storedSource.includes("Arz Digital") ||
            storedSource.includes("Tejarat") ||
            storedSource.includes("Coin")
          )) {
            continue;
          }
          
          // مقایسه عنوان
          if (storedTitle) {
            const cleanStoredTitle = storedTitle
              .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
              .trim()
              .toLowerCase();
            
            // روش 1: بررسی میزان همپوشانی کلمات عنوان
            let titleMatchCount = 0;
            for (const word of titleWords) {
              if (cleanStoredTitle.includes(word)) {
                titleMatchCount++;
              }
            }
            
            // محاسبه درصد تطابق عنوان
            const titleMatchPercentage = titleWords.length > 0 
              ? titleMatchCount / titleWords.length
              : 0;
            
            // روش 2: محاسبه شباهت متنی کلی
            const titleSimilarity = calculateSimilarity(cleanTitle, cleanStoredTitle);
            
            // بررسی انطباق دقیق - اگر عنوان‌ها خیلی شبیه هستند
            if (titleSimilarity > 0.8 || (titleMatchPercentage >= adjustedTitleThreshold && titleWords.length >= 3)) {
              console.log(`محتوای مشابه یافت شد (عنوان): "${storedTitle}" با "${post.title}" - تطابق: ${(Math.max(titleSimilarity, titleMatchPercentage) * 100).toFixed(0)}%`);
              return true;
            }
            
            // بررسی محتوا برای تشخیص دقیق‌تر
            if (titleMatchPercentage >= 0.4 || titleSimilarity >= 0.3) { // اگر عنوان تا حدی مشابه است، محتوا را هم بررسی کنیم
              const storedDescription = storedValue.data.description || "";
              if (storedDescription && cleanDescription) {
                const cleanStoredDesc = storedDescription
                  .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
                  .substring(0, 500)
                  .trim()
                  .toLowerCase();
                
                // مقایسه محتوا با دو روش
                const descSimilarity = calculateSimilarity(cleanDescription, cleanStoredDesc);
                
                let descMatchCount = 0;
                for (const word of descWords) {
                  if (cleanStoredDesc.includes(word)) {
                    descMatchCount++;
                  }
                }
                
                const descMatchPercentage = descWords.length > 0
                  ? descMatchCount / descWords.length
                  : 0;
                
                // ترکیب نتایج دو روش برای تشخیص دقیق‌تر
                const combinedScore = Math.max(descSimilarity, descMatchPercentage) * 0.7 + titleMatchPercentage * 0.3;
                
                if (combinedScore >= descThreshold) {
                  console.log(`محتوای مشابه یافت شد (ترکیبی): "${storedTitle}" با "${post.title}" - تطابق: ${(combinedScore * 100).toFixed(0)}%`);
                  return true;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(`خطا در بررسی کلید ${key.name}: ${e.message}`);
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error checking for duplicate content: ${error.message}`);
    return false;
  }
}

async function markPostAsSent(postIdentifier, env, postData = null) {
  try {
    if (!env || !env.POST_TRACKER) {
      console.error("POST_TRACKER KV binding is not available");
      return false;
    }
    
    const safeIdentifier = postIdentifier
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF_-]/g, "")
      .substring(0, 128);
    
    // اطلاعات بیشتری را ذخیره کنیم
    const currentTime = new Date().toISOString();
    const storedData = {
      sentAt: currentTime,
      data: postData || { sentAt: currentTime }
    };
    
    // برای پست‌های کریپتویی، مقدار TTL را افزایش دهیم تا مدت طولانی‌تری ذخیره شوند
    const isCryptoSource = postData && postData.source && (
      postData.source.includes("Crypto") || 
      postData.source.includes("Ramzarz") || 
      postData.source.includes("Arz Digital") ||
      postData.source.includes("Tejarat")
    );
    
    // زمان TTL طولانی‌تر برای منابع کریپتو
    const ttlDays = isCryptoSource ? STORAGE_TTL_DAYS * 2 : STORAGE_TTL_DAYS;
    
    // ذخیره با TTL مناسب
    await env.POST_TRACKER.put(safeIdentifier, JSON.stringify(storedData), {
      expirationTtl: 86400 * ttlDays
    });
    
    if (isCryptoSource) {
      console.log(`پست کریپتویی "${safeIdentifier}" به عنوان ارسال شده علامت‌گذاری شد. به مدت ${ttlDays} روز ذخیره می‌شود.`);
    } else {
      console.log(`پست "${safeIdentifier}" به عنوان ارسال شده علامت‌گذاری شد. به مدت ${ttlDays} روز ذخیره می‌شود.`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error marking post as sent: ${error.message}`);
    return false;
  }
}

// Telegram posting function
async function sendTelegramPost(post, env) {
  try {
    // Clean special sources content
    if (post.source === "DW Persian") {
      post.description = post.description
        .replace(/اینترنت بدون سانسور با سایفون دویچه‌ وله/g, "")
        .replace(/اینترنت بدون سانسور با سایفون/g, "")
        .replace(/دویچه وله فارسی را در .* دنبال کنید/g, "")
        .replace(/بیشتر بخوانید:.*/g, "")
        .replace(/\n{3,}/g, "\n\n");
    }
    
    if (post.source === "Euronews Persian") {
      post.description = post.description
        .replace(/یورونیوز در «سرخط خبرها» مهم‌ترین رویدادهای ایران و جهان را در دو نوبت مرور می‌کند.*/g, "")
        .replace(/«مجله شامگاهی» برنامه‌ای تصویری از یورونیوز است که هر شب.*/g, "")
        .replace(/«سرخط خبرها» مجموعه‌ای است که یورونیوز [^\.]*\./g, "")
        .replace(/در این قسمت مهم‌ترین عناوین خبری.*/g, "")
        .replace(/یورونیوز فارسی را در .* دنبال کنید/g, "")
        .replace(/یورونیوز فارسی \/ .*/g, "")
        .replace(/\n{3,}/g, "\n\n");
    }
    
    // Validate title and content
    const cleanTitle = post.title ? sanitizeText(post.title) : "";
    let cleanDescription = post.description ? sanitizeText(post.description) : "";
    
    if (!cleanTitle || cleanTitle.trim().length === 0) {
      console.log("عنوان پست خالی است، پست ارسال نمی‌شود");
      return false;
    }
    
    if (!cleanDescription || cleanDescription.trim().length < 50) {
      console.log(`محتوای پست "${cleanTitle}" بسیار کوتاه است، پست ارسال نمی‌شود`);
      return false;
    }
    
    // IMPROVED TITLE REPETITION FIX: More aggressive search for title in content
    if (cleanTitle && cleanDescription) {
      // Remove exact title from the end
      if (cleanDescription.endsWith(cleanTitle) || cleanDescription.endsWith(cleanTitle + ".")) {
        cleanDescription = cleanDescription.substring(0, cleanDescription.length - cleanTitle.length).trim();
        if (cleanDescription.endsWith(".")) {
          cleanDescription = cleanDescription.substring(0, cleanDescription.length - 1).trim();
        }
      }
      
      // Also remove title from the beginning if it appears exactly
      if (cleanDescription.startsWith(cleanTitle) || cleanDescription.startsWith(cleanTitle + ".")) {
        cleanDescription = cleanDescription.substring(cleanTitle.length).trim();
        if (cleanDescription.startsWith(".")) {
          cleanDescription = cleanDescription.substring(1).trim();
        }
      }
      
      // Escape special regex characters in title
      const escapedTitle = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Look for title in the text and remove it if it appears alone as a sentence or paragraph
      const titlePattern = new RegExp(`(^|\\n+)\\s*${escapedTitle}\\s*(\\.|\\n+|$)`, 'g');
      cleanDescription = cleanDescription.replace(titlePattern, '$1');
      
      // Also check for similar title (with small variations)
      // First create word array from title
      const titleWords = cleanTitle.split(/\s+/).filter(word => word.length > 3);
      if (titleWords.length >= 3) {
        // Find sequences that contain most title words in the same order
        const titleRegex = new RegExp(`([^.!?؟،؛]+(?:[.!?؟،؛]|$))`, 'g');
        let match;
        
        // Check each sentence for similarity to title
        while ((match = titleRegex.exec(cleanDescription)) !== null) {
          const sentence = match[1].trim();
          // Only check reasonably sized sentences
          if (sentence.length > titleWords.length * 2) {
            // Count how many title words appear in this sentence
            let matchCount = 0;
            for (const word of titleWords) {
              if (sentence.includes(word)) {
                matchCount++;
              }
            }
            
            // If most title words appear in this sentence, it's probably a repetition
            if (matchCount >= titleWords.length * 0.7) {
              cleanDescription = cleanDescription.replace(sentence, "");
            }
          }
        }
      }
      
      // Normalize multiple line breaks after cleaning
      cleanDescription = cleanDescription.replace(/\n{3,}/g, "\n\n").trim();
    }
    
    // Detect breaking news and important content
    const isBreakingNews = post.isBreakingNews || false;
    const isHighPriorityContent = post.isHighPriorityContent || false;
    
    // Split text into paragraphs for better analysis
    const paragraphs = cleanDescription.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Use the findNewsSummary function to get the best paragraph
    let bestSummaryParagraph = "";
    if (paragraphs.length > 0 && cleanTitle) {
      bestSummaryParagraph = findNewsSummary(paragraphs, cleanTitle);
    }
    
    // For breaking news, prioritize the best summary paragraph
    let mainContent = "";
    if (isBreakingNews || isHighPriorityContent) {
      if (bestSummaryParagraph) {
        mainContent = bestSummaryParagraph;
        
        // For important news, add one more relevant paragraph
        if (paragraphs.length > 1 && bestSummaryParagraph.length < 500) {
          // Add another important paragraph that's not the same as our best summary
          for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (para !== bestSummaryParagraph && para.length > 50 && 
                mainContent.length + para.length < 1000) {
              mainContent += "\n\n" + para;
              break;
            }
          }
        }
      } else {
        // Fallback to first paragraph
        mainContent = paragraphs[0] || cleanDescription;
      }
    } else {
      // For regular news: intelligently select most relevant paragraphs
      // Start with the best summary paragraph if available
      let selectedParagraphs = [];
      
      if (bestSummaryParagraph) {
        selectedParagraphs.push(bestSummaryParagraph);
      }
      
      // Then add other important paragraphs (up to 3 total)
      for (let i = 0; i < paragraphs.length && selectedParagraphs.length < 3; i++) {
        const para = paragraphs[i];
        // Don't add the summary paragraph twice
        if (para !== bestSummaryParagraph && para.length > 50) {
          selectedParagraphs.push(para);
          // Limit to 2 additional paragraphs after the summary
          if (selectedParagraphs.length >= 3) {
            break;
          }
        }
      }
      
      // If we somehow got no paragraphs, use the first one
      if (selectedParagraphs.length === 0 && paragraphs.length > 0) {
        selectedParagraphs.push(paragraphs[0]);
      }
      
      mainContent = selectedParagraphs.join("\n\n");
    }
    
    // Make sure content doesn't end with incomplete sentence
    if (mainContent) {
      // If content doesn't end with proper punctuation, find the last complete sentence
      if (!/[.!?؟،؛]$/.test(mainContent)) {
        const lastSentenceEnd = Math.max(
          mainContent.lastIndexOf('.'), 
          mainContent.lastIndexOf('!'),
          mainContent.lastIndexOf('?'),
          mainContent.lastIndexOf('؟'),
          mainContent.lastIndexOf('،')
        );
        
        if (lastSentenceEnd > mainContent.length * 0.7) { // Only trim if we're not losing too much
          mainContent = mainContent.substring(0, lastSentenceEnd + 1);
        } else {
          // Otherwise add a period
          mainContent += ".";
        }
      }
    }
    
    // Format title with proper emoji
    let titleText = "";
    if (cleanTitle && cleanTitle.trim()) {
      if (isBreakingNews) {
        titleText = `🔴 <b>${cleanTitle}</b>\n\n`;
      } else if (isHighPriorityContent) {
        titleText = `⭐️ <b>${cleanTitle}</b>\n\n`;
      } else {
        titleText = `📌 <b>${cleanTitle}</b>\n\n`;
      }
    }
    
    // Add channel link
    const channelLink = `\n\n@ramznewsofficial | اخبار رمزی`;
    
    // Generate hashtags - limited and relevant only
    let hashtags = extractHashtags(post);
    
    // For breaking news, add #فوری if not already there
    if (isBreakingNews && !hashtags.includes("#فوری")) {
      if (hashtags.length > 0) {
        hashtags = "#فوری " + hashtags;
      } else {
        hashtags = "#فوری";
      }
    }
    
    // Set appropriate max length based on content type
    const hasImage = post.image && isValidUrl(post.image);
    let maxLength = 3800; // Default limit
    
    if (hasImage) {
      maxLength = isBreakingNews ? 1800 : 2000; // Less for posts with images
    } else if (isBreakingNews) {
      maxLength = 2500; // Less for breaking news (better display)
    }
    
    // Calculate available space for content
    const otherPartsLength = titleText.length + hashtags.length + channelLink.length;
    const maxContentLength = maxLength - otherPartsLength;
    
    // IMPROVED CONTENT SHORTENING: Preserve meaning by trimming at sentence boundaries
    let finalContent = "";
    if (mainContent.length <= maxContentLength) {
      finalContent = mainContent;
    } else {
      // Split by sentences more accurately
      const sentenceRegex = /([^.!?؟،؛]+(?:[.!?؟،؛]|$))/g;
      const sentences = [];
      let match;
      
      while ((match = sentenceRegex.exec(mainContent)) !== null) {
        sentences.push(match[1]);
      }
      
      let currentLength = 0;
      
      // Add sentences until we reach the limit
      for (const sentence of sentences) {
        if (currentLength + sentence.length <= maxContentLength - 3) {
          finalContent += sentence;
          currentLength += sentence.length;
        } else {
          // If we can fit most of the sentence, trim it intelligently
          if (sentence.length < 100 && currentLength + sentence.length <= maxContentLength) {
            finalContent += sentence;
          } else {
            // If we have almost no content yet, use part of the first sentence
            if (finalContent.length < 100 && sentences.indexOf(sentence) === 0) {
              finalContent = sentence.substring(0, maxContentLength - 3) + "...";
            } else if (finalContent.length < 100) {
              // If we still don't have enough, use the first paragraph
              finalContent = paragraphs[0].substring(0, maxContentLength - 3) + "...";
            }
          }
          break;
        }
      }
    }
    
    // Final cleanup of content
    finalContent = finalContent.trim();
    
    // Make sure content ends with proper punctuation
    if (finalContent && !/[.!?؟،؛]$/.test(finalContent)) {
      finalContent += ".";
    }
    
    // Final check to ensure no title repetition at the end of content
    const titleWords = cleanTitle.split(/\s+/).filter(word => word.length > 3);
    if (titleWords.length >= 3) {
      const lastParagraph = finalContent.split(/\n\n+/).pop() || "";
      
      if (lastParagraph.length < cleanTitle.length * 1.5) {
        // Count how many title words appear in the last paragraph
        let matchCount = 0;
        for (const word of titleWords) {
          if (lastParagraph.includes(word)) {
            matchCount++;
          }
        }
        
        // If most of the title words appear in the last paragraph, remove it
        if (matchCount >= titleWords.length * 0.7) {
          const parts = finalContent.split(/\n\n+/);
          if (parts.length > 1) {
            parts.pop();
            finalContent = parts.join("\n\n");
          }
        }
      }
    }
    
    // Construct final message
    const message = `${titleText}${finalContent}${hashtags}${channelLink}`;
    
    // Configure API URL and payload based on image presence
    const url = hasImage 
      ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
      : `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = hasImage 
      ? {
          chat_id: CHANNEL_USERNAME,
          photo: post.image,
          caption: message,
          parse_mode: "HTML"
        } 
      : {
          chat_id: CHANNEL_USERNAME,
          text: message,
          parse_mode: "HTML"
        };
    
    console.log(`ارسال پست به تلگرام: ${cleanTitle}`);
    
    // Send request to Telegram API
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    // Handle errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.statusText}, Response: ${errorText}`);
      
      if (errorText.includes("message is too long") || errorText.includes("caption is too long")) {
        // If still too long, try sending only the title and best summary paragraph
        const shorterContent = bestSummaryParagraph || (paragraphs.length > 0 ? paragraphs[0] : "");
        const shorterMessage = `${titleText}${shorterContent}${channelLink}`;
        
        const shorterPayload = hasImage 
          ? {
              chat_id: CHANNEL_USERNAME,
              photo: post.image,
              caption: shorterMessage,
              parse_mode: "HTML"
            } 
          : {
              chat_id: CHANNEL_USERNAME,
              text: shorterMessage,
              parse_mode: "HTML"
            };
        
        console.log("Retrying with shorter message containing just the best summary paragraph");
        
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shorterPayload)
        });
        
        if (!retryResponse.ok) {
          console.error(`Final telegram API error after retry: ${await retryResponse.text()}`);
          return false;
        }
        
        console.log("Successfully sent shortened message");
        return true;
      }
      
      return false;
    }
    
    console.log("Successfully sent message to Telegram");
    return true;
  } catch (error) {
    console.error(`Error sending post to Telegram: ${error.message}`);
    return false;
  }
}

// Content fetching functions
async function fetchFullContent(url, source) {
  try {
    console.log(`درحال دریافت محتوای کامل از ${url}`);
    
    // تشخیص منابع کریپتویی و خبرگزاری‌ها
    const isCryptoSource = source && (
      source.includes("Crypto") || 
      source.includes("Ramzarz") || 
      source.includes("Arz Digital") ||
      source.includes("Tejarat")
    );
    
    const isNewsAgency = source && (
      source.includes("BBC") ||
      source.includes("DW") || 
      source.includes("Euronews") ||
      source.includes("IRNA") ||
      source.includes("Mehr")
    );
    
    // ارسال درخواست با هدرهای مناسب
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fa,en-US;q=0.7,en;q=0.3"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch article page: ${response.statusText}`);
    }
    
    const html = await response.text();
    let content = "";
    let image = null;
    
    // ⚡️ پیمایش‌گر بهبود یافته برای استخراج محتوا
    const extractContentFromHTML = (html, source) => {
      // الگوهای مختلف برای شناسایی بخش اصلی محتوا
      const contentSelectors = [
        // خبرگزاری‌ها
        /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*item-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*news-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*main-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*content-inner[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      ];
      
      // الگوهای استخراج خلاصه خبر (لید)
      const summarySelectors = [
        /<div[^>]*class="[^"]*lead[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<p[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
        /<p[^>]*class="[^"]*lead[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
        /<div[^>]*class="[^"]*article-summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*news-summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      ];
      
      // تلاش برای استخراج خلاصه خبر
      let summary = "";
      for (const selector of summarySelectors) {
        const match = selector.exec(html);
        if (match) {
          summary = match[1].trim();
          break;
        }
      }
      
      // تلاش برای استخراج محتوای اصلی
      let articleBody = "";
      for (const selector of contentSelectors) {
        const match = selector.exec(html);
        if (match) {
          articleBody = match[1].trim();
          break;
        }
      }
      
      // اگر هیچ محتوایی پیدا نشد، سعی می‌کنیم با روش ساده‌تر استخراج کنیم
      if (!articleBody) {
        const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
        if (bodyMatch) {
          // حذف هدر و فوتر و سایدبار از بدنه
          let bodyContent = bodyMatch[1];
          // حذف منوها، هدر، فوتر و بخش‌های نامربوط
          bodyContent = bodyContent
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
            .replace(/<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
            .replace(/<div[^>]*class="[^"]*menu[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
            .replace(/<div[^>]*class="[^"]*comment[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
            .replace(/<div[^>]*class="[^"]*related[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
          
          // استخراج پاراگراف‌ها از بدنه باقیمانده
          const paragraphs = [];
          const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
          let paragraphMatch;
          
          while ((paragraphMatch = paragraphRegex.exec(bodyContent)) !== null) {
            if (paragraphMatch[1].trim().length > 20) {  // حداقل طول معنادار
              paragraphs.push(sanitizeText(paragraphMatch[1]));
            }
          }
          
          if (paragraphs.length > 0) {
            articleBody = paragraphs.join("\n\n");
          }
        }
      }
      
      // پردازش محتوای استخراج شده
      if (articleBody) {
        // استخراج پاراگراف‌ها
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          const sanitizedParagraph = sanitizeText(paragraphMatch[1]);
          // فقط پاراگراف‌های با طول معنادار (بیش از 20 کاراکتر) را نگه می‌داریم
          if (sanitizedParagraph && sanitizedParagraph.trim().length > 20) {
            paragraphs.push(sanitizedParagraph);
          }
        }
        
        // همچنین از سایر تگ‌های متنی استخراج کنیم
        const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
        let headingMatch;
        
        while ((headingMatch = headingRegex.exec(articleBody)) !== null) {
          const sanitizedHeading = sanitizeText(headingMatch[1]);
          if (sanitizedHeading && sanitizedHeading.trim().length > 0) {
            paragraphs.push(sanitizedHeading);
          }
        }
        
        // بررسی وجود لیست‌ها
        const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        const listItems = [];
        let listItemMatch;
        
        while ((listItemMatch = listItemRegex.exec(articleBody)) !== null) {
          const sanitizedItem = sanitizeText(listItemMatch[1]);
          if (sanitizedItem && sanitizedItem.trim().length > 0) {
            listItems.push(`• ${sanitizedItem}`);
          }
        }
        
        if (listItems.length > 0) {
          paragraphs.push(listItems.join("\n"));
        }
        
        // ترکیب خلاصه با محتوا
        let finalContent = "";
        if (summary && !paragraphs.some(p => p.includes(summary))) {
          const sanitizedSummary = sanitizeText(summary);
          if (sanitizedSummary.length > 30) {
            finalContent = sanitizedSummary + "\n\n";
          }
        }
        
        finalContent += paragraphs.join("\n\n");
        return finalContent;
      }
      
      return "";
    };
    
    // ⚡️ استخراج هوشمند تصویر اصلی
    const extractMainImage = (html) => {
      // الگوهای متنوع برای استخراج تصویر اصلی
      const imageSelectors = [
        // Open Graph image (پرکاربردترین)
        /<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i,
        // Twitter image
        /<meta[^>]+name="twitter:image"[^>]+content="([^">]+)"/i,
        // Featured image
        /<img[^>]+class="[^"]*(?:featured-image|main-image|thumbnail|article-image)[^"]*"[^>]+src="([^">]+)"/i,
        // Image inside figure
        /<figure[^>]*>\s*<img[^>]+src="([^">]+)"[^>]*>/i,
        // First image with data-src attribute
        /<img[^>]+data-src="([^">]+)"[^>]*>/i,
        // First image with src attribute
        /<img[^>]+src="([^">]+)"[^>]*>/i
      ];
      
      for (const selector of imageSelectors) {
        const match = selector.exec(html);
        if (match && match[1]) {
          const imageUrl = match[1];
          
          // فیلتر کردن تصاویر نامعتبر
          if (
            !imageUrl.includes("logo") && 
            !imageUrl.includes("icon") && 
            !imageUrl.includes("banner") &&
            !imageUrl.includes("avatar") &&
            imageUrl.match(/\.(jpg|jpeg|png|webp)($|\?)/i)
          ) {
            return imageUrl;
          }
        }
      }
      
      return null;
    };
    
    // پردازش اختصاصی برای هر منبع
    if (isCryptoSource) {
      // استخراج محتوا برای منابع کریپتویی
      content = extractContentFromHTML(html, source);
      image = extractMainImage(html);
    } else if (source === "BBC Persian") {
      // کد اختصاصی BBC Persian
      const articleBodyMatch = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html);
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          paragraphs.push(sanitizeText(paragraphMatch[1]));
        }
        
        content = paragraphs.join("\n\n");
        
        // استخراج تصویر اصلی BBC
        image = extractMainImage(html);
        if (!image) {
          const imgMatch = /<img[^>]+src="([^">]+)"[^>]*data-ratio="original"/i.exec(articleBody);
          if (imgMatch) {
            image = imgMatch[1];
          }
        }
      }
    } else if (source === "DW Persian") {
      // استخراج محتوا برای DW Persian
      const articleBodyMatch = /<div[^>]*class="[^"]*longText[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) || 
                              /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*dw-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      
      // استخراج خلاصه خبر DW
      const summaryMatch = /<p[^>]*class="[^"]*intro[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(html);
      let summary = "";
      if (summaryMatch) {
        summary = sanitizeText(summaryMatch[1]);
      }
      
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          // پاکسازی محتوای تبلیغاتی DW
          const cleanParagraph = paragraphMatch[1]
            .replace(/اینترنت بدون سانسور با سایفون دویچه‌ وله/g, "")
            .replace(/اینترنت بدون سانسور با سایفون/g, "")
            .replace(/دویچه وله فارسی را در .* دنبال کنید/g, "")
            .replace(/بیشتر بخوانید:.*/g, "");
          
          if (cleanParagraph && cleanParagraph.trim().length > 0) {
            const sanitizedParagraph = sanitizeText(cleanParagraph);
            if (sanitizedParagraph && sanitizedParagraph.trim().length > 0) {
              paragraphs.push(sanitizedParagraph);
            }
          }
        }
        
        // اضافه کردن خلاصه به ابتدای محتوا
        if (summary && summary.trim().length > 0) {
          content = summary + "\n\n" + paragraphs.join("\n\n");
        } else {
          content = paragraphs.join("\n\n");
        }
        
        // فرمت‌بندی بهتر پاراگراف‌ها
        content = content
          .replace(/\.\s+([A-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF])/g, ".\n\n$1")
          .replace(/\n{3,}/g, "\n\n");
        
        // استخراج تصویر اصلی
        image = extractMainImage(html);
      }
    } else if (source === "Euronews Persian") {
      // استخراج محتوا برای Euronews Persian
      const articleBodyMatch = /<div[^>]*class="[^"]*c-article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*article__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*article-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      
      // استخراج خلاصه خبر Euronews
      const summaryMatch = /<div[^>]*class="[^"]*c-article-summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                         /<p[^>]*class="[^"]*article__description[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(html);
      
      let summary = "";
      if (summaryMatch) {
        summary = sanitizeText(summaryMatch[1]);
      }
      
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          // پاکسازی محتوای تبلیغاتی Euronews
          const cleanParagraph = paragraphMatch[1]
            .replace(/یورونیوز در «سرخط خبرها» مهم‌ترین رویدادهای ایران و جهان را در دو نوبت مرور می‌کند.*/g, "")
            .replace(/«مجله شامگاهی» برنامه‌ای تصویری از یورونیوز است که هر شب.*/g, "")
            .replace(/«سرخط خبرها» مجموعه‌ای است که یورونیوز [^\.]*\./g, "")
            .replace(/در این قسمت مهم‌ترین عناوین خبری.*/g, "")
            .replace(/یورونیوز فارسی را در .* دنبال کنید/g, "")
            .replace(/یورونیوز فارسی \/ .*/g, "");
          
          if (cleanParagraph && cleanParagraph.trim().length > 0) {
            const sanitizedParagraph = sanitizeText(cleanParagraph);
            if (sanitizedParagraph && sanitizedParagraph.trim().length > 0) {
              paragraphs.push(sanitizedParagraph);
            }
          }
        }
        
        // اضافه کردن خلاصه به ابتدای محتوا
        if (summary && summary.trim().length > 0) {
          content = summary + "\n\n" + paragraphs.join("\n\n");
        } else {
          content = paragraphs.join("\n\n");
        }
        
        // استخراج تصویر اصلی
        image = extractMainImage(html);
      }
    } else {
      // استخراج عمومی برای سایر منابع
      content = extractContentFromHTML(html, source);
      image = extractMainImage(html);
    }
    
    // تبدیل URL‌های نسبی تصاویر به مطلق
    if (image && !image.startsWith("http")) {
      try {
        const urlObj = new URL(url);
        if (image.startsWith("/")) {
          image = `${urlObj.protocol}//${urlObj.hostname}${image}`;
        } else {
          image = `${urlObj.protocol}//${urlObj.hostname}/${image}`;
        }
      } catch (e) {
        console.log(`خطا در تبدیل URL نسبی به مطلق: ${e.message}`);
      }
    }
    
    // پاکسازی نهایی محتوا
    if (content) {
      content = content
        .replace(/عکس:.*?(?=\n|$)/g, "")
        .replace(/منبع:.*?(?=\n|$)/g, "")
        .replace(/تصویر:.*?(?=\n|$)/g, "")
        .replace(/تبلیغات/g, "")
        .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
        .replace(/\n{3,}/g, "\n\n");
        
      // حذف آدرس‌های اضافی از انتهای محتوا
      content = content.replace(/https?:\/\/\S+\s*$/g, "");
      
      // اطمینان از اینکه محتوا با نقطه تمام می‌شود
      if (content.length > 0 && !/[.!?؟،؛]$/.test(content)) {
        content += ".";
      }
    }
    
    // گزارش وضعیت استخراج محتوا
    if (content) {
      console.log(`محتوای کامل با ${content.length} کاراکتر دریافت شد`);
    } else {
      console.log(`نتوانستیم محتوای مقاله را استخراج کنیم`);
    }
    
    if (image) {
      console.log(`تصویر مقاله دریافت شد: ${image.substring(0, 50)}...`);
    } else {
      console.log(`تصویری برای مقاله یافت نشد`);
    }
    
    return {
      content: content || "",
      image: image || null
    };
  } catch (error) {
    console.error(`Error fetching full content from ${url}: ${error.message}`);
    return {
      content: "",
      image: null
    };
  }
}

function extractPubDate(itemContent, isAtom) {
  try {
    let pubDateStr = "";
    
    if (isAtom) {
      const publishedMatch = /<published[^>]*>([\s\S]*?)<\/published>/i.exec(itemContent);
      const updatedMatch = /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(itemContent);
      pubDateStr = publishedMatch ? publishedMatch[1] : updatedMatch ? updatedMatch[1] : "";
    } else {
      const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
      const dcDateMatch = /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i.exec(itemContent);
      pubDateStr = pubDateMatch ? pubDateMatch[1] : dcDateMatch ? dcDateMatch[1] : "";
    }
    
    if (pubDateStr) {
      const pubDate = new Date(pubDateStr);
      if (!isNaN(pubDate.getTime())) {
        return pubDate.toISOString();
      }
    }
    
    return "";
  } catch (error) {
    console.error(`Error extracting publication date: ${error.message}`);
    return "";
  }
}

async function fetchLatestPosts(feedUrl, limit = 5) {
  try {
    console.log(`درحال دریافت محتوا از ${feedUrl.source} (${feedUrl.url})`);
    
    const response = await fetch(feedUrl.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fa,en-US;q=0.7,en;q=0.3"
      },
      // Add timeout to prevent hanging requests
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const text = await response.text();
    const items = [];
    const isAtom = text.includes("<feed");
    const itemRegex = isAtom ? /<entry>([\s\S]*?)<\/entry>/g : /<item>([\s\S]*?)<\/item>/g;
    
    let match;
    let count = 0;
    
    // Function to detect content type 
    const detectContentType = (title, content, source) => {
      // Breaking news detection - expanded patterns
      const breakingNewsPatterns = [
        /فوری/i, /اخبار فوری/i, /خبر فوری/i, /لحظاتی پیش/i, /همین الان/i, /عاجل/i, 
        /خبر مهم/i, /هم‌اکنون/i, /خبر لحظه‌ای/i, /آخرین خبر/i, /اطلاعیه مهم/i,
        /هشدار/i, /اعلان/i, /بیانیه مهم/i
      ];
      
      const isBreakingNews = breakingNewsPatterns.some(pattern => 
        pattern.test(title)
      );
      
      // Enhanced High priority content detection with more specific patterns
      const highPriorityPatterns = {
        political: [
          /رئیس ?جمهور/i, /وزیر خارجه/i, /شورای امنیت/i, /سازمان ملل/i, 
          /جنگ/i, /حمله/i, /تحریم/i, /هسته‌ای/i, /برجام/i, /مذاکرات/i, 
          /توافق/i, /بیانیه/i, /حمله نظامی/i, /حمله موشکی/i, /انتخابات/i,
          /رهبر/i, /انقلاب/i, /مقام معظم/i
        ],
        economic: [
          /بانک مرکزی/i, /افزایش (شدید|قیمت)/i, /کاهش (شدید|قیمت)/i, 
          /تورم/i, /رکود/i, /بحران اقتصادی/i, /سقوط ارزش/i, 
          /نرخ ارز/i, /دلار/i, /یورو/i
        ],
        crypto: [
          /سقوط (بیت ?کوین|رمزارز)/i, /افزایش قیمت بیت ?کوین/i, 
          /هک (صرافی|رمزارز)/i, /تصویب قانون/i, /رگولاتوری/i
        ]
      };
      
      // Check for high priority across all categories
      const isHighPriorityContent = 
        highPriorityPatterns.political.some(pattern => pattern.test(title)) ||
        highPriorityPatterns.economic.some(pattern => pattern.test(title)) ||
        highPriorityPatterns.crypto.some(pattern => pattern.test(title));
      
      // Determine content category
      let category = "general";
      
      // Political sources are typically BB, DW, Euronews
      if (source && (source.includes("BBC") || source.includes("DW") || source.includes("Euronews"))) {
        category = "politics";
      }
      // Crypto sources
      else if (source && (
        source.includes("Crypto") || source.includes("Ramzarz") || 
        source.includes("Arz Digital") || source.includes("Coin")
      )) {
        category = "crypto";
      }
      // Economic sources
      else if (source && (source.includes("Tejarat") || source.includes("Eghtesad") || source.includes("TGJU"))) {
        category = "economy";
      }
      // Otherwise do content-based detection
      else {
        if (highPriorityPatterns.political.some(pattern => pattern.test(title + " " + content.substring(0, 200)))) {
          category = "politics";
        } else if (highPriorityPatterns.economic.some(pattern => pattern.test(title + " " + content.substring(0, 200)))) {
          category = "economy";
        } else if (highPriorityPatterns.crypto.some(pattern => pattern.test(title + " " + content.substring(0, 200)))) {
          category = "crypto";
        }
      }
      
      return {
        isBreakingNews,
        isHighPriority: isHighPriorityContent,
        isNews: true,
        category
      };
    };
    
    // Extract the best content from item
    const parseItemContent = (itemContent, isAtom, source) => {
      // Extract title
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
      const title = titleMatch ? sanitizeText(titleMatch[1]) : "";
      
      // Extract link
      let link = "";
      if (isAtom) {
        const linkMatch = /<link[^>]*href="([^"]*)"[^>]*>/i.exec(itemContent);
        link = linkMatch ? linkMatch[1] : "";
      } else {
        const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemContent);
        if (linkMatch) {
          link = linkMatch[1];
        } else {
          const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(itemContent);
          link = guidMatch ? guidMatch[1] : "";
        }
      }
      
      // Extract date
      const pubDate = extractPubDate(itemContent, isAtom);
      
      // Extract description and content
      let description = "";
      let content = "";
      let summary = "";
      
      if (isAtom) {
        const contentMatch = /<content[^>]*>([\s\S]*?)<\/content>/i.exec(itemContent);
        const summaryMatch = /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(itemContent);
        
        content = contentMatch ? contentMatch[1] : "";
        summary = summaryMatch ? summaryMatch[1] : "";
        description = summary || content;
      } else {
        const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
        description = descMatch ? descMatch[1] : "";
        
        const contentEncodedMatch = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);
        content = contentEncodedMatch ? contentEncodedMatch[1] : "";
        
        const summaryMatch = /<itunes:summary[^>]*>([\s\S]*?)<\/itunes:summary>/i.exec(itemContent) ||
                           /<media:description[^>]*>([\s\S]*?)<\/media:description>/i.exec(itemContent);
        
        if (summaryMatch) {
          summary = summaryMatch[1];
        }
      }
      
      // Extract image
      let image = null;
      
      // Check for enclosure image
      const enclosureMatch = /<enclosure[^>]*url="([^"]*)"[^>]*type="image\/[^"]*"[^>]*>/i.exec(itemContent);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      }
      
      // Check for media:content image
      if (!image) {
        const mediaContentMatch = /<media:content[^>]*url="([^"]*)"[^>]*type="image\/[^"]*"[^>]*>/i.exec(itemContent) ||
                                /<media:content[^>]*url="([^"]*)"[^>]*medium="image"[^>]*>/i.exec(itemContent);
        if (mediaContentMatch) {
          image = mediaContentMatch[1];
        }
      }
      
      // Check for media:thumbnail
      if (!image) {
        const mediaThumbnailMatch = /<media:thumbnail[^>]*url="([^"]*)"[^>]*>/i.exec(itemContent);
        if (mediaThumbnailMatch) {
          image = mediaThumbnailMatch[1];
        }
      }
      
      // Check for image in content
      if (!image && (content || description)) {
        const imgMatch = (content || description).match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
          image = imgMatch[1];
        }
      }
      
      // Clean and choose best content
      const cleanTitle = sanitizeText(title);
      const cleanDescription = sanitizeText(description);
      const cleanContent = sanitizeText(content);
      const cleanSummary = sanitizeText(summary);
      
      // Choose best content by length and quality
      let finalContent;
      if (cleanContent && cleanContent.length > cleanDescription.length) {
        finalContent = cleanContent;
      } else if (cleanDescription && cleanDescription.length > 0) {
        finalContent = cleanDescription;
      } else if (cleanSummary && cleanSummary.length > 0) {
        finalContent = cleanSummary;
      } else {
        finalContent = "";
      }
      
      // Detect content type and importance
      const contentType = detectContentType(cleanTitle, finalContent, source);
      
      return {
        title: cleanTitle,
        description: finalContent,
        link,
        image,
        pubDate,
        contentType
      };
    };
    
    // Process all items
    const processPromises = [];
    while ((match = itemRegex.exec(text)) !== null && count < limit) {
      const itemContent = match[1];
      const parsedItem = parseItemContent(itemContent, isAtom, feedUrl.source);
      
      // Validate parsed item
      if (!parsedItem.title || parsedItem.title.trim().length === 0) {
        continue;
      }
      
      if (!parsedItem.description || parsedItem.description.trim().length < 50) {
        continue;
      }
      
      // If it's breaking news or high priority, fetch full content immediately
      // Otherwise, only fetch if content is short
      const shouldFetchFullContent = parsedItem.contentType.isBreakingNews || 
                                   parsedItem.contentType.isHighPriority ||
                                   parsedItem.description.length < 300;
      
      if (parsedItem.link && shouldFetchFullContent) {
        // Create a promise for fetching content but don't wait
        const contentPromise = fetchFullContent(parsedItem.link, feedUrl.source)
          .then(fullContent => {
            if (fullContent.content && fullContent.content.length > parsedItem.description.length * 1.2) {
              parsedItem.description = fullContent.content;
            }
            
            if (fullContent.image && (!parsedItem.image || fullContent.image.includes("original") || fullContent.image.includes("large"))) {
              parsedItem.image = fullContent.image;
            }
            
            return parsedItem;
          })
          .catch(() => parsedItem); // On error, use original item
          
        processPromises.push(contentPromise);
      } else {
        // Use item as is
        processPromises.push(Promise.resolve(parsedItem));
      }
      
      count++;
    }
    
    // Wait for all content fetching to complete (with timeout)
    const results = await Promise.allSettled(processPromises);
    
    // Process results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const item = result.value;
        
        // Add to items array
        items.push({
          title: item.title,
          description: item.description,
          link: item.link,
          image: item.image,
          source: feedUrl.source,
          pubDate: item.pubDate,
          isBreakingNews: item.contentType.isBreakingNews,
          isHighPriorityContent: item.contentType.isHighPriority,
          isNews: item.contentType.isNews,
          category: item.contentType.category
        });
      }
    });
    
    console.log(`${items.length} پست از ${feedUrl.source} دریافت شد`);
    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${feedUrl.source}: ${error.message}`);
    return [];
  }
}

// Main processing function
async function processFeeds(env) {
  try {
    console.log("شروع پردازش فیدهای RSS به صورت هوشمند");
    console.log(`پردازش ${RSS_FEEDS.length} فید RSS`);
    
    let successCount = 0;
    let failureCount = 0;
    let duplicateCount = 0;
    let filteredCount = 0;
    let lowQualityCount = 0;
    const processedIdentifiers = new Set();
    const processedTitles = new Set();
    
    // Categorize feeds by priority
    const highPriorityFeeds = RSS_FEEDS.filter(feed => feed.priority === "high"); // Political news
    const mediumPriorityFeeds = RSS_FEEDS.filter(feed => feed.priority === "medium"); // Economic news
    const lowPriorityFeeds = RSS_FEEDS.filter(feed => feed.priority === "low"); // Crypto news
    
    console.log(`فیدها بر اساس اولویت: ${highPriorityFeeds.length} فید اولویت بالا، ${mediumPriorityFeeds.length} فید اولویت متوسط، ${lowPriorityFeeds.length} فید اولویت پایین`);
    
    // Helper function to process feeds
    const processFeedsByPriority = async (feeds, priorityName, minQualityScore) => {
      console.log(`شروع پردازش ${feeds.length} فید با اولویت ${priorityName}`);
      
      const allPosts = [];
      const fetchPromises = [];
      
      // Fetch posts from all feeds in parallel
      for (const feed of feeds) {
        const postsPerFeed = priorityName.includes("بالا") ? 15 : // More posts from high priority feeds
                            priorityName.includes("متوسط") ? 10 : // Medium from economic feeds
                            7; // Fewer from crypto feeds (lower priority)
                            
        const fetchPromise = fetchLatestPosts(feed, postsPerFeed)
          .then(posts => {
            // Initial quality check for each post
            return posts.map(post => {
              // Add identifier and do basic quality check
              const uniqueIdentifier = generatePostIdentifier(post);
              const normalizedTitle = post.title.trim().replace(/\s+/g, " ").toLowerCase();
              const qualityEvaluation = evaluateContentQuality(post);
              
              return {
                ...post,
                feed,
                uniqueIdentifier,
                normalizedTitle,
                qualityEvaluation
              };
            }).filter(post => post.qualityEvaluation.isHighQuality);
          })
          .catch(error => {
            console.error(`خطا در دریافت فید ${feed.source}: ${error.message}`);
            failureCount++;
            return [];
          });
        
        fetchPromises.push(fetchPromise);
      }
      
      // Wait for all feed fetching to complete
      const results = await Promise.all(fetchPromises);
      
      // Combine all posts from all feeds
      results.forEach(posts => {
        allPosts.push(...posts);
      });
      
      console.log(`${allPosts.length} پست با کیفیت مناسب از فیدهای اولویت ${priorityName} دریافت شد`);
      
      // Sort posts by priority with enhanced logic:
      // 1. Breaking news
      // 2. High-priority political/international news
      // 3. Quality score and recency
      allPosts.sort((a, b) => {
        // Breaking news first
        if (a.isBreakingNews && !b.isBreakingNews) return -1;
        if (!a.isBreakingNews && b.isBreakingNews) return 1;
        
        // High priority content next
        if (a.isHighPriorityContent && !b.isHighPriorityContent) return -1;
        if (!a.isHighPriorityContent && b.isHighPriorityContent) return 1;
        
        // If both are breaking or both are high priority, consider quality score
        if ((a.isBreakingNews && b.isBreakingNews) || (a.isHighPriorityContent && b.isHighPriorityContent)) {
          // If quality score differs significantly
          const qualityDiff = b.qualityEvaluation.qualityScore - a.qualityEvaluation.qualityScore;
          if (Math.abs(qualityDiff) >= 3) {
            return qualityDiff;
          }
          
          // If similar quality, consider recency for breaking/important news
          if (a.pubDate && b.pubDate) {
            return new Date(b.pubDate) - new Date(a.pubDate); // Newer first
          }
        }
        
        // Otherwise just use quality score
        return b.qualityEvaluation.qualityScore - a.qualityEvaluation.qualityScore;
      });
      
      // Limit the number of posts we'll process based on priority 
      // to avoid flooding the channel and focus on quality
      const maxPostsToProcess = priorityName.includes("بالا") ? 5 : // Send at most 5 political posts
                               priorityName.includes("متوسط") ? 3 : // Send at most 3 economic posts
                               2; // Send at most 2 crypto posts
      
      // But always process breaking news regardless of limits
      const breakingNewsPosts = allPosts.filter(post => post.isBreakingNews);
      const highPriorityPosts = allPosts.filter(post => !post.isBreakingNews && post.isHighPriorityContent);
      const otherPosts = allPosts.filter(post => !post.isBreakingNews && !post.isHighPriorityContent);
      
      // Order: all breaking news + limited high priority + limited regular posts
      const postsToProcess = [
        ...breakingNewsPosts,
        ...highPriorityPosts.slice(0, maxPostsToProcess),
        ...otherPosts.slice(0, Math.max(1, maxPostsToProcess - highPriorityPosts.length))
      ];
      
      console.log(`پردازش ${postsToProcess.length} پست از مجموع ${allPosts.length} پست دریافتی (${breakingNewsPosts.length} خبر فوری، ${highPriorityPosts.length} خبر مهم)`);
      
      // Process posts by priority
      const postPromises = [];
      
      // Process each post
      for (const post of postsToProcess) {
        // Check for duplicates in this run
        if (processedIdentifiers.has(post.uniqueIdentifier) || processedTitles.has(post.normalizedTitle)) {
          console.log(`پست "${post.title}" قبلاً در همین اجرا پردازش شده است، نادیده گرفتن...`);
          duplicateCount++;
          continue;
        }
        
        // Create additional identifiers for more thorough duplicate check
        const additionalIdentifiers = [];
        if (post.title) {
          const titleIdentifier = post.title.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "").trim();
          additionalIdentifiers.push(titleIdentifier);
        }
        if (post.link) {
          additionalIdentifiers.push(post.link);
        }
        
        // Skip posts with quality score below threshold (unless breaking news)
        if (!post.isBreakingNews && 
            !post.isHighPriorityContent && 
            post.qualityEvaluation.qualityScore < minQualityScore) {
          console.log(`پست "${post.title}" به دلیل امتیاز کیفی پایین (${post.qualityEvaluation.qualityScore}) رد شد`);
          lowQualityCount++;
          continue;
        }
        
        // Process each post asynchronously but in order
        const postPromise = (async () => {
          // Check if post has been sent before
          let isPostSent = await hasPostBeenSent(post.uniqueIdentifier, env);
          
          if (!isPostSent) {
            for (const additionalId of additionalIdentifiers) {
              if (await hasPostBeenSent(additionalId, env)) {
                isPostSent = true;
                console.log(`پست با شناسه اضافی "${additionalId}" قبلاً ارسال شده است.`);
                duplicateCount++;
                break;
              }
            }
          }
          
          // Check for similar content
          if (!isPostSent && !post.isBreakingNews) {
            const contentDuplicate = await isContentDuplicate(post, env);
            if (contentDuplicate) {
              console.log(`پست "${post.title}" دارای محتوای مشابه با پست‌های قبلی است، نادیده گرفتن...`);
              isPostSent = true;
              duplicateCount++;
            }
          }
          
          // Send post if not a duplicate
          if (!isPostSent) {
            // Shorter delay for breaking news
            const sendDelay = post.isBreakingNews ? 1000 : 
                             post.isHighPriorityContent ? 2000 : 
                             DELAY_BETWEEN_POSTS;
            
            console.log(`ارسال پست با اولویت ${priorityName} از ${post.source}: ${post.title} (امتیاز کیفی: ${post.qualityEvaluation.qualityScore})`);
            const success = await sendTelegramPost(post, env);
            
            if (success) {
              // Save sent post data
              const postData = {
                title: post.title,
                link: post.link,
                source: post.source,
                description: post.description ? post.description.substring(0, 300) : "",
                qualityScore: post.qualityEvaluation.qualityScore || 0,
                isBreakingNews: post.isBreakingNews || false,
                isHighPriorityContent: post.isHighPriorityContent || false,
                sentAt: new Date().toISOString()
              };
              
              await markPostAsSent(post.uniqueIdentifier, env, postData);
              
              for (const additionalId of additionalIdentifiers) {
                await markPostAsSent(additionalId, env, {
                  referenceId: post.uniqueIdentifier,
                  sentAt: new Date().toISOString()
                });
              }
              
              processedIdentifiers.add(post.uniqueIdentifier);
              processedTitles.add(post.normalizedTitle);
              successCount++;
              await delay(sendDelay);
              return true;
            } else {
              failureCount++;
              return false;
            }
          } else {
            console.log(`پست قبلاً ارسال شده است: ${post.title}`);
            return false;
          }
        })();
        
        postPromises.push(postPromise);
        
        // Wait for the current post to be processed before moving to the next
        // This ensures posts are sent in order of priority
        await postPromise;
      }
      
      // Wait for all posts to be processed
      await Promise.all(postPromises);
      
      return allPosts.length;
    };
    
    // Process feeds by priority:
    // 1. High priority (political news) - lower quality threshold
    await processFeedsByPriority(highPriorityFeeds, "بالا (سیاسی)", 3);
    
    // 2. Medium priority (economic news) - medium quality threshold
    await processFeedsByPriority(mediumPriorityFeeds, "متوسط (اقتصادی)", 5);
    
    // 3. Low priority (crypto news) - higher quality threshold
    await processFeedsByPriority(lowPriorityFeeds, "پایین (کریپتو)", 6);
    
    // Final report
    console.log("\n--- گزارش نهایی پردازش فیدها ---");
    console.log(`تعداد پست‌های ارسال شده: ${successCount}`);
    console.log(`تعداد پست‌های تکراری: ${duplicateCount}`);
    console.log(`تعداد پست‌های فیلتر شده: ${filteredCount}`);
    console.log(`تعداد پست‌های با کیفیت پایین: ${lowQualityCount}`);
    console.log(`تعداد خطاها: ${failureCount}`);
    
    return { 
      success: successCount, 
      duplicates: duplicateCount, 
      filtered: filteredCount,
      lowQuality: lowQualityCount,
      failures: failureCount 
    };
  } catch (error) {
    console.error(`خطای کلی در پردازش فیدها: ${error.message}`);
    return { success: 0, duplicates: 0, filtered: 0, lowQuality: 0, failures: 1 };
  }
}

// تابع کمکی برای محاسبه شباهت بین دو متن
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  // تبدیل متن‌ها به آرایه‌ای از کلمات
  const words1 = text1
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 3);
    
  const words2 = text2
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // تعداد کلمات مشترک
  let commonWords = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      commonWords++;
    }
  }
  
  // محاسبه ضریب جاکارد (تعداد کلمات مشترک تقسیم بر تعداد کل کلمات متمایز)
  const uniqueWords = new Set([...words1, ...words2]);
  return commonWords / uniqueWords.size;
}

// Function to evaluate content quality - SIMPLIFIED
function evaluateContentQuality(post) {
  try {
    // Basic validation
    if (!post.title || !post.description || post.title.trim().length === 0 || post.description.trim().length === 0) {
      return { isHighQuality: false, reason: "محتوا یا عنوان ناکافی" };
    }

    // SPORTS NEWS FILTER - CRITICAL TO KEEP
    const sportsKeywords = [
      "فوتبال", "فوتسال", "والیبال", "بسکتبال", "کشتی", "تکواندو", "جودو", 
      "تیم ملی", "مسابقه", "لیگ", "جام", "قهرمانی", "مدال", "ورزش", "گل", 
      "شکست خورد", "پیروز شد", "تساوی", "فینال", "استقلال", "پرسپولیس"
    ];
    
    for (const keyword of sportsKeywords) {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (keywordRegex.test(post.title)) {
        return {
          isHighQuality: false,
          reason: `موضوع ورزشی (${keyword}) با کانال اخبار سیاسی، اقتصادی و رمزارزی همخوانی ندارد`
        };
      }
    }
    
    // ENTERTAINMENT NEWS FILTER - Also reject celebrity news and entertainment
    const entertainmentKeywords = [
      "سینما", "بازیگر", "فیلم", "سریال", "موسیقی", "خواننده", "هنرمند", 
      "کنسرت", "اینستاگرام", "کلیپ", "مد", "لباس", "آرایش", "جشنواره"
    ];
    
    for (const keyword of entertainmentKeywords) {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (keywordRegex.test(post.title)) {
        return {
          isHighQuality: false,
          reason: `موضوع سرگرمی (${keyword}) با کانال اخبار سیاسی، اقتصادی و رمزارزی همخوانی ندارد`
        };
      }
    }

    // Detect breaking news (high priority)
    const breakingNewsKeywords = [
      "فوری", "اخبار فوری", "خبر فوری", "لحظاتی پیش", "همین الان", "عاجل", "خبر مهم",
      "هم‌اکنون", "خبر لحظه‌ای", "توجه", "آخرین خبر", "هشدار"
    ];
    
    let isBreakingNews = false;
    for (const keyword of breakingNewsKeywords) {
      if (post.title.includes(keyword)) {
        isBreakingNews = true;
        break;
      }
    }

    // High priority political/international news - EXPANDED
    const highPriorityKeywords = [
      // سیاسی و بین‌المللی
      "رئیس جمهور", "وزیر خارجه", "شورای امنیت", "سازمان ملل", "جنگ", "حمله", "تحریم", 
      "هسته‌ای", "برجام", "مذاکرات", "توافق", "بیانیه", "اعلامیه", "حمله نظامی", 
      "حمله موشکی", "انتخابات", "کنگره", "پارلمان", "سفیر", "دیپلمات", "سفارت",
      "اعتراض", "تظاهرات", "نخست وزیر", "ترور", "کودتا", "تعلیق", "اخراج",
      
      // اقتصادی و مالی مهم
      "نفت", "اوپک", "بانک مرکزی", "تورم", "رکود", "بحران اقتصادی", "سقوط ارزش",
      "افزایش قیمت", "کاهش قیمت", "دلار", "یورو", "نرخ ارز", "افزایش شدید",
      "کاهش شدید", "بازار سرمایه", "بورس", "سهام", 
      
      // کریپتو - اخبار مهم
      "بیت کوین", "اتریوم", "ارز دیجیتال", "سقوط رمزارز", "افزایش قیمت بیت کوین",
      "هک صرافی", "تصویب قانون", "رگولاتوری"
    ];
    
    let isHighPriorityContent = isBreakingNews;
    if (!isHighPriorityContent) {
      for (const keyword of highPriorityKeywords) {
        if (post.title.includes(keyword)) {
          // بررسی عمیق‌تر: آیا واقعاً خبر مهمی است؟
          // اگر کلمات کلیدی مانند "افزایش" یا "کاهش" داریم، باید عدد یا درصد هم داشته باشیم
          if (keyword.includes("افزایش") || keyword.includes("کاهش") || keyword.includes("سقوط")) {
            // جستجوی عدد یا درصد در عنوان یا 100 کاراکتر اول محتوا
            const hasNumber = /\d+/.test(post.title) || 
                             /\d+/.test(post.description.substring(0, 100)) ||
                             /درصد/.test(post.title) ||
                             /درصد/.test(post.description.substring(0, 100));
            
            if (hasNumber) {
              isHighPriorityContent = true;
              break;
            }
          } else {
            isHighPriorityContent = true;
            break;
          }
        }
      }
    }

    // Verify political/international news is significant
    // Many posts mention politicians but aren't significant news
    if (isHighPriorityContent && !isBreakingNews) {
      // Look for keywords that indicate insignificance
      const insignificanceIndicators = [
        "تبریک گفت", "تسلیت گفت", "اظهار داشت", "گفتگو کرد", "دیدار کرد", 
        "تاکید کرد", "بیان کرد", "بازدید", "افتتاح"
      ];
      
      for (const indicator of insignificanceIndicators) {
        if (post.title.includes(indicator)) {
          isHighPriorityContent = false; // Downgrade from high priority
          break;
        }
      }
    }

    // CORE MISSION CHECK: politics, economy, crypto - strengthened
    const missionKeywords = {
      politics: [
        "سیاست", "دولت", "مجلس", "وزیر", "رئیس جمهور", "انتخابات", "تحریم", "مذاکره",
        "بین‌الملل", "دیپلماسی", "جنگ", "صلح", "توافق", "معاهده", "سیاست خارجی", "روابط"
      ],
      economy: [
        "اقتصاد", "بازار", "بورس", "ارز", "دلار", "یورو", "تورم", "بانک", "قیمت",
        "معاملات", "سهام", "سکه", "طلا", "تجارت", "صادرات", "واردات", "تعرفه", "مالیات"
      ],
      crypto: [
        "بیت کوین", "رمزارز", "ارز دیجیتال", "بلاک چین", "اتریوم", "توکن", "شیبا",
        "دوج کوین", "سولانا", "کاردانو", "استیبل کوین", "صرافی رمزارز", "ماینینگ", "استخراج"
      ]
    };
    
    let missionRelevance = false;
    let relevantCategory = "";
    
    for (const category in missionKeywords) {
      for (const keyword of missionKeywords[category]) {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (keywordRegex.test(post.title) || keywordRegex.test(post.description.substring(0, 300))) {
          missionRelevance = true;
          relevantCategory = category;
          break;
        }
      }
      if (missionRelevance) break;
    }
    
    // Crypto source check
    const isCryptoSource = post.source && (
      post.source.includes("Crypto") || 
      post.source.includes("Ramzarz") || 
      post.source.includes("Arz Digital") ||
      post.source.includes("Tejarat") ||
      post.source.includes("Coin")
    );
    
    // For crypto sources, be stricter on content quality
    if (isCryptoSource && !isHighPriorityContent) {
      // Check if content has educational or analytical value
      const cryptoAnalysisKeywords = [
        "تحلیل", "پیش‌بینی", "چشم‌انداز", "سرمایه‌گذاری", "سود", "ضرر", "مقاومت", "حمایت",
        "الگو", "نمودار", "روند", "صعودی", "نزولی", "بازار", "قیمت"
      ];
      
      let hasAnalyticalValue = false;
      for (const keyword of cryptoAnalysisKeywords) {
        if (post.title.includes(keyword) || post.description.includes(keyword)) {
          hasAnalyticalValue = true;
          break;
        }
      }
      
      if (!hasAnalyticalValue) {
        // اخبار غیرتحلیلی کریپتو اولویت کمتری دارند
        relevantCategory = "low_crypto";
      }
    }
    
    // Main news sources get priority
    const isMainNewsSource = post.source && (
      post.source.includes("BBC") ||
      post.source.includes("DW") || 
      post.source.includes("Euronews")
    );

    // If no relevance to our mission and not from a crypto source, reject
    if (!missionRelevance && !isCryptoSource && !isMainNewsSource && !isHighPriorityContent) {
      return {
        isHighQuality: false,
        reason: "محتوا با رسالت اصلی کانال (اخبار سیاسی، اقتصادی، رمزارزی) ارتباطی ندارد"
      };
    }

    // Filter out multimedia content references
    const multimediaKeywords = [
      "/ویدیو", "(ویدیو)", "ویدیویی", "ویدیو:", "ویدئو:", "/فیلم", "(فیلم)", "فیلم:",
      "کلیپ", "اینفوگرافیک", "(عکس)", "تصاویر:", "گالری", "پادکست", "صوت", "/صوت"
    ];

    for (const keyword of multimediaKeywords) {
      if (post.title.includes(keyword)) {
        return { 
          isHighQuality: false, 
          reason: "محتوای چندرسانه‌ای غیرقابل ارسال در تلگرام" 
        };
      }
    }

    // Calculate final quality score - REFINED SCORING SYSTEM
    let qualityScore = 0;
    
    // Breaking news gets highest priority 
    if (isBreakingNews) {
      qualityScore += 10;
    }
    // High priority international/political content
    else if (isHighPriorityContent) {
      qualityScore += 8;
    }
    // Major news sources with relevant content
    else if (isMainNewsSource && missionRelevance) {
      qualityScore += 7;
    }
    // Major news sources (but not clearly relevant)
    else if (isMainNewsSource) {
      qualityScore += 5;
    }
    // Political/economic news from any source
    else if (relevantCategory === "politics" || relevantCategory === "economy") {
      qualityScore += 6;
    }
    // Crypto news with analytical value
    else if (relevantCategory === "crypto" && isCryptoSource) {
      qualityScore += 5;
    }
    // Crypto news without clear value
    else if (relevantCategory === "low_crypto" || (isCryptoSource && !relevantCategory)) {
      qualityScore += 3;
    }
    // Other content with some relevance
    else if (missionRelevance) {
      qualityScore += 4;
    }
    
    // Content length quality check - proper news articles should have sufficient content
    if (post.description.length > 300 && post.description.length < 3000) {
      qualityScore += 2;
    } else if (post.description.length > 150 && post.description.length < 4000) {
      qualityScore += 1;
    }
    
    // Image is a plus for visual impact
    if (post.image && isValidUrl(post.image)) {
      qualityScore += 1;
    }
    
    // Title quality check - good titles should be descriptive but concise
    if (post.title.length > 15 && post.title.length < 120) {
      qualityScore += 1;
    }
    
    // Set appropriate threshold based on content type and source
    let threshold = 5; // Default higher threshold to focus on truly important news
    
    // Breaking news and high priority content get a lower threshold
    if (isBreakingNews) {
      threshold = 3;
    } else if (isHighPriorityContent) {
      threshold = 4;
    }
    
    // Special threshold for crypto news (to limit volume)
    if (isCryptoSource && !isBreakingNews && !isHighPriorityContent) {
      threshold = 6; // Higher threshold for crypto to limit volume
    }
    
    if (qualityScore < threshold) {
      return { 
        isHighQuality: false, 
        reason: `امتیاز کیفی پایین (${qualityScore} از حداقل ${threshold} مورد نیاز)` 
      };
    }
    
    return {
      isHighQuality: true,
      qualityScore: qualityScore,
      reason: "محتوای با کیفیت و مرتبط",
      isNews: true,
      isBreakingNews: isBreakingNews,
      isHighPriorityContent: isHighPriorityContent
    };
  } catch (error) {
    console.error(`خطا در ارزیابی کیفیت محتوا: ${error.message}`);
    // In case of error, let it pass so we don't miss important news
    return { 
      isHighQuality: true, 
      reason: "تأیید اتوماتیک به دلیل خطا در ارزیابی",
      qualityScore: 5
    };
  }
}

// Function to find the best summary paragraph in news content
function findNewsSummary(paragraphs, title) {
  if (!paragraphs || paragraphs.length === 0) {
    return "";
  }
  
  // If there's only one paragraph, that's our summary
  if (paragraphs.length === 1) {
    return paragraphs[0];
  }
  
  // Score each paragraph as a potential summary
  const scoreParagraph = (paragraph, index) => {
    let score = 0;
    
    // First paragraphs are more likely to be summaries
    score += Math.max(5 - index, 0) * 3;
    
    // Length is important - not too short, not too long
    if (paragraph.length > 100 && paragraph.length < 400) {
      score += 5;
    } else if (paragraph.length >= 50 && paragraph.length <= 500) {
      score += 3;
    }
    
    // Keywords that suggest this is a summary
    const summaryKeywords = [
      "گزارش", "به گزارش", "براساس", "طبق", "بنا بر", "اعلام کرد", "گفت", 
      "اظهار داشت", "تاکید کرد", "خاطرنشان کرد", "با اشاره به", "افزود"
    ];
    
    for (const keyword of summaryKeywords) {
      if (paragraph.includes(keyword)) {
        score += 2;
        break;
      }
    }
    
    // Check if paragraph contains words from the title
    const titleWords = title.split(/\s+/).filter(w => w.length > 3);
    let titleWordMatches = 0;
    
    for (const word of titleWords) {
      if (paragraph.includes(word)) {
        titleWordMatches++;
      }
    }
    
    // Bonus if paragraph has words from the title
    if (titleWords.length > 0) {
      const matchRatio = titleWordMatches / titleWords.length;
      score += matchRatio * 5;
    }
    
    return score;
  };
  
  // Score all paragraphs
  const scoredParagraphs = paragraphs.map((p, i) => ({
    paragraph: p,
    score: scoreParagraph(p, i)
  }));
  
  // Sort by score (highest first)
  scoredParagraphs.sort((a, b) => b.score - a.score);
  
  // Return the highest scoring paragraph
  return scoredParagraphs[0].paragraph;
}

// Worker export
export default {
  // تعریف متد scheduled برای پردازش رویدادهای زمانبندی شده
  async scheduled(event, env, ctx) {
    try {
      console.log("شروع پردازش زمانبندی شده فیدهای RSS");
      ctx.waitUntil(processFeeds(env));
    } catch (error) {
      console.error(`خطا در رویداد زمانبندی شده: ${error.message}`);
    }
  },
  
  // متد fetch برای پاسخ به درخواست‌های HTTP
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/manual-run") {
      ctx.waitUntil(processFeeds(env));
      return new Response("پردازش در پس‌زمینه آغاز شد", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=UTF-8" }
      });
    }
    
    if (url.pathname === "/status") {
      return new Response(JSON.stringify({
        status: "active",
        feeds: RSS_FEEDS.length,
        version: "2.0.0",
        lastUpdate: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === "/webhook") {
      if (request.method === "POST") {
        try {
          const payload = await request.json();
          console.log("Webhook received:", JSON.stringify(payload));
          
          // در اینجا می‌توانید پردازش پیام‌های دریافتی از تلگرام را انجام دهید
          // برای مثال، اگر کاربری پیامی بفرستد، می‌توانید پاسخ مناسب را ارسال کنید
          
          if (payload.message && payload.message.text === "/start") {
            // ارسال پیام خوش‌آمدگویی
            const chatId = payload.message.chat.id;
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "سلام! به ربات خبری رمز نیوز خوش آمدید. اخبار به طور خودکار در کانال @ramznewsofficial منتشر می‌شوند."
              })
            });
          }
          
          return new Response("OK", { status: 200 });
        } catch (error) {
          console.error("Error processing webhook:", error);
          return new Response("Bad Request", { status: 400 });
        }
      } else {
        return new Response("Method Not Allowed", { status: 405 });
      }
    }
    
    if (url.pathname === "/set-webhook") {
      // تنظیم وب هوک تلگرام (فقط برای ادمین‌ها)
      const webhookUrl = `${url.protocol}//${url.hostname}/webhook`;
      try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl })
        });
        
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    if (url.pathname === "/clear-old") {
      try {
        if (env && env.POST_TRACKER) {
          console.log("شروع پاکسازی پست‌های قدیمی...");
          const keys = await env.POST_TRACKER.list({ limit: 1000 });
          
          if (keys && keys.keys && keys.keys.length > MAX_SAVED_MESSAGES) {
            console.log(`تعداد ${keys.keys.length} پست ذخیره شده است. حداکثر مجاز: ${MAX_SAVED_MESSAGES}`);
            const keysToDelete = keys.keys.slice(0, keys.keys.length - MAX_SAVED_MESSAGES);
            console.log(`حذف ${keysToDelete.length} پست قدیمی...`);
            
            for (const key of keysToDelete) {
              await env.POST_TRACKER.delete(key.name);
            }
            
            return new Response(JSON.stringify({
              status: "success",
              message: `${keysToDelete.length} پست قدیمی با موفقیت حذف شدند.`
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          } else {
            return new Response(JSON.stringify({
              status: "info",
              message: `تعداد پست‌های ذخیره شده (${keys.keys.length}) کمتر از حداکثر مجاز (${MAX_SAVED_MESSAGES}) است.`
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
      } catch (error) {
        return new Response(JSON.stringify({
          status: "error",
          message: `خطا در پاکسازی پست‌های قدیمی: ${error.message}`
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    return new Response("سیستم مدیریت محتوای هوشمند رمز نیوز در حال اجراست", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=UTF-8" }
    });
  },
  
  // اضافه کردن processFeeds برای دسترسی از خارج
  processFeeds
};