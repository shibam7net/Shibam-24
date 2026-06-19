# Shibam 24

مشروع واجهة إخبارية مبني باستخدام **Vite + React + TypeScript + Tailwind CSS** مع تكامل **Supabase** لجلب الأخبار، إدارة المحتوى، والتحليلات.

## التشغيل محليًا

```bash
npm install
npm run dev
```

## البناء والاختبار

```bash
npm test
npm run build
```

## النشر

تم تجهيز المشروع للنشر التلقائي على **GitHub Pages** عبر GitHub Actions.

## المتطلبات الخارجية

- مشروع Supabase فعّال مع المتغيرات الموجودة في `.env`
- أي أسرار خاصة بوظائف Supabase Edge يجب أن تبقى مضبوطة داخل Supabase نفسها
- لتفعيل أدوات الذكاء الاصطناعي في لوحة التحكم استخدم سر `OPENROUTER_API_KEY` داخل Supabase Edge Functions secrets
- يمكن تخصيص النموذج عبر السر `AI_MODEL`، والافتراضي مع OpenRouter هو `google/gemini-2.5-flash`
