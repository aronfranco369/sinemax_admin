'use client';
/* ============================================================
   SINEMAX — Catalog data layer backed by Supabase ("kitabu").
   Loads the `media` and `files` tables into memory once, then
   exposes the same synchronous read API the UI was designed
   against, plus async mutations that write through to Supabase
   and patch the local cache.
   ============================================================ */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

const CatalogCtx = createContext(null);

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function fetchAll(table, columns, orderCol) {
  // page through PostgREST's 1000-row cap so large catalogs load fully
  const out = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from(table).select(columns)
      .order(orderCol, { ascending: false, nullsFirst: false })
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < page) break;
  }
  return out;
}

export function CatalogProvider({ children }) {
  const [media, setMedia] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [m, f] = await Promise.all([
        fetchAll('media', '*', 'created_at'),
        fetchAll('files', '*', 'created_at'),
      ]);
      if (!mountedRef.current) return;
      setMedia(m); setFiles(f);
    } catch (e) {
      if (mountedRef.current) setError(e.message || String(e));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const db = useMemo(() => {
    const filesByMedia = new Map();
    files.forEach(f => {
      const arr = filesByMedia.get(f.media_id);
      if (arr) arr.push(f); else filesByMedia.set(f.media_id, [f]);
    });

    return {
      loading, error, refresh,

      /* ---- synchronous reads over the cached tables ---- */
      listMedia() {
        return media.map(m => ({ ...m, genres: m.genres || [], tags: m.tags || [] }));
      },
      getMedia(id) {
        const m = media.find(x => x.id === id);
        return m ? { ...m, genres: m.genres || [], tags: m.tags || [] } : null;
      },
      listFiles(mediaId) {
        return (filesByMedia.get(mediaId) || [])
          .map(f => ({ ...f }))
          .sort((a, b) => (a.season || 0) - (b.season || 0) || (a.episode_number || 0) - (b.episode_number || 0));
      },
      filesCount(mediaId) { return (filesByMedia.get(mediaId) || []).length; },
      allFilesCount() { return files.length; },
      stats() {
        return {
          totalTitles: media.length,
          totalFiles: files.length,
          totalViews: media.reduce((s, m) => s + (m.view_count || 0), 0),
          totalDownloads: media.reduce((s, m) => s + (m.download_count || 0), 0),
        };
      },
      distinct(field) {
        const set = new Set();
        media.forEach(m => { if (m[field]) set.add(m[field]); });
        return [...set].sort();
      },
      distinctArray(field) {
        const set = new Set();
        media.forEach(m => (m[field] || []).forEach(v => { if (v) set.add(v); }));
        return [...set].sort();
      },

      /* ---- async mutations: write to Supabase, patch the cache ---- */
      async insertMedia(row) {
        const now = row.created_at || new Date().toISOString();
        const rec = {
          id: newId(),
          title: row.title || 'Untitled',
          description: row.description || '',
          type: row.type || 'movie',
          year: row.year || null,
          country: row.country || '',
          dj: row.dj || '',
          genres: row.genres || [],
          tags: row.tags || [],
          poster_url: row.poster_url || '',
          view_count: row.view_count || 0,
          download_count: row.download_count || 0,
          created_at: now,
          updated_at: now,
        };
        const { data, error: err } = await supabase.from('media').insert(rec).select().single();
        if (err) throw err;
        setMedia(prev => [data, ...prev]);
        return data;
      },
      async updateMedia(id, patch) {
        const upd = { ...patch, updated_at: new Date().toISOString() };
        const { data, error: err } = await supabase.from('media').update(upd).eq('id', id).select().single();
        if (err) throw err;
        setMedia(prev => prev.map(m => (m.id === id ? data : m)));
        return data;
      },
      async deleteMedia(id) {
        const { error: e1 } = await supabase.from('files').delete().eq('media_id', id);
        if (e1) throw e1;
        const { error: e2 } = await supabase.from('media').delete().eq('id', id);
        if (e2) throw e2;
        setFiles(prev => prev.filter(f => f.media_id !== id));
        setMedia(prev => prev.filter(m => m.id !== id));
      },
      async deleteManyMedia(ids) {
        const { error: e1 } = await supabase.from('files').delete().in('media_id', ids);
        if (e1) throw e1;
        const { error: e2 } = await supabase.from('media').delete().in('id', ids);
        if (e2) throw e2;
        const set = new Set(ids);
        setFiles(prev => prev.filter(f => !set.has(f.media_id)));
        setMedia(prev => prev.filter(m => !set.has(m.id)));
      },
      async insertFile(row) {
        const rec = {
          id: newId(),
          media_id: row.media_id,
          label: row.label || 'Untitled',
          episode_number: row.episode_number ?? null,
          season: row.season ?? null,
          download_url: row.download_url || '',
          created_at: row.created_at || new Date().toISOString(),
        };
        const { data, error: err } = await supabase.from('files').insert(rec).select().single();
        if (err) throw err;
        setFiles(prev => [...prev, data]);
        return data;
      },
      async updateFile(id, patch) {
        const { data, error: err } = await supabase.from('files').update(patch).eq('id', id).select().single();
        if (err) throw err;
        setFiles(prev => prev.map(f => (f.id === id ? data : f)));
        return data;
      },
      async deleteFile(id) {
        const { error: err } = await supabase.from('files').delete().eq('id', id);
        if (err) throw err;
        setFiles(prev => prev.filter(f => f.id !== id));
      },
    };
  }, [media, files, loading, error, refresh]);

  return <CatalogCtx.Provider value={db}>{children}</CatalogCtx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogCtx);
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return ctx;
}
