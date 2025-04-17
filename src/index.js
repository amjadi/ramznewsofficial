// Configuration
const TELEGRAM_BOT_TOKEN = "7834568797:AAHgNQCBjm-1ceKFtxKbGid8SRfy0gaoy9Q";
const CHANNEL_USERNAME = "@ramznewsofficial";
const MAX_SAVED_MESSAGES = 1000;
const DELAY_BETWEEN_POSTS = 5000;
const STORAGE_TTL_DAYS = 60;
const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/persian/rss.xml", source: "BBC Persian" },
  { url: "https://rss.dw.com/xml/rss-per-all_volltext", source: "DW Persian" },
  { url: "https://parsi.euronews.com/rss", source: "Euronews Persian" },
  { url: "https://crypto.asriran.com/feed/", source: "Crypto Asriran" },
  { url: "https://tejaratnews.com/feed/", source: "Tejarat News" }
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
  
  text = text.replace(/اولین بار در .* پدیدار شد\.?/g, "");
  text = text.replace(/&zwnj;/g, "");
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
  text = text.replace(/\s+/g, " ").trim();
  
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
    
    let hashtags = "";
    if (post.source === "Crypto Asriran" || post.source === "Tejarat News") {
      hashtags = `\n\n#ارز_دیجیتال #بیت_کوین #کریپتو`;
    } else if (post.source === "BBC Persian" || post.source === "DW Persian" || post.source === "Euronews Persian") {
      hashtags = `\n\n#اخبار #ایران #جهان`;
    }
    
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
            const availableText = paragraph.substring(0, maxDescriptionLength);
            const lastSentenceEnd = Math.max(
              availableText.lastIndexOf(". "),
              availableText.lastIndexOf("! "),
              availableText.lastIndexOf("? ")
            );
            
            if (lastSentenceEnd > maxDescriptionLength * 0.7) {
              truncatedDescription = paragraph.substring(0, lastSentenceEnd + 1);
            } else {
              truncatedDescription = availableText.substring(0, maxDescriptionLength - 3) + "...";
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
        const shorterDescription = firstParagraph.substring(0, evenShorterLength - otherPartsLength - 3) + "...";
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