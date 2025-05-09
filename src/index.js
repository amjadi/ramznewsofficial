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

    // بهبود: تبدیل همه متن‌ها به حروف کوچک و حذف کاراکترهای اضافی
    const cleanTitle = post.title
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
      .trim();
    
    const cleanDescription = post.description
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
      .substring(0, 300) // فقط 300 کاراکتر اول را بررسی می‌کنیم
      .trim();

    // استخراج کلیدواژه‌های مهم از عنوان
    const titleWords = cleanTitle
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // استخراج کلیدواژه‌های مهم از توضیحات
    const descWords = cleanDescription
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 15); // 15 کلمه اول

    // بدون کلمات کلیدی کافی نمی‌توان مقایسه کرد
    if (titleWords.length < 3 && descWords.length < 5) {
      return false;
    }

    // افزایش تعداد پست‌های بررسی شده به 200
    const keys = await env.POST_TRACKER.list({ limit: 200 });
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
    
    // آستانه‌های متفاوت براساس نوع منبع
    const titleThreshold = isCryptoSource ? 0.8 : 0.7;  // 80% برای کریپتو و 70% برای بقیه
    const descThreshold = isCryptoSource ? 0.6 : 0.5;   // 60% برای کریپتو و 50% برای بقیه

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
          
          // برای فیدهای کریپتو فقط با فیدهای کریپتو مقایسه کنیم
          if (isCryptoSource && !(
            storedSource.includes("Crypto") || 
            storedSource.includes("Ramzarz") || 
            storedSource.includes("Arz Digital") ||
            storedSource.includes("Tejarat"))
          ) {
            continue;
          }
          
          // مقایسه عنوان
          if (storedTitle) {
            const cleanStoredTitle = storedTitle
              .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
              .trim();
            
            // بررسی میزان همپوشانی کلمات عنوان
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
            
            // اگر عنوان به اندازه کافی مشابه است، تکراری است
            if (titleMatchPercentage >= titleThreshold && titleWords.length >= 3) {
              console.log(`محتوای مشابه یافت شد (عنوان): "${storedTitle}" با "${post.title}" - تطابق: ${titleMatchPercentage.toFixed(2)}%`);
              return true;
            }
            
            // بررسی محتوا در صورتی که منبع کریپتو باشد
            if (isCryptoSource && descWords.length >= 5) {
              // مقایسه محتوای پست‌ها هم انجام شود
              const storedDescription = storedValue.data.description || "";
              if (storedDescription) {
                const cleanStoredDesc = storedDescription
                  .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
                  .substring(0, 300)
                  .trim();
                
                let descMatchCount = 0;
                for (const word of descWords) {
                  if (cleanStoredDesc.includes(word)) {
                    descMatchCount++;
                  }
                }
                
                const descMatchPercentage = descWords.length > 0
                  ? descMatchCount / descWords.length
                  : 0;
                
                if (descMatchPercentage >= descThreshold) {
                  console.log(`محتوای مشابه یافت شد (توضیحات): "${storedTitle}" با "${post.title}" - تطابق: ${descMatchPercentage.toFixed(2)}%`);
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
    // Special handling for DW Persian content to ensure promotional content is removed
    if (post.source === "DW Persian") {
      post.description = post.description
        .replace(/اینترنت بدون سانسور با سایفون دویچه‌ وله/g, "")
        .replace(/اینترنت بدون سانسور با سایفون/g, "")
        .replace(/دویچه وله فارسی را در .* دنبال کنید/g, "")
        .replace(/بیشتر بخوانید:.*/g, "")
        .replace(/\n{3,}/g, "\n\n");
    }
    
    // Special handling for Euronews Persian content
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
    
    // بررسی برای تشخیص متن ساختاریافته (مانند ساعت کاری یا اخبار)
    const hasStructuredContent = 
      (post.title && (
        post.title.includes("ساعت کاری") || 
        post.title.includes("زمان کار") || 
        post.title.includes("ساعات اداری") ||
        // کلمات کلیدی اخبار
        post.title.includes("آمریکا") ||
        post.title.includes("ایران") ||
        post.title.includes("وزیر") ||
        post.title.includes("دولت") ||
        post.title.includes("مذاکره") ||
        post.title.includes("انتخابات") ||
        post.title.includes("احضار") ||
        post.title.includes("سفیر") ||
        post.title.includes("دیپلمات") ||
        post.title.includes("رئیس جمهور")
      )) || 
      (post.description && (
        post.description.includes("ساعت کاری") ||
        post.description.includes("ساعت ورود") ||
        post.description.includes("ساعت خروج") ||
        post.description.includes("به شرح زیر") ||
        post.description.includes("از ساعت") ||
        post.description.includes("تا ساعت") ||
        // تشخیص ساختار خبری
        (post.description.includes("گفت:") && post.description.includes("وزیر")) ||
        (post.description.includes("گفت:") && post.description.includes("رئیس جمهور")) ||
        (post.description.includes("اعلام کرد") && post.description.length > 300) ||
        (post.description.includes("خبرگزاری") && post.description.length > 300) ||
        (post.description.includes("روز") && post.description.includes("اعلام"))
      ));
    
    // پاکسازی متفاوت برای محتوای ساختاریافته
    const cleanTitle = post.title ? sanitizeText(post.title) : "";
    let cleanDescription;
    
    if (hasStructuredContent) {
      // حفظ خط‌های جدید و ساختار متن در محتوای ساختاریافته
      cleanDescription = post.description ? 
        post.description
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
          .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
          .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&zwnj;/g, " ")
          .replace(/&[a-zA-Z0-9]+;/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim() : "";
    } else {
      // استفاده از پاکسازی معمولی برای محتوای غیر ساختاریافته
      cleanDescription = post.description ? sanitizeText(post.description) : "";
    }
    
    // حذف عنوان از محتوا برای جلوگیری از تکرار
    if (cleanTitle && cleanDescription) {
        // حذف عنوان دقیقاً مشابه از انتهای محتوا
        if (cleanDescription.endsWith(cleanTitle + ".")) {
            cleanDescription = cleanDescription.substring(0, cleanDescription.length - cleanTitle.length - 1).trim();
        } else if (cleanDescription.endsWith(cleanTitle)) {
            cleanDescription = cleanDescription.substring(0, cleanDescription.length - cleanTitle.length).trim();
        }
        
        // حذف عنوان از هر جای متن
        const titleEscaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const titleRegex = new RegExp(`${titleEscaped}\\.?$`, 'g');
        cleanDescription = cleanDescription.replace(titleRegex, '').trim();
    }
    
    // بررسی وجود تصویر معتبر و بدون لوگو
    let validImage = null;
    
    if (post.image && isValidUrl(post.image)) {
      // بررسی و حذف تصاویر احتمالی با لوگو (ممکن است نیاز به سرویس‌های پیشرفته‌تر تشخیص تصویر باشد)
      const imageLowerCase = post.image.toLowerCase();
      const suspiciousImageKeywords = [
        "logo", "watermark", "banner", "header", "footer", "profile", "avatar", 
        "-logo-", "/logo/", "_logo_", "logotype", "brandlogo", "site-logo", "website-logo"
      ];
      
      const hasSuspiciousKeywords = suspiciousImageKeywords.some(keyword => imageLowerCase.includes(keyword));
      
      if (!hasSuspiciousKeywords) {
        validImage = post.image;
      } else {
        console.log(`تصویر "${post.image}" احتمالاً دارای لوگو است و استفاده نمی‌شود`);
      }
    }
    
    // بررسی عنوان و محتوا
    if (!cleanTitle || cleanTitle.trim().length === 0) {
      console.log("عنوان پست خالی است، پست ارسال نمی‌شود");
      return false;
    }
    
    // تشخیص اخبار فوری و کوتاه
    const isBreakingNews = post.isBreakingNews || false;
    const isShortNews = (post.isNews && cleanDescription.length < 500) || isBreakingNews;
    
    if (!isShortNews && (!cleanDescription || cleanDescription.trim().length < 100)) {
      console.log(`محتوای پست "${cleanTitle}" بسیار کوتاه است (${cleanDescription.length} کاراکتر)، پست ارسال نمی‌شود`);
      return false;
    }
    
    // ⚡️ تغییر مهم: استخراج هوشمند محتوای معنادار
    // تقسیم متن به پاراگراف‌ها برای تحلیل بهتر
    const paragraphs = cleanDescription.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // ⚡️ تابع جدید: شناسایی خلاصه خبر (لید) 
    const findNewsSummary = (paragraphs, title) => {
      // خلاصه خبر معمولا پاراگراف اول است که حاوی اطلاعات کلیدی است
      if (paragraphs.length === 0) return "";
      
      // جستجو برای پاراگراف حاوی خلاصه
      // الگوهای رایج لید خبر
      const summaryPatterns = [
        // الگوی: کلمه کلیدی خبرگزاری + فعل نقل قول + ":."
        /^([^.:\n]*?(?:خبرگزاری|گزارش|به گزارش|به نقل از)[^.:]*?(?:گفت|گزارش داد|اعلام کرد|نوشت)):(.{20,})/i,
        // الگوی: به گزارش...
        /^به گزارش\s[^،,.:]*،(.{20,})/i,
        // پاراگراف‌هایی که با عبارت‌های اصلی خبری شروع می‌شوند
        /^([^.:\n]*?(?:وزیر|رئیس جمهور|رهبر|مقام|سخنگو|دولت)[^.:]*?(?:گفت|اظهار داشت|اعلام کرد|افزود|تاکید کرد)):(.{20,})/i
      ];
      
      // بررسی پاراگراف اول
      for (const pattern of summaryPatterns) {
        const match = paragraphs[0].match(pattern);
        if (match) {
          return match[2].trim();
        }
      }
      
      // اگر پاراگراف اول به نسبت کوتاه است (کمتر از 250 کاراکتر) و با عبارات خاصی شروع نمی‌شود
      // احتمالا خلاصه خبر است
      if (paragraphs[0].length < 250 && 
          !paragraphs[0].startsWith("تبلیغات") && 
          !paragraphs[0].startsWith("آگهی") &&
          !paragraphs[0].includes("دنبال کنید") &&
          !paragraphs[0].includes("کلیک کنید")) {
        return paragraphs[0];
      }
      
      // اگر خلاصه شناسایی نشد، پاراگراف اول برگردانده می‌شود
      return paragraphs[0];
    };
    
    // ⚡️ تابع جدید: استخراج متن اصلی خبر
    const extractMainContent = (paragraphs, title, isBreakingNews, isShortNews) => {
      if (paragraphs.length <= 1) return paragraphs.join("\n\n");
      
      // محتوای سیاسی و اقتصادی مهم معمولا در 2-3 پاراگراف اول خلاصه می‌شود
      const isPoliticalEconomic = 
        title.match(/(?:سیاس|اقتصاد|وزیر|رئیس جمهور|مجلس|دولت|بانک|بورس|ارز|دلار|تحریم|مذاکره)/i) !== null;
      
      // برای اخبار فوری یا کوتاه، فقط خلاصه خبر کافی است
      if (isBreakingNews || isShortNews) {
        const summary = findNewsSummary(paragraphs, title);
        return summary || paragraphs[0];
      }
      
      // برای اخبار سیاسی/اقتصادی مهم تا 3 پاراگراف اول را برمی‌گردانیم
      if (isPoliticalEconomic) {
        return paragraphs.slice(0, Math.min(3, paragraphs.length)).join("\n\n");
      }
      
      // تشخیص محتوای ساختار یافته (جدول، لیست و...)
      const hasStructuredFormat = paragraphs.some(p => p.includes("• ") || p.match(/^[۰-۹0-9]+[\-\.]/) || p.includes(":") && p.split(":").length > 1);
      
      if (hasStructuredFormat) {
        // برای محتوای ساختاریافته حداکثر 5 پاراگراف
        return paragraphs.slice(0, Math.min(5, paragraphs.length)).join("\n\n");
      }
      
      // حالت عادی: استخراج 2 پاراگراف اول + خلاصه خبر
      const summary = findNewsSummary(paragraphs, title);
      let extractedContent = "";
      
      if (summary && summary !== paragraphs[0]) {
        extractedContent = summary + "\n\n";
      }
      
      // اضافه کردن پاراگراف‌های مهم
      let mainParagraphs;
      if (paragraphs.length <= 3) {
        mainParagraphs = paragraphs; // تمام پاراگراف‌ها اگر تعدادشان کم است
      } else {
        mainParagraphs = paragraphs.slice(0, 2); // دو پاراگراف اول در حالت عادی
      }
      
      extractedContent += mainParagraphs.join("\n\n");
      return extractedContent;
    };
    
    // عنوان را با فرمت درست آماده کنیم
    let titleText = "";
    if (cleanTitle && cleanTitle.trim()) {
      // اضافه کردن علامت خبر فوری برای اخبار فوری
      if (isBreakingNews) {
        titleText = `🔴 <b>${cleanTitle}</b>\n\n`;
      } else {
        titleText = `📌 <b>${cleanTitle}</b>\n\n`;
      }
    }
    
    // لینک کانال را در انتهای پست اضافه کنیم
    const channelLink = `\n\n@ramznewsofficial | اخبار رمزی`;
    
    // Generate hashtags using the new function
    let hashtags = extractHashtags(post);
    
    // محاسبه حداکثر طول پیام براساس نوع محتوا
    let maxLength = 3900; // مقدار پیش‌فرض
    
    if (validImage) {
      maxLength = isBreakingNews ? 2000 : 2500; // افزایش محدودیت برای پست‌های با تصویر
    } else if (isBreakingNews || isShortNews) {
      maxLength = 3000; // برای اخبار کوتاه، محدودیت کمتر
    }
    
    // ⚡️ استراتژی جدید: استخراج هوشمند محتوا به جای برش ساده متن
    // با استفاده از تابع جدید، محتوای اصلی خبر را استخراج می‌کنیم
    let mainContent = extractMainContent(paragraphs, cleanTitle, isBreakingNews, isShortNews);
    
    // بررسی طول نهایی پست
    const otherPartsLength = titleText.length + hashtags.length + channelLink.length;
    const maxContentLength = maxLength - otherPartsLength;
    
    // بررسی اگر محتوای استخراج شده هم بیش از حد طولانی است
    let finalContent = "";
    if (mainContent.length <= maxContentLength) {
      finalContent = mainContent;
    } else {
      // کوتاه کردن هوشمند متن با حفظ معنی
      // ابتدا پاراگراف‌های استخراج شده را دوباره تقسیم می‌کنیم
      const contentParagraphs = mainContent.split(/\n\n+/);
      let currentLength = 0;
      
      // اولویت با پاراگراف اول (خلاصه) 
      if (contentParagraphs.length > 0) {
        finalContent = contentParagraphs[0];
        currentLength = contentParagraphs[0].length;
        
        // اضافه کردن پاراگراف‌های بعدی تا جایی که در محدودیت بگنجد
        for (let i = 1; i < contentParagraphs.length; i++) {
          const paragraph = contentParagraphs[i];
          if (currentLength + paragraph.length + 4 <= maxContentLength) {
            finalContent += "\n\n" + paragraph;
            currentLength += paragraph.length + 4;
          } else {
            // اگر پاراگراف بعدی کامل نمی‌گنجد، سعی می‌کنیم جملات آن را تا حد ممکن اضافه کنیم
            const sentences = paragraph.split(/(?<=[.!?؟،؛])\s+/);
            for (const sentence of sentences) {
              if (currentLength + sentence.length + 1 <= maxContentLength - 3) {
                finalContent += "\n\n" + sentence;
                currentLength += sentence.length + 1;
              } else {
                break;
              }
            }
            break;
          }
        }
      }
      
      // اگر با روش بالا هم نتوانستیم محتوای مناسبی استخراج کنیم
      // فقط خلاصه را استفاده می‌کنیم
      if (finalContent.length === 0) {
        const summary = findNewsSummary(paragraphs, cleanTitle);
        if (summary && summary.length <= maxContentLength) {
          finalContent = summary;
        } else if (summary) {
          // کوتاه کردن خلاصه با حفظ جملات کامل
          const sentences = summary.split(/(?<=[.!?؟،؛])\s+/);
          let summaryContent = "";
          let summaryLength = 0;
          
          for (const sentence of sentences) {
            if (summaryLength + sentence.length <= maxContentLength - 3) {
              summaryContent += sentence + " ";
              summaryLength += sentence.length + 1;
            } else {
              break;
            }
          }
          
          finalContent = summaryContent.trim();
        }
      }
    }
    
    // اطمینان از اینکه متن همیشه با علامت نگارشی مناسب پایان می‌یابد
    finalContent = finalContent.trim();
    if (finalContent && !/[.!?؟،؛]$/.test(finalContent)) {
      finalContent += ".";
    }
    
    // پاکسازی نهایی محتوا
    finalContent = finalContent
      .replace(/عکس:.*?(?=\n|$)/g, "")
      .replace(/منبع:.*?(?=\n|$)/g, "")
      .replace(/تصویر:.*?(?=\n|$)/g, "")
      .replace(/تبلیغات/g, "")
      .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
      .replace(/\n{3,}/g, "\n\n");
    
    // برای اخبار فوری، هشتگ #فوری را در ابتدای هشتگ‌ها اضافه کنیم
    if (isBreakingNews) {
      if (!hashtags.includes("#فوری")) {
        if (hashtags.length > 0) {
          hashtags = "#فوری " + hashtags;
        } else {
          hashtags = "#فوری";
        }
      }
    }
    
    // ساخت پیام نهایی
    const message = `${titleText}${finalContent}${hashtags}${channelLink}`;
    
    // تنظیم URL و پارامترهای درخواست بر اساس وجود تصویر
    const url = validImage 
      ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
      : `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = validImage 
      ? {
          chat_id: CHANNEL_USERNAME,
          photo: validImage,
          caption: message,
          parse_mode: "HTML"
        } 
      : {
          chat_id: CHANNEL_USERNAME,
          text: message,
          parse_mode: "HTML"
        };
    
    console.log(`ارسال پست به تلگرام: ${cleanTitle}`);
    
    // ارسال درخواست به API تلگرام
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    // بررسی پاسخ و مدیریت خطاها
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.statusText}, Response: ${errorText}`);
      
      if (errorText.includes("message is too long") || errorText.includes("caption is too long")) {
        console.log("Message is still too long, shortening it further");
        
        // کوتاه‌سازی بیشتر با استخراج فقط خلاصه خبر
        const summary = findNewsSummary(paragraphs, cleanTitle);
        let shorterContent = "";
        
        if (summary && summary.length <= 500) {
          shorterContent = summary;
        } else {
          // یافتن آخرین پایان جمله در 500 کاراکتر اول
          const availableText = (summary || paragraphs[0] || "").substring(0, 500);
          const lastSentenceEnd = Math.max(
            availableText.lastIndexOf(". "),
            availableText.lastIndexOf("! "),
            availableText.lastIndexOf("? "),
            availableText.lastIndexOf("؟ "),
            availableText.lastIndexOf("! ")
          );
          
          if (lastSentenceEnd > 0) {
            shorterContent = availableText.substring(0, lastSentenceEnd + 1);
          } else {
            shorterContent = availableText.substring(0, 495) + "...";
          }
        }
        
        // ایجاد پیام کوتاه‌تر
        const shorterMessage = `${titleText}${shorterContent}${hashtags}${channelLink}`;
        
        const shorterPayload = validImage 
          ? {
              chat_id: CHANNEL_USERNAME,
              photo: validImage,
              caption: shorterMessage,
              parse_mode: "HTML"
            } 
          : {
              chat_id: CHANNEL_USERNAME,
              text: shorterMessage,
              parse_mode: "HTML"
            };
        
        console.log("Retrying with shorter message");
        
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shorterPayload)
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.error(`Final telegram API error after retry: ${retryResponse.statusText}, Response: ${retryErrorText}`);
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

async function fetchLatestPosts(feedUrl, limit = 1) {
  try {
    console.log(`درحال دریافت محتوا از ${feedUrl.source} (${feedUrl.url})`);
    
    const response = await fetch(feedUrl.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fa,en-US;q=0.7,en;q=0.3"
      }
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
    
    // ⚡️ تابع جدید: تشخیص نوع محتوا و فرمت
    const detectContentType = (title, content) => {
      // تشخیص خبر فوری
      const breakingNewsPatterns = [
        /فوری/i, /اخبار فوری/i, /خبر فوری/i, /لحظاتی پیش/i, /همین الان/i, /عاجل/i
      ];
      
      const isBreakingNews = breakingNewsPatterns.some(pattern => pattern.test(title));
      
      // تشخیص خبر سیاسی
      const politicalPatterns = [
        /سیاس/i, /دولت/i, /وزیر/i, /مجلس/i, /رئیس جمهور/i, /انتخابات/i, /مذاکر/i, /تحریم/i,
        /آمریکا/i, /ایران/i, /روسیه/i, /چین/i, /اروپا/i
      ];
      
      const isPolitical = politicalPatterns.some(pattern => pattern.test(title) || pattern.test(content.substring(0, 200)));
      
      // تشخیص خبر اقتصادی
      const economicPatterns = [
        /اقتصاد/i, /بورس/i, /بانک/i, /دلار/i, /ارز/i, /قیمت/i, /طلا/i, /سکه/i,
        /تورم/i, /بازار/i
      ];
      
      const isEconomic = economicPatterns.some(pattern => pattern.test(title) || pattern.test(content.substring(0, 200)));
      
      // تشخیص محتوای رمزارزی
      const cryptoPatterns = [
        /بیت ?کوین/i, /اتریوم/i, /رمزارز/i, /ارز ?دیجیتال/i, /بلاک ?چین/i,
        /توکن/i, /نشانه/i
      ];
      
      const isCrypto = cryptoPatterns.some(pattern => pattern.test(title) || pattern.test(content.substring(0, 200)));
      
      // تشخیص محتوای ساختاریافته (جدول، لیست، برنامه زمانی)
      const structuredContentPatterns = [
        /ساعت کاری/i, /زمان کار/i, /برنامه زمانی/i, /جدول زمان/i, /به شرح زیر/i,
        /لیست/i, /فهرست/i, /مراحل/i, /گام به گام/i,
        /:[\s\n]*•/i, /\d+[\-\.][\s\n]/i
      ];
      
      const isStructured = structuredContentPatterns.some(pattern => pattern.test(title) || pattern.test(content));
      
      // تشخیص محتوای خبری ساده
      const newsPatterns = [
        /^[^:]+?: /i, /گفت:?/i, /اعلام کرد:?/i, /خبر داد:?/i, /گزارش داد:?/i,
        /به گزارش/i, /به نقل از/i, /خبرگزاری/i, /طبق گزارش/i
      ];
      
      const isNews = newsPatterns.some(pattern => pattern.test(title) || pattern.test(content.substring(0, 200)));
      
      return {
        isBreakingNews,
        isPolitical,
        isEconomic,
        isCrypto,
        isStructured,
        isNews,
        category: isPolitical ? "politics" : 
                 isEconomic ? "economy" : 
                 isCrypto ? "crypto" : 
                 isNews ? "news" : "general"
      };
    };
    
    // ⚡️ تابع جدید: تفکیک هوشمند بخش‌های مختلف XML
    const parseItemContent = (itemContent, isAtom) => {
      // استخراج عنوان
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
      const title = titleMatch ? sanitizeText(titleMatch[1]) : "";
      
      // استخراج لینک
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
      
      // استخراج تاریخ انتشار
      const pubDate = extractPubDate(itemContent, isAtom);
      
      // استخراج محتوای description و content
      let description = "";
      let content = "";
      let summary = "";
      
      if (isAtom) {
        // برای فیدهای Atom
        const contentMatch = /<content[^>]*>([\s\S]*?)<\/content>/i.exec(itemContent);
        const summaryMatch = /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(itemContent);
        
        content = contentMatch ? contentMatch[1] : "";
        summary = summaryMatch ? summaryMatch[1] : "";
        description = summary || content;
      } else {
        // برای فیدهای RSS
        const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
        description = descMatch ? descMatch[1] : "";
        
        const contentEncodedMatch = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);
        content = contentEncodedMatch ? contentEncodedMatch[1] : "";
        
        // جستجو برای خلاصه در اختصاصی‌های مختلف RSS
        const summaryMatch = /<itunes:summary[^>]*>([\s\S]*?)<\/itunes:summary>/i.exec(itemContent) ||
                           /<media:description[^>]*>([\s\S]*?)<\/media:description>/i.exec(itemContent) ||
                           /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(itemContent);
        
        if (summaryMatch) {
          summary = summaryMatch[1];
        }
      }
      
      // استخراج نویسنده
      let author = "";
      const authorMatch = isAtom 
        ? /<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i.exec(itemContent) 
        : /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(itemContent) || /<author[^>]*>([\s\S]*?)<\/author>/i.exec(itemContent);
      
      if (authorMatch) {
        author = sanitizeText(authorMatch[1]);
      }
      
      // استخراج تصویر
      let image = null;
      
      // بررسی enclosure برای تصویر
      const enclosureMatch = /<enclosure[^>]*url="([^"]*)"[^>]*type="image\/[^"]*"[^>]*>/i.exec(itemContent);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      }
      
      // بررسی media:content برای تصویر
      if (!image) {
        const mediaContentMatch = /<media:content[^>]*url="([^"]*)"[^>]*type="image\/[^"]*"[^>]*>/i.exec(itemContent) ||
                                /<media:content[^>]*url="([^"]*)"[^>]*medium="image"[^>]*>/i.exec(itemContent);
        if (mediaContentMatch) {
          image = mediaContentMatch[1];
        }
      }
      
      // بررسی media:thumbnail برای تصویر
      if (!image) {
        const mediaThumbnailMatch = /<media:thumbnail[^>]*url="([^"]*)"[^>]*>/i.exec(itemContent);
        if (mediaThumbnailMatch) {
          image = mediaThumbnailMatch[1];
        }
      }
      
      // بررسی itunes:image برای تصویر
      if (!image) {
        const itunesImageMatch = /<itunes:image[^>]*href="([^"]*)"[^>]*>/i.exec(itemContent);
        if (itunesImageMatch) {
          image = itunesImageMatch[1];
        }
      }
      
      // بررسی image درون محتوا
      if (!image && (content || description)) {
        const imgMatch = (content || description).match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
          image = imgMatch[1];
          
          // تبدیل URL نسبی به مطلق
          if (image && !image.startsWith("http") && link) {
            try {
              const urlObj = new URL(link);
              if (image.startsWith("/")) {
                image = `${urlObj.protocol}//${urlObj.hostname}${image}`;
              } else {
                image = `${urlObj.protocol}//${urlObj.hostname}/${image}`;
              }
            } catch (e) {
              console.log(`خطا در تبدیل URL نسبی به مطلق: ${e.message}`);
            }
          }
        }
      }
      
      // تمیز کردن و تشخیص نوع محتوا
      const cleanTitle = sanitizeText(title);
      const cleanDescription = sanitizeText(description);
      const cleanContent = sanitizeText(content);
      const cleanSummary = sanitizeText(summary);
      
      // انتخاب هوشمند محتوای نهایی
      let finalContent = chooseBestContent(cleanDescription, cleanContent, cleanSummary);
      
      // تشخیص نوع محتوا
      const contentType = detectContentType(cleanTitle, finalContent);
      
      return {
        title: cleanTitle,
        description: finalContent,
        originalDescription: cleanDescription,
        originalContent: cleanContent,
        originalSummary: cleanSummary,
        link,
        image,
        pubDate,
        author,
        contentType
      };
    };
    
    // ⚡️ تابع جدید: انتخاب بهترین محتوا از میان گزینه‌های موجود
    const chooseBestContent = (description, content, summary) => {
      // اگر فقط یک گزینه غیر خالی وجود دارد، آن را انتخاب می‌کنیم
      if (description && !content && !summary) return description;
      if (!description && content && !summary) return content;
      if (!description && !content && summary) return summary;
      
      // امتیازدهی به هر محتوا براساس کیفیت
      const scoreContent = (text) => {
        if (!text) return 0;
        
        let score = 0;
        
        // امتیاز براساس طول (طول مناسب)
        if (text.length > 1000) score += 5;
        else if (text.length > 500) score += 4;
        else if (text.length > 300) score += 3;
        else if (text.length > 100) score += 2;
        else score += 1;
        
        // امتیاز براساس پاراگراف‌بندی (کیفیت ساختار)
        const paragraphs = text.split("\n\n").filter(p => p.trim().length > 0);
        score += Math.min(paragraphs.length, 5);
        
        // امتیاز منفی برای محتوای احتمالاً HTML
        if (text.includes("<") && text.includes(">")) score -= 3;
        
        // امتیاز منفی برای محتوای تبلیغاتی
        if (text.includes("دنبال کنید") || text.includes("کلیک کنید")) score -= 2;
        
        return score;
      };
      
      const descriptionScore = scoreContent(description);
      const contentScore = scoreContent(content);
      const summaryScore = scoreContent(summary);
      
      console.log(`امتیاز محتواها - description: ${descriptionScore}, content: ${contentScore}, summary: ${summaryScore}`);
      
      // انتخاب محتوا با بالاترین امتیاز
      if (descriptionScore >= contentScore && descriptionScore >= summaryScore) {
        return description;
      } else if (contentScore >= descriptionScore && contentScore >= summaryScore) {
        return content;
      } else {
        return summary;
      }
    };
    
    // پردازش آیتم‌های RSS/Atom
    while ((match = itemRegex.exec(text)) !== null && count < limit) {
      const itemContent = match[1];
      const parsedItem = parseItemContent(itemContent, isAtom);
      
      // بررسی کیفیت اولیه
      if (!parsedItem.title || parsedItem.title.trim().length === 0) {
        console.log("عنوان پست خالی است، پست نادیده گرفته می‌شود");
        continue;
      }
      
      if (!parsedItem.description || parsedItem.description.trim().length < 100) {
        console.log(`محتوای پست "${parsedItem.title}" بسیار کوتاه است (${parsedItem.description ? parsedItem.description.length : 0} کاراکتر)، پست نادیده گرفته می‌شود`);
        continue;
      }
      
      // دریافت محتوای کامل از صفحه اصلی اگر لینک موجود باشد
      if (parsedItem.link) {
        console.log(`دریافت محتوای کامل از صفحه اصلی: ${parsedItem.link}`);
        const fullContent = await fetchFullContent(parsedItem.link, feedUrl.source);
        
        if (fullContent.content && fullContent.content.length > 100) {
          // مقایسه محتوای استخراج شده از صفحه با محتوای فید
          if (fullContent.content.length > parsedItem.description.length * 1.2) {
            // محتوای صفحه حداقل 20% بزرگتر است، جایگزین می‌کنیم
            console.log(`محتوای کامل‌تر از صفحه اصلی جایگزین شد (${fullContent.content.length} vs ${parsedItem.description.length} کاراکتر)`);
            parsedItem.description = fullContent.content;
          } else {
            console.log(`محتوای فعلی کافی است، از محتوای صفحه اصلی استفاده نمی‌شود (${parsedItem.description.length} vs ${fullContent.content.length} کاراکتر)`);
          }
        } else {
          console.log(`محتوای صفحه اصلی ناکافی است (${fullContent.content ? fullContent.content.length : 0} کاراکتر)`);
        }
        
        if (fullContent.image && (!parsedItem.image || fullContent.image.includes("original") || fullContent.image.includes("large"))) {
          parsedItem.image = fullContent.image;
          console.log(`تصویر با کیفیت با موفقیت دریافت شد: ${parsedItem.image}`);
        }
      }
      
      // پاکسازی نهایی محتوا
      parsedItem.description = parsedItem.description
        .replace(/عکس:.*?(?=\n|$)/g, "")
        .replace(/منبع:.*?(?=\n|$)/g, "")
        .replace(/تصویر:.*?(?=\n|$)/g, "")
        .replace(/تبلیغات/g, "")
        .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
        .replace(/\n{3,}/g, "\n\n");
      
      // تبدیل نتیجه به فرمت مورد نیاز
      items.push({
        title: parsedItem.title,
        description: parsedItem.description,
        link: parsedItem.link,
        image: parsedItem.image,
        source: feedUrl.source,
        pubDate: parsedItem.pubDate,
        author: parsedItem.author,
        isBreakingNews: parsedItem.contentType.isBreakingNews,
        isNews: parsedItem.contentType.isNews,
        isStructured: parsedItem.contentType.isStructured,
        category: parsedItem.contentType.category
      });
      
      count++;
    }
    
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
    
    // دسته‌بندی فیدها بر اساس اولویت
    const highPriorityFeeds = RSS_FEEDS.filter(feed => feed.priority === "high"); // اولویت اول: سیاسی
    const mediumPriorityFeeds = RSS_FEEDS.filter(feed => feed.priority === "medium"); // اولویت دوم: اقتصادی
    const lowPriorityFeeds = RSS_FEEDS.filter(feed => feed.priority === "low"); // اولویت سوم: کریپتو
    
    console.log(`فیدها بر اساس اولویت: ${highPriorityFeeds.length} فید اولویت بالا، ${mediumPriorityFeeds.length} فید اولویت متوسط، ${lowPriorityFeeds.length} فید اولویت پایین`);
    
    // تابع کمکی برای پردازش فیدها
    const processFeedsByPriority = async (feeds, priorityName) => {
      console.log(`شروع پردازش ${feeds.length} فید با اولویت ${priorityName}`);
      
      const allPosts = [];
      
      // دریافت همه پست‌ها از فیدهای این اولویت
      for (const feed of feeds) {
        try {
          console.log(`دریافت پست‌ها از ${feed.source} (${feed.url})`);
          const latestPosts = await fetchLatestPosts(feed, 3);
          console.log(`${latestPosts.length} پست از ${feed.source} یافت شد`);
          
          // بررسی اولیه محتوای پست‌ها
          for (const post of latestPosts) {
            // فیلتر کردن پست‌های تبلیغاتی یورونیوز
            if (feed.source === "Euronews Persian" &&
                (post.title.includes("سرخط خبرها") || 
                 post.title.includes("مجله شامگاهی") ||
                 (post.description && post.description.includes("یورونیوز در «سرخط خبرها» مهم‌ترین رویدادهای ایران و جهان را در دو نوبت مرور می‌کند")) ||
                 (post.description && post.description.includes("مجله شامگاهی» برنامه‌ای تصویری از یورونیوز است که هر شب")))) {
              console.log(`پست "${post.title}" از پست‌های تبلیغاتی یورونیوز است، نادیده گرفتن...`);
              filteredCount++;
              continue;
            }
            
            // ارزیابی کیفیت محتوا
            const qualityEvaluation = evaluateContentQuality(post);
            if (!qualityEvaluation.isHighQuality) {
              console.log(`پست "${post.title}" رد شد: ${qualityEvaluation.reason}`);
              lowQualityCount++;
              continue;
            }
            
            // اضافه کردن اطلاعات مورد نیاز برای پردازش بعدی
            allPosts.push({
              ...post,
              feed,
              uniqueIdentifier: generatePostIdentifier(post),
              normalizedTitle: post.title.trim().replace(/\s+/g, " ").toLowerCase(),
              qualityEvaluation
            });
          }
        } catch (error) {
          console.error(`خطا در دریافت فید ${feed.source}: ${error.message}`);
          failureCount++;
        }
      }
      
      console.log(`${allPosts.length} پست با کیفیت مناسب از فیدهای اولویت ${priorityName} دریافت شد`);
      
      // مرتب‌سازی پست‌ها بر اساس امتیاز کیفی و اخبار فوری
      allPosts.sort((a, b) => {
        // اولویت اول: اخبار فوری
        if (a.qualityEvaluation.isBreakingNews && !b.qualityEvaluation.isBreakingNews) return -1;
        if (!a.qualityEvaluation.isBreakingNews && b.qualityEvaluation.isBreakingNews) return 1;
        
        // اولویت دوم: امتیاز کیفی
        return b.qualityEvaluation.qualityScore - a.qualityEvaluation.qualityScore;
      });
      
      // پردازش پست‌ها به ترتیب اولویت
      for (const post of allPosts) {
        // بررسی تکراری بودن در همین اجرا
        if (processedIdentifiers.has(post.uniqueIdentifier) || processedTitles.has(post.normalizedTitle)) {
          console.log(`پست "${post.title}" قبلاً در همین اجرا پردازش شده است، نادیده گرفتن...`);
          duplicateCount++;
          continue;
        }
        
        // ایجاد شناسه‌های اضافی برای بررسی دقیق‌تر
        const additionalIdentifiers = [];
        if (post.title) {
          const titleIdentifier = post.title.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "").trim();
          additionalIdentifiers.push(titleIdentifier);
        }
        if (post.link) {
          additionalIdentifiers.push(post.link);
        }
        
        // بررسی تکراری بودن در پست‌های قبلی
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
        
        // بررسی محتوای مشابه با دقت بیشتر
        if (!isPostSent) {
          const contentDuplicate = await isContentDuplicate(post, env);
          if (contentDuplicate) {
            console.log(`پست "${post.title}" دارای محتوای مشابه با پست‌های قبلی است، نادیده گرفتن...`);
            isPostSent = true;
            duplicateCount++;
          }
        }
        
        // ارسال پست در صورت عدم تکراری بودن
        if (!isPostSent) {
          console.log(`ارسال پست با اولویت ${priorityName} از ${post.source}: ${post.title} (امتیاز کیفی: ${post.qualityEvaluation.qualityScore})`);
          const success = await sendTelegramPost(post, env);
          
          if (success) {
            // ذخیره اطلاعات پست ارسال شده
            const postData = {
              title: post.title,
              link: post.link,
              source: post.source,
              description: post.description ? post.description.substring(0, 300) : "",
              qualityScore: post.qualityEvaluation.qualityScore || 0,
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
            await delay(DELAY_BETWEEN_POSTS);
          } else {
            failureCount++;
          }
        } else {
          console.log(`پست قبلاً ارسال شده است: ${post.title}`);
        }
      }
      
      return allPosts.length;
    };
    
    // پردازش فیدها به ترتیب اولویت
    // ابتدا پردازش فیدهای با اولویت بالا (سیاسی)
    await processFeedsByPriority(highPriorityFeeds, "بالا (سیاسی)");
    
    // سپس پردازش فیدهای با اولویت متوسط (اقتصادی)
    await processFeedsByPriority(mediumPriorityFeeds, "متوسط (اقتصادی)");
    
    // در نهایت پردازش فیدهای با اولویت پایین (کریپتو)
    await processFeedsByPriority(lowPriorityFeeds, "پایین (کریپتو)");
    
    // گزارش نهایی
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

// تابع جدید برای ارزیابی کیفیت محتوا
function evaluateContentQuality(post) {
  try {
    // اگر محتوا یا عنوان خالی باشد، کیفیت پایین است
    if (!post.title || !post.description || post.title.trim().length === 0 || post.description.trim().length === 0) {
      console.log(`پست "${post.title || 'بدون عنوان'}" به دلیل نداشتن محتوا یا عنوان کافی رد شد`);
      return { 
        isHighQuality: false, 
        reason: "محتوا یا عنوان ناکافی" 
      };
    }

    // ⭐️ فیلتر جدید: رد کردن مطالب نامرتبط با موضوع اصلی کانال
    // لیست موضوعات ممنوعه و غیرمرتبط با کانال
    const prohibitedTopics = [
      // محصولات و کالاهای مصرفی
      "لوازم آرایش", "آرایشی", "آرایش", "لاک", "رژ لب", "فاندیشن", "ریمل", "کرم", "شامپو", 
      "لوسیون", "مراقبت پوست", "اسکراب", "مرطوب کننده", "ضد آفتاب", "ماسک صورت",
      
      // غذا و نوشیدنی
      "دستور پخت", "آشپزی", "رستوران", "پیتزا", "فست فود", "غذاخوری", "کافه", "کافی شاپ",
      "نوشیدنی", "دسر", "شیرینی", "کیک", "بستنی", "طرز تهیه", "آرد", "روغن", "خرید توافقی",
      "برنج", "گندم", "پیاز", "سیب زمینی", "میوه", "سبزیجات", "کشاورزی",
      
      // مد و لباس
      "لباس", "پوشاک", "کفش", "کیف", "اکسسوری", "زیورآلات", "مد", "فشن", "استایل", "طراحی لباس",
      
      // سرگرمی غیرمرتبط
      "بازی", "سینما", "فیلم", "موسیقی", "کنسرت", "تفریح", "سرگرمی", "بازیگر", "خواننده", 
      "هنرمند", "هنرپیشه", "شوی تلویزیونی", "سریال", "شبکه نمایش خانگی",
      
      // ورزش و تناسب اندام
      "فوتبال", "والیبال", "بسکتبال", "تناسب اندام", "فیتنس", "بدنسازی", "یوگا", "ایروبیک",
      "باشگاه", "ورزشگاه", "استادیوم", "مسابقه", "لیگ", "جام", "دوپینگ", "مدال", "قهرمانی",
      
      // سلامت غیرمرتبط
      "سلامت", "بیماری", "درمان", "دارو", "مکمل", "ویتامین", "رژیم غذایی", "لاغری", "چاقی",
      "پزشک", "دندانپزشک", "روانشناس", "داروخانه", "بهداشت", "کرونا", "واکسن",
      
      // حوادث محلی و اخبار شهرستانی
      "تصادف", "حادثه", "سانحه", "آتش‌سوزی", "سیل", "زلزله", "طوفان", "خسارت", "کشته", "مصدوم",
      "زخمی", "اورژانس", "هلال احمر", "آتش‌نشانی", "آمبولانس", "بیمارستان", "نجات", "امداد",
      "امدادگر", "آمبولانس", "آتش‌نشان", "نیروهای امدادی", "نیروی انتظامی", "پلیس",
      
      // اخبار محلی و شهرستانی
      "شهرداری", "شهردار", "شورای شهر", "استانداری", "استاندار", "فرمانداری", "فرماندار",
      "بخشداری", "بخشدار", "دهیاری", "دهیار", "شهرستان", "روستا", "دهستان",
      
      // مسائل جزئی و غیر استراتژیک داخلی
      "مدارس", "دانش‌آموز", "معلم", "کلاس درس", "آموزش و پرورش", "طرح ترافیک",
      "شهرک صنعتی", "صنایع دستی", "اداره کل", "بنیاد مسکن", "هنرستان", "مدرسه", 
      "کنکور", "امتحانات", "آزمون", "دانشگاه آزاد", "علوم پزشکی", "آب و فاضلاب",
      "مخابرات", "قبض", "یارانه", "سهمیه", "ترافیک", "عوارض", "مالیات بر ارزش افزوده",
      
      // موارد دیگر
      "توصیه", "چگونه", "آموزش", "ترفند", "راهنمای", "نحوه"
    ];
    
    // بررسی عنوان و محتوا برای موضوعات ممنوعه
    for (const topic of prohibitedTopics) {
      // بررسی دقیق‌تر با درنظر گرفتن اینکه کلمه به تنهایی در متن باشد (نه بخشی از یک کلمه دیگر)
      const topicRegex = new RegExp(`\\b${topic}\\b`, 'i');
      
      if (topicRegex.test(post.title) || topicRegex.test(post.description)) {
        // بررسی اینکه آیا این موضوع ممنوعه در یک بافت سیاسی یا اقتصادی مهم به کار رفته است
        // مثلاً "تحریم دارو" موضوعی سیاسی است، نه پزشکی
        const hasPoliticalContext = (
          post.title.includes("تحریم") || 
          post.title.includes("سیاست") || 
          post.title.includes("دولت") || 
          post.title.includes("وزیر") ||
          post.title.includes("قانون") ||
          post.title.includes("مجلس") ||
          post.title.includes("رئیس جمهور")
        );
        
        const hasEconomicContext = (
          post.title.includes("اقتصاد") || 
          post.title.includes("بازار") || 
          post.title.includes("ارز") || 
          post.title.includes("تورم") ||
          post.title.includes("بانک") ||
          post.title.includes("قیمت") ||
          post.title.includes("بورس")
        );
        
        const hasInternationalContext = (
          post.title.includes("بین‌المللی") ||
          post.title.includes("جهانی") ||
          post.title.includes("اروپا") ||
          post.title.includes("آمریکا") ||
          post.title.includes("روسیه") ||
          post.title.includes("چین") ||
          post.title.includes("خاورمیانه")
        );
        
        // اگر بافت سیاسی یا اقتصادی یا بین‌المللی نداشت، پست را رد کنیم
        if (!hasPoliticalContext && !hasEconomicContext && !hasInternationalContext) {
          console.log(`پست "${post.title}" به دلیل موضوع نامرتبط "${topic}" رد شد`);
          return {
            isHighQuality: false,
            reason: `موضوع نامرتبط با کانال (${topic})`
          };
        }
      }
    }

    // فیلتر ویژه برای اخبار محلی شهرستان‌ها
    // شناسایی الگوی "نام شهر - خبرگزاری" که معمولاً نشان‌دهنده خبر محلی غیرمهم است
    if (post.title.match(/^[\u0600-\u06FF]+[\s]*[-–][\s]*(?:ایرنا|ایسنا|فارس|مهر|تسنیم)/i) ||
        post.description.match(/^[\u0600-\u06FF]+[\s]*[-–][\s]*(?:ایرنا|ایسنا|فارس|مهر|تسنیم)/i)) {
      // بررسی اینکه آیا این خبر با وجود داشتن فرمت محلی، موضوع بین‌المللی یا اقتصادی مهم دارد
      const isImportantInternationalNews = (
        post.title.includes("آمریکا") || 
        post.title.includes("روسیه") || 
        post.title.includes("چین") ||
        post.title.includes("اروپا") || 
        post.title.includes("ناتو") ||
        post.title.includes("سازمان ملل") ||
        post.title.includes("اتحادیه اروپا") ||
        post.title.includes("هسته‌ای") ||
        post.title.includes("تحریم")
      );
      
      // اگر موضوع مهم بین‌المللی نیست، خبر را رد کنیم
      if (!isImportantInternationalNews) {
        console.log(`پست "${post.title}" به دلیل خبر محلی شهرستانی رد شد`);
        return {
          isHighQuality: false,
          reason: "خبر محلی شهرستانی غیرمهم"
        };
      }
    }

    // ⭐️ فیلتر جدید: افزایش کیفیت هشتگ‌های انتخابی
    // بررسی ناسازگاری بین عنوان و هشتگ‌ها (مشکل کلاسیک محتوای زرد)
    if (post.title) {
      const irrelevantHashtags = [
        "هند", "پاکستان", "چین", "روسیه", "آمریکا", "طلا", "نفت", "گاز", 
        "سیاست", "وزیر", "انتخابات", "اقتصاد", "ارز", "دلار"
      ];
      
      let hasMismatchingHashtags = false;
      
      for (const hashtag of irrelevantHashtags) {
        const hashtagRegex = new RegExp(`\\b${hashtag}\\b`, 'i');
        
        // اگر هشتگ در عنوان نیست اما در متن هشتگ استفاده شده، این یک ناسازگاری است
        if (!hashtagRegex.test(post.title) && 
            !hashtagRegex.test(post.description && post.description.substring(0, 200)) && 
            post.hashtags && post.hashtags.includes(hashtag)) {
          hasMismatchingHashtags = true;
          console.log(`پست "${post.title}" دارای هشتگ نامرتبط "${hashtag}" است`);
        }
      }
      
      if (hasMismatchingHashtags) {
        console.log(`پست "${post.title}" به دلیل هشتگ‌های نامرتبط رد شد`);
        return {
          isHighQuality: false,
          reason: "هشتگ‌های نامرتبط با محتوا"
        };
      }
    }

    // ابتدا اولویت‌های کانال را بررسی کنیم
    // شناسایی محتوای مرتبط با اولویت‌های کانال (سیاست، اقتصاد، رمزارز) به ترتیب اولویت
    const priorityKeywords = {
      politics: [
        "مذاکره", "سیاست", "دولت", "وزیر", "مجلس", "رئیس جمهور", "انتخابات", "رهبر", 
        "نماینده", "قانون", "دیپلماسی", "بین‌الملل", "تحریم", "آمریکا", "ایران", "چین", 
        "روسیه", "اروپا", "برجام", "هسته‌ای", "نظامی", "FATF", "بیانیه", "توافق", "رای",
        "سیاسی", "دیپلماتیک", "سازمان ملل", "شورای امنیت", "اوپک", "نفت", "کنگره", "پارلمان",
        "جمهوری", "سفیر", "پرزیدنت", "کنفرانس", "اجلاس", "سخنگو", "سخنران", "مقام",
        "اتحادیه اروپا", "ناتو", "پیمان", "کرملین", "کاخ سفید", "پنتاگون", "وزارت خارجه",
        "وزارت دفاع", "استراتژیک", "حق وتو", "قطعنامه", "قدرت‌های بزرگ", "بحران", 
        "خاورمیانه", "ژئوپلیتیک", "تنش", "روابط", "حمله", "تسلیحات", "موشک", "پهپاد",
        "جنگ", "صلح", "آتش‌بس", "امنیت", "سیاست خارجی", "منافع ملی", "استقلال", "حاکمیت",
        "حقوق بشر", "اوکراین", "غزه", "فلسطین", "اسرائیل", "عربستان", "ترکیه", "سوریه", "لبنان", "عراق",
        "افغانستان", "پوتین", "بایدن", "شی جین پینگ", "ماکرون", "اردوغان", "نتانیاهو"
      ],
      economy: [
        "اقتصاد", "بانک مرکزی", "بازار", "بورس", "دلار", "یورو", "سکه", "طلا", "قیمت", 
        "تورم", "رکود", "رشد اقتصادی", "بدهی", "بودجه", "مالیات", "یارانه", "بانک", 
        "ارز", "پول", "سرمایه‌گذاری", "صادرات", "واردات", "نرخ", "بازار سرمایه", "صنعت",
        "ذخایر", "خزانه", "سود", "شاخص", "تولید", "ناخالص داخلی", "GDP", "سهام", "معیشت",
        "خصوصی‌سازی", "تجارت", "تراز تجاری", "بازرگانی", "اوراق", "استاندارد اند پورز",
        "وال استریت", "نزدک", "داوجونز", "فدرال رزرو", "بانک جهانی", "صندوق بین‌المللی",
        "فارکس", "جهانی‌سازی", "اقتصاد جهانی", "بحران اقتصادی", "رقابت‌پذیری",
        "تعرفه", "توافق تجاری", "نرخ بهره", "سرمایه‌گذاری خارجی", "منابع ارزی",
        "بازارهای جهانی", "قیمت جهانی", "شاخص‌های جهانی", "انرژی", "اوپک پلاس",
        "سوئیفت", "تحریم اقتصادی", "دور زدن تحریم", "مبادلات مالی"
      ],
      crypto: [
        "بیت کوین", "بیتکوین", "اتریوم", "ارز دیجیتال", "رمزارز", "بلاک چین", "بلاکچین",
        "کریپتو", "توکن", "استیبل کوین", "استیبل", "کاردانو", "سولانا", "NFT", "دیفای",
        "صرافی ارز دیجیتال", "کیف پول", "ولت", "تتر", "شیبا", "دوج کوین", "لایتکوین", "ترون",
        "وب 3", "متاورس", "قرارداد هوشمند", "پروتکل", "ماینینگ", "استخراج", "وایت پیپر",
        "آلتکوین", "بایننس", "کوین‌بیس", "هش ریت", "بی‌ان‌بی", "پولکادات", "سیف مون", "آواکس",
        "کریپتو پانک", "ان‌اف‌تی", "عرضه اولیه سکه", "آی‌سی‌او", "پامپ", "دامپ", "هودل",
        "فیر لانچ", "سوپاپ ایردراپ", "باینری آپشن", "ترید", "سیگنال", "تحلیل تکنیکال",
        "اسپات", "مارجین", "فیوچرز", "لونگ", "شورت", "مون", "هاوینگ", "سگکوین", "یونی‌سواپ"
      ],
      international: [
        "بین‌المللی", "جهانی", "قدرت‌های جهانی", "روابط بین‌الملل", "دیپلماسی جهانی",
        "سازمان ملل متحد", "شورای امنیت", "جامعه جهانی", "حقوق بین‌الملل", "قوانین بین‌المللی",
        "معاهده بین‌المللی", "پیمان بین‌المللی", "صلح جهانی", "امنیت جهانی", "جنگ جهانی",
        "بحران جهانی", "تغییرات اقلیمی", "گرمایش زمین", "تروریسم بین‌المللی", "دادگاه بین‌المللی",
        "سازمان تجارت جهانی", "اتحادیه اروپا", "یورو", "ناتو", "گروه ۲۰", "گروه ۸", "گروه ۷",
        "سران جهان", "نشست بین‌المللی", "کنفرانس بین‌المللی", "اختلافات مرزی", "مهاجرت",
        "پناهندگی", "کمک‌های بین‌المللی", "نظام بین‌الملل", "نظم جهانی", "چندجانبه‌گرایی",
        "فرامرزی", "ائتلاف بین‌المللی", "تحریم بین‌المللی", "انرژی هسته‌ای", "منع گسترش سلاح‌های هسته‌ای"
      ]
    };

    // بررسی اولویت‌ها در عنوان (امتیاز بیشتر) و محتوا
    // امتیازدهی با اولویت سیاست > اقتصاد > رمزارز
    const categoryScores = {
      politics: 0,
      economy: 0, 
      crypto: 0,
      international: 0
    };
    
    let categoryFound = false;
    
    // بررسی در عنوان (امتیاز بیشتر)
    for (const category in priorityKeywords) {
      for (const keyword of priorityKeywords[category]) {
        if (post.title.includes(keyword)) {
          categoryScores[category] += 3;
          categoryFound = true;
        }
      }
    }
    
    // بررسی در محتوا (امتیاز کمتر)
    for (const category in priorityKeywords) {
      for (const keyword of priorityKeywords[category]) {
        if (post.description.includes(keyword)) {
          categoryScores[category] += 1;
          categoryFound = true;
        }
      }
    }
    
    // بررسی نشانه‌های اخبار محلی و شهرستانی
    const localNewsIndicators = [
      { pattern: /^[\u0600-\u06FF]+[\s]*[-–][\s]*(?:ایرنا|ایسنا|فارس|مهر|تسنیم)/i, score: -10 },
      { pattern: /اورژانس/i, score: -5 },
      { pattern: /هلال احمر/i, score: -5 },
      { pattern: /آتش‌نشانی/i, score: -5 },
      { pattern: /شهرداری/i, score: -3 },
      { pattern: /استانداری/i, score: -3 },
      { pattern: /فرمانداری/i, score: -3 },
      { pattern: /تصادف/i, score: -5 },
      { pattern: /حادثه/i, score: -3 },
      { pattern: /مصدوم/i, score: -5 },
      { pattern: /کشته/i, score: -3 },
      { pattern: /زخمی/i, score: -3 },
      { pattern: /مدارس/i, score: -2 },
      { pattern: /آموزش و پرورش/i, score: -2 }
    ];
    
    let localNewsScore = 0;
    for (const indicator of localNewsIndicators) {
      if (indicator.pattern.test(post.title) || indicator.pattern.test(post.description.substring(0, 200))) {
        localNewsScore += indicator.score;
      }
    }
    
    // بررسی نشانه‌های اخبار سیاسی بین‌المللی مهم
    const importantInternationalIndicators = [
      { pattern: /سازمان ملل/i, score: 5 },
      { pattern: /شورای امنیت/i, score: 5 },
      { pattern: /اتحادیه اروپا/i, score: 4 },
      { pattern: /وزارت خارجه/i, score: 4 },
      { pattern: /کاخ سفید/i, score: 4 },
      { pattern: /کرملین/i, score: 4 },
      { pattern: /پنتاگون/i, score: 4 },
      { pattern: /ناتو/i, score: 5 },
      { pattern: /تحریم/i, score: 4 },
      { pattern: /هسته‌ای/i, score: 4 },
      { pattern: /توافق/i, score: 3 },
      { pattern: /جنگ/i, score: 3 },
      { pattern: /صلح/i, score: 3 },
      { pattern: /بحران/i, score: 3 },
      { pattern: /بین‌المللی/i, score: 4 },
      { pattern: /جهانی/i, score: 3 }
    ];
    
    let internationalScore = 0;
    for (const indicator of importantInternationalIndicators) {
      if (indicator.pattern.test(post.title)) {
        internationalScore += indicator.score;
      } else if (indicator.pattern.test(post.description.substring(0, 200))) {
        internationalScore += Math.floor(indicator.score / 2);
      }
    }
    
    // بررسی نشانه‌های اخبار اقتصادی مهم
    const importantEconomicIndicators = [
      { pattern: /بانک مرکزی/i, score: 4 },
      { pattern: /بانک جهانی/i, score: 5 },
      { pattern: /صندوق بین‌المللی/i, score: 5 },
      { pattern: /تورم/i, score: 3 },
      { pattern: /رکود/i, score: 3 },
      { pattern: /رشد اقتصادی/i, score: 3 },
      { pattern: /بازارهای جهانی/i, score: 4 },
      { pattern: /قیمت جهانی/i, score: 3 },
      { pattern: /اقتصاد جهانی/i, score: 5 },
      { pattern: /وال استریت/i, score: 4 },
      { pattern: /داوجونز/i, score: 4 },
      { pattern: /نزدک/i, score: 4 },
      { pattern: /فدرال رزرو/i, score: 5 }
    ];
    
    let economicScore = 0;
    for (const indicator of importantEconomicIndicators) {
      if (indicator.pattern.test(post.title)) {
        economicScore += indicator.score;
      } else if (indicator.pattern.test(post.description.substring(0, 200))) {
        economicScore += Math.floor(indicator.score / 2);
      }
    }
    
    // بررسی نشانه‌های اخبار کریپتو مهم
    const importantCryptoIndicators = [
      { pattern: /بیت ?کوین/i, score: 4 },
      { pattern: /اتریوم/i, score: 4 },
      { pattern: /ارز دیجیتال/i, score: 3 },
      { pattern: /رمزارز/i, score: 3 },
      { pattern: /بلاک ?چین/i, score: 3 },
      { pattern: /هاوینگ/i, score: 5 },
      { pattern: /کریپتو/i, score: 3 },
      { pattern: /صرافی ارز دیجیتال/i, score: 3 }
    ];
    
    let cryptoScore = 0;
    for (const indicator of importantCryptoIndicators) {
      if (indicator.pattern.test(post.title)) {
        cryptoScore += indicator.score;
      } else if (indicator.pattern.test(post.description.substring(0, 200))) {
        cryptoScore += Math.floor(indicator.score / 2);
      }
    }
    
    // تشخیص منبع کریپتویی
    const isCryptoSource = post.source && (
      post.source.includes("Crypto") || 
      post.source.includes("Arz") || 
      post.source.includes("Ramzarz") ||
      post.source.includes("Coin") ||
      post.source.includes("Blockchain")
    );
    
    // اگر موضوع مهم بین‌المللی یا اقتصادی یا کریپتو دارد، از امتیاز منفی خبر محلی کاسته می‌شود
    if (internationalScore > 8 || economicScore > 8 || cryptoScore > 8 || 
        categoryScores.international > 6 || categoryScores.politics > 9) {
      localNewsScore = Math.max(localNewsScore, -3); // کاهش تأثیر منفی نشانه‌های محلی
    }
    
    // ⭐️ تغییر مهم: افزایش آستانه امتیاز برای مطالب غیرمرتبط و عدم ارتباط با اولویت‌ها
    // اگر محتوا با هیچ یک از اولویت‌های کانال مرتبط نیست و از منابع کریپتویی هم نیست، آن را رد کنیم
    const priorityScore = (categoryScores.politics * 1.5) + (categoryScores.economy * 1.2) + 
                         (categoryScores.crypto * 1.0) + (categoryScores.international * 1.8);
                         
    if (priorityScore < 5 && !categoryFound && !isCryptoSource) {
      console.log(`پست "${post.title}" به دلیل عدم ارتباط کافی با اولویت‌های کانال رد شد (امتیاز: ${priorityScore})`);
      return { 
        isHighQuality: false, 
        reason: "عدم ارتباط با اولویت‌های کانال" 
      };
    }
    
    // رد کردن اخبار با نشانه‌های قوی محلی و شهرستانی، مگر اینکه اخبار بین‌المللی بسیار مهم باشند
    if (localNewsScore < -10 && internationalScore < 10 && economicScore < 10 && 
        !post.title.includes("تحریم") && !post.title.includes("هسته‌ای")) {
      console.log(`پست "${post.title}" به دلیل محتوای محلی غیرمهم رد شد (امتیاز محلی: ${localNewsScore})`);
      return {
        isHighQuality: false,
        reason: "محتوای محلی غیرمهم با امتیاز پایین"
      };
    }

    // بررسی عنوان برای محتوای چندرسانه‌ای که نمی‌توان در تلگرام ارسال کرد
    const multimediaKeywords = [
      "/ویدیو", "+ ویدیو", "(ویدیو)", "ویدئو", "ویدیویی", "ویدیو:", "ویدئو:",
      "/فیلم", "+ فیلم", "(فیلم)", "فیلم:", "کلیپ", "کلیپ:", "/کلیپ",
      "/جدول", "+ جدول", "(جدول)", "جدول:", "اینفوگرافیک", "اینفوگرافی", "اینفوگرافیک:",
      "/عکس", "+ عکس", "(عکس)", "تصاویر:", "گالری", "گالری تصاویر",
      "پادکست", "صوت", "/صوت", "+ صوت", "فایل صوتی",
      "ویژه نامه", "ویژه‌نامه", "دانلود", "فایل PDF", "پی‌دی‌اف", "pdf"
    ];

    for (const keyword of multimediaKeywords) {
      if (post.title.includes(keyword)) {
        console.log(`پست "${post.title}" به دلیل اشاره به محتوای چندرسانه‌ای (${keyword}) در عنوان رد شد`);
        return { 
          isHighQuality: false, 
          reason: "محتوای چندرسانه‌ای غیرقابل ارسال در تلگرام" 
        };
      }
    }
    
    // بررسی بیشتر در محتوا برای اشاره به ویدیو یا محتوای چندرسانه‌ای
    const multimediaContentPatterns = [
      "مشاهده ویدیو", "ویدیوی کامل", "فیلم کامل", "دانلود ویدیو", "دانلود فیلم",
      "جدول زیر", "طبق جدول", "مشاهده جدول", "طبق اینفوگرافیک", "مشاهده اینفوگرافیک",
      "مشاهده تصاویر بیشتر", "گزارش تصویری", "تصاویر این خبر", "عکس‌های بیشتر",
      "فایل صوتی این", "گوش دادن به", "دانلود فایل", "مشاهده نمودار"
    ];
    
    for (const pattern of multimediaContentPatterns) {
      if (post.description.includes(pattern)) {
        console.log(`پست "${post.title}" به دلیل اشاره به محتوای چندرسانه‌ای در متن (${pattern}) رد شد`);
        return { 
          isHighQuality: false, 
          reason: "اشاره به محتوای چندرسانه‌ای در متن" 
        };
      }
    }

    // شناسایی پست‌های آموزشی طولانی با فهرست مطالب
    const tutorialKeywords = [
      "آموزش کامل", "آموزش جامع", "راهنمای کامل", "آموزش گام به گام", 
      "فهرست مطالب", "سرفصل", "همه چیز درباره", "جامع‌ترین", "کامل‌ترین",
      "چگونه می‌توان", "آموزش:", "بررسی کامل", "بخش اول", "قسمت اول",
      "بخش ۱", "قسمت ۱", "معرفی و راه‌اندازی", "مقدمه‌ای بر"
    ];

    for (const keyword of tutorialKeywords) {
      if ((post.title && post.title.includes(keyword)) || 
          (post.description && post.description.includes(keyword) && post.description.length > 1000)) {
        console.log(`پست "${post.title}" به دلیل محتوای آموزشی طولانی (${keyword}) رد شد`);
        return { 
          isHighQuality: false, 
          reason: "محتوای آموزشی طولانی" 
        };
      }
    }

    // شناسایی پست‌های با فهرست شماره‌دار یا بولت‌دار (نشانه پست آموزشی یا فهرست‌دار)
    const listPatterns = [
      /^[۰-۹0-9]+-.*?\n[۰-۹0-9]+-/m,   // الگوی رایج شماره‌گذاری فارسی و انگلیسی
      /[۰-۹0-9]+\.\s.*?\n[۰-۹0-9]+\./m,  // الگوی شماره با نقطه
      /•\s.*?\n•\s/m,  // بولت پوینت
      /^\*\s.*?\n\*\s/m,  // ستاره به عنوان بولت
      /^-\s.*?\n-\s/m   // خط تیره به عنوان بولت
    ];

    for (const pattern of listPatterns) {
      if (pattern.test(post.description) && post.description.length > 800) {
        console.log(`پست "${post.title}" به دلیل داشتن فهرست شماره‌دار یا بولت‌دار رد شد`);
        return { 
          isHighQuality: false, 
          reason: "محتوای فهرست‌دار طولانی" 
        };
      }
    }

    // بررسی کلمات کلیدی تبلیغاتی و محتوای زرد
    const spamKeywords = [
      "اینستاگرام دنبال کنید", "تلگرام دنبال کنید", "فیسبوک دنبال کنید", "توییتر دنبال کنید",
      "برای دریافت اخبار بیشتر", "برای اطلاعات بیشتر کلیک کنید", "لینک زیر را کلیک کنید",
      "اسپانسر", "تبلیغات", "پروموشن", "فالو کنید", "لایک کنید", "به اشتراک بگذارید",
      "چگونه پولدار شویم", "درآمد میلیونی", "درآمد دلاری", "کسب درآمد آسان",
      "سود تضمینی", "سودهای نجومی", "پول پارو کردن", "به سرعت پولدار شوید"
    ];

    for (const keyword of spamKeywords) {
      if (post.description.includes(keyword) || post.title.includes(keyword)) {
        console.log(`پست "${post.title}" به دلیل داشتن محتوای تبلیغاتی رد شد (کلمه کلیدی: ${keyword})`);
        return { 
          isHighQuality: false, 
          reason: "محتوای تبلیغاتی یا نامناسب" 
        };
      }
    }

    // ⭐️ تغییر مهم: بررسی خبرهای کوتاه اما کامل (اولویت اخبار فوری)
    // شناسایی اخبار فوری و کوتاه برای ارسال با اولویت بالا
    const breakingNewsKeywords = [
      "فوری", "اخبار فوری", "خبر فوری", "گزارش فوری", "اعلام شد", "تازه‌ترین خبر",
      "لحظاتی پیش", "همین الان", "دقایقی پیش", "ساعتی پیش", "امروز اعلام شد",
      "هم‌اکنون", "سریعاً", "بلافاصله", "عاجل", "خبر مهم"
    ];
    
    let isBreakingNews = false;
    for (const keyword of breakingNewsKeywords) {
      if (post.title.includes(keyword)) {
        isBreakingNews = true;
        break;
      }
    }
    
    // تشخیص اخبار کوتاه از طریق ساختار عنوان
    const isNewsStyleTitle = /^[^:]+?(?:گفت|اعلام کرد|خبر داد|اظهار داشت|تأکید کرد):/.test(post.title);
    
    // خبرهای کوتاه با ساختار استاندارد خبری و اولویت بالا
    const isShortNews = (post.description.length < 500 && (isBreakingNews || isNewsStyleTitle || priorityScore >= 5));

    // ⭐️ تغییر مهم: خبرهای طولانی که نمی‌توان در تلگرام نمایش داد باید رد شوند
    // کاهش محدودیت طول برای محتوای طولانی از 4000 به 3800 کاراکتر
    if (post.description.length > 3800 && !isBreakingNews) {
      console.log(`پست "${post.title}" به دلیل محتوای بسیار طولانی (${post.description.length} کاراکتر) رد شد`);
      return { 
        isHighQuality: false, 
        reason: "محتوای بسیار طولانی برای تلگرام" 
      };
    }

    // بررسی جامعیت محتوا برای اخباری که کوتاه نیستند
    const paragraphs = post.description.split("\n\n").filter(p => p.trim().length > 0);
    
    // اخبار کوتاه نیازی به بررسی تعداد پاراگراف ندارند
    if (paragraphs.length < 2 && !isShortNews && post.description.length > 600) {
      console.log(`پست "${post.title}" به دلیل نداشتن ساختار پاراگراف‌بندی مناسب رد شد`);
      return { 
        isHighQuality: false, 
        reason: "ساختار ضعیف محتوا" 
      };
    }

    // بررسی وجود لینک‌های خارجی زیاد در محتوا
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = post.description.match(urlRegex) || [];
    if (urls.length > 3) {
      console.log(`پست "${post.title}" به دلیل داشتن تعداد زیاد لینک خارجی (${urls.length}) رد شد`);
      return { 
        isHighQuality: false, 
        reason: "تعداد زیاد لینک خارجی" 
      };
    }

    // بررسی تکرار بیش از حد کلمات
    const words = post.description.toLowerCase().split(/\s+/);
    const wordFrequency = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    const repeatedWords = Object.keys(wordFrequency).filter(word => wordFrequency[word] > 5);
    if (repeatedWords.length > 5) {
      console.log(`پست "${post.title}" به دلیل تکرار بیش از حد کلمات رد شد`);
      return { 
        isHighQuality: false, 
        reason: "تکرار بیش از حد کلمات" 
      };
    }

    // بررسی محتوای ناقص (پست‌هایی که با عبارات "ادامه مطلب" یا "..." تمام می‌شوند)
    const incompleteEndings = [
      "...", "ادامه دارد", "ادامه مطلب", "برای مطالعه ادامه مطلب", "مشروح خبر", 
      "مشروح گزارش", "متن کامل", "بخوانید:", "بیشتر بخوانید", "برای مشاهده کامل", 
      "برای دریافت", "برای دانلود", "برای مشاهده", "برای مطالعه", "در ادامه"
    ];

    for (const ending of incompleteEndings) {
      if (post.description.trim().endsWith(ending) || 
          post.description.includes(ending + " " + "http") ||
          post.description.includes(ending + "\n")) {
        console.log(`پست "${post.title}" به دلیل ناقص بودن محتوا (${ending}) رد شد`);
        return { 
          isHighQuality: false, 
          reason: "محتوای ناقص" 
        };
      }
    }

    // تشخیص خبری بودن محتوا (به جای محتوای تحلیلی طولانی)
    const isNewsContent = (
      post.title.length < 150 && 
      (post.title.includes(":") || 
       /^[^:]+?(?:گفت|اعلام کرد|خبر داد|اظهار داشت|تأکید کرد|افزود|اضافه کرد)/.test(post.title))
    );

    // امتیازدهی کلی به محتوا با توجه به اولویت‌ها
    let qualityScore = 0;
    
    // ⭐️ تغییر مهم: خبرهای فوری با اولویت بالاتر
    if (isBreakingNews) {
      qualityScore += 6; // اخبار فوری ارزش بسیار بالایی دارند
    } else if (isShortNews || isNewsContent) {
      qualityScore += 4; // اخبار کوتاه و معمولی ارزش بالایی دارند
    } else if (post.description.length >= 300 && post.description.length <= 3000) {
      qualityScore += 3;
    } else if (post.description.length >= 100 && post.description.length < 300) {
      qualityScore += 2;
    }
    
    // امتیازدهی براساس دسته‌بندی و اولویت محتوا
    // سیاست > اقتصاد > رمزارز
    if (categoryScores.politics > 3) {
      qualityScore += 4; // بالاترین اولویت
    } else if (categoryScores.politics > 0) {
      qualityScore += 3;
    } else if (categoryScores.economy > 3) {
      qualityScore += 3; // اولویت دوم
    } else if (categoryScores.economy > 0) {
      qualityScore += 2;
    } else if (categoryScores.crypto > 3 || isCryptoSource) {
      qualityScore += 2; // اولویت سوم
    } else if (categoryScores.crypto > 0) {
      qualityScore += 1;
    }
    
    // امتیاز برای داشتن تصویر
    if (post.image && isValidUrl(post.image)) {
      qualityScore += 2;
    }
    
    // امتیاز برای تعداد پاراگراف‌ها (ساختار بهتر)
    if (isShortNews) {
      qualityScore += 2; // اخبار کوتاه معاف از نیاز به پاراگراف‌بندی هستند
    } else {
      qualityScore += Math.min(paragraphs.length, 4); // حداکثر 4 امتیاز
    }
    
    // ⭐️ تغییر مهم: آستانه متفاوت برای انواع مختلف خبر
    let minScoreThreshold = 8; // آستانه پیش‌فرض
    
    // خبرهای فوری یا بین‌المللی بسیار مهم با آستانه پایین‌تر
    if (isBreakingNews || internationalScore > 12) {
      minScoreThreshold = 6;
    } else if (isShortNews) {
      minScoreThreshold = 7; // آستانه برای اخبار کوتاه
    } else if (categoryScores.politics > 6 || categoryScores.international > 6) {
      minScoreThreshold = 7; // آستانه پایین‌تر برای اخبار سیاسی مهم
    }
    
    if (qualityScore < minScoreThreshold) {
      console.log(`پست "${post.title}" به دلیل امتیاز کیفی پایین (${qualityScore}/20) رد شد`);
      return { 
        isHighQuality: false, 
        reason: `امتیاز کیفی پایین (${qualityScore}/20)` 
      };
    }
    
    console.log(`پست "${post.title}" با امتیاز کیفی ${qualityScore}/20 تأیید شد`);
    return {
      isHighQuality: true,
      qualityScore: qualityScore,
      reason: "محتوای با کیفیت و مرتبط",
      isNews: isNewsContent || isShortNews,
      isBreakingNews: isBreakingNews,
      priorityCategories: {
        politics: categoryScores.politics > 0,
        economy: categoryScores.economy > 0,
        international: categoryScores.international > 0,
        crypto: categoryScores.crypto > 0 || isCryptoSource
      }
    };
  } catch (error) {
    console.error(`خطا در ارزیابی کیفیت محتوا: ${error.message}`);
    return { 
      isHighQuality: false, 
      reason: "خطا در ارزیابی کیفیت" 
    };
  }
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