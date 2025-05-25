# ربات RSS به تلگرام

ربات خودکار برای دریافت فیدهای RSS و ارسال پست‌های با کیفیت به کانال تلگرام. این ربات اخبار سیاسی، اقتصادی و رمزارزی را از منابع مختلف جمع‌آوری می‌کند و پس از فیلتر کردن، پست‌های مرتبط را به کانال تلگرام ارسال می‌کند.

## ویژگی‌ها

- دریافت خودکار از چندین منبع RSS
- فیلتر کردن محتوای تکراری و کم‌کیفیت
- حذف محتوای نامرتبط با استفاده از الگوریتم‌های پیشرفته
- اولویت‌بندی هوشمند اخبار فوری و مهم
- استخراج خودکار هشتگ‌های مرتبط
- ذخیره‌سازی پست‌های ارسال شده در KV Storage برای جلوگیری از ارسال مجدد
- فرمت‌بندی زیبا برای پست‌های تلگرام

## نصب و راه‌اندازی

### پیش‌نیازها

- حساب Cloudflare
- توکن ربات تلگرام
- نام کاربری کانال تلگرام

### دیپلوی

روش‌های مختلف دیپلوی:

1. **دیپلوی خودکار با Git (روش توصیه شده)**:
   - پروژه را به یک مخزن GitHub یا GitLab پوش کنید
   - پروژه را به Cloudflare Pages متصل کنید
   - هر بار تغییرات را پوش کنید، به‌طور خودکار دیپلوی می‌شود
   
   برای جزئیات بیشتر به [DEPLOYMENT.md](./DEPLOYMENT.md) مراجعه کنید.

2. **دیپلوی دستی با Wrangler CLI**:
   ```bash
   npm install -g wrangler
   wrangler login
   wrangler publish
   ```

## پیکربندی

تنظیمات اصلی در فایل `src/index.js`:

```javascript
// Configuration
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN";
const CHANNEL_USERNAME = "@your_channel";
const MAX_SAVED_MESSAGES = 1000;
const DELAY_BETWEEN_POSTS = 10000; // milliseconds
const STORAGE_TTL_DAYS = 60;
```

همچنین می‌توانید منابع RSS را در آرایه `RSS_FEEDS` تنظیم کنید.

## تست

برای تست ربات قبل از دیپلوی:

```bash
wrangler dev
```

یا برای اجرای یکباره:

```bash
node run-once.js
```

## نگهداری

- لاگ‌ها و وضعیت اجرا را در داشبورد Cloudflare بررسی کنید
- برای تست وضعیت ربات، به آدرس `https://your-worker.workers.dev/status` مراجعه کنید
- برای اجرای دستی، به آدرس `https://your-worker.workers.dev/manual-run` مراجعه کنید

## راهنمای عیب‌یابی

موارد رایج خطا:
- مشکل در دسترسی به API تلگرام
- تنظیم نادرست KV Storage
- مشکل در دسترسی به فیدهای RSS
- خطاهای فرمت‌بندی محتوا

برای اطلاعات بیشتر به [DEPLOYMENT.md](./DEPLOYMENT.md) مراجعه کنید.

## News Sources

The bot currently aggregates news from:

### General News (High Priority)
- BBC Persian
- DW Persian
- Euronews Persian

### Crypto News (High Priority)
- Ramzarz News
- Arz Digital
- Nobitex Mag
- Crypto Asriran
- And more...

### Financial News (Medium Priority)
- Tejarat News

## License

MIT

## Credits

Built by Ramz News Team. 