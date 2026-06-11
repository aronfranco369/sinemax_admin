'use client';
/* SINEMAX — Import & Approve: pending queue store + JSON validation.
   The queue lives in localStorage (nothing touches the catalog until
   approved); plan() and approve() take the catalog db so approval
   writes through to Supabase. */

const KEY = 'sinemax_import_queue_v1';
let qid = 1;
let items = null;
const subs = new Set();

function load() {
  if (items) return items;
  items = [];
  if (typeof window === 'undefined') return items;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(raw)) {
      raw.forEach(it => { const n = parseInt(String(it.qid || '').replace('q', ''), 10); if (n >= qid) qid = n + 1; });
      items = raw;
    }
  } catch (e) { /* ignore */ }
  return items;
}

function emit() { subs.forEach(fn => { try { fn(); } catch (e) {} }); }
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  emit();
}

/* ---------- validation ---------- */
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }
function isInt(v) { return Number.isInteger(v); }

function validateItem(raw, idx, errors) {
  const label = 'Item ' + (idx + 1) + (isStr(raw && raw.title) ? ' “' + raw.title.trim() + '”' : '');
  const errs = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { errors.push(label + ': not an object'); return null; }
  if (!isStr(raw.title)) errs.push('missing required "title"');
  if (raw.type !== 'movie' && raw.type !== 'series') errs.push('"type" must be "movie" or "series"');
  if (raw.year != null && !isInt(raw.year)) errs.push('"year" must be a whole number');
  if (raw.genres != null && !Array.isArray(raw.genres)) errs.push('"genres" must be an array of strings');
  if (raw.tags != null && !Array.isArray(raw.tags)) errs.push('"tags" must be an array of strings');
  if (raw.created_at != null && (typeof raw.created_at !== 'string' || isNaN(Date.parse(raw.created_at)))) errs.push('"created_at" must be an ISO date string');
  if (raw.view_count != null && !isInt(raw.view_count)) errs.push('"view_count" must be a whole number');
  if (raw.download_count != null && !isInt(raw.download_count)) errs.push('"download_count" must be a whole number');
  const files = raw.files;
  if (files != null && !Array.isArray(files)) errs.push('"files" must be an array');
  const cleanFiles = [];
  if (Array.isArray(files)) {
    files.forEach((f, fi) => {
      const fl = 'file ' + (fi + 1);
      if (!f || typeof f !== 'object') { errs.push(fl + ' is not an object'); return; }
      if (!isStr(f.label)) errs.push('missing label on ' + fl);
      if (!isStr(f.download_url)) errs.push('missing download_url on ' + fl);
      else if (!/^https?:\/\//i.test(f.download_url.trim())) errs.push(fl + ' download_url must start with http(s)://');
      if (raw.type === 'movie') {
        if (f.season != null) errs.push(fl + ': season must be null for movies');
        if (f.episode_number != null && !isInt(f.episode_number)) errs.push(fl + ': episode_number (part #) must be a whole number');
      } else if (raw.type === 'series') {
        if (!isInt(f.season)) errs.push(fl + ': season is required for series');
        if (!isInt(f.episode_number)) errs.push(fl + ': episode_number is required for series');
      }
      cleanFiles.push({
        label: isStr(f.label) ? f.label.trim() : '',
        season: raw.type === 'movie' ? null : (isInt(f.season) ? f.season : null),
        episode_number: isInt(f.episode_number) ? f.episode_number : (raw.type === 'movie' ? fi + 1 : null),
        download_url: isStr(f.download_url) ? f.download_url.trim() : '',
      });
    });
  }
  if (errs.length) { errs.forEach(e => errors.push(label + ': ' + e)); return null; }
  return {
    qid: 'q' + (qid++),
    title: raw.title.trim(),
    type: raw.type,
    description: isStr(raw.description) ? raw.description.trim() : '',
    poster_url: isStr(raw.poster_url) ? raw.poster_url.trim() : '',
    country: isStr(raw.country) ? raw.country.trim() : '',
    year: isInt(raw.year) ? raw.year : null,
    dj: isStr(raw.dj) ? raw.dj.trim().replace(/^DJ\s+/i, '') : '',
    genres: Array.isArray(raw.genres) ? raw.genres.filter(isStr).map(s => s.trim()) : [],
    tags: Array.isArray(raw.tags) ? raw.tags.filter(isStr).map(s => s.trim()) : [],
    created_at: isStr(raw.created_at) ? new Date(raw.created_at).toISOString() : null,
    view_count: isInt(raw.view_count) ? raw.view_count : 0,
    download_count: isInt(raw.download_count) ? raw.download_count : 0,
    files: cleanFiles,
    imported_at: new Date().toISOString(),
  };
}

/* Parse + validate a JSON string. Returns a report; valid items are
   appended to the queue (skipping titles already pending). */
function importJson(text) {
  load();
  const report = { added: 0, errors: [], skipped: [], total: 0 };
  let json;
  try { json = JSON.parse(text); } catch (e) {
    report.errors.push('Not valid JSON — ' + e.message);
    return report;
  }
  let list = null;
  if (Array.isArray(json)) list = json;
  else if (json && Array.isArray(json.media)) list = json.media;
  if (!list) { report.errors.push('Expected an object with a "media" array (see the format example)'); return report; }
  report.total = list.length;
  const pendingTitles = new Set(items.map(i => i.title.toLowerCase()));
  list.forEach((raw, idx) => {
    const item = validateItem(raw, idx, report.errors);
    if (!item) return;
    if (pendingTitles.has(item.title.toLowerCase())) { report.skipped.push(item.title); return; }
    pendingTitles.add(item.title.toLowerCase());
    items.push(item);
    report.added++;
  });
  if (report.added) persist();
  return report;
}

/* ---------- catalog duplicate / merge planning ---------- */
function findExisting(title, db) {
  const t = (title || '').trim().toLowerCase();
  return db.listMedia().find(m => m.title.trim().toLowerCase() === t) || null;
}
/* Plan what approval will do: create new media, or merge files into existing.
   Dedupe key includes the label so episode/movie PARTS that share an
   episode_number (e.g. "Episode 2 - Part A" / "Part B") all merge in. */
function fileKeyOf(f) {
  return (f.season == null ? '-' : f.season) + ':' + (f.episode_number == null ? '-' : f.episode_number) + ':' + (f.label || '').trim().toLowerCase();
}
function plan(item, db) {
  const existing = findExisting(item.title, db);
  if (!existing) return { mode: 'new', addFiles: item.files, skipCount: 0 };
  const have = new Set(db.listFiles(existing.id).map(fileKeyOf));
  const addFiles = item.files.filter(f => !have.has(fileKeyOf(f)));
  return { mode: 'merge', existing, addFiles, skipCount: item.files.length - addFiles.length };
}

/* Execute approval: write into Supabase (insert or merge). Returns summary. */
async function approve(itemQid, db) {
  load();
  const item = items.find(i => i.qid === itemQid);
  if (!item) return null;
  const p = plan(item, db);
  let mediaId;
  if (p.mode === 'new') {
    const created = await db.insertMedia({
      title: item.title, description: item.description, type: item.type,
      year: item.year, country: item.country, dj: item.dj,
      genres: item.genres, tags: item.tags, poster_url: item.poster_url,
      view_count: item.view_count, download_count: item.download_count,
      created_at: item.created_at,
    });
    mediaId = created.id;
  } else {
    mediaId = p.existing.id;
  }
  for (const f of p.addFiles) {
    await db.insertFile({
      media_id: mediaId, label: f.label,
      episode_number: f.episode_number, season: item.type === 'series' ? f.season : null,
      download_url: f.download_url, created_at: item.created_at,
    });
  }
  items = items.filter(i => i.qid !== itemQid);
  persist();
  return { mode: p.mode, title: item.title, added: p.addFiles.length, skipped: p.skipCount };
}

export const importQueue = {
  list() { load(); return items.map(i => ({ ...i, genres: [...i.genres], tags: [...i.tags], files: i.files.map(f => ({ ...f })) })); },
  get(itemQid) { load(); const i = items.find(x => x.qid === itemQid); return i ? JSON.parse(JSON.stringify(i)) : null; },
  count() { load(); return items.length; },
  update(itemQid, patch) {
    load();
    const i = items.find(x => x.qid === itemQid);
    if (!i) return;
    Object.assign(i, patch);
    persist();
  },
  remove(itemQid) { load(); items = items.filter(i => i.qid !== itemQid); persist(); },
  importJson, plan, approve, findExisting,
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
};

export default importQueue;
