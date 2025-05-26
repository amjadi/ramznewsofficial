# راهنمای دیپلوی رمزنیوز نسل ۲

به دلیل مشکلات اتصال به اینترنت، مراحل زیر را بعد از برقراری ارتباط مناسب با سرورهای Cloudflare انجام دهید:

## ۱. ورود به حساب کاربری Cloudflare

```bash
npx wrangler login
```

این دستور یک صفحه مرورگر باز می‌کند. اجازه دسترسی را تایید کنید.

## ۲. ایجاد KV Namespace

```bash
npx wrangler kv:namespace create POST_TRACKER
```

بعد از اجرای این دستور، خروجی مشابه زیر دریافت خواهید کرد:

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

## ۳. (اختیاری) ایجاد دیتابیس D1

برای استفاده از قابلیت‌های تحلیلی پیشرفته‌تر:

```bash
npx wrangler d1 create ramznews-db
```

شناسه دیتابیس را در `wrangler.toml` قرار دهید و خط کامنت را حذف کنید:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ramznews-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # شناسه دریافتی را اینجا قرار دهید
```

سپس اسکیمای دیتابیس را اجرا کنید:

```bash
npx wrangler d1 execute ramznews-db --file=./db_schema.sql
```

## ۴. ثبت اطلاعات حساس با Secrets

برای امنیت بیشتر، توکن‌ها را به صورت Secret ثبت کنید:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# سپس مقدار توکن بات تلگرام خود را وارد کنید

npx wrangler secret put OPENROUTER_API_KEY
# سپس مقدار API Key خود را وارد کنید
```

## ۵. استقرار نهایی روی Cloudflare Workers

```bash
npx wrangler deploy
```

یا می‌توانید از اسکریپت تعریف شده در package.json استفاده کنید:

```bash
npm run publish
```

## ۶. بررسی وضعیت

پس از دیپلوی موفق، آدرس‌های زیر در دسترس خواهند بود:
- نسخه workers.dev: `https://ramznews-gen2.<your-subdomain>.workers.dev`
- وضعیت سلامت: `https://ramznews-gen2.<your-subdomain>.workers.dev/health`

## عیب‌یابی مشکلات شبکه

اگر با مشکلات اتصال به اینترنت مواجه هستید:

1. مطمئن شوید VPN یا پروکسی شما به درستی کار می‌کند
2. تنظیمات فایروال را بررسی کنید
3. از یک DNS جایگزین استفاده کنید
4. اگر پشت پروکسی هستید، متغیرهای محیطی HTTP_PROXY و HTTPS_PROXY را تنظیم کنید:

```bash
$env:HTTP_PROXY="http://proxy.example.com:8080"
$env:HTTPS_PROXY="http://proxy.example.com:8080"
``` 