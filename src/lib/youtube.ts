export function getYouTubeThumbnail(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    let videoId = '';
    if (host === 'youtu.be') videoId = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      videoId = /^\/(shorts|live|embed)\//.test(url.pathname)
        ? url.pathname.split('/')[2]
        : url.searchParams.get('v') || '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : null;
  } catch { return null; }
}
