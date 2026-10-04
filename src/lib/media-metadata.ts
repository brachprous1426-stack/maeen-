import { PDFDocument } from 'pdf-lib';
import { getYouTubeThumbnail } from './youtube';

export function youtubeDuration(html: string, expectedId: string): number {
  const marker = /"videoDetails"\s*:\s*\{/.exec(html);
  if (!marker) throw new Error('تعذر قراءة بيانات الفيديو');
  const start = marker.index + marker[0].length - 1;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      const details = JSON.parse(html.slice(start, i + 1));
      const seconds = Number(details.lengthSeconds);
      if (details.videoId !== expectedId || details.isLive === true || !Number.isSafeInteger(seconds) || seconds <= 0) throw new Error('مدة الفيديو غير متاحة أو لا تطابق رابط المادة');
      return seconds;
    }
  }
  throw new Error('تعذر استخراج مدة المقطع من YouTube');
}

// Only trusted media providers are fetched server-side. Never fetch arbitrary admin input.
async function providerFetch(url: string, maxBytes: number, redirects = 0): Promise<Buffer> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['drive.google.com', 'drive.usercontent.google.com', 'www.youtube.com'].includes(parsed.hostname)) throw new Error('رابط المصدر غير مدعوم للاستخراج التلقائي');
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(45000), cache: 'no-store' });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 4 || !response.headers.get('location')) throw new Error('تعذر الوصول إلى المصدر');
    if (new URL(response.headers.get('location')!, url).hostname === 'accounts.google.com') throw new Error('يتطلب ملف Drive تسجيل الدخول؛ ارفع نسخة PDF لحساب صفحاتها أو استخدم رابطًا متاحًا للقراءة');
    return providerFetch(new URL(response.headers.get('location')!, url).href, maxBytes, redirects + 1);
  }
  if (!response.ok || Number(response.headers.get('content-length')) > maxBytes) throw new Error('المصدر غير متاح أو يتجاوز الحجم المسموح');
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!response.body) throw new Error('استجابة المصدر فارغة');
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) throw new Error('المصدر يتجاوز الحجم المسموح');
      chunks.push(value);
    }
  } finally { await reader.cancel(); reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function extractMediaMetadata(item: { type: string; mediaUrl: string }): Promise<{ pageCount: number } | { duration: string }> {
  if (item.type === 'BOOK') {
    const url = new URL(item.mediaUrl);
    const id = url.hostname === 'drive.google.com' ? (url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id')) : null;
    if (!id || !/^[\w-]+$/.test(id)) throw new Error('استخدم رابط ملف PDF من Google Drive');
    const bytes = await providerFetch(`https://drive.google.com/uc?export=download&id=${id}`, 100 * 1024 * 1024);
    if (!bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw new Error('الملف غير متاح كـ PDF؛ تحقق من صلاحية مشاركة الرابط');
    // Page-tree metadata is readable even when a PDF restricts editing/printing.
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    const pageCount = pdf.getPageCount();
    if (!pageCount) throw new Error('ملف PDF لا يحتوي صفحات');
    return { pageCount };
  }
  const thumbnail = getYouTubeThumbnail(item.mediaUrl);
  if (!thumbnail) throw new Error('استخدم رابط مقطع YouTube صالح');
  const id = thumbnail.split('/')[4];
  const html = (await providerFetch(`https://www.youtube.com/watch?v=${id}&hl=en`, 8 * 1024 * 1024)).toString('utf8');
  if (/"isLiveContent":true/.test(html) && /"isLive":true/.test(html)) throw new Error('البث ما زال مباشرًا');
  const seconds = youtubeDuration(html, id);
  return { duration: `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` };
}
