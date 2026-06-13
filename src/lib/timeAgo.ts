/**
 * Smart Arabic/English relative time formatting
 */
export function getSmartTimeAgo(dateStr: string, isArabic: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (isArabic) {
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (mins < 120) return 'منذ ساعة';
    if (mins < 180) return 'منذ ساعتين';
    if (mins < 1440) return `منذ ${hours} ساعات`;
    if (mins < 2880) return 'منذ يوم';
    if (mins < 4320) return 'منذ يومين';
    if (days < 30) return `منذ ${days} أيام`;
    return new Date(dateStr).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
  } else {
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 120) return '1h ago';
    if (hours < 24) return `${hours}h ago`;
    if (days < 2) return '1d ago';
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
