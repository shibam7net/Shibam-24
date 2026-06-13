
CREATE OR REPLACE FUNCTION public.recategorize_articles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec RECORD;
  src_cat text;
  title_l text;
  sum_l text;
  new_cat text;
  best_cat text;
  best_score int;
  updated_count int := 0;

  -- helper macro replaced by inline calc
  s_markets int; s_sports int; s_tech int; s_health int; s_art int; s_culture int;
  s_articles int; s_local int; s_econ int; s_politics int;
BEGIN
  FOR rec IN
    SELECT a.id, a.title, a.summary, a.category, a.section, s.assigned_category AS src_cat
    FROM articles a
    LEFT JOIN sources s ON s.id = a.source_id
  LOOP
    -- Source override wins
    IF rec.src_cat IS NOT NULL AND length(trim(rec.src_cat)) > 0 THEN
      IF rec.src_cat IS DISTINCT FROM rec.category THEN
        UPDATE articles SET category = rec.src_cat WHERE id = rec.id;
        updated_count := updated_count + 1;
      END IF;
      CONTINUE;
    END IF;

    title_l := lower(coalesce(rec.title, ''));
    sum_l   := lower(coalesce(rec.summary, ''));

    IF rec.section = 'arabic' THEN
      -- score per category: title*3 + summary*1
      s_markets := (CASE WHEN title_l ~ '(سعر(\s+ال)?(صرف|الذهب|النفط|البترول)|الذهب|الفضة|البترول|النفط|الدولار|اليورو|الريال|بورصة|تداول|سوق المال|عملات|بتكوين|كريبتو|فوركس|أسهم)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(سعر(\s+ال)?(صرف|الذهب|النفط|البترول)|الذهب|الفضة|البترول|النفط|الدولار|اليورو|الريال|بورصة|تداول|سوق المال|عملات|بتكوين|كريبتو|فوركس|أسهم)' THEN 1 ELSE 0 END);
      s_sports  := (CASE WHEN title_l ~ '(كرة(\s+القدم|\s+السلة|\s+اليد)?|مباراة|بطولة|الدوري|هدف|لاعب|منتخب|مدرب|ملعب|كأس|أولمبي|فيفا|تنس|سباق|ماراثون|سباحة|ملاكمة|الهلال|النصر|الاتحاد|الأهلي|الزمالك|ريال مدريد|برشلونة|ليفربول|مانشستر|ميسي|رونالدو|مبابي|محمد صلاح|بنزيما|نيمار|تشامبيونزليج)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(كرة(\s+القدم|\s+السلة|\s+اليد)?|مباراة|بطولة|الدوري|هدف|لاعب|منتخب|مدرب|ملعب|كأس|أولمبي|فيفا|تنس|سباق|ماراثون|سباحة|ملاكمة|الهلال|النصر|الاتحاد|الأهلي|الزمالك|ريال مدريد|برشلونة|ليفربول|مانشستر|ميسي|رونالدو|مبابي|محمد صلاح|بنزيما|نيمار|تشامبيونزليج)' THEN 1 ELSE 0 END);
      s_tech    := (CASE WHEN title_l ~ '(تكنولوج|الذكاء الاصطناعي|ذكاء اصطناعي|تقنية|الإنترنت|آيفون|سامسونج|أندرويد|تطبيق|برمجة|روبوت|ميتافيرس|بلوكتشين|google|apple|microsoft|openai|chatgpt|فيسبوك|تويتر|تيك توك|يوتيوب|إنستغرام|واتساب)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(تكنولوج|الذكاء الاصطناعي|ذكاء اصطناعي|تقنية|الإنترنت|آيفون|سامسونج|أندرويد|تطبيق|برمجة|روبوت|ميتافيرس|بلوكتشين|google|apple|microsoft|openai|chatgpt|فيسبوك|تويتر|تيك توك|يوتيوب|إنستغرام|واتساب)' THEN 1 ELSE 0 END);
      s_health  := (CASE WHEN title_l ~ '(صحة|طب|طبي|مرض|علاج|دواء|فيروس|لقاح|مستشفى|صيدلية|تغذية|حمية|سمنة|سكري|ضغط الدم|سرطان|قلب|كبد|كلى|عملية جراحية|طبيب|ممرض|الصحة النفسية|اكتئاب|وباء|جائحة|كورونا|كوفيد)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(صحة|طب|طبي|مرض|علاج|دواء|فيروس|لقاح|مستشفى|صيدلية|تغذية|حمية|سمنة|سكري|ضغط الدم|سرطان|قلب|كبد|كلى|عملية جراحية|طبيب|ممرض|الصحة النفسية|اكتئاب|وباء|جائحة|كورونا|كوفيد)' THEN 1 ELSE 0 END);
      s_art     := (CASE WHEN title_l ~ '(سينما|مسرح|موسيقى|فيلم|أفلام|ممثل|ممثلة|مهرجان|حفل|أغنية|ألبوم|مسلسل|دراما|نجم|نجمة|فنان|فنانة|مخرج|إخراج|كليب|سينمائي|درامي)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(سينما|مسرح|موسيقى|فيلم|أفلام|ممثل|ممثلة|مهرجان|حفل|أغنية|ألبوم|مسلسل|دراما|نجم|نجمة|فنان|فنانة|مخرج|إخراج|كليب|سينمائي|درامي)' THEN 1 ELSE 0 END);
      s_culture := (CASE WHEN title_l ~ '(أدب|كتاب|شعر|رواية|روائي|مكتبة|معرض كتاب|تراث|متحف|أثر(ي|ية)?|تاريخ|حضارة|اللغة العربية|الخط العربي|مثقف|ثقاف)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(أدب|كتاب|شعر|رواية|روائي|مكتبة|معرض كتاب|تراث|متحف|أثر(ي|ية)?|تاريخ|حضارة|اللغة العربية|الخط العربي|مثقف|ثقاف)' THEN 1 ELSE 0 END);
      s_articles:= (CASE WHEN title_l ~ '(مقال|مقالة|رأي|تحليل|تعليق|افتتاحية|عمود|قراءة في|وجهة نظر)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(مقال|مقالة|رأي|تحليل|تعليق|افتتاحية|عمود|قراءة في|وجهة نظر)' THEN 1 ELSE 0 END);
      s_local   := (CASE WHEN title_l ~ '(اليمن|صنعاء|عدن|حضرموت|تعز|إب|مأرب|أبين|شبوة|لحج|الضالع|البيضاء|حجة|صعدة|عمران|ذمار|المهرة|سقطرى|ريمة|المكلا|سيئون|شبام|محافظ|بلدية|محلي)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(اليمن|صنعاء|عدن|حضرموت|تعز|إب|مأرب|أبين|شبوة|لحج|الضالع|البيضاء|حجة|صعدة|عمران|ذمار|المهرة|سقطرى|ريمة|المكلا|سيئون|شبام|محافظ|بلدية|محلي)' THEN 1 ELSE 0 END);
      s_econ    := (CASE WHEN title_l ~ '(اقتصاد|مالي|تجارة|بنك|استثمار|ميزانية|ضريبة|تضخم|الناتج المحلي|صادرات|واردات|شركة|أعمال|مشروع|تنمية|فقر|بطالة|قروض|تمويل|صندوق النقد|البنك الدولي)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(اقتصاد|مالي|تجارة|بنك|استثمار|ميزانية|ضريبة|تضخم|الناتج المحلي|صادرات|واردات|شركة|أعمال|مشروع|تنمية|فقر|بطالة|قروض|تمويل|صندوق النقد|البنك الدولي)' THEN 1 ELSE 0 END);
      s_politics:= (CASE WHEN title_l ~ '(سياس|رئيس|الحكومة|البرلمان|انتخابات|وزير|دبلوماس|سفير|مجلس(\s+الأمن|\s+الوزراء|\s+النواب)?|قمة|حزب|معارضة|سلطة|نظام|ترامب|بوتين|بايدن|ماكرون|نتنياهو|أردوغان|الحرب|عسكر|جيش|قصف|غارة|صاروخ|دفاع|هجوم|اشتباك|معارك|مقاتل|قوات|تحالف|مفاوضات|اتفاق|هدنة|سلام|أزمة|توتر|إرهاب|داعش|طالبان|حماس|حزب الله|إيران|إسرائيل|فلسطين|أوكرانيا|روسيا|سوريا|لبنان|العراق|ليبيا|السودان|ناتو|الأمم المتحدة|غزة|الضفة|القدس)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(سياس|رئيس|الحكومة|البرلمان|انتخابات|وزير|دبلوماس|سفير|مجلس(\s+الأمن|\s+الوزراء|\s+النواب)?|قمة|حزب|معارضة|سلطة|نظام|ترامب|بوتين|بايدن|ماكرون|نتنياهو|أردوغان|الحرب|عسكر|جيش|قصف|غارة|صاروخ|دفاع|هجوم|اشتباك|معارك|مقاتل|قوات|تحالف|مفاوضات|اتفاق|هدنة|سلام|أزمة|توتر|إرهاب|داعش|طالبان|حماس|حزب الله|إيران|إسرائيل|فلسطين|أوكرانيا|روسيا|سوريا|لبنان|العراق|ليبيا|السودان|ناتو|الأمم المتحدة|غزة|الضفة|القدس)' THEN 1 ELSE 0 END);

      best_score := 0; best_cat := NULL;
      IF s_markets  > best_score THEN best_score := s_markets;  best_cat := 'عملات وأسعار'; END IF;
      IF s_sports   > best_score THEN best_score := s_sports;   best_cat := 'رياضة'; END IF;
      IF s_tech     > best_score THEN best_score := s_tech;     best_cat := 'تكنولوجيا'; END IF;
      IF s_health   > best_score THEN best_score := s_health;   best_cat := 'صحة'; END IF;
      IF s_art      > best_score THEN best_score := s_art;      best_cat := 'فن'; END IF;
      IF s_culture  > best_score THEN best_score := s_culture;  best_cat := 'ثقافة'; END IF;
      IF s_articles > best_score THEN best_score := s_articles; best_cat := 'مقالات'; END IF;
      IF s_local    > best_score THEN best_score := s_local;    best_cat := 'أخبار محلية'; END IF;
      IF s_econ     > best_score THEN best_score := s_econ;     best_cat := 'اقتصاد'; END IF;
      IF s_politics > best_score THEN best_score := s_politics; best_cat := 'سياسة'; END IF;
      new_cat := COALESCE(best_cat, 'أخبار');

    ELSE
      s_markets := (CASE WHEN title_l ~ '(currency|exchange rate|gold price|silver|crude|forex|crypto|bitcoin|ethereum|stock market|nasdaq|dow jones|s&p 500|wall street|bonds?|treasury yield|commodit)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(currency|exchange rate|gold price|silver|crude|forex|crypto|bitcoin|ethereum|stock market|nasdaq|dow jones|s&p 500|wall street|bonds?|treasury yield|commodit)' THEN 1 ELSE 0 END);
      s_sports  := (CASE WHEN title_l ~ '(football|soccer|basketball|tennis|olympic|athlete|goal|league|champion|coach|stadium|fifa|uefa|nba|nfl|mlb|nhl|premier league|la liga|bundesliga|serie a|messi|ronaldo|salah|mbappe|cricket|rugby|boxing|wrestling|formula\s?1|grand prix)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(football|soccer|basketball|tennis|olympic|athlete|goal|league|champion|coach|stadium|fifa|uefa|nba|nfl|mlb|nhl|premier league|la liga|bundesliga|serie a|messi|ronaldo|salah|mbappe|cricket|rugby|boxing|wrestling|formula\s?1|grand prix)' THEN 1 ELSE 0 END);
      s_tech    := (CASE WHEN title_l ~ '(artificial intelligence|chatgpt|openai|google|apple|microsoft|meta|tesla|nvidia|software|smartphone|iphone|android|app store|cybersecurity|cyberattack|hacker|hacked|hacking|startup|silicon valley|blockchain|metaverse|robot|drone|saas|cloud comput)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(artificial intelligence|chatgpt|openai|google|apple|microsoft|meta|tesla|nvidia|software|smartphone|iphone|android|app store|cybersecurity|cyberattack|hacker|hacked|hacking|startup|silicon valley|blockchain|metaverse|robot|drone|saas|cloud comput)' THEN 1 ELSE 0 END);
      s_health  := (CASE WHEN title_l ~ '(health|medical|disease|treatment|virus|vaccin|drug|hospital|pharma|nutrition|diet|obesity|diabet|cancer|heart attack|stroke|liver|kidney|surgery|doctor|nurse|mental health|depression|pandemic|covid)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(health|medical|disease|treatment|virus|vaccin|drug|hospital|pharma|nutrition|diet|obesity|diabet|cancer|heart attack|stroke|liver|kidney|surgery|doctor|nurse|mental health|depression|pandemic|covid)' THEN 1 ELSE 0 END);
      s_art     := (CASE WHEN title_l ~ '(cinema|theater|theatre|music|film|movie|actor|actress|festival|concert|album|series|drama|director|hollywood|netflix|oscar|grammy|cannes)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(cinema|theater|theatre|music|film|movie|actor|actress|festival|concert|album|series|drama|director|hollywood|netflix|oscar|grammy|cannes)' THEN 1 ELSE 0 END);
      s_culture := (CASE WHEN title_l ~ '(book|literature|museum|heritage|history|historical|archaeolog|civiliz|poetry|novel|exhibition|gallery)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(book|literature|museum|heritage|history|historical|archaeolog|civiliz|poetry|novel|exhibition|gallery)' THEN 1 ELSE 0 END);
      s_articles:= (CASE WHEN title_l ~ '(opinion|analysis|editorial|commentary|column|op[\-\s]?ed|perspective)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(opinion|analysis|editorial|commentary|column|op[\-\s]?ed|perspective)' THEN 1 ELSE 0 END);
      s_local   := (CASE WHEN title_l ~ '(city council|statewide|county|municipal|township|community|neighborhood|mayor|sheriff)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(city council|statewide|county|municipal|township|community|neighborhood|mayor|sheriff)' THEN 1 ELSE 0 END);
      s_econ    := (CASE WHEN title_l ~ '(econom|financ|trade deal|banking|dollar|euro|inflation|gdp|export|import|business|investor|investment|tax|debt|recession|earnings|revenue|profit|imf|world bank|federal reserve)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(econom|financ|trade deal|banking|dollar|euro|inflation|gdp|export|import|business|investor|investment|tax|debt|recession|earnings|revenue|profit|imf|world bank|federal reserve)' THEN 1 ELSE 0 END);
      s_politics:= (CASE WHEN title_l ~ '(politic|president|government|parliament|election|minister|senate|congress|trump|putin|biden|macron|netanyahu|erdogan|xi jinping|war|military|army|airstrike|missile|attack|bomb|troops|coalition|nato|cease.?fire|peace deal|conflict|crisis|terror|hamas|hezbollah|iran|israel|palest|ukrain|russia|syria|lebanon|iraq|sudan|gaza|west bank|united nations|security council|diplomat|embassy|sanction)' THEN 3 ELSE 0 END)
                 + (CASE WHEN sum_l   ~ '(politic|president|government|parliament|election|minister|senate|congress|trump|putin|biden|macron|netanyahu|erdogan|xi jinping|war|military|army|airstrike|missile|attack|bomb|troops|coalition|nato|cease.?fire|peace deal|conflict|crisis|terror|hamas|hezbollah|iran|israel|palest|ukrain|russia|syria|lebanon|iraq|sudan|gaza|west bank|united nations|security council|diplomat|embassy|sanction)' THEN 1 ELSE 0 END);

      best_score := 0; best_cat := NULL;
      IF s_markets  > best_score THEN best_score := s_markets;  best_cat := 'Markets'; END IF;
      IF s_sports   > best_score THEN best_score := s_sports;   best_cat := 'Sports'; END IF;
      IF s_tech     > best_score THEN best_score := s_tech;     best_cat := 'Technology'; END IF;
      IF s_health   > best_score THEN best_score := s_health;   best_cat := 'Health'; END IF;
      IF s_art      > best_score THEN best_score := s_art;      best_cat := 'Art'; END IF;
      IF s_culture  > best_score THEN best_score := s_culture;  best_cat := 'Culture'; END IF;
      IF s_articles > best_score THEN best_score := s_articles; best_cat := 'Articles'; END IF;
      IF s_local    > best_score THEN best_score := s_local;    best_cat := 'Local News'; END IF;
      IF s_econ     > best_score THEN best_score := s_econ;     best_cat := 'Economy'; END IF;
      IF s_politics > best_score THEN best_score := s_politics; best_cat := 'Politics'; END IF;
      new_cat := COALESCE(best_cat, 'News');
    END IF;

    IF new_cat IS DISTINCT FROM rec.category THEN
      UPDATE articles SET category = new_cat WHERE id = rec.id;
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN updated_count;
END;
$function$;

-- Run immediately to fix existing articles
SELECT public.recategorize_articles();
