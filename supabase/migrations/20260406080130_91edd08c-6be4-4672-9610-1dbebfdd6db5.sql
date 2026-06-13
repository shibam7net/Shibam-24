
CREATE OR REPLACE FUNCTION public.recategorize_articles()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  new_cat text;
  lower_text text;
  updated_count int := 0;
BEGIN
  FOR rec IN SELECT id, title, summary, section FROM articles LOOP
    lower_text := lower(rec.title || ' ' || coalesce(rec.summary, ''));
    
    IF rec.section = 'arabic' THEN
      IF lower_text ~ '(محل|يمن|صنعاء|عدن|حضرموت|تعز|إب|مأرب|محافظ|أبين|شبوة|لحج|الضالع|البيضاء|حجة|صعدة|عمران|ذمار|المهرة|سقطرى|ريمة|المكلا)' THEN
        new_cat := 'أخبار محلية';
      ELSIF lower_text ~ '(سياس|رئيس|حكوم|برلمان|انتخاب|وزير|دبلوماس|سفير|مجلس|قمة|مؤتمر|حزب|معارض|سلطة|نظام|ترامب|بوتين|بايدن|أوباما|ماكرون|حرب|عسكر|جيش|قصف|غارة|صاروخ|دفاع|هجوم|اشتباك|معارك|مقاتل|قوات|تحالف|مفاوض|اتفاق|هدنة|سلام|صراع|أزمة|توتر|إرهاب|داعش|طالبان|حماس|حزب الله|إيران|إسرائيل|فلسطين|أوكرانيا|روسيا|سوريا|لبنان|عراق|ليبيا|سودان|ناتو|أمم متحدة|مجلس الأمن)' THEN
        new_cat := 'سياسة';
      ELSIF lower_text ~ '(عمل|سعر|صرف|ريال|دولار|ذهب|فضة|بترول|نفط|بورصة|فوركس|بتكوين|عمله|أسعار|تداول|سوق مال)' THEN
        new_cat := 'عملات وأسعار';
      ELSIF lower_text ~ '(اقتصاد|مال|تجار|بنك|استثمار|ميزاني|ضريب|تضخم|ناتج|صادرات|واردات|شركة|أعمال|مشروع|تنمية|فقر|بطالة)' THEN
        new_cat := 'اقتصاد';
      ELSIF lower_text ~ '(رياض|كرة|لاعب|مباراة|بطولة|فريق|هدف|دوري|منتخب|مدرب|ملعب|تدريب|كأس|أولمبي|فيفا|تنس|سباق|ماراثون|سباحة|ملاكمة|مصارعة|الهلال|النصر|الاتحاد|الأهلي|ريال مدريد|برشلونة|ليفربول|ميسي|رونالدو|مبابي|صلاح|بنزيما|نيمار)' THEN
        new_cat := 'رياضة';
      ELSIF lower_text ~ '(تكنولوج|ذكاء|تقن|إنترنت|هاتف|رقم|برمج|تطبيق|روبوت|فضاء|قمر|مركبة|ناسا|صاروخ فضائي|مدار|كوكب|نجم|مذنب|شمس|فلك|مسبار)' THEN
        new_cat := 'تكنولوجيا';
      ELSIF lower_text ~ '(صح|طب|مرض|علاج|فيروس|لقاح|دواء|مستشفى|صيدل|تغذية|حمية|سمنة|سكر|ضغط|سرطان|قلب|كبد|كلى|عملية جراح|طبيب|ممرض|صحة نفس|اكتئاب|زيت)' THEN
        new_cat := 'صحة';
      ELSIF lower_text ~ '(فن|سينما|مسرح|موسيق|فيلم|ممثل|مهرجان|غنا|أغنية|ألبوم|مسلسل|دراما|حفل|نجم|فنان|مخرج|إخراج)' THEN
        new_cat := 'فن';
      ELSIF lower_text ~ '(ثقاف|أدب|كتاب|شعر|رواية|مكتب|معرض|تراث|متحف|أثر|تاريخ|حضار|لغة عربية|خط عربي)' THEN
        new_cat := 'ثقافة';
      ELSIF lower_text ~ '(مقال|رأي|تحليل|تعليق|افتتاحية|عمود)' THEN
        new_cat := 'مقالات';
      ELSE
        new_cat := 'أخبار';
      END IF;
    ELSE
      -- Global/English section
      IF lower_text ~ '(politi|president|government|parliament|elect|minister|senat|congress|trump|putin|biden|macron|war|military|army|strike|missile|attack|bomb|troops|coalition|nato|cease.?fire|peace|conflict|crisis|terror|hamas|hezbollah|iran|israel|palesti|ukrain|russia|syria|lebanon|iraq|sudan|united nations|security council)' THEN
        new_cat := 'Politics';
      ELSIF lower_text ~ '(currency|exchange|gold|silver|crude|forex|crypto|bitcoin|oil price|stock market)' THEN
        new_cat := 'Markets';
      ELSIF lower_text ~ '(econom|financ|market|trade|bank|dollar|inflat|gdp|export|import|business|invest|tax|debt|recession|company|startup)' THEN
        new_cat := 'Economy';
      ELSIF lower_text ~ '(sport|football|soccer|basketball|tennis|olympic|athlete|goal|league|champion|coach|stadium|fifa|match|player|team|cricket|rugby|boxing|wrestling|formula|nba|nfl|premier league|messi|ronaldo|salah)' THEN
        new_cat := 'Sports';
      ELSIF lower_text ~ '(tech|ai|artificial|comput|software|digital|cyber|robot|space|moon|mars|nasa|orbit|planet|star|comet|asteroid|satellite|spacecraft|rocket|astronaut)' THEN
        new_cat := 'Technology';
      ELSIF lower_text ~ '(health|medic|disease|treatment|virus|vaccin|drug|hospital|pharma|nutrition|diet|obes|diabet|cancer|heart|liver|kidney|surgery|doctor|nurse|mental health|depression)' THEN
        new_cat := 'Health';
      ELSIF lower_text ~ '(art|music|cinema|theater|film|entertain|movie|actor|actress|festival|concert|album|series|drama|director)' THEN
        new_cat := 'Art';
      ELSIF lower_text ~ '(cultur|book|literat|museum|heritage|histor|archaeolog|civiliz|language|poetry|novel)' THEN
        new_cat := 'Culture';
      ELSIF lower_text ~ '(opinion|analysis|editorial|commentary|column|op.ed)' THEN
        new_cat := 'Articles';
      ELSIF lower_text ~ '(local|city|state|county|municipal|town|community|neighborhood)' THEN
        new_cat := 'Local News';
      ELSE
        new_cat := 'News';
      END IF;
    END IF;

    IF new_cat IS DISTINCT FROM rec.category THEN
      UPDATE articles SET category = new_cat WHERE id = rec.id;
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;
