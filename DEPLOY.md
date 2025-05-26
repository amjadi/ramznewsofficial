# 🚀 راهنمای استقرار رمزنیوز نسل ۲

این سند شامل دستورالعمل‌های قدم به قدم برای استقرار پروژه رمزنیوز نسل ۲ روی Cloudflare Workers است.

## پیش‌نیازها

1. نصب [Node.js](https://nodejs.org/) نسخه 14 یا بالاتر
2. نصب [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
3. داشتن حساب کاربری در [Cloudflare](https://dash.cloudflare.com/)

## مراحل استقرار

### ۱. نصب Wrangler CLI

```bash
npm install -g wrangler
```

### ۲. ورود به حساب کاربری Cloudflare

```bash
wrangler login
```

این دستور یک مرورگر باز می‌کند تا شما را به حساب Cloudflare خود متصل کند.

### ۳. ایجاد KV Namespace

```bash
wrangler kv:namespace create POST_TRACKER
```

پس از اجرای این دستور، خروجی مشابه زیر دریافت خواهید کرد:

```
🌀 Creating namespace with title "ramznews-gen2-POST_TRACKER"
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "POST_TRACKER"
id = "xxxxxxxxxxxxxxxxxxxxxxxx"
```

شناسه `id` را در فایل `wrangler.toml` جایگزین کنید:

```toml
[[kv_namespaces]]
binding = "POST_TRACKER"
id = "xxxxxxxxxxxxxxxxxxxxxxxx" # شناسه دریافتی را اینجا قرار دهید
```

### ۴. (اختیاری) ایجاد دیتابیس D1

برای استفاده از قابلیت‌های تحلیلی پیشرفته‌تر، می‌توانید یک دیتابیس D1 ایجاد کنید:

```bash
wrangler d1 create ramznews-db
```

شناسه دیتابیس را در `wrangler.toml` قرار دهید:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ramznews-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # شناسه دریافتی را اینجا قرار دهید
```

سپس اسکیمای دیتابیس را اجرا کنید:

```bash
wrangler d1 execute ramznews-db --file=./db_schema.sql
```

### ۵. ثبت اطلاعات حساس با Secrets

برای امنیت بیشتر، توکن‌ها را به صورت Secret ثبت کنید:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# سپس مقدار 7901847454:AAHiID4x5SDdZCNbwgYd3vVLmRnKVl10J78 را وارد کنید

wrangler secret put OPENROUTER_API_KEY
# سپس مقدار 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 را وارد کنید
```

### ۶. تست محلی پروژه

```bash
npm run dev
```

این دستور یک نسخه محلی از پروژه را اجرا می‌کند که می‌توانید آن را در آدرس `http://localhost:8787` ببینید.

### ۷. استقرار نهایی روی Cloudflare Workers

```bash
npm run publish
# یا مستقیماً
wrangler publish
```

پس از موفقیت‌آمیز بودن استقرار، آدرس‌های زیر در دسترس خواهند بود:

- نسخه workers.dev: `https://ramznews-gen2.your-subdomain.workers.dev`
- وضعیت سلامت: `https://ramznews-gen2.your-subdomain.workers.dev/health`

### ۸. تنظیم زمان‌بندی Cron Triggers

Cron Triggers به صورت خودکار در `wrangler.toml` تنظیم شده‌اند:

```toml
[triggers]
crons = ["*/10 * * * *", "* * * * *"]
```

به ترتیب برای:
- هر ۱۰ دقیقه: دریافت فیدهای RSS
- هر ۱ دقیقه: پردازش صف و ارسال به تلگرام

## عیب‌یابی

### مشکلات رایج

1. **خطای دسترسی به KV**: مطمئن شوید شناسه KV را درست وارد کرده‌اید.
2. **عدم ارسال به تلگرام**: توکن تلگرام را بررسی کنید و مطمئن شوید بات به کانال دسترسی دارد.
3. **عدم فراخوانی Cron**: تنظیمات cron را در داشبورد Cloudflare بررسی کنید.

### بررسی لاگ‌ها

برای دیدن لاگ‌های برنامه:

```bash
wrangler tail
```

## نگهداری

### بروزرسانی کد

برای بروزرسانی کد پروژه پس از تغییرات:

```bash
git pull
npm install
npm run publish
```

### تغییر منابع RSS

برای تغییر منابع RSS، متغیر `RSS_FEED_URLS` را در `wrangler.toml` ویرایش کنید یا از طریق داشبورد Cloudflare Workers متغیرهای محیطی را تغییر دهید. 