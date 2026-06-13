import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes on the articles table.
 * When any INSERT/UPDATE/DELETE happens, invalidates the articles cache
 * so the UI updates instantly for all connected users.
 */
export function useRealtimeArticles() {
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleChange = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['articles'] });
  }, [qc]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        handleChange
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [handleChange]);
}
