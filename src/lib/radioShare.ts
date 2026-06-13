import type { RadioStation } from '@/data/radioStations';
import { absoluteSiteUrl } from '@/lib/site';

export function stationShareUrl(station: RadioStation): string {
  return absoluteSiteUrl(`/?station=${station.id}`);
}

export function stationShareText(station: RadioStation): string {
  return `تعال واستمتع بالبث المباشر لإذاعة ${station.name} 🎧`;
}

export async function nativeShareStation(station: RadioStation): Promise<boolean> {
  const url = stationShareUrl(station);
  const text = stationShareText(station);
  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: station.name, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
