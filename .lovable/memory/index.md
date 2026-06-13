Design system, auth, and architecture constraints for Shibam Press news platform.

Admin credentials: shib / 777492635. Auth uses Supabase with email shib@shibampress.local. Signups disabled, auto-confirm enabled.
Database tables: sources (cascade delete to articles), articles (has slug column for SEO URLs). Storage bucket: news-images.
Section naming: Arabic = عربي, Global = English.
Edge functions: fetch-news (RSS scraper), ai-article (generate/analyze), ai-optimize (rewrite/summarize/categorize/full optimize), cleanup-old-articles (7-day TTL), admin-seed, post-telegram, post-twitter.
Articles use slug-based URLs: /article/{slug}. Slug generated from title. Falls back to UUID if no slug.
AI system uses Lovable AI gateway (google/gemini-3-flash-preview). No external API keys needed.
Social publishing: Telegram bot token + channel ID stored as secrets. Twitter/X OAuth 1.0a keys stored as secrets. Both called via edge functions from admin "نشر وتوزيع" button.
