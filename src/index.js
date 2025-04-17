// Configuration
const TELEGRAM_BOT_TOKEN = "7901847454:AAHiID4x5SDdZCNbwgYd3vVLmRnKVl10J78";
const CHANNEL_USERNAME = "@ramznewsofficial";
const MAX_SAVED_MESSAGES = 1000;
const DELAY_BETWEEN_POSTS = 5000;
const STORAGE_TTL_DAYS = 60;
const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/persian/rss.xml", source: "BBC Persian" },
  { url: "https://rss.dw.com/xml/rss-per-all_volltext", source: "DW Persian" },
  { url: "https://parsi.euronews.com/rss", source: "Euronews Persian" },
  { url: "https://crypto.asriran.com/feed/", source: "Crypto Asriran" },
  { url: "https://tejaratnews.com/feed/", source: "Tejarat News" },
  // Crypto/blockchain RSS feeds
  { url: "https://ramzarz.news/feed/", source: "Ramzarz News" },
  { url: "https://coiniran.com/feed/", source: "Coin Iran" },
  { url: "https://arzdigital.com/feed/", source: "Arz Digital" },
  // Technology RSS feed
  { url: "https://itiran.com/feed/", source: "IT Iran" },
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
  text = text.replace(/اینترنت بدون سانسور با سایفون دویچه‌ وله/g, "");
  
  // Additional cleanup for new RSS feeds
  text = text.replace(/زمان مطالعه:?\s*\d+\s*دقیقه/g, "");
  text = text.replace(/نوشته .* اولین بار در .* پدیدار شد\.?/g, "");
  text = text.replace(/اولین بار در .* پدیدار شد\.?/g, "");
  text = text.replace(/مطلب پیشنهادی:?.*/g, "");
  text = text.replace(/\[\&hellip;\]/g, "...");
  text = text.replace(/\[&#8230;\]/g, "...");
  text = text.replace(/\[\s*…\s*\]/g, "...");
  
  // Remove "Read more" type links
  text = text.replace(/ادامه مطلب را بخوانید.*/g, "");
  text = text.replace(/برای مشاهده متن کامل.*/g, "");
  text = text.replace(/برای مطالعه ادامه خبر.*/g, "");
  
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
  text = text.replace(/عکس:.*?(?=\n|$)/g, "");
  text = text.replace(/منبع:.*?(?=\n|$)/g, "");
  text = text.replace(/تصویر:.*?(?=\n|$)/g, "");
  text = text.replace(/تبلیغات/g, "");
  text = text.replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "");
  text = text.replace(/دویچه وله فارسی \/ .*/g, "");
  text = text.replace(/بی‌بی‌سی فارسی \/ .*/g, "");
  text = text.replace(/یورونیوز فارسی \/ .*/g, "");
  text = text.replace(/\n{2,}/g, "\n\n");
  
  // Final cleanup of spaces after all replacements
  text = text.replace(/\s+/g, " ").trim();
  
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
    
    if (post.source) {
      identifierParts.push(post.source.replace(/\s+/g, "").substring(0, 10));
    }
    
    if (post.title && post.title.trim()) {
      const cleanTitle = post.title
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "")
        .trim();
      identifierParts.push(cleanTitle);
    }
    
    if (post.link) {
      try {
        const url = new URL(post.link);
        identifierParts.push(url.pathname.replace(/[^a-zA-Z0-9]/g, ""));
      } catch (e) {
        identifierParts.push(post.link.replace(/[^a-zA-Z0-9]/g, ""));
      }
    }
    
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
    
    if (post.description && post.description.trim()) {
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
    
    let identifier = identifierParts.join("-");
    identifier = identifier.replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF_-]/g, "");
    
    if (identifier.length > 128) {
      identifier = simpleHash(identifier);
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
        source === "Coin Iran" || 
        source === "Arz Digital" || 
        fullText.includes("ارز دیجیتال") || 
        fullText.includes("بیت کوین") || 
        fullText.includes("بلاک چین") || 
        fullText.includes("رمزارز") || 
        fullText.includes("کریپتو")) {
      return "finance";
    }
    
    // Check for tech content - include IT Iran
    if (source === "IT Iran" || 
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
        console.log(`Post "${safeIdentifier}" was sent at ${parsedValue.sentAt}`);
      } catch (e) {
        hasBeenSent = storedValue === "sent";
        console.log(`Post "${safeIdentifier}" was sent (old format)`);
      }
    }
    
    console.log(`Checking if post "${safeIdentifier}" has been sent: ${hasBeenSent ? "Yes" : "No"}`);
    return hasBeenSent;
  } catch (error) {
    console.error(`Error checking if post has been sent: ${error.message}`);
    return false;
  }
}

async function isContentDuplicate(post, env) {
  try {
    if (!env || !env.POST_TRACKER || !post.title || !post.description) {
      return false;
    }

    const titleWords = post.title
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5);

    if (titleWords.length === 0) {
      return false;
    }

    const keys = await env.POST_TRACKER.list({ limit: 100 });
    if (!keys || !keys.keys || keys.keys.length === 0) {
      return false;
    }

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

        if (storedValue.data && typeof storedValue.data === "object" && storedValue.data.title) {
          const storedTitle = storedValue.data.title;
          let matchCount = 0;

          for (const word of titleWords) {
            if (storedTitle.includes(word)) {
              matchCount++;
            }
          }

          if (matchCount >= Math.ceil(titleWords.length * 0.7)) {
            console.log(`محتوای مشابه یافت شد: "${storedTitle}" با "${post.title}"`);
            return true;
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
    
    const storedData = {
      sentAt: new Date().toISOString(),
      data: postData || "sent"
    };
    
    await env.POST_TRACKER.put(safeIdentifier, JSON.stringify(storedData), {
      expirationTtl: 86400 * STORAGE_TTL_DAYS
    });
    
    console.log(`Post "${safeIdentifier}" marked as sent. Will be stored for ${STORAGE_TTL_DAYS} days.`);
    return true;
  } catch (error) {
    console.error(`Error marking post as sent: ${error.message}`);
    return false;
  }
}

// Telegram posting function
async function sendTelegramPost(post, env) {
  try {
    const cleanDescription = post.description;
    const cleanTitle = post.title ? sanitizeText(post.title) : "";
    const validImage = post.image && isValidUrl(post.image) ? post.image : null;
    
    let titleText = "";
    if (cleanTitle && cleanTitle.trim()) {
      titleText = `📌 <b>${cleanTitle}</b>\n\n`;
    }
    
    const channelLink = `\n\n@ramznewsofficial`;
    
    // Generate hashtags using the new function
    const hashtags = extractHashtags(post);
    
    const maxLength = validImage ? 900 : 3900;
    const otherPartsLength = titleText.length + hashtags.length + channelLink.length;
    const maxDescriptionLength = maxLength - otherPartsLength;
    
    let truncatedDescription = "";
    if (cleanDescription.length <= maxDescriptionLength) {
      truncatedDescription = cleanDescription;
    } else {
      const paragraphs = cleanDescription.split(/\n+/);
      let currentLength = 0;
      
      for (const paragraph of paragraphs) {
        if (currentLength + paragraph.length + 2 > maxDescriptionLength) {
          if (currentLength === 0) {
            // If first paragraph is already too long, we need to truncate it smartly
            const availableText = paragraph.substring(0, maxDescriptionLength);
            
            // Look for sentence endings (Persian and Latin punctuation)
            const lastSentenceEnd = Math.max(
              availableText.lastIndexOf(". "),
              availableText.lastIndexOf("! "),
              availableText.lastIndexOf("? "),
              availableText.lastIndexOf("؟ "),
              availableText.lastIndexOf("! "),
              availableText.lastIndexOf(". "),
              availableText.lastIndexOf("؛ "),
              availableText.lastIndexOf("، ")
            );
            
            if (lastSentenceEnd > maxDescriptionLength * 0.6) {
              // Use the last complete sentence if it's at least 60% of available text
              truncatedDescription = paragraph.substring(0, lastSentenceEnd + 1).trim();
              
              // Ensure text ends with proper punctuation
              if (!/[.!?؟،؛]$/.test(truncatedDescription)) {
                truncatedDescription += ".";
              }
            } else {
              // Find the last space to avoid cutting words
              const lastSpace = availableText.lastIndexOf(" ", maxDescriptionLength - 4);
              if (lastSpace > maxDescriptionLength * 0.8) {
                truncatedDescription = paragraph.substring(0, lastSpace).trim() + "...";
              } else {
                truncatedDescription = availableText.substring(0, maxDescriptionLength - 3).trim() + "...";
              }
            }
          }
          break;
        }
        
        if (truncatedDescription) {
          truncatedDescription += "\n\n";
        }
        truncatedDescription += paragraph;
        currentLength += paragraph.length + 2;
      }
    }
    
    // Make sure the description always ends with proper punctuation
    truncatedDescription = truncatedDescription.trim();
    if (truncatedDescription && !/[.!?؟،؛]$/.test(truncatedDescription)) {
      truncatedDescription += ".";
    }
    
    truncatedDescription = truncatedDescription
      .replace(/عکس:.*?(?=\n|$)/g, "")
      .replace(/منبع:.*?(?=\n|$)/g, "")
      .replace(/تصویر:.*?(?=\n|$)/g, "")
      .replace(/تبلیغات/g, "")
      .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
      .replace(/\n{3,}/g, "\n\n");
    
    const message = `${titleText}${truncatedDescription}${hashtags}${channelLink}`;
    
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
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error: ${response.statusText}, Response: ${errorText}`);
      
      if (errorText.includes("message is too long") || errorText.includes("caption is too long")) {
        console.log("Message is still too long, shortening it further");
        
        const evenShorterLength = validImage ? 500 : 2000;
        const firstParagraph = cleanDescription.split(/\n+/)[0];
        
        // Smart truncation for retry
        let shorterDescription = "";
        if (firstParagraph.length <= evenShorterLength - otherPartsLength) {
          shorterDescription = firstParagraph;
        } else {
          // Find last sentence ending
          const availableText = firstParagraph.substring(0, evenShorterLength - otherPartsLength - 5);
          const lastSentenceEnd = Math.max(
            availableText.lastIndexOf(". "),
            availableText.lastIndexOf("! "),
            availableText.lastIndexOf("? "),
            availableText.lastIndexOf("؟ "),
            availableText.lastIndexOf("! "),
            availableText.lastIndexOf(". "),
            availableText.lastIndexOf("؛ ")
          );
          
          if (lastSentenceEnd > availableText.length * 0.5) {
            shorterDescription = availableText.substring(0, lastSentenceEnd + 1).trim();
            // Ensure text ends with proper punctuation
            if (!/[.!?؟،؛]$/.test(shorterDescription)) {
              shorterDescription += ".";
            }
          } else {
            // Find the last space to avoid cutting words
            const lastSpace = availableText.lastIndexOf(" ", availableText.length - 4);
            shorterDescription = availableText.substring(0, lastSpace).trim() + "...";
          }
        }
        
        const shorterMessage = `${titleText}${shorterDescription}${hashtags}${channelLink}`;
        
        const retryPayload = validImage 
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
        
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(retryPayload)
        });
        
        if (!retryResponse.ok) {
          console.log("Still having issues, sending only title and link");
          
          // Ensure title ends with proper punctuation
          if (cleanTitle && !/[.!?؟،؛]$/.test(cleanTitle)) {
            titleText = `📌 <b>${cleanTitle}.</b>\n\n`;
          }
          
          const finalMessage = `${titleText}${hashtags}${channelLink}`;
          const finalPayload = validImage 
            ? {
                chat_id: CHANNEL_USERNAME,
                photo: validImage,
                caption: finalMessage,
                parse_mode: "HTML"
              } 
            : {
                chat_id: CHANNEL_USERNAME,
                text: finalMessage,
                parse_mode: "HTML"
              };
          
          const finalResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload)
          });
          
          if (!finalResponse.ok) {
            throw new Error(`Telegram API error on final retry: ${finalResponse.statusText}`);
          }
        }
      } else {
        throw new Error(`Telegram API error: ${response.statusText}, Response: ${errorText}`);
      }
    }
    
    const postTitle = cleanTitle || cleanDescription.substring(0, 30) + "...";
    console.log(`Post "${postTitle}" sent successfully to Telegram.`);
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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch article page: ${response.statusText}`);
    }
    
    const html = await response.text();
    let content = "";
    let image = null;
    
    if (source === "BBC Persian") {
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
      const articleBodyMatch = /<div[^>]*class="[^"]*longText[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          paragraphs.push(sanitizeText(paragraphMatch[1]));
        }
        
        content = paragraphs.join("\n\n");
        
        const imgMatch = /<img[^>]+data-src="([^">]+)"[^>]*>/i.exec(html);
        if (imgMatch) {
          image = imgMatch[1];
        } else {
          const metaImgMatch = /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i.exec(html);
          if (metaImgMatch) {
            image = metaImgMatch[1];
          }
        }
      }
    } else if (source === "Euronews Persian") {
      const articleBodyMatch = /<div[^>]*class="[^"]*c-article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          paragraphs.push(sanitizeText(paragraphMatch[1]));
        }
        
        content = paragraphs.join("\n\n");
        
        const imgMatch = /<img[^>]+src="([^">]+)"[^>]*class="[^"]*c-article-media__img[^"]*"[^>]*>/i.exec(html);
        if (imgMatch) {
          image = imgMatch[1];
        } else {
          const metaImgMatch = /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i.exec(html);
          if (metaImgMatch) {
            image = metaImgMatch[1];
          }
        }
      }
    } else if (source === "Ramzarz News" || source === "Coin Iran" || source === "Arz Digital") {
      // Handle crypto news sites - WordPress-based sites
      const articleBodyMatch = /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) || 
                              /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<div[^>]*class="[^"]*content-inner[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html);
      
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          paragraphs.push(sanitizeText(paragraphMatch[1]));
        }
        
        content = paragraphs.join("\n\n");
        
        // Image extraction from Crypto news sites
        // First try featured image
        const featuredImgMatch = /<img[^>]+class="[^"]*(?:wp-post-image|attachment-post-thumbnail)[^"]*"[^>]+src="([^">]+)"[^>]*>/i.exec(html);
        if (featuredImgMatch) {
          image = featuredImgMatch[1];
        } else {
          // Try OpenGraph image
          const ogImgMatch = /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i.exec(html);
          if (ogImgMatch) {
            image = ogImgMatch[1];
          } else {
            // Try any image in the content
            const contentImgMatch = /<img[^>]+src="([^">]+)"[^>]*>/i.exec(articleBody);
            if (contentImgMatch) {
              image = contentImgMatch[1];
            }
          }
        }
      }
    } else if (source === "IT Iran") {
      // Handle IT Iran (tech news)
      const articleBodyMatch = /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) || 
                              /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
                              /<article[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i.exec(html);
      
      if (articleBodyMatch) {
        const articleBody = articleBodyMatch[1];
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let paragraphMatch;
        
        while ((paragraphMatch = paragraphRegex.exec(articleBody)) !== null) {
          paragraphs.push(sanitizeText(paragraphMatch[1]));
        }
        
        content = paragraphs.join("\n\n");
        
        // Image extraction from IT Iran
        const featuredImgMatch = /<img[^>]+class="[^"]*(?:wp-post-image|attachment-full)[^"]*"[^>]+src="([^">]+)"[^>]*>/i.exec(html);
        if (featuredImgMatch) {
          image = featuredImgMatch[1];
        } else {
          // Try OpenGraph image
          const ogImgMatch = /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i.exec(html);
          if (ogImgMatch) {
            image = ogImgMatch[1];
          } else {
            // Try any image in the content
            const contentImgMatch = /<img[^>]+src="([^">]+)"[^>]*>/i.exec(articleBody);
            if (contentImgMatch) {
              image = contentImgMatch[1];
            }
          }
        }
      }
    } else if (source === "Crypto Asriran" || source === "Tejarat News") {
      const contentSelectors = [
        /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i
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
        
        const imgSelectors = [
          /<meta[^>]+property="og:image"[^>]+content="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*featured-image[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^">]+)"[^>]*>/i,
          /<img[^>]+src="([^">]+)"[^>]*class="[^"]*attachment-full[^"]*"[^>]*>/i
        ];
        
        for (const selector of imgSelectors) {
          const match = selector.exec(html);
          if (match) {
            image = match[1];
            break;
          }
        }
      }
    }
    
    // Generic content extraction as fallback
    if (!content) {
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
      }
    }
    
    if (content) {
      content = content
        .replace(/عکس:.*?(?=\n|$)/g, "")
        .replace(/منبع:.*?(?=\n|$)/g, "")
        .replace(/تصویر:.*?(?=\n|$)/g, "")
        .replace(/تبلیغات/g, "")
        .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
        .replace(/\n{3,}/g, "\n\n");
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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
      
      let description = "";
      if (isAtom) {
        const contentMatch = /<content[^>]*>([\s\S]*?)<\/content>/i.exec(itemContent);
        const summaryMatch = /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(itemContent);
        description = contentMatch ? contentMatch[1] : summaryMatch ? summaryMatch[1] : "";
      } else {
        const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
        description = descMatch ? descMatch[1] : "";
        
        if (description.length < 100) {
          const contentMatch = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);
          if (contentMatch && contentMatch[1]) {
            description = contentMatch[1];
          }
        }
      }
      
      let author = "";
      const authorMatch = isAtom 
        ? /<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i.exec(itemContent) 
        : /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(itemContent) || /<author[^>]*>([\s\S]*?)<\/author>/i.exec(itemContent);
      
      if (authorMatch) {
        author = sanitizeText(authorMatch[1]);
      }
      
      let image = null;
      
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
      
      if (!image && description) {
        const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
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
      
      let processedDescription = sanitizeText(description);
      
      if (link) {
        console.log(`دریافت محتوای کامل از صفحه اصلی: ${link}`);
        const fullContent = await fetchFullContent(link, feedUrl.source);
        
        if (fullContent.content && fullContent.content.length > 100) {
          processedDescription = fullContent.content;
          console.log(`محتوای کامل با موفقیت دریافت شد (${processedDescription.length} کاراکتر)`);
        }
        
        if (fullContent.image && (!image || fullContent.image.includes("original") || fullContent.image.includes("large"))) {
          image = fullContent.image;
          console.log(`تصویر با کیفیت با موفقیت دریافت شد: ${image}`);
        }
      }
      
      if (processedDescription.length < 100 && title.length > 0) {
        console.log(`محتوای پست "${title}" خیلی کوتاه است (${processedDescription.length} کاراکتر)، نادیده گرفتن پست`);
        continue;
      }
      
      processedDescription = processedDescription
        .replace(/عکس:.*?(?=\n|$)/g, "")
        .replace(/منبع:.*?(?=\n|$)/g, "")
        .replace(/تصویر:.*?(?=\n|$)/g, "")
        .replace(/تبلیغات/g, "")
        .replace(/https?:\/\/p\.dw\.com\/p\/\w+/g, "")
        .replace(/\n{3,}/g, "\n\n");
      
      items.push({
        title,
        description: processedDescription,
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
    const processedIdentifiers = new Set();
    
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`دریافت پست‌ها از ${feed.source} (${feed.url})`);
        const latestPosts = await fetchLatestPosts(feed, 3);
        console.log(`${latestPosts.length} پست از ${feed.source} یافت شد`);
        
        for (const post of latestPosts) {
          const uniqueIdentifier = generatePostIdentifier(post);
          
          if (processedIdentifiers.has(uniqueIdentifier)) {
            console.log(`پست "${post.title}" قبلاً در همین اجرا پردازش شده است، نادیده گرفتن...`);
            duplicateCount++;
            continue;
          }
          
          const additionalIdentifiers = [];
          if (post.title) {
            const titleIdentifier = post.title.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, "").trim();
            additionalIdentifiers.push(titleIdentifier);
          }
          if (post.link) {
            additionalIdentifiers.push(post.link);
          }
          
          let isPostSent = await hasPostBeenSent(uniqueIdentifier, env);
          
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
          
          if (!isPostSent) {
            const contentDuplicate = await isContentDuplicate(post, env);
            if (contentDuplicate) {
              console.log(`پست "${post.title}" دارای محتوای مشابه با پست‌های قبلی است، نادیده گرفتن...`);
              isPostSent = true;
              duplicateCount++;
            }
          }
          
          if (!isPostSent) {
            console.log(`ارسال پست جدید از ${feed.source}: ${post.title}`);
            const success = await sendTelegramPost(post, env);
            
            if (success) {
              const postData = {
                title: post.title,
                link: post.link,
                source: post.source,
                sentAt: new Date().toISOString()
              };
              
              await markPostAsSent(uniqueIdentifier, env, postData);
              
              for (const additionalId of additionalIdentifiers) {
                await markPostAsSent(additionalId, env, {
                  referenceId: uniqueIdentifier,
                  sentAt: new Date().toISOString()
                });
              }
              
              processedIdentifiers.add(uniqueIdentifier);
              successCount++;
              await delay(DELAY_BETWEEN_POSTS);
            } else {
              failureCount++;
            }
          } else {
            console.log(`پست قبلاً ارسال شده است: ${post.title}`);
          }
        }
      } catch (error) {
        console.error(`خطا در پردازش فید ${feed.source}: ${error.message}`);
        failureCount++;
        continue;
      }
    }
    
    // Clean up old posts
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
          
          console.log(`${keysToDelete.length} پست قدیمی با موفقیت حذف شدند.`);
        } else {
          console.log(`تعداد پست‌های ذخیره شده (${keys.keys.length}) کمتر از حداکثر مجاز (${MAX_SAVED_MESSAGES}) است.`);
        }
      }
    } catch (error) {
      console.error(`خطا در پاکسازی پست‌های قدیمی: ${error.message}`);
    }
    
    console.log(`پردازش با موفقیت به پایان رسید. ${successCount} پست ارسال شد. ${failureCount} خطا رخ داد. ${duplicateCount} پست تکراری شناسایی شد.`);
  } catch (error) {
    console.error(`خطا در پردازش: ${error.message}`);
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