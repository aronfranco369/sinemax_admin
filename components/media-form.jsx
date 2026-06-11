'use client';
/* SINEMAX — Add / Edit Media form
   Type-first, title autocomplete (prefill existing to avoid dupes),
   dropdown+custom fields, inline files/episodes, two-preview column. */
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '@/components/icons';
import { useApp } from '@/components/shell';
import { useCatalog } from '@/lib/catalog';
import { hexA, Poster, Badge, TypeBadge, Btn, Field, TextInput, Segmented, useToast, SectionDivider } from '@/components/ui';

const AeIc = Icons;

function blankMedia() {
  return { title: '', description: '', type: 'movie', year: '', country: '', dj: '', genres: [], tags: [], poster_url: '', view_count: 0, download_count: 0 };
}
let _fileKey = 1;
function fileKey() { return 'f' + (_fileKey++); }

function classifyUrl(url) {
  if (!url || !url.trim()) return 'empty';
  const u = url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mp4|m4v|mkv|webm|mov|avi|m3u8|ogv|flv|wmv)$/.test(u)) return 'video';
  if (/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/.test(u)) return 'image';
  return 'unknown';
}

/* ===== combobox: type to filter; typed value becomes custom automatically ===== */
export function FieldSelect({ value, onChange, options, placeholder, numeric }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function f(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  const v = value == null ? '' : String(value);
  const q = v.trim().toLowerCase();
  const matches = q ? options.filter(o => String(o).toLowerCase().includes(q)) : options;
  const exact = options.some(o => String(o).toLowerCase() === q);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="combo-wrap">
        <input
          className="input" value={v} placeholder={placeholder}
          inputMode={numeric ? 'numeric' : undefined}
          onChange={e => { let nv = e.target.value; if (numeric) nv = nv.replace(/[^0-9]/g, ''); onChange(nv); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); setOpen(false); } }}
        />
        <button type="button" className="combo-caret" onClick={() => setOpen(o => !o)} tabIndex={-1}>
          <AeIc.chevDown size={15} />
        </button>
      </div>
      {open && (
        <div className="menu" style={{ width: '100%' }}>
          {matches.length === 0 && (
            <div className="menu-item" style={{ color: 'var(--muted2)' }}>
              {q ? 'No match — “' + v.trim() + '” will be saved as a new value' : 'Start typing…'}
            </div>
          )}
          {v.trim() && !exact && matches.length > 0 && (
            <div className="menu-cap">{'Existing matches — or keep “' + v.trim() + '” as new'}</div>
          )}
          {matches.slice(0, 40).map(o => (
            <div
              key={o} className={'menu-item' + (q === String(o).toLowerCase() ? ' sel' : '')}
              onClick={() => { onChange(String(o)); setOpen(false); }}
            >
              {o}{q === String(o).toLowerCase() && <AeIc.check />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== dropdown + custom (multi select: genres / tags) ===== */
export function FieldMultiSelect({ values, onChange, options, placeholder }) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function f(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  function add(v) { v = (v || '').trim().replace(/,$/, '').trim(); if (v && !values.includes(v)) onChange([...values, v]); setDraft(''); }
  const avail = options.filter(o => !values.includes(o) && o.toLowerCase().includes(draft.toLowerCase()));
  const exactExists = options.some(o => o.toLowerCase() === draft.trim().toLowerCase()) || values.some(v => v.toLowerCase() === draft.trim().toLowerCase());
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="tag-input" onClick={() => setOpen(true)}>
        {values.map((t, i) => (
          <span key={t + i} className="chip">
            {t}<span className="chip-x" onClick={e => { e.stopPropagation(); onChange(values.filter((_, j) => j !== i)); }}><AeIc.x /></span>
          </span>
        ))}
        <input
          value={draft} placeholder={values.length ? '' : placeholder}
          onFocus={() => setOpen(true)}
          onChange={e => { setDraft(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); }
            else if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
          }}
        />
      </div>
      {open && (avail.length > 0 || (draft.trim() && !exactExists)) && (
        <div className="menu" style={{ width: '100%' }}>
          {draft.trim() && !exactExists && (
            <div className="menu-item add" onClick={() => add(draft)}>
              <AeIc.plus size={14} />{'Add “' + draft.trim() + '”'}
            </div>
          )}
          {avail.slice(0, 30).map(o => (
            <div key={o} className="menu-item" onClick={() => { add(o); }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== title autocomplete (prefill existing) ===== */
function TitleAutocomplete({ value, onChange, onPick, linkedTitle }) {
  const db = useCatalog();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function f(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  const all = db.listMedia();
  const q = value.trim().toLowerCase();
  const matches = q ? all.filter(m => m.title.toLowerCase().includes(q) && m.title !== linkedTitle).slice(0, 8) : [];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="input" value={value} placeholder={'Start typing… pick an existing title to edit it'}
        onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <div className="menu" style={{ width: '100%', maxHeight: 320 }}>
          <div className="menu-cap">{'Existing titles — select to edit (avoids duplicates)'}</div>
          {matches.map(m => (
            <div
              key={m.id} className="menu-item" style={{ gap: 10 }}
              onClick={() => { onPick(m.id); setOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Poster media={m} w={26} h={36} radius={4} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink)' }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{(m.year || '') + ' · ' + db.filesCount(m.id) + (m.type === 'series' ? ' episodes' : ' files')}</div>
                </div>
              </div>
              <TypeBadge type={m.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== media previews (right column) ===== */
export function ImagePreview({ url }) {
  const [status, setStatus] = useState('idle');
  useEffect(() => { setStatus(url && url.trim() ? 'loading' : 'idle'); }, [url]);
  if (!url || !url.trim()) {
    return (
      <div className="prev-pane empty">
        <AeIc.uploadCloud size={24} />
        <span>Paste a poster image URL to preview</span>
      </div>
    );
  }
  return (
    <div className="prev-pane">
      <img src={url} alt="poster" style={{ display: status === 'ok' ? 'block' : 'none' }} onLoad={() => setStatus('ok')} onError={() => setStatus('error')} />
      {status === 'loading' && <div className="prev-state"><div className="spinner" /><span>{'Loading…'}</span></div>}
      {status === 'error' && <div className="prev-state err"><AeIc.alert size={20} /><span>{'Couldn’t load this image. Check the URL is public & direct.'}</span></div>}
    </div>
  );
}
export function VideoPreview({ url }) {
  const [status, setStatus] = useState('loading');
  useEffect(() => { setStatus('loading'); }, [url]);
  const kind = classifyUrl(url);
  if (!url || !url.trim()) {
    return (
      <div className="prev-pane empty">
        <AeIc.video size={24} />
        <span>Add or focus a file link to preview the video</span>
      </div>
    );
  }
  return (
    <div className="prev-pane dark">
      {kind === 'image'
        ? <img src={url} style={{ display: status === 'error' ? 'none' : 'block' }} onLoad={() => setStatus('ok')} onError={() => setStatus('error')} />
        : <video src={url} controls preload="metadata" style={{ display: status === 'error' ? 'none' : 'block' }} onLoadedData={() => setStatus('ok')} onError={() => setStatus('error')} />}
      {status === 'loading' && <div className="prev-state"><div className="spinner" /><span>{'Checking link…'}</span></div>}
      {status === 'error' && <div className="prev-state err"><AeIc.alert size={20} /><span>{'This link didn’t load as a ' + (kind === 'image' ? 'image' : 'video') + '. Verify it’s a direct, public media URL.'}</span></div>}
    </div>
  );
}

/* ===== one file/part/episode card ===== */
function FileCard({ file, type, active, isNew, onChange, onRemove, onAddPart, onFocusPreview, onDone, onCollapse }) {
  const set = (k, v) => onChange({ ...file, [k]: v });
  const kind = classifyUrl(file.download_url);
  const noun = type === 'series' ? 'EPISODE' : 'PART';
  const hasLabel = (file.label || '').trim().length > 0;
  const hasUrl = (file.download_url || '').trim().length > 0;
  const ready = hasLabel && hasUrl;
  return (
    <div className={'file-edit-card' + (active ? ' active' : '') + (isNew ? ' isnew' : '')}>
      {isNew && (
        <div className="fec-newbar">
          <span className="new-pill">{'NEW ' + noun}</span>
          <span className="fec-newhint">Fill in the details below, then mark it ready.</span>
        </div>
      )}
      <div className="fec-top">
        {type === 'series'
          ? (
            <div className="fec-grid series">
              <MiniField label="Season">
                <input className="input" type="number" value={file.season ?? ''} placeholder="1" onChange={e => set('season', e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
              </MiniField>
              <MiniField label="Episode #">
                <input className="input" type="number" value={file.episode_number ?? ''} placeholder="1" onChange={e => set('episode_number', e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
              </MiniField>
              <MiniField label="Label" grow>
                <input className={'input' + (isNew && !hasLabel ? ' miss' : '')} value={file.label || ''} placeholder="Episode 1 - Title" onChange={e => set('label', e.target.value)} />
              </MiniField>
            </div>
          )
          : (
            <div className="fec-grid movie">
              <MiniField label="Part #">
                <input className="input" type="number" value={file.episode_number ?? ''} placeholder="1" onChange={e => set('episode_number', e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
              </MiniField>
              <MiniField label="Label" grow>
                <input className={'input' + (isNew && !hasLabel ? ' miss' : '')} value={file.label || ''} placeholder="Full Movie / Part 1" onChange={e => set('label', e.target.value)} />
              </MiniField>
            </div>
          )}
        <button className="icon-btn danger" title="Remove" onClick={onRemove}><AeIc.trash /></button>
      </div>
      <div className="fec-url">
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <AeIc.link className="lead" />
          <input className={'input' + (isNew && !hasUrl ? ' miss' : '')} style={{ paddingLeft: 38 }} value={file.download_url || ''} placeholder={'https://… direct video link'} onFocus={onFocusPreview} onChange={e => set('download_url', e.target.value)} />
        </div>
        {file.download_url && kind !== 'empty' && (
          <span className="badge" style={{ alignSelf: 'center', background: hexA(kind === 'video' ? '#2D8EFF' : kind === 'image' ? '#22D3A6' : '#FF8A3D', 0.14), border: '0.5px solid ' + hexA(kind === 'video' ? '#2D8EFF' : kind === 'image' ? '#22D3A6' : '#FF8A3D', 0.42), color: kind === 'video' ? '#2D8EFF' : kind === 'image' ? '#22D3A6' : '#FF8A3D' }}>
            {kind === 'video' ? 'VIDEO' : kind === 'image' ? 'IMAGE' : '?'}
          </span>
        )}
      </div>
      <div className="fec-foot">
        <button className="add-part-link" onClick={onFocusPreview}><AeIc.eye size={13} />{active ? 'Showing in preview' : 'Preview link'}</button>
        <button className="add-part-link" onClick={onAddPart}><AeIc.plus size={13} />{type === 'series' ? 'Add part' : 'Add another part'}</button>
        <div className="grow" />
        {isNew && (
          <button
            className={'btn btn-sm ' + (ready ? 'btn-blue' : 'btn-ghost')} disabled={!ready} onClick={onDone}
            title={ready ? 'Mark this ' + noun.toLowerCase() + ' ready' : 'Add a label and a video link first'}
          ><AeIc.check size={14} />{ready ? 'Mark ready' : 'Needs label & link'}</button>
        )}
        {!isNew && onCollapse && (
          <button className="btn btn-sm btn-ghost" onClick={onCollapse}><AeIc.check size={14} />Done</button>
        )}
      </div>
    </div>
  );
}

/* compact summary row (shown until you click Edit) */
function EpisodeRow({ file, type, active, onEdit, onRemove, onPreview }) {
  const kind = classifyUrl(file.download_url);
  const num = type === 'series' ? ('E' + (file.episode_number != null ? file.episode_number : '•')) : ('P' + (file.episode_number != null ? file.episode_number : '•'));
  const hasUrl = (file.download_url || '').trim().length > 0;
  return (
    <div className={'ep-row' + (active ? ' active' : '')}>
      <span className="ep-row-num">{num}</span>
      <div className="ep-row-main">
        <div className="ep-row-lbl">{file.label || <span style={{ color: 'var(--muted2)' }}>Untitled</span>}</div>
        <div className="ep-row-url">
          {hasUrl
            ? (
              <>
                <span className="badge" style={{ fontSize: 9, padding: '1px 6px', background: hexA(kind === 'video' ? '#2D8EFF' : kind === 'image' ? '#22D3A6' : '#FF8A3D', 0.14), border: '0.5px solid ' + hexA(kind === 'video' ? '#2D8EFF' : kind === 'image' ? '#22D3A6' : '#FF8A3D', 0.42), color: kind === 'video' ? '#2D8EFF' : kind === 'image' ? '#22D3A6' : '#FF8A3D' }}>{kind === 'video' ? 'VIDEO' : kind === 'image' ? 'IMAGE' : '?'}</span>
                <span className="ep-row-link">{file.download_url}</span>
              </>
            )
            : <span style={{ color: 'var(--orange)' }}>No link yet</span>}
        </div>
      </div>
      {hasUrl && <button className="icon-btn" title="Preview link" onClick={onPreview}><AeIc.eye /></button>}
      <button className="icon-btn" title="Edit" onClick={onEdit}><AeIc.edit /></button>
      <button className="icon-btn danger" title="Remove" onClick={onRemove}><AeIc.trash /></button>
    </div>
  );
}
function MiniField({ label, grow, children }) {
  return (
    <div className={'mini-field' + (grow ? ' grow' : '')}>
      <label>{label}</label>{children}
    </div>
  );
}

/* ===== episode sort ===== */
function epTime(f) { return f._touched || (f.created_at ? new Date(f.created_at).getTime() : 0); }
const EP_SORTS = [
  { id: 'ep_asc', label: 'Episode # ↑', cmp: (a, b) => (a.episode_number || 0) - (b.episode_number || 0) },
  { id: 'ep_desc', label: 'Episode # ↓', cmp: (a, b) => (b.episode_number || 0) - (a.episode_number || 0) },
  { id: 'recent', label: 'Last modified', cmp: (a, b) => epTime(b) - epTime(a) },
  { id: 'az', label: 'Label A→Z', cmp: (a, b) => (a.label || '').localeCompare(b.label || '') },
];
function EpSortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function f(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  const cur = EP_SORTS.find(o => o.id === value) || EP_SORTS[0];
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button className="ep-sort-btn" onClick={() => setOpen(o => !o)}>
        <AeIc.sliders size={13} /><span>{cur.label}</span><AeIc.chevDown size={13} />
      </button>
      {open && (
        <div className="menu" style={{ right: 0, left: 'auto', minWidth: 158 }}>
          {EP_SORTS.map(o => (
            <div key={o.id} className={'menu-item' + (o.id === value ? ' sel' : '')} onClick={() => { onChange(o.id); setOpen(false); }}>
              {o.label}{o.id === value && <AeIc.check />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function SeasonCard({ season, eps, open, onToggle, epSort, onEpSort, onAddEpisode, renderEp }) {
  const isNewEp = e => !e.id && !e._done;
  const newEps = eps.filter(isNewEp);
  const savedEps = [...eps.filter(e => !isNewEp(e))].sort(EP_SORTS.find(s => s.id === epSort).cmp);
  const peekList = [...newEps, ...savedEps];
  return (
    <div className={'season-card' + (open ? ' open' : '')}>
      <div className="season-head">
        <button className="season-toggle" onClick={onToggle} title={open ? 'Collapse' : 'Expand'}><AeIc.chevRight size={16} /></button>
        <Badge color="purple">{'SEASON ' + season}</Badge>
        <span className="season-count">{eps.length + ' episode' + (eps.length === 1 ? '' : 's')}</span>
        {newEps.length > 0 && <span className="season-newtag">{newEps.length + ' new'}</span>}
        <div className="grow" />
        {open && savedEps.length > 1 && <EpSortMenu value={epSort} onChange={onEpSort} />}
        <button className="add-part-link" onClick={e => { e.stopPropagation(); onAddEpisode(); }}><AeIc.plus size={13} />Add episode</button>
      </div>
      {open
        ? (
          <div className="season-body">
            {newEps.length > 0 && (
              <div className="new-eps">
                <div className="new-eps-cap"><AeIc.plus size={12} />{'New — complete the details, then mark ready'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{newEps.map(f => renderEp(f, true))}</div>
              </div>
            )}
            {savedEps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: newEps.length ? 14 : 0 }}>{savedEps.map(f => renderEp(f, false))}</div>
            )}
            {eps.length === 0 && <div className="season-empty">{'No episodes yet — add the first one below'}</div>}
            <button className="add-block-btn" onClick={onAddEpisode}><AeIc.plus size={15} />{'Add episode to Season ' + season}</button>
          </div>
        )
        : (
          <div className="season-peek" onClick={onToggle}>
            {eps.length === 0
              ? <div className="peek-empty">{'No episodes yet — click to expand and add'}</div>
              : (
                <div className="peek-list">
                  {peekList.slice(0, 4).map(f => (
                    <div key={f._k} className="peek-row">
                      <span className="peek-ep">{'E' + (f.episode_number != null ? f.episode_number : '•')}</span>
                      <span className="peek-lbl">{f.label || 'Untitled'}</span>
                    </div>
                  ))}
                  <div className="peek-fade" />
                </div>
              )}
            <div className="peek-cta"><AeIc.chevDown size={14} />
              {eps.length === 0 ? 'Add episode' : 'Expand to see & edit ' + eps.length + ' episode' + (eps.length === 1 ? '' : 's')}
            </div>
          </div>
        )}
    </div>
  );
}

/* ===== files / episodes editor ===== */
function FilesEditor({ type, files, onChange, activeKey, setActiveKey }) {
  const [openSeasons, setOpenSeasons] = useState(() => new Set());
  const [epSort, setEpSort] = useState('ep_asc');
  const [editingKeys, setEditingKeys] = useState(() => new Set());
  function updateAt(key, next) { onChange(files.map(f => f._k === key ? { ...next, _touched: Date.now() } : f)); }
  function removeAt(key) { onChange(files.filter(f => f._k !== key)); }
  function addFile(seed) { const nf = { _k: fileKey(), label: '', episode_number: null, season: type === 'series' ? 1 : null, download_url: '', _touched: Date.now(), ...seed }; onChange([...files, nf]); setActiveKey(nf._k); return nf; }
  function openSeason(s) { setOpenSeasons(prev => { const n = new Set(prev); n.add(s); return n; }); }
  function toggleSeason(s) { setOpenSeasons(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; }); }
  function markDone(key) { onChange(files.map(f => f._k === key ? { ...f, _done: true } : f)); }
  function startEdit(key) { setEditingKeys(prev => { const n = new Set(prev); n.add(key); return n; }); setActiveKey(key); }
  function stopEdit(key) { setEditingKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); }

  if (type === 'movie') {
    const isNewPart = f => !f.id && !f._done;
    const newParts = files.filter(isNewPart);
    const savedParts = files.filter(f => !isNewPart(f));
    const renderPart = (f, isNew) => (isNew || editingKeys.has(f._k))
      ? (
        <FileCard
          key={f._k} file={f} type="movie" active={f._k === activeKey} isNew={isNew}
          onChange={nf => updateAt(f._k, nf)} onRemove={() => removeAt(f._k)}
          onFocusPreview={() => setActiveKey(f._k)} onDone={() => markDone(f._k)}
          onCollapse={() => stopEdit(f._k)}
          onAddPart={() => addFile({ label: 'Part ' + (files.length + 1), episode_number: files.length + 1 })}
        />
      )
      : (
        <EpisodeRow
          key={f._k} file={f} type="movie" active={f._k === activeKey}
          onEdit={() => startEdit(f._k)} onRemove={() => removeAt(f._k)} onPreview={() => setActiveKey(f._k)}
        />
      );
    return (
      <div>
        {files.length === 0
          ? (
            <div className="empty-dashed" style={{ padding: '26px' }}>
              <div className="ei"><AeIc.video size={22} /></div>
              <div style={{ fontWeight: 600, color: 'var(--muted)' }}>{'No file yet — add the movie link'}</div>
              <Btn variant="ghost" sm icon={<AeIc.plus size={14} />} onClick={() => addFile({ label: 'Full Movie', episode_number: 1 })}>Add file</Btn>
            </div>
          )
          : (
            <>
              {newParts.length > 0 && (
                <div className="new-eps">
                  <div className="new-eps-cap"><AeIc.plus size={12} />{'New — paste the link, then mark ready'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{newParts.map(f => renderPart(f, true))}</div>
                </div>
              )}
              {savedParts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: newParts.length ? 14 : 0 }}>{savedParts.map(f => renderPart(f, false))}</div>
              )}
            </>
          )}
        <button className="add-block-btn" onClick={() => addFile({ label: 'Part ' + (files.length + 1), episode_number: files.length + 1 })}>
          <AeIc.plus size={15} />Add part / file
        </button>
      </div>
    );
  }

  const seasons = [...new Set(files.map(f => f.season || 1))].sort((a, b) => a - b);
  if (seasons.length === 0) seasons.push(1);
  function addEpisode(season) {
    const eps = files.filter(f => (f.season || 1) === season);
    const maxEp = eps.reduce((m, f) => Math.max(m, f.episode_number || 0), 0);
    addFile({ season, episode_number: maxEp + 1, label: 'Episode ' + (maxEp + 1) + ' - ' });
    openSeason(season);
  }
  function addSeason() {
    const next = Math.max(0, ...seasons) + 1;
    addFile({ season: next, episode_number: 1, label: 'Episode 1 - ' });
    openSeason(next);
  }
  return (
    <div>
      {seasons.map(season => {
        const eps = files.filter(f => (f.season || 1) === season);
        return (
          <SeasonCard
            key={season} season={season} eps={eps} open={openSeasons.has(season)}
            onToggle={() => toggleSeason(season)} epSort={epSort} onEpSort={setEpSort}
            onAddEpisode={() => addEpisode(season)}
            renderEp={(f, isNew) => (isNew || editingKeys.has(f._k))
              ? (
                <FileCard
                  key={f._k} file={f} type="series" active={f._k === activeKey} isNew={isNew}
                  onChange={nf => updateAt(f._k, nf)} onRemove={() => removeAt(f._k)}
                  onFocusPreview={() => setActiveKey(f._k)} onDone={() => markDone(f._k)}
                  onCollapse={() => stopEdit(f._k)}
                  onAddPart={() => { addFile({ season: f.season, episode_number: f.episode_number, label: (f.label || 'Episode ' + f.episode_number) + ' - Part 2', download_url: '' }); openSeason(f.season); }}
                />
              )
              : (
                <EpisodeRow
                  key={f._k} file={f} type="series" active={f._k === activeKey}
                  onEdit={() => startEdit(f._k)} onRemove={() => removeAt(f._k)} onPreview={() => setActiveKey(f._k)}
                />
              )}
          />
        );
      })}
      <button className="add-block-btn" onClick={addSeason}>
        <AeIc.plus size={15} />Add season
      </button>
    </div>
  );
}

/* ===== main page ===== */
const YEARS = (() => { const y = new Date().getFullYear(); const a = []; for (let i = 0; i <= 10; i++) a.push(String(y - i)); return a; })();

export default function MediaForm({ mediaId: initialMediaId }) {
  const db = useCatalog();
  const { navigate, requestDelete, beginUpload } = useApp();
  const toast = useToast();
  const [mediaId, setMediaId] = useState(() => initialMediaId || null);
  const [form, setForm] = useState(() => {
    if (initialMediaId) { const m = db.getMedia(initialMediaId); return m ? { ...m, year: m.year || '' } : blankMedia(); }
    return blankMedia();
  });
  const [files, setFiles] = useState(() => (initialMediaId ? db.listFiles(initialMediaId).map(f => ({ ...f, _k: fileKey() })) : [{ _k: fileKey(), label: 'Full Movie', episode_number: 1, season: null, download_url: '' }]));
  const [origFileIds, setOrigFileIds] = useState(() => (initialMediaId ? db.listFiles(initialMediaId).map(f => f.id) : []));
  const [activeKey, setActiveKey] = useState(() => null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // option sources
  const countries = db.distinct('country');
  const djs = db.distinct('dj');
  const genreOpts = db.distinctArray('genres');
  const tagOpts = db.distinctArray('tags');

  function loadMedia(id) {
    const m = db.getMedia(id);
    if (!m) return;
    setMediaId(id);
    setForm({ ...m, year: m.year || '' });
    const fs = db.listFiles(id);
    setFiles(fs.map(f => ({ ...f, _k: fileKey() })));
    setOrigFileIds(fs.map(f => f.id));
    setActiveKey(null);
    toast('Loaded “' + m.title + '” for editing', 'info');
  }
  function startNew() {
    setMediaId(null); setForm(blankMedia());
    setFiles([{ _k: fileKey(), label: 'Full Movie', episode_number: 1, season: null, download_url: '' }]);
    setOrigFileIds([]); setActiveKey(null);
  }

  function onTypeChange(t) {
    if (t === form.type) return;
    set('type', t);
    // if nothing real has been entered yet, swap to the new type's starter card
    const untouched = files.every(f => !f.id && !(f.download_url || '').trim());
    if (files.length === 0 || untouched) {
      const seed = t === 'movie'
        ? [{ _k: fileKey(), label: 'Full Movie', episode_number: 1, season: null, download_url: '' }]
        : [{ _k: fileKey(), label: 'Episode 1 - ', episode_number: 1, season: 1, download_url: '' }];
      setFiles(seed); setActiveKey(seed[0]._k);
    }
  }

  // duplicate hint (only when creating new)
  const dupExists = !mediaId && form.title.trim() && db.listMedia().some(m => m.title.toLowerCase() === form.title.trim().toLowerCase());

  /* Required details before anything is uploaded to Supabase */
  function missingFields() {
    const miss = [];
    if (!form.title.trim()) miss.push('Title');
    if (!form.description.trim()) miss.push('Description');
    if (!String(form.year || '').trim()) miss.push('Year');
    if (!(form.country || '').trim()) miss.push('Country');
    if (!form.genres.length) miss.push('At least one genre');
    if (!(form.poster_url || '').trim()) miss.push('Poster image URL');
    const complete = files.filter(f => (f.label || '').trim() && (f.download_url || '').trim());
    if (complete.length === 0) miss.push(form.type === 'series' ? 'At least one episode with a label & video link' : 'At least one file with a label & video link');
    return miss;
  }

  async function save() {
    const miss = missingFields();
    if (miss.length) { toast('Missing required details: ' + miss.join(', '), 'err'); return; }
    const payload = {
      title: form.title, description: form.description, type: form.type,
      year: form.year ? parseInt(form.year, 10) : null, country: form.country, dj: form.dj,
      genres: form.genres, tags: form.tags, poster_url: form.poster_url,
      view_count: parseInt(form.view_count, 10) || 0, download_count: parseInt(form.download_count, 10) || 0,
    };
    try {
      await beginUpload(mediaId ? 'Saving changes…' : 'Publishing…', async () => {
        let id;
        if (mediaId) { await db.updateMedia(mediaId, payload); id = mediaId; }
        else { id = (await db.insertMedia(payload)).id; }
        const keptIds = new Set(files.filter(f => f.id).map(f => f.id));
        for (const fid of origFileIds) { if (!keptIds.has(fid)) await db.deleteFile(fid); }
        for (const f of files) {
          // don't upload empty starter cards — only complete new files
          if (!f.id && !((f.label || '').trim() && (f.download_url || '').trim())) continue;
          const row = { media_id: id, label: f.label || '', episode_number: f.episode_number ?? null, season: form.type === 'series' ? (f.season ?? null) : null, download_url: f.download_url || '' };
          if (f.id) await db.updateFile(f.id, row); else await db.insertFile(row);
        }
      });
    } catch (e) {
      return; // beginUpload already toasted the failure
    }
    toast(mediaId ? 'Changes saved' : 'Published — now live', 'success');
    navigate('library');
  }

  const activeFile = files.find(f => f._k === activeKey) || files[0];
  const activeUrl = activeFile ? activeFile.download_url : '';

  if (initialMediaId && !db.getMedia(initialMediaId)) {
    return (
      <div className="page page-narrow fade-in">
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Title not found</div>
          <Btn variant="blue" onClick={() => navigate('library')}>Back to Library</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow fade-in">
      {mediaId && (
        <div className="editing-banner">
          <AeIc.edit size={15} />
          <span>{'Editing existing title — '}<b>{form.title}</b>. Changes update this record.</span>
          <div className="grow" />
          <button className="btn btn-ghost btn-sm" onClick={startNew}>Start new instead</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT — form */}
        <div className="card card-pad">
          <SectionDivider label="Type" />
          <Field req help={form.type === 'series' ? 'Series have seasons & episodes (below). Episodes can be split into parts.' : 'Movies are one file, or several if split into parts (below).'}>
            <Segmented
              value={form.type} onChange={onTypeChange}
              options={[{ value: 'movie', label: 'MOVIE' }, { value: 'series', label: 'SERIES' }]}
            />
          </Field>

          <SectionDivider label="Basic Info" />
          <Field label="Title" req help="Type to search the catalog. Pick a match to edit it (no duplicates), or keep typing to create a new title.">
            <TitleAutocomplete value={form.title} onChange={v => set('title', v)} onPick={loadMedia} linkedTitle={mediaId ? form.title : null} />
          </Field>
          {dupExists && (
            <div className="dup-hint">
              <AeIc.alert size={14} />{'A title with this exact name already exists — select it above to edit instead of creating a duplicate.'}
            </div>
          )}
          <Field label="Description" req>
            <textarea className="textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder={'Brief synopsis of the content…'} />
          </Field>

          <SectionDivider label="Metadata" />
          <div className="row2">
            <Field label="Year" req>
              <FieldSelect value={form.year ? String(form.year) : ''} onChange={v => set('year', v)} options={YEARS} placeholder="Select year" numeric />
            </Field>
            <Field label="Country" req>
              <FieldSelect value={form.country} onChange={v => set('country', v)} options={countries} placeholder="Select country" />
            </Field>
          </div>
          <Field label="DJ" help={"Displayed as 'DJ {name}' in the app"}>
            <FieldSelect value={form.dj} onChange={v => set('dj', v)} options={djs} placeholder="Select DJ" />
          </Field>

          <SectionDivider label="Categorization" />
          <Field label="Genres" req help="Pick from existing or add custom.">
            <FieldMultiSelect values={form.genres} onChange={v => set('genres', v)} options={genreOpts} placeholder={'Search or add a genre…'} />
          </Field>
          <Field label="Tags" help="Pick from existing or add custom.">
            <FieldMultiSelect values={form.tags} onChange={v => set('tags', v)} options={tagOpts} placeholder={'Search or add a tag…'} />
          </Field>

          <SectionDivider label="Poster" />
          <Field label="Poster image URL" req help={'We don’t host files — paste a direct, public image link. The preview (right) confirms it loads.'}>
            <div className="input-icon-wrap">
              <AeIc.link className="lead" />
              <input className="input" style={{ paddingLeft: 38 }} value={form.poster_url} onChange={e => set('poster_url', e.target.value)} placeholder={'https://…/poster.jpg'} />
            </div>
          </Field>

          <SectionDivider label={form.type === 'series' ? 'Episodes' : 'Movie Files'} />
          <div className="field-help" style={{ marginTop: -6, marginBottom: 14 }}>
            {form.type === 'series'
              ? 'Each episode is one MediaFile (season, episode #, label, link). Split an episode into parts with “Add part”. Focus a link to preview it on the right.'
              : 'A movie is one MediaFile, or several if split into parts. Focus a link to preview it on the right.'}
          </div>
          <FilesEditor type={form.type} files={files} onChange={setFiles} activeKey={activeKey} setActiveKey={setActiveKey} />

          {mediaId && (
            <>
              <SectionDivider label="Stats" />
              <div className="row2">
                <Field label="View Count">
                  <TextInput type="number" value={form.view_count} onChange={e => set('view_count', e.target.value)} />
                </Field>
                <Field label="Download Count">
                  <TextInput type="number" value={form.download_count} onChange={e => set('download_count', e.target.value)} />
                </Field>
              </div>
              <div className="field-help" style={{ marginTop: -6 }}>These are normally auto-incremented by the app.</div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <Btn variant="ghost" onClick={() => navigate('library')}>Cancel</Btn>
            {mediaId && <Btn variant="danger" icon={<AeIc.trash size={15} />} onClick={() => requestDelete(db.getMedia(mediaId))}>Delete</Btn>}
            <div className="grow" />
            <button className="btn btn-blue" style={{ fontWeight: 800, paddingLeft: 22, paddingRight: 22 }} onClick={() => save()}>
              {mediaId ? 'Save Changes' : 'Publish'}<AeIc.chevRight size={16} />
            </button>
          </div>
        </div>

        {/* RIGHT — two previews */}
        <div className="sticky-side">
          <div className="prev-block">
            <div className="prev-head">
              <span className="prev-title">Poster image</span>
              <span className="prev-sub">{form.poster_url ? 'from URL' : 'no URL'}</span>
            </div>
            <ImagePreview url={form.poster_url} />
          </div>
          <div className="prev-block" style={{ marginTop: 16 }}>
            <div className="prev-head">
              <span className="prev-title">Video link</span>
              <span className="prev-sub">{activeFile ? (activeFile.label || 'file') : 'no file'}</span>
            </div>
            <VideoPreview url={activeUrl} />
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 }}>
            {'Previews verify your links resolve to a real image / video. Focus any file’s link on the left to preview it here.'}
          </div>
        </div>
      </div>
    </div>
  );
}
