import { supabase } from '@/integrations/supabase/client';

export async function uploadNewsImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  
  const { error } = await supabase.storage.from('news-images').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('news-images').getPublicUrl(fileName);
  return data.publicUrl;
}
