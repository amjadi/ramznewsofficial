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
  
  // فیدهای جدید کریپتویی (اولویت سوم)
  { url: "https://arzdigital.com/breaking/feed/", source: "Arz Digital Breaking", category: "crypto", priority: "low" },
  { url: "https://nobitex.ir/mag/feed/", source: "Nobitex Mag", category: "crypto", priority: "low" },
  { url: "https://zoomarz.com/feed", source: "Zoomarz", category: "crypto", priority: "low" },
  
  // فیدهای بلاکچینی فارسی (اولویت سوم)
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
        fullText.includes("ارز دیجیتال") || 
        fullText.includes("بیت کوین") || 
        fullText.includes("بلاک چین") || 
        fullText.includes("رمزارز") || 
        fullText.includes("کریپتو")) {
      return "finance";
    }
    
    // Check for tech content - include IT Iran
    if (
        fullText.includes("فناوری") || 
        fullText.includes("تکنولوژی") || 
        fullText.includes("هوش مصنوعی") || 
        fullText.includes("اینترنت") || 
        fullText.includes("ai") || 
        fullText.includes("دیجیتال")) {
      return "tech";
    }
    
    // Check for political content
    const politicalTerms = ["مذاکره", "سیاست", "دولت", "وزیر", "مجلس", "رئیس جمهور", "خامنه‌ای", "رهبر", "انتخابات"];
    if (politicalTerms.some(term => fullText.includes(term))) {
      return "politics";
    }
    
    // Check for international news
    const internationalTerms = ["بین‌المللی", "خارجی", "جهانی", "دیپلماتیک", "سازمان ملل"];
    if (internationalTerms.some(term => fullText.includes(term))) {
      return "international";
    }
    
    // Default
    return "news";
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
      "آذربایجان", "مصر", "عربستان", "امارات", "قطر", "کویت", "عمان", "بحرین"
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
      "سنا", "کنگره", "رأی", "تحریم"
    ],
    // Technology terms
    tech: [
      "فناوری", "تکنولوژی", "هوش مصنوعی", "اینترنت", "کلود", "AI", "هوشمند", "اپلیکیشن",
      "دیجیتال", "نرم‌افزار", "سخت‌افزار", "سایبری", "امنیت", "پلتفرم", "داده", "اپل",
      "گوگل", "مایکروسافت", "تلگرام"
    ],
    // Social media terms
    social: [
      "اینستاگرام", "توییتر", "فیسبوک", "تلگرام", "پیام‌رسان", "واتساپ", "یوتیوب",
      "تیک‌تاک", "توییت", "پست", "فالوور", "شبکه اجتماعی", "لایک"
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
        if (text.includes(entity)) {
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
  
  // Category-specific hashtags
  if (category === "finance" || post.source === "Crypto Asriran" || post.source === "Tejarat News") {
    defaultHashtags.push("ارز_دیجیتال", "بیت_کوین", "اقتصاد");
  } else if (category === "politics") {
    defaultHashtags.push("سیاست", "ایران", "اخبار");
  } else if (category === "international") {
    defaultHashtags.push("جهان", "بین_الملل", "اخبار");
  } else if (category === "tech") {
    defaultHashtags.push("فناوری", "تکنولوژی", "دیجیتال");
  } else {
    // Default news hashtags
    defaultHashtags.push("اخبار", "ایران", "جهان");
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
    // Named entities get highest priority
    if (namedEntities.includes(hashtag)) score += 100;
    // Phrases from title get next priority
    if (phraseHashtags.includes(hashtag)) score += 80;
    // Top frequency words get scores based on frequency
    const freq = wordFrequency[hashtag] || 0;
    score += freq * 5;
    // Default hashtags get a small boost
    if (defaultHashtags.includes(hashtag)) score += 10;
    
    // Length bonus/penalty - not too short, not too long
    if (hashtag.length < 5) score -= 20;
    if (hashtag.length > 20) score -= 30;
    
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
    
    // محتوا را به درستی پاکسازی کنیم
    const cleanDescription = post.description ? sanitizeText(post.description) : "";
    const cleanTitle = post.title ? sanitizeText(post.title) : "";
    
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
    
    // ⭐️ تغییر مهم: بررسی اخبار فوری و کوتاه
    // برای اخبار فوری، محدودیت طول کمتر را اعمال می‌کنیم
    const isBreakingNews = post.isBreakingNews || false;
    const isShortNews = (post.isNews && cleanDescription.length < 500) || isBreakingNews;
    
    if (!isShortNews && (!cleanDescription || cleanDescription.trim().length < 100)) {
      console.log(`محتوای پست "${cleanTitle}" بسیار کوتاه است (${cleanDescription.length} کاراکتر)، پست ارسال نمی‌شود`);
      return false;
    }
    
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
    const channelLink = `\n\n@ramznewsofficial`;
    
    // Generate hashtags using the new function
    const hashtags = extractHashtags(post);
    
    // ⭐️ تغییر مهم: محاسبه حداکثر طول پیام براساس نوع محتوا
    // برای اخبار فوری طول متن کمتر ولی با اولویت ارسال بالاتر
    let maxLength = 3900; // مقدار پیش‌فرض
    
    if (validImage) {
      maxLength = isBreakingNews ? 1000 : 900; // محدودیت برای پست‌های با تصویر
    } else if (isBreakingNews || isShortNews) {
      maxLength = 3000; // برای اخبار کوتاه، محدودیت کمتر
    }
    
    const otherPartsLength = titleText.length + hashtags.length + channelLink.length;
    const maxDescriptionLength = maxLength - otherPartsLength;
    
    // ایجاد متن پست با طول مناسب
    let truncatedDescription = "";
    if (cleanDescription.length <= maxDescriptionLength) {
      truncatedDescription = cleanDescription;
    } else {
      // بهبود: پاراگراف‌بندی بهتر برای متن طولانی
      const paragraphs = cleanDescription.split(/\n\n+/);
      let currentLength = 0;
      
      // ⭐️ تغییر مهم: برای اخبار فوری یا کوتاه، ترجیحاً فقط یک یا دو پاراگراف اول را نمایش دهیم
      const maxParagraphs = isBreakingNews || isShortNews ? 2 : paragraphs.length;
      
      for (let i = 0; i < Math.min(maxParagraphs, paragraphs.length); i++) {
        const paragraph = paragraphs[i];
        // بررسی اینکه آیا افزودن این پاراگراف از محدودیت طول فراتر می‌رود
        if (currentLength + paragraph.length + 4 > maxDescriptionLength) {
          // اگر نمی‌توانیم حتی یک پاراگراف بگنجانیم، مورد خاص را مدیریت کنیم
          if (currentLength === 0) {
            // تلاش کنیم تا جایی که ممکن است جملات کامل را شامل کنیم
            const sentences = paragraph.split(/(?<=[.!?؟،؛])\s+/);
            let sentenceLength = 0;
            
            for (const sentence of sentences) {
              if (sentenceLength + sentence.length + 1 > maxDescriptionLength - 3) {
                break;
              }
              
              if (truncatedDescription) {
                truncatedDescription += " ";
              }
              truncatedDescription += sentence;
              sentenceLength += sentence.length + 1;
            }
            
            // اگر نتوانستیم حتی یک جمله را به درستی استخراج کنیم، متن را با سه نقطه کوتاه کنیم
            if (truncatedDescription.length === 0) {
              const availableLength = maxDescriptionLength - 3; // برای سه نقطه جا بگذاریم
              const lastSpace = paragraph.substring(0, availableLength).lastIndexOf(" ");
              if (lastSpace > availableLength * 0.8) {
                truncatedDescription = paragraph.substring(0, lastSpace).trim() + "...";
              } else {
                truncatedDescription = paragraph.substring(0, availableLength).trim() + "...";
              }
            }
          }
          // به محدودیت طول رسیده‌ایم
          break;
        }
        
        // اضافه کردن پاراگراف با دو خط جدید
        if (truncatedDescription) {
          truncatedDescription += "\n\n";
        }
        truncatedDescription += paragraph;
        currentLength += paragraph.length + 4; // برای خطوط جدید هم جا در نظر بگیریم
      }
    }
    
    // اطمینان از اینکه متن همیشه با علامت نگارشی مناسب پایان می‌یابد
    truncatedDescription = truncatedDescription.trim();
    if (truncatedDescription && !/[.!?؟،؛]$/.test(truncatedDescription)) {
      truncatedDescription += ".";
    }
    
    // پاکسازی نهایی محتوا
    truncatedDescription = truncatedDescription
      .replace(/عکس:.*?(?=\n|$)/g, "")
      .replace(/منبع:.*?(?=\n|$)/g, "")
      .replace(/تصویر:.*?(?=\n|$)/g, "")
      .replace(/تبلیغات/g, "")
      .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
      .replace(/\n{3,}/g, "\n\n");
    
    // ⭐️ تغییر مهم: اگر این پست یک خبر فوری است، ساختار متن را بهبود دهیم
    if (isBreakingNews) {
      // برای اخبار فوری، هشتگ #فوری را در ابتدای هشتگ‌ها اضافه کنیم
      if (!hashtags.includes("#فوری")) {
        if (hashtags.length > 0) {
          hashtags = "#فوری " + hashtags;
        } else {
          hashtags = "#فوری";
        }
      }
    }
    
    // ساخت پیام نهایی
    const message = `${titleText}${truncatedDescription}${hashtags}${channelLink}`;
    
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
      
      // اگر پیام بیش از حد طولانی باشد، آن را کوتاه‌تر کنیم و دوباره تلاش کنیم
      if (errorText.includes("message is too long") || errorText.includes("caption is too long")) {
        console.log("Message is still too long, shortening it further");
        
        const evenShorterLength = validImage ? 500 : 2000;
        const firstParagraph = cleanDescription.split(/\n+/)[0];
        
        // کوتاه‌سازی هوشمند برای تلاش مجدد
        let shorterDescription = "";
        if (firstParagraph.length <= evenShorterLength - otherPartsLength) {
          shorterDescription = firstParagraph;
        } else {
          // یافتن آخرین پایان جمله
          const availableText = firstParagraph.substring(0, evenShorterLength - otherPartsLength - 5);
          const lastSentenceEnd = Math.max(
            availableText.lastIndexOf(". "),
            availableText.lastIndexOf("! "),
            availableText.lastIndexOf("? "),
            availableText.lastIndexOf("؟ "),
            availableText.lastIndexOf("! ")
          );
          
          if (lastSentenceEnd > 0) {
            shorterDescription = availableText.substring(0, lastSentenceEnd + 1);
          } else {
            // اگر نتوانستیم پایان جمله را پیدا کنیم، متن را در آخرین فضای خالی قطع کنیم
            const lastSpace = availableText.lastIndexOf(" ");
            if (lastSpace > 0) {
              shorterDescription = availableText.substring(0, lastSpace) + "...";
            } else {
              shorterDescription = availableText.substring(0, evenShorterLength - otherPartsLength - 5) + "...";
            }
          }
        }
        
        // ایجاد پیام کوتاه‌تر
        const shorterMessage = `${titleText}${shorterDescription}${hashtags}${channelLink}`;
        
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
    
    // تشخیص منابع کریپتویی
    const isCryptoSource = source && (
      source.includes("Crypto") || 
      source.includes("Ramzarz") || 
      source.includes("Arz Digital") ||
      source.includes("Tejarat")
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
    
    // استخراج بهتر محتوا از سایت‌های کریپتویی
    if (isCryptoSource) {
      // الگوهای مختلف برای استخراج محتوا از منابع کریپتویی
      const contentSelectors = [
        /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>(?:<\/article>|<div[^>]*class="[^"]*post-tags|<footer)/i,
        /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>(?:<div[^>]*class="[^"]*post-tags|<div[^>]*class="[^"]*post-share|<footer)/i,
        /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>(?:<div[^>]*class="[^"]*article-footer|<div[^>]*class="[^"]*post-share|<section)/i,
        /<div[^>]*class="[^"]*content-inner[^"]*"[^>]*>([\s\S]*?)<\/div>(?:<div[^>]*class="[^"]*post-tags|<div[^>]*class="[^"]*post-share|<footer)/i,
        /<div[^>]*class="[^"]*single-content[^"]*"[^>]*>([\s\S]*?)<\/div>(?:<div[^>]*class="[^"]*post-tags|<div[^>]*class="[^"]*post-share|<footer)/i,
        /<article[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/article>/i
      ];
      
      let articleBody = "";
      for (const selector of contentSelectors) {
        const match = selector.exec(html);
        if (match) {
          articleBody = match[1];
          break;
        }
      }
      
      if (articleBody) {
        // استخراج پاراگراف‌ها
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          const sanitizedParagraph = sanitizeText(paragraphMatch[1]);
          if (sanitizedParagraph && sanitizedParagraph.trim().length > 10) { // حداقل طول پاراگراف افزایش یافت 
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
        
        // اتصال پاراگراف‌ها با دو خط جدید
        content = paragraphs.join("\n\n");
        
        // جستجوی تصویر شاخص برای محتوای کریپتویی با الگوهای بیشتر
        const imgSelectors = [
          /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*(?:wp-post-image|attachment-post-thumbnail)[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*featured-image[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<div[^>]*class="[^"]*entry-thumb[^"]*"[^>]*>\s*<img[^>]+src="([^">]+)"[^>]*>/i,
          /<figure[^>]*class="[^"]*post-thumbnail[^"]*"[^>]*>\s*<img[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+id="[^"]*featured-image[^"]*"[^>]+src="([^">]+)"[^>]*>/i
        ];
        
        for (const selector of imgSelectors) {
          const match = selector.exec(html);
          if (match) {
            image = match[1];
            break;
          }
        }
        
        // اگر هنوز تصویری پیدا نشده، اولین تصویر در محتوا را بگیریم
        if (!image) {
          const imgMatch = /<img[^>]+src="([^">]+)"[^>]*>/i.exec(articleBody);
          if (imgMatch) {
            image = imgMatch[1];
          }
        }
      }
    } else if (source === "BBC Persian") {
      // کد موجود برای BBC Persian
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
        
        const imgMatch = /<img[^>]+src="([^">]+)"[^>]*data-ratio="original"/i.exec(articleBody);
        if (imgMatch) {
          image = imgMatch[1];
        } else {
          const pageImgMatch = /<img[^>]+src="([^">]+)"[^>]*class="[^"]*image-replace[^"]*"/i.exec(html);
          if (pageImgMatch) {
            image = pageImgMatch[1];
          }
        }
      }
    } else if (source === "DW Persian") {
      // کد موجود برای DW Persian
      const articleBodyMatch = /<div[^>]*class="[^"]*longText[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) || 
                              /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*dw-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          // Clean each paragraph individually to ensure no promotional content
          const cleanParagraph = paragraphMatch[1]
            .replace(/اینترنت بدون سانسور با سایفون دویچه‌ وله/g, "")
            .replace(/اینترنت بدون سانسور با سایفون/g, "")
            .replace(/دویچه وله فارسی را در .* دنبال کنید/g, "")
            .replace(/بیشتر بخوانید:.*/g, "");
          
          // Only add non-empty paragraphs after cleaning
          if (cleanParagraph && cleanParagraph.trim().length > 0) {
            const sanitizedParagraph = sanitizeText(cleanParagraph);
            if (sanitizedParagraph && sanitizedParagraph.trim().length > 0) {
              paragraphs.push(sanitizedParagraph);
            }
          }
        }
        
        // Join paragraphs with double line breaks for better readability
        content = paragraphs.join("\n\n");
        
        // Apply proper paragraph formatting
        content = content
          .replace(/\.\s+([A-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF])/g, ".\n\n$1")
          .replace(/\n{3,}/g, "\n\n");
        
        // Ensure content ends with a period
        if (content && content.length > 0 && !/[.!?؟،؛]$/.test(content)) {
          content += ".";
        }
        
        // Get the best possible image
        const imgSelectors = [
          /<img[^>]+data-src="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*hero-media__image[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*image-landscape[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*image-hero[^"]*"[^>]+src="([^">]+)"[^>]*>/i
        ];
        
        for (const selector of imgSelectors) {
          const match = selector.exec(html);
          if (match) {
            image = match[1];
            break;
          }
        }
      }
    } else if (source === "Euronews Persian") {
      // کد موجود برای Euronews Persian
      const articleBodyMatch = /<div[^>]*class="[^"]*c-article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*article__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*article-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          // Clean each paragraph individually to ensure no promotional content
          const cleanParagraph = paragraphMatch[1]
            .replace(/یورونیوز در «سرخط خبرها» مهم‌ترین رویدادهای ایران و جهان را در دو نوبت مرور می‌کند.*/g, "")
            .replace(/«مجله شامگاهی» برنامه‌ای تصویری از یورونیوز است که هر شب.*/g, "")
            .replace(/«سرخط خبرها» مجموعه‌ای است که یورونیوز [^\.]*\./g, "")
            .replace(/در این قسمت مهم‌ترین عناوین خبری.*/g, "")
            .replace(/یورونیوز فارسی را در .* دنبال کنید/g, "")
            .replace(/یورونیوز فارسی \/ .*/g, "");
          
          // Only add non-empty paragraphs after cleaning
          if (cleanParagraph && cleanParagraph.trim().length > 0) {
            const sanitizedParagraph = sanitizeText(cleanParagraph);
            if (sanitizedParagraph && sanitizedParagraph.trim().length > 0) {
              paragraphs.push(sanitizedParagraph);
            }
          }
        }
        
        // Join paragraphs with double line breaks for better readability
        content = paragraphs.join("\n\n");
        
        // Find the best image from various selectors
        const imgSelectors = [
          /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i,
          /<img[^>]+src="([^">]+)"[^>]*class="[^"]*c-article-media__img[^"]*"[^>]*>/i,
          /<img[^>]+data-src="([^">]+)"[^>]*class="[^"]*u-media-enlarge__img[^"]*"[^>]*>/i,
          /<img[^>]+src="([^">]+)"[^>]*class="[^"]*article__img[^"]*"[^>]*>/i
        ];
        
        for (const selector of imgSelectors) {
          const match = selector.exec(html);
          if (match) {
            image = match[1];
            break;
          }
        }
      }
    } else {
      // Generic content extraction as fallback
      const contentSelectors = [
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<main[^>]*>([\s\S]*?)<\/main>/i
      ];
      
      let articleBody = "";
      for (const selector of contentSelectors) {
        const match = selector.exec(html);
        if (match) {
          articleBody = match[1];
          break;
        }
      }
      
      if (articleBody) {
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          paragraphs.push(sanitizeText(paragraphMatch[1]));
        }
        
        content = paragraphs.join("\n\n");
      }
      
      if (!image) {
        const imgSelectors = [
          /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*featured[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+id="[^"]*featured[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+src="([^">]+)"[^>]*class="[^"]*attachment-full[^"]*"[^>]*>/i
        ];
        
        for (const selector of imgSelectors) {
          const match = selector.exec(html);
          if (match) {
            image = match[1];
            break;
          }
        }
        
        if (!image) {
          const imgMatch = /<img[^>]+src="([^">]+)"[^>]*>/i.exec(html);
          if (imgMatch) {
            image = imgMatch[1];
          }
        }
      }
    }
    
    // Handle relative image URLs
    if (image && !image.startsWith("http")) {
      if (image.startsWith("/")) {
        try {
          const urlObj = new URL(url);
          image = `${urlObj.protocol}//${urlObj.hostname}${image}`;
        } catch (e) {
          console.log(`خطا در تبدیل URL نسبی به مطلق: ${e.message}`);
        }
      } else {
        try {
          const urlObj = new URL(url);
          image = `${urlObj.protocol}//${urlObj.hostname}/${image}`;
        } catch (e) {
          console.log(`خطا در تبدیل URL نسبی به مطلق: ${e.message}`);
        }
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
    
    // لاگ کردن وضعیت نتیجه
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
    
    while ((match = itemRegex.exec(text)) !== null && count < limit) {
      const itemContent = match[1];
      
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
      const title = titleMatch ? sanitizeText(titleMatch[1]) : "";
      
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
      
      const pubDate = extractPubDate(itemContent, isAtom);
      
      // استخراج هر دو نوع محتوا: description و content
      let description = "";
      let content = "";
      
      if (isAtom) {
        // استخراج محتوا از فیدهای Atom
        const contentMatch = /<content[^>]*>([\s\S]*?)<\/content>/i.exec(itemContent);
        const summaryMatch = /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(itemContent);
        
        content = contentMatch ? contentMatch[1] : "";
        description = summaryMatch ? summaryMatch[1] : "";
      } else {
        // استخراج محتوا از فیدهای RSS
        const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
        description = descMatch ? descMatch[1] : "";
        
        const contentEncodedMatch = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);
        content = contentEncodedMatch ? contentEncodedMatch[1] : "";
      }
      
      // انتخاب هوشمند بین content و description
      let finalContent = "";
      
      // پاکسازی اولیه هر دو نوع محتوا
      const cleanedDescription = sanitizeText(description);
      const cleanedContent = sanitizeText(content);
      
      // ارزیابی کیفیت هر دو محتوا برای انتخاب بهترین
      if (cleanedContent.length > 0 && cleanedDescription.length > 0) {
        // اگر هر دو موجود باشند، مقایسه کنیم
        if (cleanedContent.length > cleanedDescription.length * 1.5) {
          // content حداقل 50% بزرگتر است، احتمالاً کامل‌تر است
          console.log(`برای پست "${title}" از تگ content استفاده می‌شود (${cleanedContent.length} vs ${cleanedDescription.length} کاراکتر)`);
          finalContent = cleanedContent;
        } else if (cleanedDescription.length > cleanedContent.length * 1.5) {
          // description حداقل 50% بزرگتر است، احتمالاً کامل‌تر است
          console.log(`برای پست "${title}" از تگ description استفاده می‌شود (${cleanedDescription.length} vs ${cleanedContent.length} کاراکتر)`);
          finalContent = cleanedDescription;
        } else {
          // تفاوت اندازه معنادار نیست، بررسی کیفیت محتوا
          
          // بررسی وجود تگ‌های HTML در محتوا
          const contentHasHTML = /<[a-z][\s\S]*>/i.test(content);
          const descriptionHasHTML = /<[a-z][\s\S]*>/i.test(description);
          
          if (contentHasHTML && !descriptionHasHTML) {
            console.log(`برای پست "${title}" از تگ content استفاده می‌شود (دارای قالب‌بندی HTML)`);
            finalContent = cleanedContent;
          } else if (!contentHasHTML && descriptionHasHTML) {
            console.log(`برای پست "${title}" از تگ description استفاده می‌شود (دارای قالب‌بندی HTML)`);
            finalContent = cleanedDescription;
          } else {
            // هر دو مشابه هستند، به صورت پیش‌فرض از content استفاده می‌کنیم
            console.log(`برای پست "${title}" به صورت پیش‌فرض از تگ content استفاده می‌شود`);
            finalContent = cleanedContent;
          }
        }
      } else if (cleanedContent.length > 0) {
        console.log(`برای پست "${title}" از تگ content استفاده می‌شود (تنها محتوای موجود)`);
        finalContent = cleanedContent;
      } else if (cleanedDescription.length > 0) {
        console.log(`برای پست "${title}" از تگ description استفاده می‌شود (تنها محتوای موجود)`);
        finalContent = cleanedDescription;
      } else {
        console.log(`پست "${title}" فاقد محتوا است، نادیده گرفتن...`);
        continue; // این پست فاقد محتوا است، آن را نادیده می‌گیریم
      }
      
      let author = "";
      const authorMatch = isAtom 
        ? /<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i.exec(itemContent) 
        : /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(itemContent) || /<author[^>]*>([\s\S]*?)<\/author>/i.exec(itemContent);
      
      if (authorMatch) {
        author = sanitizeText(authorMatch[1]);
      }
      
      let image = null;
      
      // استخراج تصویر از محتوا
      const enclosureMatch = /<enclosure[^>]*url="([^"]*)"[^>]*type="image\/[^"]*"[^>]*>/i.exec(itemContent);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      }
      
      if (!image) {
        const mediaContentMatch = /<media:content[^>]*url="([^"]*)"[^>]*type="image\/[^"]*"[^>]*>/i.exec(itemContent);
        if (mediaContentMatch) {
          image = mediaContentMatch[1];
        }
      }
      
      if (!image) {
        const mediaThumbnailMatch = /<media:thumbnail[^>]*url="([^"]*)"[^>]*>/i.exec(itemContent);
        if (mediaThumbnailMatch) {
          image = mediaThumbnailMatch[1];
        }
      }
      
      // استخراج تصویر از محتوای HTML
      if (!image && (content || description)) {
        const imgMatch = (content || description).match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
          image = imgMatch[1];
          
          if (image && !image.startsWith("http")) {
            if (image.startsWith("/")) {
              try {
                const urlObj = new URL(link);
                image = `${urlObj.protocol}//${urlObj.hostname}${image}`;
              } catch (e) {
                console.log(`خطا در تبدیل URL نسبی به مطلق: ${e.message}`);
              }
            }
          }
        }
      }
      
      // بررسی محتوا برای تعیین کیفیت اولیه
      if (finalContent.length < 100 && title.length > 0) {
        console.log(`محتوای پست "${title}" خیلی کوتاه است (${finalContent.length} کاراکتر)، نادیده گرفتن پست`);
        continue;
      }
      
      // دریافت محتوای کامل از صفحه اصلی اگر لینک موجود باشد
      if (link) {
        console.log(`دریافت محتوای کامل از صفحه اصلی: ${link}`);
        const fullContent = await fetchFullContent(link, feedUrl.source);
        
        if (fullContent.content && fullContent.content.length > 100) {
          // مقایسه محتوای استخراج شده از صفحه با محتوای فید
          if (fullContent.content.length > finalContent.length * 1.2) {
            // محتوای صفحه حداقل 20% بزرگتر است، جایگزین می‌کنیم
            console.log(`محتوای کامل‌تر از صفحه اصلی جایگزین شد (${fullContent.content.length} vs ${finalContent.length} کاراکتر)`);
            finalContent = fullContent.content;
          } else {
            console.log(`محتوای فعلی کافی است، از محتوای صفحه اصلی استفاده نمی‌شود (${finalContent.length} vs ${fullContent.content.length} کاراکتر)`);
          }
        } else {
          console.log(`محتوای صفحه اصلی ناکافی است (${fullContent.content ? fullContent.content.length : 0} کاراکتر)`);
        }
        
        if (fullContent.image && (!image || fullContent.image.includes("original") || fullContent.image.includes("large"))) {
          image = fullContent.image;
          console.log(`تصویر با کیفیت با موفقیت دریافت شد: ${image}`);
        }
      }
      
      // پاکسازی نهایی محتوا
      finalContent = finalContent
        .replace(/عکس:.*?(?=\n|$)/g, "")
        .replace(/منبع:.*?(?=\n|$)/g, "")
        .replace(/تصویر:.*?(?=\n|$)/g, "")
        .replace(/تبلیغات/g, "")
        .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
        .replace(/\n{3,}/g, "\n\n");
      
      items.push({
        title,
        description: finalContent,
        link,
        image,
        source: feedUrl.source,
        pubDate,
        author
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

    // ابتدا اولویت‌های کانال را بررسی کنیم
    // شناسایی محتوای مرتبط با اولویت‌های کانال (سیاست، اقتصاد، رمزارز) به ترتیب اولویت
    const priorityKeywords = {
      politics: [
        "مذاکره", "سیاست", "دولت", "وزیر", "مجلس", "رئیس جمهور", "انتخابات", "رهبر", 
        "نماینده", "قانون", "دیپلماسی", "بین‌الملل", "تحریم", "آمریکا", "ایران", "چین", 
        "روسیه", "اروپا", "برجام", "هسته‌ای", "نظامی", "FATF", "بیانیه", "توافق", "رای",
        "سیاسی", "دیپلماتیک", "سازمان ملل", "شورای امنیت", "اوپک", "نفت", "کنگره", "پارلمان",
        "جمهوری", "سفیر", "پرزیدنت", "کنفرانس", "اجلاس", "سخنگو", "سخنران", "مقام"
      ],
      economy: [
        "اقتصاد", "بانک مرکزی", "بازار", "بورس", "دلار", "یورو", "سکه", "طلا", "قیمت", 
        "تورم", "رکود", "رشد اقتصادی", "بدهی", "بودجه", "مالیات", "یارانه", "بانک", 
        "ارز", "پول", "سرمایه‌گذاری", "صادرات", "واردات", "نرخ", "بازار سرمایه", "صنعت",
        "ذخایر", "خزانه", "سود", "شاخص", "تولید", "ناخالص داخلی", "GDP", "سهام", "معیشت",
        "خصوصی‌سازی", "تجارت", "تراز تجاری", "بازرگانی", "اوراق"
      ],
      crypto: [
        "بیت کوین", "بیتکوین", "اتریوم", "ارز دیجیتال", "رمزارز", "بلاک چین", "بلاکچین",
        "کریپتو", "توکن", "استیبل کوین", "استیبل", "کاردانو", "سولانا", "NFT", "دیفای",
        "صرافی ارز دیجیتال", "کیف پول", "ولت", "تتر", "شیبا", "دوج کوین", "لایتکوین", "ترون",
        "وب 3", "متاورس", "قرارداد هوشمند", "پروتکل", "ماینینگ", "استخراج", "وایت پیپر",
        "آلتکوین", "بایننس", "کوین‌بیس", "هش ریت", "بی‌ان‌بی", "پولکادات", "سیف مون", "آواکس"
      ]
    };

    // بررسی اولویت‌ها در عنوان (امتیاز بیشتر) و محتوا
    // امتیازدهی با اولویت سیاست > اقتصاد > رمزارز
    const categoryScores = {
      politics: 0,
      economy: 0, 
      crypto: 0
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
    
    // مجموع امتیاز اولویت‌ها (با ضریب اولویت)
    const priorityScore = (categoryScores.politics * 1.5) + (categoryScores.economy * 1.2) + (categoryScores.crypto * 1.0);

    // تشخیص منبع کریپتویی
    const isCryptoSource = post.source && (
      post.source.includes("Crypto") || 
      post.source.includes("Arz") || 
      post.source.includes("Ramzarz") ||
      post.source.includes("Coin") ||
      post.source.includes("Blockchain")
    );
    
    // اگر محتوا با هیچ یک از اولویت‌های کانال مرتبط نیست و از منابع کریپتویی هم نیست، آن را رد کنیم
    if (priorityScore < 3 && !categoryFound && !isCryptoSource) {
      console.log(`پست "${post.title}" به دلیل عدم ارتباط کافی با اولویت‌های کانال رد شد`);
      return { 
        isHighQuality: false, 
        reason: "عدم ارتباط با اولویت‌های کانال" 
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
    
    if (isBreakingNews) {
      minScoreThreshold = 6; // آستانه پایین‌تر برای اخبار فوری
    } else if (isShortNews) {
      minScoreThreshold = 7; // آستانه برای اخبار کوتاه
    } else if (categoryScores.politics > 3) {
      minScoreThreshold = 7; // آستانه پایین‌تر برای اخبار سیاسی مهم
    }
    
    if (qualityScore < minScoreThreshold) {
      console.log(`پست "${post.title}" به دلیل امتیاز کیفی پایین (${qualityScore}/16) رد شد`);
      return { 
        isHighQuality: false, 
        reason: `امتیاز کیفی پایین (${qualityScore}/16)` 
      };
    }
    
    console.log(`پست "${post.title}" با امتیاز کیفی ${qualityScore}/16 تأیید شد`);
    return {
      isHighQuality: true,
      qualityScore: qualityScore,
      reason: "محتوای با کیفیت و مرتبط",
      isNews: isNewsContent || isShortNews,
      isBreakingNews: isBreakingNews,
      priorityCategories: {
        politics: categoryScores.politics > 0,
        economy: categoryScores.economy > 0,
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