# 🚀 راهنمای راه‌اندازی رمزنیوز نسل ۲

این سند راهنمای راه‌اندازی اولیه و پیکربندی پروژه رمزنیوز نسل ۲ است.

## پیش‌نیازها

- حساب کاربری در [Cloudflare Workers](https://workers.cloudflare.com)
- Node.js نسخه 14 یا بالاتر
- نصب [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) برای توسعه و استقرار

## مراحل نصب

### ۱. دریافت کد پروژه

```bash
git clone https://github.com/yourusername/ramznews-gen2.git
cd ramznews-gen2
npm install
```

### ۲. تنظیم محیط توسعه

اطلاعات حساب کاربری و توکن‌های دسترسی در فایل `wrangler.toml` قرار داده شده است:

```toml
[vars]
TELEGRAM_BOT_TOKEN = "7901847454:AAHiID4x5SDdZCNbwgYd3vVLmRnKVl10J78"
TELEGRAM_CHANNEL_USERNAME = "@ramznewsofficial"
OPENROUTER_API_KEY = "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"
LLM_MODEL = "mistralai/mixtral-8x7b"
```

### ۳. ایجاد KV namespace در Cloudflare

برای ذخیره‌سازی داده‌ها، نیاز به یک KV namespace در حساب Cloudflare خود دارید:

```bash
wrangler kv:namespace create POST_TRACKER
```

پس از اجرای دستور بالا، خروجی شبیه به این خواهید دید:

```
🌀 Creating namespace with title "ramznews-gen2-POST_TRACKER"
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "POST_TRACKER"
id = "xxxxxxxxxxxxxxxxxxxxxxxx"
```

شناسه `id` را در فایل `wrangler.toml` در بخش مربوطه کپی کنید:

```toml
[[kv_namespaces]]
binding = "POST_TRACKER"
id = "xxxxxxxxxxxxxxxxxxxxxxxx" # شناسه دریافتی را اینجا قرار دهید
```

### ۴. تست در محیط محلی

```bash
npm run dev
```

### ۵. استقرار روی Cloudflare Workers

```bash
npm run publish
```

## نکات امنیتی

- توکن‌های دسترسی در `wrangler.toml` ذخیره شده‌اند. این فایل را در مخزن عمومی Git قرار ندهید.
- برای محیط توسعه مشترک، از Cloudflare Workers Secrets استفاده کنید:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put OPENROUTER_API_KEY
```

## تست و اجرا

برای اجرای تست‌ها:

```bash
npm test
```

## منابع خبری پیش‌فرض

منابع خبری پیش‌فرض در `wrangler.toml` تنظیم شده‌اند:

```
RSS_FEED_URLS = "https://www.bbc.com/persian/iran/rss.xml,https://rss.dw.com/rdf/rss-per-iran,https://per.euronews.com/rss,https://ramzarz.news/feed/,https://arzdigital.com/feed/"
```

برای تغییر منابع، این متغیر را در فایل `wrangler.toml` ویرایش کنید. 