'use strict';

/* ============================================================
   A tiny, dependency-free viewer for a social data export.
   Everything happens in this tab. No network requests.
   ============================================================ */

/* ---------------- DOM helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function appendKids(node, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false || kid === true) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
}

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key === 'style') node.style.cssText = value;
      else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, value);
    }
  }
  appendKids(node, kids);
  return node;
}

function frag(...kids) {
  const f = document.createDocumentFragment();
  appendKids(f, kids);
  return f;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/* ---------------- icons ---------------- */
const S = (inner, fill = false) =>
  `<svg viewBox="0 0 24 24" ${fill
    ? 'fill="currentColor"'
    : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  }>${inner}</svg>`;

const ICONS = {
  home: S('<path d="M12 2.5 2.5 11h3V21h5v-6h3v6h5v-10h3L12 2.5z"/>', true),
  friends: S('<path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 13c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.7 0-1.1.1 1.3.9 2.1 2.1 2.1 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/>', true),
  chat: S('<path d="M21 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2v4l5-4h9a2 2 0 0 0 2-2V5z"/>', true),
  photos: S('<path d="M21 3H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8.5 7A1.5 1.5 0 1 1 7 8.5 1.5 1.5 0 0 1 8.5 7zM4 19l5-6 4 4.5 3-3.5 4 5H4z"/>', true),
  search: S('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  like: S('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
  comment: S('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  share: S('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
  globe: S('<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>'),
  back: S('<polyline points="15 18 9 12 15 6"/>'),
  close: S('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  send: S('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
  more: S('<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>', true),
  archive: S('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
  link: S('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  users: S('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  flag: S('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  shield: S('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  refresh: S('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
  calendar: S('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  pin: S('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  play: S('<polygon points="6 3 20 12 6 21 6 3"/>', true),
  image: S('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
  lock: S('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  chevronRight: S('<polyline points="9 18 15 12 9 6"/>'),
  smile: S('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'),
  bookmark: S('<path d="M19 21l-7-5-7 5V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  activity: S('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  info: S('<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
  sun: S('<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>'),
  moon: S('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'),
};

function icon(name, size = 20) {
  const span = el('span', { class: 'icon', 'aria-hidden': 'true', html: ICONS[name] || '' });
  span.style.width = size + 'px';
  span.style.height = size + 'px';
  return span;
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* private mode */ }
}

function currentLocale() {
  return state.lang === 'en' ? 'en' : 'zh-Hant';
}

function t(key, params = {}) {
  const table = globalThis.I18N || {};
  const lang = state.lang === 'en' ? 'en' : 'zh-Hant';
  let value = table[lang] ? table[lang][key] : undefined;
  if (value === undefined && table.en) value = table.en[key];
  if (value === undefined) return key;
  if (typeof value === 'function') return value(params);
  return String(value).replace(/\{(\w+)\}/g, (_, name) => params[name] == null ? '' : params[name]);
}

function applyStaticI18n() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  const search = document.querySelector('#search-input');
  if (search) {
    search.placeholder = t('topbar.searchPlaceholder');
    search.setAttribute('aria-label', t('topbar.searchPlaceholder'));
  }
  document.title = state.ready && state.profile
    ? t('app.profileTitle', { name: state.profile.name })
    : t('app.title');
}

function makeLangButton() {
  const toEnglish = state.lang === 'zh-Hant';
  const label = toEnglish ? t('topbar.switchToEnglish') : t('topbar.switchToChinese');
  return el('button', {
    class: 'tool-btn lang-tool',
    type: 'button',
    title: label,
    'aria-label': label,
    onclick: () => setLanguage(toEnglish ? 'en' : 'zh-Hant'),
  }, icon('globe', 17), el('span', { class: 'tool-label' }, toEnglish ? 'EN' : '繁'));
}

function makeThemeButton() {
  const toDark = state.theme !== 'dark';
  const label = toDark ? t('topbar.darkMode') : t('topbar.lightMode');
  return el('button', {
    class: 'tool-btn',
    type: 'button',
    title: label,
    'aria-label': label,
    onclick: () => setTheme(toDark ? 'dark' : 'light'),
  }, icon(toDark ? 'moon' : 'sun', 18));
}

function renderTools() {
  if (typeof document === 'undefined') return;
  for (const selector of ['#boot-tools', '#topbar-tools']) {
    const box = document.querySelector(selector);
    if (!box) continue;
    clear(box);
    box.append(makeLangButton(), makeThemeButton());
  }
}

function applyTheme() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = state.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#0f1115' : '#2563eb');
}

function setTheme(theme) {
  state.theme = theme;
  storageSet('bluepaper.theme', theme);
  applyTheme();
  renderTools();
}

function setLanguage(lang) {
  if (!globalThis.I18N || !globalThis.I18N[lang]) return;
  state.lang = lang;
  storageSet('bluepaper.lang', lang);
  document.documentElement.lang = lang;
  applyStaticI18n();
  renderTools();
  if (state.ready) {
    closeOverlay();
    render();
    document.title = t('app.profileTitle', { name: state.profile.name });
  }
}

/* ---------------- text recovery ----------------
   Social exports often encode UTF-8 as Latin-1 in JSON strings.
   "ã±ã«" -> "ケル". Re-decode only when the whole string is bytes. */
function fixText(value) {
  if (typeof value !== 'string' || !/[\u0080-\u00ff]/.test(value)) return value;
  const bytes = [];
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code > 255) return value;
    bytes.push(code);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  } catch (_) {
    return value;
  }
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
}

/* ---------------- zip reader ----------------
   Reads the central directory first, then only the entries we need.
   The file is never loaded whole, so large exports stay workable. */
class Zip {
  constructor(file) {
    this.file = file;
    this.entries = new Map();
    this._findCache = new Map();
  }

  async open() {
    if (!this.file || this.file.size < 22) throw new Error(t('error.zipInvalid'));
    const size = this.file.size;
    const tailSize = Math.min(size, 22 + 65535 + 64);
    const tail = new Uint8Array(await this.file.slice(size - tailSize, size).arrayBuffer());
    const view = new DataView(tail.buffer);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        const commentLength = view.getUint16(i + 20, true);
        if (i + 22 + commentLength <= tail.length) { eocd = i; break; }
      }
    }
    if (eocd < 0) throw new Error(t('error.zipInvalid'));

    let total = view.getUint16(eocd + 10, true);
    let cdSize = view.getUint32(eocd + 12, true);
    let cdOffset = view.getUint32(eocd + 16, true);

    // ZIP64: the standard end record uses sentinel values and a locator
    // points at a 64-bit end record. The rest of the reader is unchanged.
    if (total === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      let locator = eocd - 20;
      if (locator < 0 || view.getUint32(locator, true) !== 0x07064b50) {
        locator = -1;
        for (let i = eocd - 20; i >= Math.max(0, eocd - 512); i--) {
          if (view.getUint32(i, true) === 0x07064b50) { locator = i; break; }
        }
      }
      if (locator < 0) throw new Error(t('error.zip64Missing'));
      const recordOffset = this._safeNumber(view.getBigUint64(locator + 8, true));
      const record = new Uint8Array(await this.file.slice(recordOffset, recordOffset + 56).arrayBuffer());
      if (record.length < 56) throw new Error(t('error.zip64Damaged'));
      const rv = new DataView(record.buffer, record.byteOffset, record.byteLength);
      if (rv.getUint32(0, true) !== 0x06064b50) throw new Error(t('error.zip64Damaged'));
      total = this._safeNumber(rv.getBigUint64(32, true));
      cdSize = this._safeNumber(rv.getBigUint64(40, true));
      cdOffset = this._safeNumber(rv.getBigUint64(48, true));
    }
    if (!cdSize || !cdOffset) throw new Error(t('error.zipEmpty'));

    const cd = new Uint8Array(await this.file.slice(cdOffset, cdOffset + cdSize).arrayBuffer());
    const cv = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
    const decoder = new TextDecoder('utf-8');
    let p = 0;
    for (let i = 0; i < total; i++) {
      if (p + 46 > cd.length || cv.getUint32(p, true) !== 0x02014b50) {
        throw new Error(t('error.zipDamaged'));
      }
      const flags = cv.getUint16(p + 8, true);
      const method = cv.getUint16(p + 10, true);
      let compressed = cv.getUint32(p + 20, true);
      let uncompressed = cv.getUint32(p + 24, true);
      const nameLength = cv.getUint16(p + 28, true);
      const extraLength = cv.getUint16(p + 30, true);
      const commentLength = cv.getUint16(p + 32, true);
      let diskStart = cv.getUint16(p + 34, true);
      let localOffset = cv.getUint32(p + 42, true);

      const needsZip64 = compressed === 0xffffffff || uncompressed === 0xffffffff || localOffset === 0xffffffff || diskStart === 0xffff;
      if (needsZip64) {
        const extra = this._readZip64Extra(cv, p + 46 + nameLength, extraLength, {
          uncompressed: uncompressed === 0xffffffff,
          compressed: compressed === 0xffffffff,
          offset: localOffset === 0xffffffff,
          disk: diskStart === 0xffff,
        });
        if (!extra) throw new Error(t('error.zip64Info'));
        if (extra.uncompressed != null) uncompressed = extra.uncompressed;
        if (extra.compressed != null) compressed = extra.compressed;
        if (extra.localOffset != null) localOffset = extra.localOffset;
        if (extra.diskStart != null) diskStart = extra.diskStart;
      }
      if (diskStart !== 0) throw new Error(t('error.multiDisk'));

      const name = decoder.decode(cd.subarray(p + 46, p + 46 + nameLength)).replace(/\\/g, '/');
      this.entries.set(name, { name, flags, method, compressed, uncompressed, localOffset });
      p += 46 + nameLength + extraLength + commentLength;
    }
  }

  _safeNumber(value) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 0) {
      throw new Error(t('error.zipTooLarge'));
    }
    return number;
  }

  _readZip64Extra(view, start, length, needs) {
    const end = start + length;
    let p = start;
    while (p + 4 <= end) {
      const id = view.getUint16(p, true);
      const size = view.getUint16(p + 2, true);
      if (id === 0x0001) {
        let q = p + 4;
        const stop = q + size;
        const extra = {};
        if (needs.uncompressed) {
          if (q + 8 > stop) throw new Error(t('error.zip64Damaged'));
          extra.uncompressed = this._safeNumber(view.getBigUint64(q, true));
          q += 8;
        }
        if (needs.compressed) {
          if (q + 8 > stop) throw new Error(t('error.zip64Damaged'));
          extra.compressed = this._safeNumber(view.getBigUint64(q, true));
          q += 8;
        }
        if (needs.offset) {
          if (q + 8 > stop) throw new Error(t('error.zip64Damaged'));
          extra.localOffset = this._safeNumber(view.getBigUint64(q, true));
          q += 8;
        }
        if (needs.disk) {
          if (q + 4 > stop) throw new Error(t('error.zip64Damaged'));
          extra.diskStart = view.getUint32(q, true);
          q += 4;
        }
        return extra;
      }
      p += 4 + size;
    }
    return null;
  }

  find(path) {
    if (!path) return null;
    const wanted = path.replace(/\\/g, '/').replace(/^\.?\//, '');
    if (this._findCache.has(wanted)) return this._findCache.get(wanted);
    let found = this.entries.get(wanted) || null;
    if (!found) {
      const suffix = '/' + wanted;
      for (const [name, entry] of this.entries) {
        if (name.endsWith(suffix)) { found = entry; break; }
      }
    }
    this._findCache.set(wanted, found);
    return found;
  }

  async bytes(entry) {
    if (!entry) throw new Error(t('error.entryMissing'));
    if (entry.flags & 1) throw new Error(t('error.encrypted'));
    const head = new Uint8Array(await this.file.slice(entry.localOffset, entry.localOffset + 30).arrayBuffer());
    const hv = new DataView(head.buffer);
    if (hv.getUint32(0, true) !== 0x04034b50) throw new Error(t('error.zipDamaged'));
    const nameLength = hv.getUint16(26, true);
    const extraLength = hv.getUint16(28, true);
    const start = entry.localOffset + 30 + nameLength + extraLength;
    const raw = new Uint8Array(await this.file.slice(start, start + entry.compressed).arrayBuffer());
    if (entry.method === 0) return raw;
    if (entry.method !== 8) throw new Error(t('error.unsupportedCompression'));
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(t('error.noDecompress'));
    }
    const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async text(entry) {
    return new TextDecoder('utf-8').decode(await this.bytes(entry));
  }

  async json(entry) {
    const raw = await this.text(entry);
    return JSON.parse(raw, (_key, value) => (typeof value === 'string' ? fixText(value) : value));
  }
}

/* ---------------- formatting ---------------- */
const DAY_MS = 86400000;
const formatterCache = new Map();

function msOf(ts) {
  if (!ts) return 0;
  return ts > 1e12 ? ts : ts * 1000;
}

function dateFormatter(kind) {
  const key = currentLocale() + ':' + kind;
  if (!formatterCache.has(key)) {
    const options = kind === 'time'
      ? { hour: 'numeric', minute: '2-digit' }
      : kind === 'datetime'
        ? { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }
        : { year: 'numeric', month: 'long', day: 'numeric' };
    formatterCache.set(key, new Intl.DateTimeFormat(currentLocale(), options));
  }
  return formatterCache.get(key);
}

function formatDate(ts) {
  const d = new Date(msOf(ts));
  if (isNaN(d)) return '';
  return dateFormatter('date').format(d);
}

function formatDateTime(ts) {
  const d = new Date(msOf(ts));
  if (isNaN(d)) return '';
  return dateFormatter('datetime').format(d);
}

function formatTime(ts) {
  const d = new Date(msOf(ts));
  if (isNaN(d)) return '';
  return dateFormatter('time').format(d);
}

function relative(ts) {
  const ms = msOf(ts);
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 0) return formatDate(ms);
  if (diff < 60000) return t('time.justNow');
  if (diff < 3600000) return t('time.minutes', { n: Math.floor(diff / 60000) });
  if (diff < DAY_MS) return t('time.hours', { n: Math.floor(diff / 3600000) });
  if (diff < 7 * DAY_MS) return t('time.days', { n: Math.floor(diff / DAY_MS) });
  return formatDate(ms);
}

function shortRelative(ts) {
  const ms = msOf(ts);
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 0) return formatDate(ms);
  if (diff < DAY_MS) return formatTime(ms);
  if (diff < 7 * DAY_MS) return t('time.days', { n: Math.floor(diff / DAY_MS) });
  return new Intl.DateTimeFormat(currentLocale(), { year: '2-digit', month: 'numeric', day: 'numeric' }).format(new Date(ms));
}

function dayLabel(ts) {
  const ms = msOf(ts);
  const d = new Date(ms);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (that === today) return t('time.today');
  if (that === today - DAY_MS) return t('time.yesterday');
  return formatDate(ms);
}

function formatBirthday(birthday) {
  if (!birthday || !birthday.month || !birthday.day) return '';
  const options = { month: 'long', day: 'numeric', timeZone: 'UTC' };
  if (birthday.year) options.year = 'numeric';
  const date = new Date(Date.UTC(birthday.year || 2000, birthday.month - 1, birthday.day));
  return new Intl.DateTimeFormat(currentLocale(), options).format(date);
}

function albumLabel(name) {
  const key = { 'cover photos': 'albums.cover', 'mobile uploads': 'albums.mobile', 'profile pictures': 'albums.profile', videos: 'photos.videos' }[String(name || '').toLowerCase()];
  return key ? t(key) : name;
}

function hashString(str) {
  let h = 2166136261;
  for (const ch of String(str)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/* ---------------- media ---------------- */
const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', mp4: 'video/mp4', m4v: 'video/mp4',
  mov: 'video/quicktime', webm: 'video/webm', mp3: 'audio/mpeg', m4a: 'audio/mp4',
  ogg: 'audio/ogg', wav: 'audio/wav',
};

function extOf(uri) {
  const m = String(uri || '').toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return m ? m[1] : '';
}

function kindOf(uri) {
  const ext = extOf(uri);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image';
  if (['mp4', 'm4v', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'ogg', 'wav'].includes(ext)) return 'audio';
  return null;
}

const mediaUrls = new Map();
const resolvedMediaUrls = new Map();

function mediaUrl(uri) {
  if (!uri) return Promise.resolve(null);
  if (mediaUrls.has(uri)) return mediaUrls.get(uri);
  const promise = (async () => {
    const entry = state.zip && state.zip.find(uri);
    if (!entry) return null;
    const bytes = await state.zip.bytes(entry);
    return URL.createObjectURL(new Blob([bytes], { type: MIME[extOf(uri)] || 'application/octet-stream' }));
  })().catch((err) => {
    console.warn('Could not load media', uri, err);
    return null;
  });
  mediaUrls.set(uri, promise);
  promise.then((url) => { if (url) resolvedMediaUrls.set(uri, url); });
  return promise;
}

function setImg(img, uri) {
  const ready = resolvedMediaUrls.get(uri);
  if (ready) { img.src = ready; return; }
  mediaUrl(uri).then((url) => {
    if (url) img.src = url;
    else img.classList.add('missing');
  });
}

function avatar(name, size = 40, uri = null, extra = '') {
  const node = el('span', {
    class: 'avatar' + (extra ? ' ' + extra : ''),
    style: `width:${size}px;height:${size}px;font-size:${Math.max(10, size * 0.36)}px;background:${avatarColor(name)}`,
    'aria-hidden': 'true',
  });
  node.textContent = initials(name) || '?';
  if (uri) {
    mediaUrl(uri).then((url) => {
      if (!url) return;
      node.textContent = '';
      node.style.background = '#d8dde3';
      const img = el('img', { alt: '' });
      img.src = url;
      node.append(img);
    });
  }
  return node;
}

const AVATAR_COLORS = ['#2563eb', '#f7b928', '#e41e3f', '#42b72a', '#8a3ab9', '#f7793f', '#00a4a6', '#6c5ce7', '#c0392b', '#2d9cdb'];

function avatarColor(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name) {
  const clean = String(name || '').trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return [...clean].slice(0, 2).join('').toUpperCase();
}

function safeUrl(value) {
  try {
    const url = new URL(value, location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch (_) {
    return null;
  }
}

function externalLink(value, label, className) {
  const href = safeUrl(value);
  if (!href) return el('span', { class: className }, label);
  return el('a', { class: className, href, target: '_blank', rel: 'noopener noreferrer' }, label);
}

/* ---------------- state ---------------- */
const initialTheme = (() => {
  const saved = storageGet('bluepaper.theme');
  if (saved === 'dark' || saved === 'light') return saved;
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme) return document.documentElement.dataset.theme;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();
const initialLang = storageGet('bluepaper.lang') === 'en' ? 'en' : 'zh-Hant';

const state = {
  ready: false,
  lang: initialLang,
  theme: initialTheme,
  zip: null,
  profile: null,
  friends: [],
  posts: [],
  threads: [],
  albums: [],
  media: [],
  comments: [],
  reactions: [],
  pages: [],
  groups: [],
  saved: [],
  localPosts: [],
  likes: new Set(),
  postComments: {},
  commentsOpen: new Set(),
  expanded: new Set(),
  drafts: { post: '', comments: {}, messages: {} },
  friendQuery: '',
  threadQuery: '',
  photoFilter: 'all',
  activityTab: 'comments',
  route: { view: 'feed', key: 'feed' },
  lightbox: null,
  focusPost: null,
};

/* ---------------- parsing ---------------- */
async function readJson(zip, path) {
  if (!path) return null;
  const entry = zip.find(path);
  if (!entry) return null;
  try {
    return await zip.json(entry);
  } catch (err) {
    console.warn('Could not read', path, err);
    return null;
  }
}

function collectMedia(node) {
  const out = [];
  const seen = new Set();
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (typeof value.uri === 'string' && kindOf(value.uri)) {
      if (!seen.has(value.uri)) {
        seen.add(value.uri);
        out.push({
          uri: value.uri,
          kind: kindOf(value.uri),
          ts: value.creation_timestamp || 0,
          caption: cleanText(value.description || value.title || ''),
        });
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === 'uri' || key === 'media_metadata') continue;
      walk(child);
    }
  };
  walk(node);
  return out;
}

function normalizePost(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const media = collectMedia(raw).filter((m) => m.kind === 'image' || m.kind === 'video');
  const dataPost = Array.isArray(raw.data)
    ? raw.data.find((d) => d && typeof d.post === 'string')?.post
    : '';
  const labelMessage = Array.isArray(raw.label_values)
    ? raw.label_values.find((l) => l && l.label === 'Message')?.value
    : '';
  const text = cleanText(dataPost || labelMessage || media.find((m) => m.caption)?.caption || '');
  let ts = raw.timestamp || 0;
  if (!ts && Array.isArray(raw.label_values)) {
    const published = raw.label_values.find((l) => l && l.label === 'Publish time' && l.timestamp_value);
    const updated = raw.label_values.find((l) => l && l.label === 'Last updated time' && l.timestamp_value);
    ts = (published && published.timestamp_value) || (updated && updated.timestamp_value) || 0;
  }
  const url = Array.isArray(raw.label_values)
    ? (raw.label_values.find((l) => l && l.label === 'URL')?.value || '')
    : '';
  if (!text && !media.length) return null;
  return {
    id: raw.fbid ? 'fbid-' + raw.fbid : 'post-' + ts + '-' + hashString(text.slice(0, 80) + '|' + (media[0]?.uri || '')),
    ts: ts || 0,
    text,
    media,
    url: safeUrl(url) ? url : '',
    title: cleanText(raw.title || ''),
    local: false,
  };
}

function mergePosts(mainPosts, archivePosts) {
  const byText = new Map();
  const byMedia = new Map();
  const result = [];
  const add = (post) => {
    result.push(post);
    if (post.text) byText.set(post.text, post);
    for (const m of post.media) byMedia.set(m.uri, post);
  };
  mainPosts.forEach(add);
  for (const post of archivePosts) {
    const target = (post.text && byText.get(post.text)) || post.media.map((m) => byMedia.get(m.uri)).find(Boolean);
    if (!target) { add(post); continue; }
    if (!target.text && post.text) target.text = post.text;
    if (!target.url && post.url) target.url = post.url;
    for (const m of post.media) {
      if (!target.media.some((x) => x.uri === m.uri)) {
        target.media.push(m);
        byMedia.set(m.uri, target);
      }
    }
  }
  return result;
}

function messageMedia(msg) {
  const out = [];
  const seen = new Set();
  for (const key of ['photos', 'videos', 'audio_files', 'gifs', 'files']) {
    for (const item of msg[key] || []) {
      if (!item || typeof item.uri !== 'string' || seen.has(item.uri)) continue;
      seen.add(item.uri);
      out.push({ uri: item.uri, kind: kindOf(item.uri) || key, ts: item.creation_timestamp || 0 });
    }
  }
  return out;
}

function normalizeThread(raw, path) {
  const participants = (raw.participants || []).map((p) => cleanText(p.name)).filter(Boolean);
  const title = cleanText(raw.title) || participants.find((n) => n !== state.profile.name) || t('messages.conversation');
  const folder = path.split('/').slice(-2)[0];
  const messages = (raw.messages || []).map((m) => ({
    sender: cleanText(m.sender_name || ''),
    ts: m.timestamp_ms || (m.timestamp ? m.timestamp * 1000 : 0),
    content: cleanText(m.content || ''),
    share: m.share && (m.share.link || m.share.share_text) ? { link: m.share.link || '', text: cleanText(m.share.share_text || '') } : null,
    media: messageMedia(m),
  })).filter((m) => m.ts || m.content || m.share || m.media.length).sort((a, b) => a.ts - b.ts);
  return {
    id: folder,
    title,
    participants,
    messages,
    archived: path.includes('/archived_threads/'),
  };
}

function normalizeComment(item) {
  const text = (item.data || []).map((d) => cleanText(d?.comment?.comment || '')).filter(Boolean).join('\n');
  return {
    ts: item.timestamp || 0,
    title: cleanText(item.title || ''),
    text,
  };
}

function normalizeReaction(item) {
  let reaction = '';
  if (Array.isArray(item.data)) reaction = item.data[0]?.reaction?.reaction || '';
  if (Array.isArray(item.label_values)) {
    reaction = item.label_values.find((l) => l.label === 'Reaction')?.value || reaction;
  }
  const url = Array.isArray(item.label_values)
    ? (item.label_values.find((l) => l.label === 'URL')?.value || '')
    : '';
  return {
    ts: item.timestamp || 0,
    reaction: String(reaction || '').toLowerCase(),
    title: cleanText(item.title || ''),
    url: safeUrl(url) ? url : '',
  };
}

const REACTION_EMOJI = { like: '👍', love: '❤️', haha: '😆', wow: '😮', sad: '😢', angry: '😡', care: '🥰' };

function reactionEmoji(value) {
  return REACTION_EMOJI[String(value || '').toLowerCase()] || '👍';
}

/* ---------------- loading ---------------- */
async function loadExport(file, status = () => {}) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error(t('error.noUnzip'));
  }

  status(t('status.opening'));
  const zip = new Zip(file);
  await zip.open();
  state.zip = zip;
  const paths = [...zip.entries.keys()];
  const all = (re) => paths.filter((p) => re.test(p));
  const one = (re) => all(re)[0] || null;

  const profilePath = one(/(?:^|\/)personal_information\/profile_information\/profile_information\.json$/);
  const friendsPath = one(/(?:^|\/)connections\/friends\/your_friends\.json$/);
  const pagesPath = one(/(?:^|\/)pages\/pages_you've_liked\.json$/);
  const groupsPath = one(/(?:^|\/)groups\/your_group_membership_activity\.json$/);
  const savedPath = one(/(?:^|\/)saved_items_and_collections\/your_saved_items\.json$/);
  const commentsPath = one(/(?:^|\/)comments_and_reactions\/comments\.json$/);
  const reactionPaths = all(/(?:^|\/)comments_and_reactions\/likes_and_reactions(?:_\d+)?\.json$/);
  const albumPaths = all(/(?:^|\/)posts\/album\/\d+\.json$/);
  const postPaths = all(/(?:^|\/)posts\/(?:your_posts[^/]*|archive)\.json$/);
  const videoPaths = all(/(?:^|\/)posts\/your_videos\.json$/);
  const messagePaths = all(/(?:^|\/)messages\/(?:inbox|archived_threads)\/[^/]+\/message_\d+\.json$/).sort();

  if (!profilePath && !postPaths.length && !messagePaths.length) {
    throw new Error(t('error.notExport'));
  }

  status(t('status.profile'));
  const [profileRaw, friendsRaw, pagesRaw, groupsRaw, savedRaw, commentsRaw] = await Promise.all([
    readJson(zip, profilePath),
    readJson(zip, friendsPath),
    readJson(zip, pagesPath),
    readJson(zip, groupsPath),
    readJson(zip, savedPath),
    readJson(zip, commentsPath),
  ]);

  const p = profileRaw?.profile_v2 || profileRaw || {};
  state.profile = {
    name: cleanText(p.name?.full_name) || cleanText(p.name?.first_name) || t('common.you'),
    bio: cleanText(p.intro_bio?.name || ''),
    city: cleanText(p.current_city?.name || ''),
    birthday: p.birthday || null,
    joined: p.registration_timestamp || 0,
    username: cleanText(p.username || ''),
    url: safeUrl(p.profile_uri) ? p.profile_uri : '',
    avatarUri: null,
    coverUri: null,
  };

  state.friends = (friendsRaw?.friends_v2 || [])
    .filter((f) => f && cleanText(f.name))
    .map((f) => ({ name: cleanText(f.name), ts: f.timestamp || 0 }));

  state.pages = (pagesRaw?.page_likes_v2 || [])
    .filter((pg) => pg && cleanText(pg.name))
    .map((pg) => ({ name: cleanText(pg.name), ts: pg.timestamp || 0, url: safeUrl(pg.url) ? pg.url : '' }));

  const groupMap = new Map();
  for (const item of groupsRaw?.groups_joined_v2 || []) {
    const name = cleanText(item.data?.[0]?.name || item.title || '');
    if (!name) continue;
    const ts = item.timestamp || 0;
    const status = /stopped/i.test(item.title || '') ? 'left' : 'joined';
    const previous = groupMap.get(name);
    if (!previous || ts >= previous.ts) groupMap.set(name, { name, ts, status });
  }
  state.groups = [...groupMap.values()].sort((a, b) => b.ts - a.ts);

  state.saved = (savedRaw?.saves_v2 || [])
    .filter((s) => s && cleanText(s.title))
    .map((s) => ({ title: cleanText(s.title), ts: s.timestamp || 0 }));

  const rawComments = Array.isArray(commentsRaw) ? commentsRaw : (commentsRaw?.comments_v2 || []);
  state.comments = rawComments.map(normalizeComment).filter((c) => c.text || c.title).sort((a, b) => b.ts - a.ts);

  const reactionFiles = await Promise.all(reactionPaths.map((path) => readJson(zip, path)));
  const reactionMap = new Map();
  for (const raw of reactionFiles) {
    if (!Array.isArray(raw)) continue;
    for (const item of raw) {
      const reaction = normalizeReaction(item);
      if (!reaction.reaction && !reaction.title) continue;
      const key = reaction.ts ? String(reaction.ts) : `0|${reaction.title}|${reaction.reaction}`;
      const previous = reactionMap.get(key);
      if (!previous) {
        reactionMap.set(key, reaction);
      } else {
        if (!previous.title && reaction.title) previous.title = reaction.title;
        if (!previous.url && reaction.url) previous.url = reaction.url;
        if (!previous.reaction && reaction.reaction) previous.reaction = reaction.reaction;
      }
    }
  }
  state.reactions = [...reactionMap.values()].sort((a, b) => b.ts - a.ts);

  status(t('status.photos'));
  const albumFiles = (await Promise.all(albumPaths.map((path) => readJson(zip, path)))).filter(Boolean);
  state.albums = albumFiles.map((a) => ({
    name: cleanText(a.name || t('photos.album')),
    photos: (a.photos || [])
      .filter((ph) => ph && typeof ph.uri === 'string' && kindOf(ph.uri) === 'image')
      .map((ph) => ({
        uri: ph.uri,
        ts: ph.creation_timestamp || 0,
        caption: cleanText(ph.description || ph.title || ''),
      })),
  })).filter((a) => a.photos.length);

  const profileAlbum = state.albums.find((a) => /profile pictures/i.test(a.name));
  const coverAlbum = state.albums.find((a) => /cover photos/i.test(a.name));
  state.profile.avatarUri = profileAlbum?.photos[0]?.uri || null;
  state.profile.coverUri = coverAlbum?.photos[0]?.uri || null;

  status(t('status.posts', { count: postPaths.length }));
  const postFiles = [];
  for (const path of postPaths) postFiles.push({ path, raw: await readJson(zip, path) });
  const mainPosts = [];
  const archivePosts = [];
  for (const { path, raw } of postFiles) {
    const posts = Array.isArray(raw) ? raw.map(normalizePost).filter(Boolean) : [];
    if (/\/archive\.json$/.test(path)) archivePosts.push(...posts);
    else mainPosts.push(...posts);
  }
  state.posts = mergePosts(mainPosts, archivePosts).sort((a, b) => b.ts - a.ts);

  status(t('status.threads', { count: messagePaths.length }));
  const threads = [];
  for (const path of messagePaths) {
    const raw = await readJson(zip, path);
    if (raw) threads.push(normalizeThread(raw, path));
  }
  state.threads = threads.sort((a, b) => threadLastTs(b) - threadLastTs(a));

  const videoRaw = videoPaths.length ? await readJson(zip, videoPaths[0]) : null;

  status(t('status.media'));
  const mediaMap = new Map();
  const addMedia = (uri, album, ts, caption) => {
    if (!uri || !zip.find(uri)) return;
    const kind = kindOf(uri);
    if (!kind) return;
    if (!mediaMap.has(uri)) mediaMap.set(uri, { uri, kind, album: album || '', ts: ts || 0, caption: caption || '' });
  };
  for (const album of state.albums) {
    for (const photo of album.photos) addMedia(photo.uri, album.name, photo.ts, photo.caption);
  }
  for (const post of state.posts) for (const m of post.media) addMedia(m.uri, '', m.ts, '');
  for (const video of videoRaw?.videos_v2 || []) {
    addMedia(video.uri, 'Videos', video.creation_timestamp, cleanText(video.description || video.title || ''));
  }
  state.media = [...mediaMap.values()].sort((a, b) => b.ts - a.ts);

  status(t('status.done'));
}

/* ---------------- derived helpers ---------------- */
function threadLastTs(thread) {
  const last = thread.messages[thread.messages.length - 1];
  return last ? last.ts : 0;
}

function threadPreview(thread) {
  const last = thread.messages[thread.messages.length - 1];
  if (!last) return t('messages.previewNoMessages');
  if (last.content) return last.content.replace(/\s+/g, ' ');
  if (last.share) return t('messages.previewShared');
  if (last.media.length) return last.media[0].kind === 'video' ? t('messages.previewVideo') : t('messages.previewPhoto');
  return t('messages.previewAttachment');
}

function reactionLabel(value) {
  const key = 'reaction.' + String(value || '').toLowerCase();
  const label = t(key);
  return label === key ? t('reaction.default') : label;
}

// The export stores generated activity sentences in the account's language.
// Translate the common ones when showing the Traditional Chinese UI.
function localizeGeneratedTitle(title) {
  if (!title || state.lang !== 'zh-Hant') return title;
  const target = (value) => value
    .replace(/'s post$/, '的貼文')
    .replace(/'s photo$/, '的相片')
    .replace(/'s video$/, '的影片')
    .replace(/'s comment$/, '的留言')
    .replace(/'s profile$/, '的個人檔案');
  return title
    .replace(/^(.+?) reacted to (.+)\.$/, (_, author, to) => `${author} 對${target(to)}表達了心情。`)
    .replace(/^(.+?) commented on (.+)\.$/, (_, author, on) => `${author} 在${target(on)}留言。`)
    .replace(/^(.+?) saved (.+)\.$/, (_, author, saved) => `${author} 儲存了${target(saved)}。`);
}

function findThreadFor(name) {
  const candidates = state.threads.filter((t) => t.participants.includes(name));
  return candidates.find((t) => t.participants.length <= 2) || candidates[0] || null;
}

function ensureThread(name) {
  const existing = findThreadFor(name);
  if (existing) return existing;
  const thread = {
    id: 'local-' + hashString(name),
    title: name,
    participants: [name, state.profile.name],
    messages: [],
    archived: false,
    synthetic: true,
  };
  state.threads.push(thread);
  return thread;
}

function openConversationWith(name) {
  const thread = ensureThread(name);
  go('messages/' + encodeURIComponent(thread.id));
}

/* ---------------- routing ---------------- */
function decodePart(value) {
  try { return decodeURIComponent(value); } catch (_) { return value; }
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '') || 'feed';
  const parts = raw.split('/');
  const view = parts.shift() || 'feed';
  const rest = parts.join('/');
  if (view === 'messages') return { view, id: rest ? decodePart(rest) : null, key: 'messages/' + rest };
  if (view === 'search') return { view, q: decodePart(rest), key: 'search/' + rest };
  if (['feed', 'friends', 'photos', 'about', 'activity'].includes(view)) return { view, key: view };
  return { view: 'feed', key: 'feed' };
}

function go(path) {
  const target = '#/' + path;
  if (location.hash === target) render();
  else location.hash = target;
}

/* ---------------- topbar, sidebar, rail ---------------- */
const TOPNAV = [
  ['feed', 'home', 'nav.home'],
  ['friends', 'friends', 'nav.friends'],
  ['messages', 'chat', 'nav.messages'],
  ['photos', 'photos', 'nav.photos'],
];

const SIDENAV = [
  ['feed', 'home', 'nav.feed'],
  ['friends', 'friends', 'nav.friends'],
  ['messages', 'chat', 'nav.messages'],
  ['photos', 'photos', 'nav.photos'],
  ['activity', 'activity', 'nav.activity'],
  ['about', 'info', 'nav.about'],
];

function renderTopbar(route) {
  const nav = $('#topnav');
  nav.setAttribute('aria-label', t('nav.main'));
  clear(nav);
  for (const [view, ic, labelKey] of TOPNAV) {
    const active = route.view === view || (view === 'feed' && route.view === 'search');
    const label = t(labelKey);
    nav.append(el('a', {
      class: 'topnav-link' + (active ? ' active' : ''),
      href: '#/' + view,
      title: label,
      'aria-label': label,
    }, icon(ic, 26)));
  }

  const user = $('#topbar-user');
  clear(user);
  if (state.profile) {
    user.append(el('a', { class: 'profile-chip', href: '#/about', title: t('topbar.profile') },
      avatar(state.profile.name, 32, state.profile.avatarUri),
      el('span', { class: 'profile-chip-name' }, state.profile.name),
    ));
  }

  const searchIcon = $('#search-icon');
  if (!searchIcon.firstChild) searchIcon.append(icon('search', 18));
  const input = $('#search-input');
  input.placeholder = t('topbar.searchPlaceholder');
  input.setAttribute('aria-label', t('topbar.searchPlaceholder'));
  input.value = route.view === 'search' ? (route.q || '') : '';
  renderTools();
}

function renderSidebar(route) {
  const sidebar = $('#sidebar');
  clear(sidebar);
  const p = state.profile;

  const card = el('a', { class: 'side-profile', href: '#/about', 'aria-label': t('profile.about', { name: p.name }) });
  const cover = el('div', { class: 'side-cover' });
  if (p.coverUri) {
    const img = el('img', { alt: '' });
    setImg(img, p.coverUri);
    cover.append(img);
  }
  card.append(cover, avatar(p.name, 64, p.avatarUri, 'side-avatar'), el('div', { class: 'side-profile-name' }, p.name));
  if (p.bio) card.append(el('div', { class: 'side-profile-bio' }, p.bio));
  sidebar.append(card);

  const nav = el('nav', { class: 'side-nav', 'aria-label': t('side.sections') });
  const counts = {
    friends: state.friends.length,
    messages: state.threads.length,
    photos: state.media.filter((m) => m.kind === 'image').length,
    activity: state.comments.length + state.reactions.length + state.saved.length,
  };
  for (const [view, ic, labelKey] of SIDENAV) {
    nav.append(el('a', {
      class: 'side-link' + (route.view === view || (view === 'feed' && route.view === 'search') ? ' active' : ''),
      href: '#/' + view,
    }, icon(ic, 28), el('span', {}, t(labelKey)), counts[view] != null ? el('span', { class: 'count' }, counts[view]) : null));
  }
  sidebar.append(nav);

  if (state.pages.length) {
    sidebar.append(el('div', { class: 'side-divider' }));
    const section = el('div', { class: 'side-section' });
    section.append(el('div', { class: 'side-section-title' }, t('side.pages')));
    for (const page of state.pages.slice(0, 4)) {
      const node = el('a', { class: 'side-item', href: page.url || '#/about', ...(page.url ? { target: '_blank', rel: 'noopener noreferrer' } : {}) },
        icon('flag', 22), el('span', {}, page.name));
      section.append(node);
    }
    sidebar.append(section);
  }

  if (state.groups.length) {
    const section = el('div', { class: 'side-section' });
    section.append(el('div', { class: 'side-section-title' }, t('side.groups')));
    for (const group of state.groups.slice(0, 3)) {
      section.append(el('a', { class: 'side-item', href: '#/about' }, icon('users', 22), el('span', {}, group.name)));
    }
    sidebar.append(section);
  }

  sidebar.append(el('button', { class: 'side-reload', type: 'button', onclick: () => location.reload() }, icon('refresh', 16), t('side.loadAnother')));
  sidebar.append(el('p', { class: 'side-privacy' }, t('side.privacy')));
}

function renderRail() {
  const rail = $('#rail');
  clear(rail);

  const contacts = [...state.friends].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
  const contactCard = el('section', { class: 'rail-card' });
  contactCard.append(el('div', { class: 'rail-head' }, el('h2', {}, t('rail.contacts')), el('a', { class: 'rail-link', href: '#/friends' }, t('rail.seeAll'))));
  if (!contacts.length) {
    contactCard.append(el('div', { class: 'rail-empty' }, t('rail.noFriends')));
  } else {
    contacts.forEach((friend, index) => {
      const online = (hashString(friend.name).charCodeAt(0) + index) % 3 === 0;
      contactCard.append(el('button', { class: 'contact', type: 'button', onclick: () => openConversationWith(friend.name) },
        avatar(friend.name, 34, null),
        el('span', { class: 'contact-name' }, friend.name),
        el('span', { class: 'online-dot' + (online ? ' on' : ''), title: online ? t('rail.active') : t('rail.offline') }),
      ));
    });
  }
  rail.append(contactCard);

  const activityKeys = [['comments', 'rail.comments', state.comments.length], ['reactions', 'rail.reactions', state.reactions.length], ['saved', 'rail.saved', state.saved.length]];
  const activityCard = el('section', { class: 'rail-card' });
  activityCard.append(el('div', { class: 'rail-head' }, el('h2', {}, t('rail.yourActivity'))));
  for (const [key, labelKey, count] of activityKeys) {
    activityCard.append(el('a', {
      class: 'stat-row', href: '#/activity',
      onclick: (event) => { event.preventDefault(); state.activityTab = key; go('activity'); },
    }, el('span', {}, t(labelKey)), el('b', {}, count)));
  }
  rail.append(activityCard);

  if (state.pages.length) {
    const pageCard = el('section', { class: 'rail-card' });
    pageCard.append(el('div', { class: 'rail-head' }, el('h2', {}, t('rail.pages'))));
    state.pages.slice(0, 4).forEach((page) => {
      pageCard.append(el('a', {
        class: 'stat-row', href: page.url || '#/about',
        ...(page.url ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      }, el('span', {}, page.name), icon('flag', 15)));
    });
    rail.append(pageCard);
  }
}

function renderMobileNav(route) {
  const nav = $('#mobile-nav');
  nav.setAttribute('aria-label', t('nav.mobile'));
  clear(nav);
  const items = [
    ['feed', 'home', 'nav.home'],
    ['friends', 'friends', 'nav.friends'],
    ['messages', 'chat', 'nav.messages'],
    ['photos', 'photos', 'nav.photos'],
    ['about', 'info', 'nav.about'],
  ];
  for (const [view, ic, labelKey] of items) {
    const active = route.view === view || (view === 'feed' && route.view === 'search');
    nav.append(el('a', { class: 'mnav-link' + (active ? ' active' : ''), href: '#/' + view }, icon(ic, 25), el('span', {}, t(labelKey))));
  }
}

/* ---------------- feed ---------------- */
function renderFeed(main) {
  const posts = [...state.localPosts, ...state.posts].sort((a, b) => b.ts - a.ts);
  main.append(el('div', { class: 'section-head' },
    el('h1', {}, t('feed.title')),
    el('p', {}, t('feed.stats', { posts: posts.length, conversations: state.threads.length })),
  ));
  main.append(composerCard());
  if (!posts.length) {
    main.append(emptyState(t('feed.noPosts'), t('feed.noPostsText')));
  }
  for (const post of posts) main.append(postCard(post));

  if (state.focusPost) {
    const id = state.focusPost;
    state.focusPost = null;
    requestAnimationFrame(() => {
      const target = main.querySelector(`[data-post="${id}"]`);
      if (!target) return;
      target.scrollIntoView({ block: 'center' });
      if (target.animate) {
        target.animate(
          [{ backgroundColor: '#e7f3ff' }, { backgroundColor: '#ffffff' }],
          { duration: 1600, easing: 'ease-out' },
        );
      }
    });
  }
}

function composerCard() {
  const form = el('form', { class: 'card composer' });
  const top = el('div', { class: 'composer-top' });
  const textarea = el('textarea', {
    class: 'composer-input',
    rows: '1',
    placeholder: t('feed.composer', { name: state.profile.name.split(/\s+/)[0] }),
    'aria-label': t('feed.writePost'),
  });
  textarea.value = state.drafts.post;
  textarea.addEventListener('input', () => { state.drafts.post = textarea.value; });
  top.append(avatar(state.profile.name, 40, state.profile.avatarUri), textarea);

  const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, t('feed.post'));
  form.append(top, el('div', { class: 'composer-bottom' }, submit));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;
    state.localPosts.unshift({
      id: 'local-' + Date.now().toString(36),
      ts: Math.floor(Date.now() / 1000),
      text,
      media: [],
      url: '',
      title: '',
      local: true,
    });
    state.drafts.post = '';
    render();
  });
  return form;
}

function postCard(post) {
  const article = el('article', { class: 'card post', 'data-post': post.id });
  const header = el('div', { class: 'post-head' });
  const meta = el('div', { class: 'post-meta' });
  const time = post.url
    ? el('a', { href: post.url, target: '_blank', rel: 'noopener noreferrer', title: t('feed.openOriginal') }, relative(post.ts))
    : el('span', {}, relative(post.ts));
  meta.append(time, el('span', { class: 'meta-sep', 'aria-hidden': 'true' }, '·'), el('span', {}, post.local ? t('feed.yourNewPost') : t('feed.fromArchive')));
  header.append(avatar(state.profile.name, 40, state.profile.avatarUri),
    el('div', {}, el('div', { class: 'post-author' }, state.profile.name), meta));
  article.append(header);

  if (post.text) {
    const long = post.text.length > 480;
    const expanded = state.expanded.has(post.id);
    const text = el('div', { class: 'post-text' + (long && !expanded ? ' clamped' : '') }, post.text);
    article.append(text);
    if (long) {
      article.append(el('button', {
        class: 'see-more', type: 'button',
        onclick: () => {
          if (state.expanded.has(post.id)) state.expanded.delete(post.id);
          else state.expanded.add(post.id);
          render();
        },
      }, expanded ? t('feed.seeLess') : t('feed.seeMore')));
    }
  }

  if (post.media.length) article.append(postMediaGrid(post.media));

  const comments = state.postComments[post.id] || [];
  const stats = el('div', { class: 'post-stats' });
  const paintStats = () => {
    clear(stats);
    const liked = state.likes.has(post.id);
    if (liked) stats.append(el('span', { class: 'reaction-pill' }, '👍'), el('span', {}, t('common.you')));
    if (comments.length) stats.append(el('span', { class: 'right' }, t('feed.commentCount', { count: comments.length })));
  };
  paintStats();
  article.append(stats);

  const liked = state.likes.has(post.id);
  const likeButton = el('button', {
    class: 'action' + (liked ? ' liked' : ''), type: 'button',
    'aria-pressed': liked ? 'true' : 'false',
  }, icon('like', 19), el('span', {}, liked ? t('feed.liked') : t('feed.like')));
  likeButton.addEventListener('click', () => {
    const nowLiked = !state.likes.has(post.id);
    if (nowLiked) state.likes.add(post.id);
    else state.likes.delete(post.id);
    likeButton.classList.toggle('liked', nowLiked);
    likeButton.setAttribute('aria-pressed', nowLiked ? 'true' : 'false');
    likeButton.replaceChildren(icon('like', 19), el('span', {}, nowLiked ? t('feed.liked') : t('feed.like')));
    paintStats();
  });

  const actions = el('div', { class: 'post-actions' });
  actions.append(
    likeButton,
    el('button', {
      class: 'action', type: 'button',
      onclick: () => {
        if (state.commentsOpen.has(post.id)) state.commentsOpen.delete(post.id);
        else state.commentsOpen.add(post.id);
        render();
      },
    }, icon('comment', 19), el('span', {}, t('feed.comment'))),
    el('button', {
      class: 'action', type: 'button',
      onclick: () => showToast(t('feed.shareOff')),
    }, icon('share', 19), el('span', {}, t('feed.share'))),
  );
  article.append(actions);

  if (state.commentsOpen.has(post.id) || comments.length) {
    const section = el('div', { class: 'comments' });
    for (const comment of comments) {
      section.append(el('div', { class: 'comment' },
        avatar(comment.author, 32, state.profile.avatarUri),
        el('div', {},
          el('div', { class: 'comment-bubble' },
            el('div', { class: 'comment-author' }, comment.author),
            el('div', { class: 'comment-text' }, comment.text),
          ),
          el('div', { class: 'comment-time' }, relative(comment.ts)),
        ),
      ));
    }
    const form = el('form', { class: 'comment-form' });
    const input = el('input', {
      class: 'comment-input', type: 'text', placeholder: t('feed.commentPlaceholder'),
      'aria-label': t('feed.commentPlaceholder'),
    });
    input.value = state.drafts.comments[post.id] || '';
    input.addEventListener('input', () => { state.drafts.comments[post.id] = input.value; });
    form.append(avatar(state.profile.name, 32, state.profile.avatarUri), input,
      el('button', { class: 'send-mini', type: 'submit', 'aria-label': t('feed.sendComment') }, icon('send', 20)));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      (state.postComments[post.id] ||= []).push({
        author: state.profile.name,
        text,
        ts: Math.floor(Date.now() / 1000),
      });
      state.drafts.comments[post.id] = '';
      render();
    });
    section.append(form);
    article.append(section);
  }
  return article;
}

function postMediaGrid(media) {
  const visible = media.slice(0, 4);
  const grid = el('div', { class: 'post-media count-' + Math.min(media.length, 4) });
  visible.forEach((item, index) => {
    const cell = el('button', {
      class: 'media-cell', type: 'button',
      'aria-label': item.kind === 'video' ? t('photos.openVideo') : t('photos.openPhoto'),
      onclick: () => openLightbox(media, index),
    });
    if (item.kind === 'video') {
      const video = el('video', { preload: 'metadata', muted: true, playsinline: true });
      mediaUrl(item.uri).then((url) => { if (url) video.src = url; });
      cell.append(video, el('span', { class: 'media-play' }, icon('play', 46)));
    } else {
      const img = el('img', { alt: '', loading: 'lazy' });
      setImg(img, item.uri);
      cell.append(img);
    }
    if (index === 3 && media.length > 4) {
      cell.append(el('span', { class: 'media-more' }, '+' + (media.length - 4)));
    }
    grid.append(cell);
  });
  return grid;
}

/* ---------------- friends ---------------- */
function renderFriends(main) {
  main.append(el('div', { class: 'section-head' },
    el('h1', {}, t('friends.title')),
    el('p', {}, t('friends.count', { count: state.friends.length })),
  ));
  if (!state.friends.length) {
    main.append(emptyState(t('friends.emptyTitle'), t('friends.emptyText')));
    return;
  }
  const search = el('input', { class: 'inline-search', type: 'search', placeholder: t('friends.search'), value: state.friendQuery });
  const applyFriendFilter = () => {
    const q = search.value.trim().toLowerCase();
    $$('.friend-card', main).forEach((card) => {
      card.hidden = Boolean(q) && !card.dataset.name.includes(q);
    });
  };
  search.addEventListener('input', () => { state.friendQuery = search.value; applyFriendFilter(); });
  main.append(search);

  const grid = el('div', { class: 'friends-grid' });
  for (const friend of [...state.friends].sort((a, b) => a.name.localeCompare(b.name))) {
    const card = el('div', {
      class: 'friend-card',
      'data-name': friend.name.toLowerCase(),
      role: 'button',
      tabindex: '0',
      onclick: () => openFriendModal(friend),
      onkeydown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFriendModal(friend); }
      },
    });
    const cardMain = el('div', { class: 'friend-main' },
      avatar(friend.name, 74),
      el('div', { class: 'friend-info' },
        el('div', { class: 'friend-name' }, friend.name),
        el('div', { class: 'friend-since' }, friend.ts ? t('time.friendsSince', { date: formatDate(friend.ts) }) : t('friends.friend')),
      ),
    );
    card.append(cardMain, el('button', {
      class: 'btn btn-ghost friend-msg', type: 'button',
      onclick: (event) => { event.stopPropagation(); openConversationWith(friend.name); },
    }, icon('chat', 17), t('friends.message')));
    grid.append(card);
  }
  main.append(grid);
  applyFriendFilter();
}

function openFriendModal(friend) {
  const thread = findThreadFor(friend.name);
  const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': friend.name });
  const cover = el('div', { class: 'modal-cover' });
  if (state.profile.coverUri) {
    const img = el('img', { alt: '' });
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    setImg(img, state.profile.coverUri);
    cover.append(img);
  }
  const body = el('div', { class: 'modal-body' },
    avatar(friend.name, 92, null, 'modal-avatar'),
    el('div', { class: 'modal-name' }, friend.name),
    el('div', { class: 'modal-sub' }, friend.ts ? t('time.friendsSince', { date: formatDate(friend.ts) }) : t('friends.friend')),
    el('div', { class: 'modal-actions' },
      el('button', {
        class: 'btn btn-primary', type: 'button',
        onclick: () => { closeOverlay(); openConversationWith(friend.name); },
      }, icon('chat', 17), thread ? t('friends.openChat') : t('friends.message')),
      el('button', { class: 'btn', type: 'button', onclick: closeOverlay }, t('friends.close')),
    ),
  );
  modal.append(cover, body);
  openModal(modal);
}

/* ---------------- messages ---------------- */
function renderMessages(main, route) {
  const wrapper = el('div', { class: 'messages-view' + (route.id ? ' has-thread' : '') });
  const list = el('aside', { class: 'thread-list' });
  list.append(el('div', { class: 'thread-list-head' },
    el('h1', {}, t('messages.title')),
    el('span', {}, t('messages.count', { count: state.threads.length })),
  ));
  const search = el('input', { class: 'inline-search thread-search', type: 'search', placeholder: t('messages.search'), value: state.threadQuery });
  list.append(search);
  const scroll = el('div', { class: 'thread-scroll' });
  const sorted = [...state.threads].sort((a, b) => threadLastTs(b) - threadLastTs(a));
  if (!sorted.length) {
    scroll.append(el('div', { class: 'rail-empty', style: 'padding:16px' }, t('messages.emptyList')));
  }
  for (const thread of sorted) {
    const active = route.id === thread.id;
    const row = el('button', {
      class: 'thread-row' + (active ? ' active' : ''),
      type: 'button',
      'data-name': thread.title.toLowerCase(),
      onclick: () => go('messages/' + encodeURIComponent(thread.id)),
    },
      avatar(thread.title, 44),
      el('div', { class: 'thread-main' },
        el('div', { class: 'thread-name' }, thread.title),
        el('div', { class: 'thread-preview' }, threadPreview(thread)),
      ),
      el('div', { class: 'thread-side' },
        el('span', { class: 'thread-time' }, threadLastTs(thread) ? shortRelative(threadLastTs(thread)) : ''),
        thread.archived ? el('span', { class: 'thread-archived' }, t('messages.archived')) : null,
      ),
    );
    scroll.append(row);
  }
  const applyThreadFilter = () => {
    const q = search.value.trim().toLowerCase();
    $$('.thread-row', scroll).forEach((row) => {
      row.hidden = Boolean(q) && !row.dataset.name.includes(q);
    });
  };
  search.addEventListener('input', () => { state.threadQuery = search.value; applyThreadFilter(); });
  list.append(scroll);
  applyThreadFilter();

  const conversation = el('section', { class: 'conversation' });
  const thread = route.id ? state.threads.find((t) => t.id === route.id) : null;
  if (!thread) {
    conversation.append(el('div', { class: 'conv-empty' },
      icon('chat', 54),
      el('strong', {}, t('messages.select')),
      el('span', { class: 'muted', style: 'font-size:13px;margin-top:4px' }, t('messages.selectHint')),
    ));
  } else {
    renderConversation(conversation, thread);
  }
  wrapper.append(list, conversation);
  main.append(wrapper);
}

function renderConversation(container, thread) {
  const head = el('div', { class: 'conv-head' });
  head.append(
    el('button', { class: 'back-btn', type: 'button', 'aria-label': t('messages.back'), onclick: () => go('messages') }, icon('back', 22)),
    avatar(thread.title, 40),
    el('div', { style: 'min-width:0' },
      el('div', { class: 'conv-title' }, thread.title),
      el('div', { class: 'conv-sub' }, thread.archived ? t('messages.archivedConv') : t('messages.participants', { count: thread.participants.length })),
    ),
  );
  container.append(head);

  const body = el('div', { class: 'conv-body' });
  if (!thread.messages.length) {
    body.append(el('div', { class: 'conv-empty' },
      icon('chat', 44),
      el('strong', {}, t('messages.empty')),
      el('span', { class: 'muted', style: 'font-size:13px' }, t('messages.emptyHint')),
    ));
  }
  let lastDay = '';
  for (const message of thread.messages) {
    const label = dayLabel(message.ts);
    if (label !== lastDay) {
      body.append(el('div', { class: 'day-divider' }, el('span', {}, label)));
      lastDay = label;
    }
    body.append(messageRow(message, thread));
  }
  container.append(body);

  const form = el('form', { class: 'conv-composer' });
  const input = el('textarea', {
    class: 'conv-input', rows: '1', placeholder: t('messages.placeholder'),
    'aria-label': t('messages.placeholder'),
  });
  input.value = state.drafts.messages[thread.id] || '';
  input.addEventListener('input', () => { state.drafts.messages[thread.id] = input.value; });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.append(input, el('button', { class: 'send-btn', type: 'submit', 'aria-label': t('messages.send') }, icon('send', 21)));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    thread.messages.push({
      sender: state.profile.name,
      ts: Date.now(),
      content: text,
      share: null,
      media: [],
    });
    state.drafts.messages[thread.id] = '';
    render();
  });
  container.append(form);

  requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
}

function messageRow(message, thread) {
  const own = message.sender === state.profile.name;
  const group = thread.participants.length > 2;
  const groupEl = el('div', { class: 'msg-group' });
  if (!own && group && message.sender) groupEl.append(el('div', { class: 'msg-sender' }, message.sender));
  const bubble = el('div', { class: 'bubble' });
  if (message.content) bubble.append(el('div', {}, message.content));
  for (const media of message.media) {
    if (media.kind === 'image') {
      const img = el('img', { alt: '', loading: 'lazy' });
      setImg(img, media.uri);
      bubble.append(el('div', { class: 'msg-media' }, img));
    } else if (media.kind === 'video') {
      const video = el('video', { controls: true, preload: 'metadata' });
      mediaUrl(media.uri).then((url) => { if (url) video.src = url; });
      bubble.append(el('div', { class: 'msg-media' }, video));
    }
  }
  if (message.share) {
    const href = safeUrl(message.share.link);
    const card = el(href ? 'a' : 'div', {
      class: 'share-card',
      ...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}),
    });
    const inner = el('div', { class: 'share-card-body' },
      el('div', { class: 'share-card-label' }, t('messages.sharedLink')),
      message.share.text ? el('div', { class: 'share-card-text' }, message.share.text) : null,
    );
    card.append(inner);
    bubble.append(card);
  }
  groupEl.append(bubble, el('div', { class: 'msg-time' }, formatTime(message.ts)));
  return el('div', { class: 'msg-row' + (own ? ' own' : '') }, groupEl);
}

/* ---------------- photos ---------------- */
function renderPhotos(main) {
  const photos = state.media.filter((m) => m.kind === 'image');
  const videos = state.media.filter((m) => m.kind === 'video');
  main.append(el('div', { class: 'section-head' },
    el('h1', {}, t('photos.title')),
    el('p', {}, t('photos.stats', { photos: photos.length, videos: videos.length, albums: state.albums.length })),
  ));

  const filters = [['all', t('photos.all'), state.media.length], ['videos', t('photos.videos'), videos.length]];
  for (const album of state.albums) filters.push([album.name, albumLabel(album.name), album.photos.length]);
  if (!filters.some(([key]) => key === state.photoFilter)) state.photoFilter = 'all';

  const chips = el('div', { class: 'chips' });
  for (const [key, label, count] of filters) {
    chips.append(el('button', {
      class: 'chip' + (state.photoFilter === key ? ' active' : ''),
      type: 'button',
      onclick: () => { state.photoFilter = key; render(); },
    }, `${label}${count != null ? ` · ${count}` : ''}`));
  }
  main.append(chips);

  let items;
  if (state.photoFilter === 'all') items = state.media;
  else if (state.photoFilter === 'videos') items = videos;
  else items = state.media.filter((m) => m.album === state.photoFilter);

  if (!items.length) {
    main.append(emptyState(t('photos.emptyTitle'), t('photos.emptyText')));
    return;
  }
  main.append(el('p', { class: 'photo-meta' }, t('photos.items', { count: items.length })));
  const grid = el('div', { class: 'photo-grid' });
  items.forEach((item, index) => {
    const tile = el('button', {
      class: 'photo-tile', type: 'button',
      'aria-label': item.kind === 'video' ? t('photos.openVideo') : t('photos.openPhoto'),
      onclick: () => openLightbox(items, index),
    });
    if (item.kind === 'video') {
      tile.style.background = 'linear-gradient(135deg,#3a3b3c,#1c1e21)';
      tile.append(el('span', { class: 'media-play' }, icon('play', 38)));
    } else {
      const img = el('img', { alt: '', loading: 'lazy' });
      setImg(img, item.uri);
      tile.append(img);
    }
    grid.append(tile);
  });
  main.append(grid);
}

/* ---------------- about ---------------- */
function renderAbout(main) {
  const p = state.profile;
  const hero = el('section', { class: 'profile-hero' });
  const cover = el('div', { class: 'hero-cover' });
  if (p.coverUri) {
    const img = el('img', { alt: '' });
    setImg(img, p.coverUri);
    cover.append(img);
  }
  const bottom = el('div', { class: 'hero-bottom' });
  bottom.append(avatar(p.name, 120, p.avatarUri, 'hero-avatar'), el('h1', { class: 'hero-name' }, p.name));
  if (p.bio) bottom.append(el('p', { class: 'hero-bio' }, p.bio));
  bottom.append(el('div', { class: 'hero-actions' },
    el('button', {
      class: 'btn btn-primary', type: 'button',
      onclick: () => { state.activityTab = 'comments'; go('activity'); },
    }, icon('activity', 17), t('profile.activity')),
    el('a', { class: 'btn', href: '#/photos' }, t('profile.seePhotos')),
    el('button', { class: 'btn', type: 'button', onclick: () => location.reload() }, t('profile.loadAnother')),
  ));
  hero.append(cover, bottom);
  main.append(hero);

  const details = el('section', { class: 'card detail-card' });
  details.append(el('h2', {}, t('profile.intro')));
  if (p.bio) details.append(detailRow('info', p.bio));
  if (p.city) details.append(detailRow('pin', t('time.livesIn', { city: p.city })));
  if (p.birthday) details.append(detailRow('calendar', t('time.born', { date: formatBirthday(p.birthday) })));
  if (p.joined) details.append(detailRow('calendar', t('time.joined', { date: formatDate(p.joined) })));
  if (p.username) {
    const handle = externalLink(p.url, '@' + p.username, 'detail-link');
    details.append(detailRow('link', p.url ? handle : el('span', { class: 'detail-link' }, '@' + p.username)));
  }
  if (!p.bio && !p.city && !p.birthday && !p.joined) details.append(el('p', { class: 'muted' }, t('profile.noDetails')));
  main.append(details);

  const stats = el('section', { class: 'card detail-card' });
  stats.append(el('h2', {}, t('profile.glance')));
  const grid = el('div', { class: 'stats-grid' });
  for (const [count, label] of [
    [state.friends.length, t('profile.friends')],
    [state.posts.length, t('profile.posts')],
    [state.media.filter((m) => m.kind === 'image').length, t('profile.photos')],
    [state.media.filter((m) => m.kind === 'video').length, t('profile.videos')],
  ]) {
    grid.append(el('div', { class: 'stat-box' }, el('b', {}, count), el('span', {}, label)));
  }
  stats.append(grid);
  main.append(stats);

  if (state.pages.length) {
    const pages = el('section', { class: 'card detail-card' });
    pages.append(el('h2', {}, t('profile.pages')));
    const list = el('div', { class: 'mini-list' });
    state.pages.forEach((page) => {
      list.append(el('a', {
        class: 'mini-item', href: page.url || '#/about',
        ...(page.url ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      }, icon('flag', 20), el('span', { class: 'grow' }, page.name), el('time', {}, page.ts ? formatDate(page.ts) : '')));
    });
    pages.append(list);
    main.append(pages);
  }

  if (state.groups.length) {
    const groups = el('section', { class: 'card detail-card' });
    groups.append(el('h2', {}, t('profile.groups')));
    const list = el('div', { class: 'mini-list' });
    state.groups.forEach((group) => {
      list.append(el('div', { class: 'mini-item' }, icon('users', 20),
        el('span', { class: 'grow' }, group.name),
        el('time', {}, t('profile.' + group.status) + (group.ts ? ' · ' + formatDate(group.ts) : '')),
      ));
    });
    groups.append(list);
    main.append(groups);
  }
}

function detailRow(ic, content) {
  return el('div', { class: 'detail-row' }, icon(ic, 18), typeof content === 'string' ? el('span', {}, content) : content);
}

/* ---------------- activity ---------------- */
function renderActivity(main) {
  const tabs = [
    ['comments', 'activity.comments', state.comments.length],
    ['reactions', 'activity.reactions', state.reactions.length],
    ['saved', 'activity.saved', state.saved.length],
  ];
  if (!tabs.some(([key]) => key === state.activityTab)) state.activityTab = 'comments';
  main.append(el('div', { class: 'section-head' },
    el('h1', {}, t('activity.title')),
    el('p', {}, t('activity.sub')),
  ));

  const card = el('section', { class: 'card' });
  const tabBar = el('div', { class: 'tabs', role: 'tablist' });
  for (const [key, labelKey, count] of tabs) {
    tabBar.append(el('button', {
      class: 'tab' + (state.activityTab === key ? ' active' : ''),
      type: 'button', role: 'tab', 'aria-selected': state.activityTab === key ? 'true' : 'false',
      onclick: () => { state.activityTab = key; render(); },
    }, `${t(labelKey)} · ${count}`));
  }
  card.append(tabBar);

  const list = el('div', { class: 'activity-list' });
  if (state.activityTab === 'comments') {
    if (!state.comments.length) list.append(emptyInline(t('activity.noComments')));
    for (const comment of state.comments) {
      list.append(el('div', { class: 'activity-item' },
        el('div', { class: 'activity-icon' }, icon('comment', 18)),
        el('div', { class: 'activity-main' },
          el('div', { class: 'activity-text' }, comment.text || comment.title),
          comment.title ? el('div', { class: 'activity-title' }, localizeGeneratedTitle(comment.title)) : null,
          el('div', { class: 'activity-date' }, formatDateTime(comment.ts)),
        ),
      ));
    }
  } else if (state.activityTab === 'reactions') {
    if (!state.reactions.length) list.append(emptyInline(t('activity.noReactions')));
    for (const reaction of state.reactions) {
      list.append(el('div', { class: 'activity-item' },
        el('div', { class: 'activity-icon', style: 'font-size:18px' }, reactionEmoji(reaction.reaction)),
        el('div', { class: 'activity-main' },
          el('div', { class: 'activity-text' }, reaction.title ? localizeGeneratedTitle(reaction.title) : t('activity.reacted', { reaction: reactionLabel(reaction.reaction) })),
          reaction.url ? el('div', { class: 'activity-title' }, externalLink(reaction.url, t('activity.openOriginal'), '')) : null,
          el('div', { class: 'activity-date' }, formatDateTime(reaction.ts)),
        ),
      ));
    }
  } else {
    if (!state.saved.length) list.append(emptyInline(t('activity.noSaved')));
    for (const saved of state.saved) {
      list.append(el('div', { class: 'activity-item' },
        el('div', { class: 'activity-icon' }, icon('bookmark', 18)),
        el('div', { class: 'activity-main' },
          el('div', { class: 'activity-text' }, localizeGeneratedTitle(saved.title)),
          el('div', { class: 'activity-date' }, formatDateTime(saved.ts)),
        ),
      ));
    }
  }
  card.append(list);
  main.append(card);
}

function emptyInline(text) {
  return el('div', { class: 'rail-empty', style: 'padding:18px 10px;text-align:center' }, text);
}

/* ---------------- search ---------------- */
function renderSearch(main, route) {
  const q = (route.q || '').trim();
  const needle = q.toLowerCase();
  main.append(el('div', { class: 'section-head' },
    el('h1', {}, t('search.title')),
    el('p', {}, q ? t('search.results', { q }) : t('search.prompt')),
  ));
  if (!q) {
    main.append(emptyState(t('search.emptyTitle'), t('search.emptyText')));
    return;
  }

  const people = state.friends.filter((f) => f.name.toLowerCase().includes(needle));
  const posts = [...state.localPosts, ...state.posts].filter((p) => p.text.toLowerCase().includes(needle));
  const pages = state.pages.filter((p) => p.name.toLowerCase().includes(needle));
  const messageHits = [];
  for (const thread of state.threads) {
    for (const message of thread.messages) {
      const hay = (message.content + ' ' + (message.share?.text || '')).toLowerCase();
      if (hay.includes(needle)) messageHits.push({ thread, message });
    }
  }
  messageHits.sort((a, b) => b.message.ts - a.message.ts);

  if (!people.length && !posts.length && !pages.length && !messageHits.length) {
    main.append(emptyState(t('search.noMatches'), t('search.nothing', { q })));
    return;
  }

  if (people.length) {
    const card = el('section', { class: 'card detail-card' });
    card.append(el('h2', {}, t('search.people', { count: people.length })));
    const list = el('div', { class: 'mini-list' });
    for (const friend of people) {
      list.append(el('button', {
        class: 'mini-item', type: 'button', style: 'width:100%;border:0;background:transparent;text-align:left',
        onclick: () => openFriendModal(friend),
      }, avatar(friend.name, 38), el('span', { class: 'grow' }, friend.name), icon('chevronRight', 17)));
    }
    card.append(list);
    main.append(card);
  }

  if (posts.length) {
    const card = el('section', { class: 'card detail-card' });
    card.append(el('h2', {}, t('search.posts', { count: posts.length })));
    for (const post of posts.slice(0, 25)) {
      card.append(el('button', {
        class: 'search-result', type: 'button', 'data-post': post.id,
        onclick: () => { state.focusPost = post.id; go('feed'); },
      },
        el('div', { class: 'activity-text' }, snippet(post.text, needle)),
        el('div', { class: 'activity-date' }, formatDateTime(post.ts)),
      ));
    }
    main.append(card);
  }

  if (messageHits.length) {
    const card = el('section', { class: 'card detail-card' });
    card.append(el('h2', {}, t('search.messages', { count: messageHits.length })));
    for (const { thread, message } of messageHits.slice(0, 25)) {
      card.append(el('button', {
        class: 'search-result', type: 'button',
        onclick: () => go('messages/' + encodeURIComponent(thread.id)),
      },
        el('div', { class: 'search-result-head' }, el('strong', {}, thread.title), el('span', { class: 'activity-date' }, formatDateTime(message.ts))),
        el('div', { class: 'activity-text' }, snippet(message.content || message.share?.text || '', needle)),
      ));
    }
    main.append(card);
  }

  if (pages.length) {
    const card = el('section', { class: 'card detail-card' });
    card.append(el('h2', {}, t('search.pages', { count: pages.length })));
    const list = el('div', { class: 'mini-list' });
    for (const page of pages) {
      list.append(el('a', {
        class: 'mini-item', href: page.url || '#/about',
        ...(page.url ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      }, icon('flag', 20), el('span', { class: 'grow' }, page.name)));
    }
    card.append(list);
    main.append(card);
  }
}

function snippet(text, needle) {
  const source = String(text || '');
  const index = source.toLowerCase().indexOf(needle);
  if (index < 0 || source.length <= 220) return source;
  const start = Math.max(0, index - 80);
  const end = Math.min(source.length, index + 160);
  return (start > 0 ? '…' : '') + source.slice(start, end).replace(/\s+/g, ' ') + (end < source.length ? '…' : '');
}

/* ---------------- overlays ---------------- */
function openLightbox(items, index) {
  state.lightbox = { items, index };
  renderLightbox();
}

function renderLightbox() {
  const overlay = $('#overlay');
  const { items, index } = state.lightbox;
  const item = items[index];
  if (!item) return closeOverlay();
  clear(overlay);
  overlay.hidden = false;
  overlay.className = 'overlay';
  overlay.onclick = (event) => { if (event.target === overlay) closeOverlay(); };
  document.body.classList.add('no-scroll');

  const box = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('lightbox.label') });
  const close = el('button', { class: 'lightbox-close', type: 'button', 'aria-label': t('lightbox.close'), onclick: closeOverlay }, icon('close', 22));
  const stage = el('div', { class: 'lightbox-stage' });
  if (item.kind === 'video') {
    const video = el('video', { controls: true, autoplay: true, playsinline: true });
    mediaUrl(item.uri).then((url) => {
      if (!url) {
        stage.append(el('div', { style: 'color:#fff' }, t('lightbox.videoMissing')));
        return;
      }
      video.src = url;
    });
    stage.append(video);
  } else {
    const img = el('img', { alt: '' });
    setImg(img, item.uri);
    stage.append(img);
  }

  const meta = el('div', { class: 'lightbox-meta' },
    [item.album ? albumLabel(item.album) : '', item.ts ? formatDate(item.ts) : '', t('lightbox.position', { current: index + 1, total: items.length })].filter(Boolean).join(' · '),
  );
  box.append(close, stage, meta);

  if (items.length > 1) {
    box.append(
      el('button', { class: 'lightbox-nav prev', type: 'button', 'aria-label': t('lightbox.prev'), onclick: () => { state.lightbox.index = (index - 1 + items.length) % items.length; renderLightbox(); } }, icon('back', 24)),
      el('button', { class: 'lightbox-nav next', type: 'button', 'aria-label': t('lightbox.next'), onclick: () => { state.lightbox.index = (index + 1) % items.length; renderLightbox(); } }, icon('chevronRight', 24)),
    );
  }
  overlay.append(box);
}

function openModal(node) {
  const overlay = $('#overlay');
  state.lightbox = null;
  clear(overlay);
  overlay.hidden = false;
  overlay.className = 'overlay';
  overlay.onclick = (event) => { if (event.target === overlay) closeOverlay(); };
  overlay.append(node);
  document.body.classList.add('no-scroll');
}

function closeOverlay() {
  const overlay = $('#overlay');
  state.lightbox = null;
  overlay.hidden = true;
  overlay.className = 'overlay';
  overlay.onclick = null;
  clear(overlay);
  document.body.classList.remove('no-scroll');
}

let toastTimer = 0;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
}

/* ---------------- empty state ---------------- */
function emptyState(title, text) {
  return el('div', { class: 'empty' }, icon('archive', 44), el('h3', {}, title), el('p', {}, text));
}

/* ---------------- render ---------------- */
function render() {
  if (!state.ready || !state.profile) return;
  const route = parseRoute();
  const previous = state.route;
  state.route = route;
  renderTopbar(route);
  renderSidebar(route);
  renderRail(route);
  renderMobileNav(route);
  const main = $('#main');
  clear(main);
  switch (route.view) {
    case 'friends': renderFriends(main); break;
    case 'messages': renderMessages(main, route); break;
    case 'photos': renderPhotos(main); break;
    case 'about': renderAbout(main); break;
    case 'activity': renderActivity(main); break;
    case 'search': renderSearch(main, route); break;
    default: renderFeed(main);
  }
  if (previous.key !== route.key) window.scrollTo({ top: 0 });
}

/* ---------------- upload ---------------- */
function setStatus(message) {
  const status = $('#load-status');
  status.hidden = false;
  status.className = 'load-status';
  clear(status);
  status.append(el('span', { class: 'spinner' }), el('span', {}, message));
}

function showUploadError(message) {
  const status = $('#load-status');
  status.hidden = false;
  status.className = 'load-status error';
  status.textContent = message;
}

async function handleFile(file) {
  if (!file) return;
  if (!/\.zip$/i.test(file.name)) {
    showUploadError(t('error.chooseZip'));
    return;
  }
  try {
    setStatus(t('status.opening'));
    await loadExport(file, setStatus);
    state.ready = true;
    $('#load-status').hidden = true;
    $('#upload-screen').hidden = true;
    $('#app').hidden = false;
    document.title = t('app.profileTitle', { name: state.profile.name });
    if (!location.hash) {
      try { history.replaceState(null, '', '#/feed'); }
      catch (_) { location.hash = '#/feed'; }
    }
    render();
  } catch (err) {
    console.error(err);
    showUploadError(err && err.message ? err.message : t('error.read'));
  }
}

function initUpload() {
  const zone = $('#drop-zone');
  const input = $('#zip-input');
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.value = '';
    handleFile(file);
  });
  for (const eventName of ['dragenter', 'dragover']) {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add('dragging');
    });
  }
  for (const eventName of ['dragleave', 'dragend']) {
    zone.addEventListener(eventName, () => zone.classList.remove('dragging'));
  }
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dragging');
    handleFile(event.dataTransfer?.files?.[0]);
  });
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => event.preventDefault());
}

/* ---------------- boot ---------------- */
function init() {
  applyTheme();
  applyStaticI18n();
  renderTools();
  initUpload();
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const q = $('#search-input').value.trim();
    if (q) go('search/' + encodeURIComponent(q));
    else go('feed');
  });
  $('#search-input').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.target.value = '';
      go('feed');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#overlay').hidden) closeOverlay();
    if (!state.lightbox) return;
    const count = state.lightbox.items.length;
    if (count < 2) return;
    if (event.key === 'ArrowLeft') {
      state.lightbox.index = (state.lightbox.index - 1 + count) % count;
      renderLightbox();
    } else if (event.key === 'ArrowRight') {
      state.lightbox.index = (state.lightbox.index + 1) % count;
      renderLightbox();
    }
  });
  window.addEventListener('hashchange', () => {
    closeOverlay();
    render();
  });
}

if (typeof document !== 'undefined') init();

/* Exported only for the Node self-test; the browser ignores this. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fixText, initials, formatBirthday, Zip };
}
