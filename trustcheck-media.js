/* Clasifica fotos, videos y enlaces de YouTube/Vimeo de TRUST CHECK. */
(function (global) {
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function youtubeId(input) {
    try {
      const u = new URL(String(input || '').trim());
      const host = u.hostname.replace(/^www\./, '');
      const idOk = (id) => /^[A-Za-z0-9_-]{11}$/.test(id || '');
      if (host === 'youtu.be') {
        const id = (u.pathname.split('/').filter(Boolean)[0] || '').split('?')[0];
        return idOk(id) ? id : '';
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
        const fromQuery = u.searchParams.get('v');
        if (idOk(fromQuery)) return fromQuery;
        const parts = u.pathname.split('/').filter(Boolean);
        const markers = ['embed', 'shorts', 'live', 'v'];
        const i = parts.findIndex((p) => markers.includes(p));
        if (i >= 0 && idOk(parts[i + 1])) return parts[i + 1];
      }
    } catch (_) { /* enlace inválido */ }
    return '';
  }

  function vimeoId(input) {
    try {
      const u = new URL(String(input || '').trim());
      const host = u.hostname.replace(/^www\./, '');
      if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return '';
      const parts = u.pathname.split('/').filter(Boolean);
      return [...parts].reverse().find((p) => /^\d{6,12}$/.test(p)) || '';
    } catch (_) {
      return '';
    }
  }

  function safeHttpUrl(input) {
    try {
      const u = new URL(String(input || '').trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.href;
    } catch (_) {
      return '';
    }
  }

  function isUnsupportedHost(input) {
    try {
      const host = new URL(String(input || '').trim()).hostname.replace(/^www\./, '');
      const blocked = ['instagram.com', 'facebook.com', 'fb.watch', 'tiktok.com', 'vm.tiktok.com'];
      return blocked.some((h) => host === h || host.endsWith('.' + h));
    } catch (_) {
      return false;
    }
  }

  function isDirectVideo(url) {
    return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url || '');
  }

  function normalizeStoryMedia(raw) {
    let list = raw;
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch (_) { list = []; }
    }
    if (!Array.isArray(list)) return [];

    const out = [];
    list.forEach((item) => {
      const original = String((item && (item.url || item.src)) || '').trim();
      if (!original || isUnsupportedHost(original)) return;
      const yt = youtubeId(original);
      if (yt) {
        out.push({ type: 'youtube', url: original, id: yt });
        return;
      }
      const vm = vimeoId(original);
      if (vm) {
        out.push({ type: 'vimeo', url: original, id: vm });
        return;
      }
      const safe = safeHttpUrl(original);
      if (!safe) return;
      const declared = String((item && item.type) || '').toLowerCase();
      const video = declared === 'video' || isDirectVideo(safe);
      out.push({ type: video ? 'video' : 'image', url: safe });
    });
    return out;
  }

  global.TrustCheckMedia = {
    escapeHtml,
    youtubeId,
    vimeoId,
    safeHttpUrl,
    isUnsupportedHost,
    isDirectVideo,
    normalizeStoryMedia,
  };
})(window);
