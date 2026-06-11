'use client';
/* SINEMAX — Import & Approve: inspect drawer (view + edit-before-approve).
   Reuses ImagePreview / VideoPreview / FieldSelect / FieldMultiSelect
   from the Add/Edit page. */
import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/icons';
import {
  fmtDate, djLabel, Badge, TypeBadge, Btn, Field, TextInput,
  useToast, SectionDivider,
} from '@/components/ui';
import { ImagePreview, VideoPreview, FieldSelect, FieldMultiSelect } from '@/components/media-form';
import { useCatalog } from '@/lib/catalog';

const DrIc = Icons;

export function DrawerMetaCell({ k, v }) {
  return (
    <div className="iq-meta-cell">
      <span className="k">{k}</span>
      <span className="v">{v || '—'}</span>
    </div>
  );
}

/* one read-only file row inside the drawer */
export function DrawerFileRow({ file, type, active, onPreview }) {
  const num = type === 'series' ? 'E' + (file.episode_number ?? '•') : 'P' + (file.episode_number ?? '•');
  return (
    <div className={'ep-row' + (active ? ' active' : '')}>
      <span className="ep-row-num">{num}</span>
      <div className="ep-row-main">
        <div className="ep-row-lbl">{file.label || 'Untitled'}</div>
        <div className="ep-row-url"><span className="ep-row-link">{file.download_url}</span></div>
      </div>
      <button className="icon-btn" title="Check this video link loads" onClick={onPreview}><DrIc.eye /></button>
    </div>
  );
}

/* collapsible season group (read-only) */
export function DrawerSeason({ season, eps, type, open, onToggle, activeIdx, onPreview }) {
  return (
    <div className={'season-card' + (open ? ' open' : '')}>
      <div className="season-head" style={{ cursor: 'pointer' }} onClick={onToggle}>
        <button className="season-toggle" title={open ? 'Collapse' : 'Expand'}><DrIc.chevRight size={16} /></button>
        {season != null ? <Badge color="purple">{'SEASON ' + season}</Badge> : <Badge color="blue">FILES</Badge>}
        <span className="season-count">{eps.length + (type === 'series' ? ' episode' : ' file') + (eps.length === 1 ? '' : 's')}</span>
      </div>
      {open && (
        <div className="season-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {eps.map(e => (
            <DrawerFileRow key={e._idx} file={e} type={type} active={e._idx === activeIdx} onPreview={() => onPreview(e._idx)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- edit mode: one editable file row ---------- */
export function EditFileRow({ file, type, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...file, [k]: v });
  const intOr = (v) => (v === '' ? null : parseInt(v, 10));
  return (
    <div className="file-edit-card">
      <div className="fec-top">
        <div className={'fec-grid ' + type}>
          {type === 'series' && (
            <div className="mini-field">
              <label>Season</label>
              <input className="input" type="number" value={file.season ?? ''} onChange={e => set('season', intOr(e.target.value))} />
            </div>
          )}
          <div className="mini-field">
            <label>{type === 'series' ? 'Episode #' : 'Part #'}</label>
            <input className="input" type="number" value={file.episode_number ?? ''} onChange={e => set('episode_number', intOr(e.target.value))} />
          </div>
          <div className="mini-field grow">
            <label>Label</label>
            <input className="input" value={file.label || ''} onChange={e => set('label', e.target.value)} />
          </div>
        </div>
        <button className="icon-btn danger" title="Remove file" onClick={onRemove}><DrIc.trash /></button>
      </div>
      <div className="fec-url">
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <DrIc.link className="lead" />
          <input className="input" style={{ paddingLeft: 38 }} value={file.download_url || ''} placeholder="https://… direct video link" onChange={e => set('download_url', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/* ---------- main drawer ---------- */
export function ImportDrawer({ item, plan, onClose, onApprove, onReject, onSave }) {
  const db = useCatalog();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [previewIdx, setPreviewIdx] = useState(null);
  const [openSeasons, setOpenSeasons] = useState(() => new Set([null, 1]));
  useEffect(() => { setEditing(false); setDraft(null); setPreviewIdx(null); setOpenSeasons(new Set([null, 1])); }, [item && item.qid]);
  if (!item) return null;

  const view = editing && draft ? draft : item;
  const filesIdx = view.files.map((f, i) => ({ ...f, _idx: i }));
  const seasons = view.type === 'series'
    ? [...new Set(filesIdx.map(f => f.season ?? 1))].sort((a, b) => a - b)
    : [null];
  const previewFile = previewIdx != null ? view.files[previewIdx] : null;
  const merge = plan && plan.mode === 'merge';

  function startEdit() { setDraft(JSON.parse(JSON.stringify(item))); setEditing(true); }
  function setD(k, v) { setDraft(d => ({ ...d, [k]: v })); }
  function saveDraft() {
    if (!draft.title.trim()) { toast('Title is required', 'err'); return; }
    const bad = draft.files.findIndex(f => !(f.label || '').trim() || !(f.download_url || '').trim());
    if (bad >= 0) { toast('File ' + (bad + 1) + ' needs a label and a link', 'err'); return; }
    onSave(item.qid, draft);
    setEditing(false); setDraft(null);
    toast('Pending item updated — not yet in the catalog', 'info');
  }
  function toggleSeason(s) { setOpenSeasons(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; }); }

  const countries = db.distinct('country');
  const djs = db.distinct('dj');
  const genreOpts = db.distinctArray('genres');
  const tagOpts = db.distinctArray('tags');

  return (
    <div className="iq-drawer card" data-screen-label="Import inspect drawer">
      <div className="iq-drawer-head">
        <div style={{ minWidth: 0 }}>
          <div className="iq-drawer-title">{view.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <TypeBadge type={view.type} />
            {merge
              ? <Badge color="gold" icon={<DrIc.layers size={12} />}>{'EXISTS · +' + plan.addFiles.length + ' NEW'}</Badge>
              : <Badge color="teal">NEW TITLE</Badge>}
          </div>
        </div>
        <button className="icon-btn" title="Close" onClick={onClose}><DrIc.x /></button>
      </div>

      <div className="iq-drawer-body">
        {merge && (
          <div className="iq-merge-note">
            <DrIc.layers size={15} />
            <span>
              {'“' + plan.existing.title + '” is already in the catalog. Approving will add '}
              <b>{plan.addFiles.length + ' new ' + (view.type === 'series' ? 'episode' : 'part') + (plan.addFiles.length === 1 ? '' : 's')}</b>
              {' to it'}{plan.skipCount > 0 ? ' — ' + plan.skipCount + ' already exist and will be skipped' : ''}{'. No duplicate title will be created.'}
            </span>
          </div>
        )}

        {!editing ? (
          <React.Fragment>
            <SectionDivider label="Poster check" />
            <ImagePreview url={view.poster_url} />

            <SectionDivider label="Details" />
            {view.description
              ? <p className="iq-desc">{view.description}</p>
              : <p className="iq-desc dim">No description provided.</p>}
            <div className="iq-meta-grid">
              <DrawerMetaCell k="Year" v={view.year} />
              <DrawerMetaCell k="Country" v={view.country} />
              <DrawerMetaCell k="DJ" v={djLabel(view.dj)} />
              <DrawerMetaCell k="Imported" v={fmtDate(view.imported_at)} />
            </div>
            {(view.genres.length > 0 || view.tags.length > 0) && (
              <div className="iq-chips">
                {view.genres.map(g => <span key={'g' + g} className="chip">{g}</span>)}
                {view.tags.map(t => <span key={'t' + t} className="chip" style={{ color: 'var(--blueBright)' }}>#{t}</span>)}
              </div>
            )}

            <SectionDivider label={(view.type === 'series' ? 'Episodes' : 'Files') + ' · ' + view.files.length} />
            {seasons.map(s => {
              const eps = filesIdx.filter(f => (view.type === 'series' ? (f.season ?? 1) === s : true));
              return (
                <DrawerSeason key={String(s)} season={view.type === 'series' ? s : null} eps={eps} type={view.type}
                  open={openSeasons.has(s)} onToggle={() => toggleSeason(s)}
                  activeIdx={previewIdx} onPreview={setPreviewIdx} />
              );
            })}

            <SectionDivider label="Video link check" />
            <div className="prev-block">
              <div className="prev-head">
                <span className="prev-title">Video link</span>
                <span className="prev-sub">{previewFile ? (previewFile.label || 'file') : 'pick a file above'}</span>
              </div>
              <VideoPreview url={previewFile ? previewFile.download_url : ''} />
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="iq-edit-note"><DrIc.edit size={14} /><span>Editing the <b>pending</b> item — changes save back to the queue, not to the catalog.</span></div>
            <Field label="Title" req={true}><TextInput value={draft.title} onChange={e => setD('title', e.target.value)} /></Field>
            <Field label="Description"><textarea className="textarea" rows={3} value={draft.description} onChange={e => setD('description', e.target.value)}></textarea></Field>
            <div className="row2">
              <Field label="Year"><FieldSelect value={draft.year ? String(draft.year) : ''} onChange={v => setD('year', v ? parseInt(v, 10) : null)} options={['2026', '2025', '2024', '2023', '2022', '2021', '2020']} placeholder="Year" numeric={true} /></Field>
              <Field label="Country"><FieldSelect value={draft.country} onChange={v => setD('country', v)} options={countries} placeholder="Country" /></Field>
            </div>
            <Field label="DJ" help="Bare name — shown as 'DJ name'"><FieldSelect value={draft.dj} onChange={v => setD('dj', v)} options={djs} placeholder="DJ" /></Field>
            <Field label="Genres"><FieldMultiSelect values={draft.genres} onChange={v => setD('genres', v)} options={genreOpts} placeholder="Add genre…" /></Field>
            <Field label="Tags"><FieldMultiSelect values={draft.tags} onChange={v => setD('tags', v)} options={tagOpts} placeholder="Add tag…" /></Field>
            <Field label="Poster image URL">
              <div className="input-icon-wrap">
                <DrIc.link className="lead" />
                <input className="input" style={{ paddingLeft: 38 }} value={draft.poster_url} onChange={e => setD('poster_url', e.target.value)} placeholder="https://…/poster.jpg" />
              </div>
            </Field>
            <ImagePreview url={draft.poster_url} />
            <SectionDivider label={draft.type === 'series' ? 'Episodes' : 'Files'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draft.files.map((f, i) => (
                <EditFileRow key={i} file={f} type={draft.type}
                  onChange={nf => setD('files', draft.files.map((x, j) => j === i ? nf : x))}
                  onRemove={() => setD('files', draft.files.filter((_, j) => j !== i))} />
              ))}
            </div>
            <button className="add-block-btn" onClick={() => setD('files', [...draft.files, { label: '', season: draft.type === 'series' ? 1 : null, episode_number: draft.files.length + 1, download_url: '' }])}>
              <DrIc.plus size={15} />{draft.type === 'series' ? 'Add episode' : 'Add file'}
            </button>
          </React.Fragment>
        )}
      </div>

      <div className="iq-drawer-foot">
        {!editing ? (
          <React.Fragment>
            <Btn variant="ghost" sm={true} icon={<DrIc.edit size={14} />} onClick={startEdit}>Edit before approving</Btn>
            <Btn variant="danger" sm={true} icon={<DrIc.trash size={14} />} onClick={() => onReject(item)}>Delete</Btn>
            <div className="grow"></div>
            <Btn variant="blue" icon={<DrIc.uploadCloud size={16} />} onClick={() => onApprove(item)}>Approve &amp; upload</Btn>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Btn variant="ghost" sm={true} onClick={() => { setEditing(false); setDraft(null); }}>Discard changes</Btn>
            <div className="grow"></div>
            <Btn variant="blue" icon={<DrIc.check size={16} />} onClick={saveDraft}>Save to pending</Btn>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

export default ImportDrawer;
