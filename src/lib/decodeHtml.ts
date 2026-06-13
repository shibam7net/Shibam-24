const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;

export function decodeHtml(text: string | null | undefined): string {
  if (!text) return '';
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

const VIDEO_URL_RE = /https?:\/\/[^\s"'<>]+\.(?:mp4|webm|m3u8|mov)(?:\?[^\s"'<>]*)?/i;
const BARE_VIDEO_URL_RE = /https?:\/\/[^\s"'<>]+\.(?:mp4|webm|m3u8|mov)(?:\?[^\s"'<>]*)?/gi;

function cleanMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return decodeHtml(url).trim().replace(/["'<>]+$/g, '').replace(/&amp;/g, '&');
}

function readAttr(fragment: string, attr: string): string | undefined {
  const match = fragment.match(new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`, 'i'));
  return cleanMediaUrl(match?.[1] || match?.[2] || match?.[3]);
}

function removeMediaMarkup(text: string): string {
  let value = text.replace(/<video\b[\s\S]*?<\/video>/gi, '');
  for (const tag of ['video', 'source', 'img']) {
    const re = new RegExp(`<${tag}\\b`, 'ig');
    let match: RegExpExecArray | null;
    while ((match = re.exec(value))) {
      const start = match.index;
      const nextGt = value.indexOf('>', start);
      const nextLine = value.slice(start).search(/[\r\n]/);
      const lineEnd = nextLine >= 0 ? start + nextLine : -1;
      let end = nextGt >= 0 ? nextGt + 1 : -1;
      if (lineEnd >= 0 && (end < 0 || lineEnd < end)) end = lineEnd;
      if (end < 0) {
        const fragment = value.slice(start, start + 2000);
        const attrMatches = [...fragment.matchAll(/\b[a-z:-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi)];
        end = attrMatches.length ? start + attrMatches[attrMatches.length - 1].index! + attrMatches[attrMatches.length - 1][0].length : value.length;
      }
      value = value.slice(0, start) + value.slice(end);
      re.lastIndex = start;
    }
  }
  return value.replace(BARE_VIDEO_URL_RE, '');
}

/** Strip all HTML tags and return plain text */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return '';
  return removeMediaMarkup(decodeHtml(text))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>\n\r]*(?:>|(?=\n|\r)|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/#\S+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Clean title: decode entities + strip ANY html/media markup */
export function cleanTitle(text: string | null | undefined): string {
  if (!text) return '';
  return stripHtml(decodeHtml(text));
}

/** Extract first video URL + poster + image from raw HTML */
export function extractMedia(html: string): { videoUrl?: string; poster?: string; imageUrl?: string } {
  if (!html) return {};
  const result: { videoUrl?: string; poster?: string; imageUrl?: string } = {};
  const decoded = decodeHtml(html);

  const mediaTag = decoded.match(/<(?:video|source)\b[\s\S]{0,2500}?(?:>|(?=\n|\r)|$)/i)?.[0] || decoded;
  const tagSrc = readAttr(mediaTag, 'src');
  if (tagSrc && VIDEO_URL_RE.test(tagSrc)) result.videoUrl = tagSrc;
  result.poster = readAttr(mediaTag, 'poster');

  const imgTag = decoded.match(/<img\b[\s\S]{0,2000}?(?:>|(?=\n|\r)|$)/i)?.[0];
  result.imageUrl = readAttr(imgTag || '', 'src');

  if (!result.videoUrl) {
    const bare = decoded.match(VIDEO_URL_RE);
    if (bare) result.videoUrl = cleanMediaUrl(bare[0]);
  }

  return result;
}
