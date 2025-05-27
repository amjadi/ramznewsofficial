// تابع استخراج هشتگ‌های هوشمند و موضوعی از پست
export function extractHashtags(post) {
  // Detect post category
  const detectCategory = (title, content, source) => {
    const fullText = (title + " " + content).toLowerCase();
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
    const politicalTerms = [
      "مذاکره", "سیاست", "دولت", "وزیر", "مجلس", "رئیس جمهور", "خامنه‌ای", "رهبر", 
      "انتخابات", "تحریم", "دیپلماسی", "سفیر", "سازمان ملل", "شورای امنیت", 
      "کنگره", "پارلمان", "حزب", "سنا", "احضار", "دیپلمات"
    ];
    if (politicalTerms.some(term => fullText.includes(term))) {
      return "politics";
    }
    const internationalTerms = ["بین‌المللی", "خارجی", "جهانی", "دیپلماتیک", "سازمان ملل"];
    if (internationalTerms.some(term => fullText.includes(term))) {
      return "international";
    }
    const economicTerms = [
      "اقتصاد", "بورس", "بانک", "دلار", "یورو", "ارز", "طلا", "سکه", "بازار",
      "تورم", "رکود", "قیمت", "معاملات", "سهام", "صادرات", "واردات"
    ];
    if (economicTerms.some(term => fullText.includes(term))) {
      return "economy";
    }
    return source === "BBC Persian" || source === "DW Persian" || source === "Euronews Persian" || source === "Mehr News" || source === "IRNA Politics" || source === "IRNA World" ? 
      "news" : "general";
  };
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
  const namedEntityPatterns = {
    countries: [
      "ایران", "آمریکا", "روسیه", "چین", "فرانسه", "آلمان", "انگلستان", "بریتانیا", 
      "ترکیه", "ایتالیا", "عراق", "سوریه", "لبنان", "فلسطین", "اسرائیل", "افغانستان", 
      "پاکستان", "هند", "ژاپن", "کره", "کانادا", "ونزوئلا", "برزیل", "ارمنستان", 
      "آذربایجان", "مصر", "عربستان", "امارات", "قطر", "کویت", "عمان", "بحرین",
      "اوکراین", "دانمارک", "سوئد", "نروژ", "اسپانیا", "پرتغال", "یونان"
    ],
    organizations: [
      "سازمان ملل", "ناتو", "اتحادیه اروپا", "آژانس", "پنتاگون", "کنگره", "کاخ سفید", 
      "وزارت خارجه", "شورای امنیت", "اوپک", "بانک جهانی", "صندوق بین‌المللی"
    ],
    crypto: [
      "بیت‌کوین", "اتریوم", "ارز دیجیتال", "رمزارز", "بلاکچین", "توکن", "تتر", 
      "کاردانو", "سولانا", "دوج کوین", "کوین", "صرافی", "شیبا", "استیبل"
    ],
    finance: [
      "بورس", "سهام", "دلار", "یورو", "سکه", "طلا", "نفت", "اقتصاد", "تورم", "بانک مرکزی",
      "بازار", "قیمت", "ارز", "بهادار", "معاملات", "سهامداران", "بازار سرمایه"
    ],
    politics: [
      "رئیس‌جمهور", "مجلس", "نماینده", "وزیر", "دولت", "انتخابات", "رهبر", "سیاست", 
      "گفتگو", "مذاکره", "دیپلماسی", "سیاسی", "پارلمان", "حزب", "جمهوری", "دموکرات", 
      "سنا", "کنگره", "رأی", "تحریم", "سفیر", "دیپلمات", "بیانیه", "لایحه", "حکم"
    ]
  };
  const title = post.title ? post.title : "";
  const content = post.description ? post.description : "";
  const category = detectCategory(title, content, post.source);
  const extractNamedEntities = (text) => {
    const entities = [];
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
  const extractPhrases = (text) => {
    const phrases = [];
    const regex = /(\b[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]{3,}(\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]{3,}){1,2}\b)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const phrase = match[0].trim();
      const phraseWords = phrase.split(/\s+/);
      if (!phraseWords.some(word => stopWords.includes(word)) && phraseWords.length <= 3) {
        phrases.push(phrase);
      }
    }
    return phrases;
  };
  const titlePhrases = extractPhrases(title);
  const namedEntities = extractNamedEntities(title + " " + content);
  let text = (title + " " + content).replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, " ");
  let words = text.split(/\s+/).filter(word => word.length > 3);
  words = words.filter(word => !stopWords.includes(word) && word.length >= 4);
  const wordFrequency = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  let sortedWords = Object.keys(wordFrequency).sort((a, b) => {
    return wordFrequency[b] - wordFrequency[a];
  });
  sortedWords = sortedWords.slice(0, 8);
  const phraseHashtags = titlePhrases.map(phrase => phrase.replace(/\s+/g, "_"));
  const defaultHashtags = [];
  if (category === "finance" || category === "economy" || post.source === "Tejarat News" || post.source === "TGJU" || post.source === "IRNA Economy" || post.source === "Eghtesad News") {
    if (title.includes("ارز") || content.includes("ارز")) defaultHashtags.push("ارز");
    if (title.includes("بورس") || content.includes("بورس")) defaultHashtags.push("بورس");
    if (title.includes("اقتصاد") || content.includes("اقتصاد")) defaultHashtags.push("اقتصاد");
    if (title.includes("بانک") || content.includes("بانک")) defaultHashtags.push("بانک");
    if (defaultHashtags.length === 0) defaultHashtags.push("اقتصاد");
  } else if (category === "crypto" || post.source.includes("Crypto") || post.source.includes("Coin") || post.source.includes("Arz")) {
    if (title.includes("بیت کوین") || content.includes("بیت کوین")) defaultHashtags.push("بیت_کوین");
    if (title.includes("رمزارز") || content.includes("رمزارز")) defaultHashtags.push("رمزارز");
    if (defaultHashtags.length === 0) defaultHashtags.push("رمزارز");
  } else if (category === "politics") {
    if (title.includes("ایران") || content.includes("ایران")) defaultHashtags.push("ایران");
    if (title.includes("آمریکا") || content.includes("آمریکا")) defaultHashtags.push("آمریکا");
    if (title.includes("انتخابات") || content.includes("انتخابات")) defaultHashtags.push("انتخابات");
    if (title.includes("مذاکره") || content.includes("مذاکره")) defaultHashtags.push("مذاکره");
    if (title.includes("تحریم") || content.includes("تحریم")) defaultHashtags.push("تحریم");
    if (title.includes("دولت") || content.includes("دولت")) defaultHashtags.push("دولت");
    if (defaultHashtags.length === 0) defaultHashtags.push("سیاست");
  } else if (category === "international") {
    const countries = namedEntityPatterns.countries;
    let countryFound = false;
    for (const country of countries) {
      const countryRegex = new RegExp(`\\b${country}\\b`, 'i');
      if (countryRegex.test(title) || countryRegex.test(content)) {
        defaultHashtags.push(country);
        countryFound = true;
        if (defaultHashtags.length >= 2) break;
      }
    }
    if (!countryFound) defaultHashtags.push("بین_الملل");
  } else {
    if (text.includes("ایران")) defaultHashtags.push("ایران");
    if (text.includes("اخبار")) defaultHashtags.push("اخبار");
  }
  const allHashtags = [...new Set([
    ...namedEntities, 
    ...phraseHashtags, 
    ...sortedWords,
    ...defaultHashtags
  ])];
  const scoreHashtag = (hashtag) => {
    let score = 0;
    const hashtagRegex = new RegExp(`\\b${hashtag.replace(/_/g, "[_ ]")}\\b`, 'i');
    if (hashtagRegex.test(title)) {
      score += 100;
    } else if (hashtagRegex.test(content.substring(0, 200))) {
      score += 80;
    } else if (hashtagRegex.test(content)) {
      score += 50;
    }
    if (namedEntities.includes(hashtag)) score += 90;
    if (phraseHashtags.includes(hashtag)) score += 70;
    const freq = wordFrequency[hashtag] || 0;
    score += freq * 5;
    if (defaultHashtags.includes(hashtag)) {
      if (hashtagRegex.test(title) || hashtagRegex.test(content)) {
        score += 30;
      } else {
        score += 10;
      }
    }
    if (hashtag.length < 3) score -= 50;
    if (hashtag.length > 20) score -= 40;
    if (hashtag.length > 12) score -= 20;
    const irrelevantHashtags = ["هند", "پاکستان", "طلا", "نفت", "گاز"];
    if (irrelevantHashtags.includes(hashtag) && !hashtagRegex.test(title) && !hashtagRegex.test(content.substring(0, 500))) {
      score -= 500;
    }
    return score;
  };
  const finalHashtags = allHashtags
    .sort((a, b) => scoreHashtag(b) - scoreHashtag(a))
    .slice(0, 5);
  return finalHashtags;
} 