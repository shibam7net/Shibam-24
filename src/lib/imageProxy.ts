/**
 * Converts an external image URL to use the image proxy edge function.
 * This bypasses hotlink protection and CORS issues.
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Don't proxy local/storage URLs or data URIs
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.includes('supabase.co/storage')
  ) {
    return url;
  }

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (!projectId) return url;

  return `https://${projectId}.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}
