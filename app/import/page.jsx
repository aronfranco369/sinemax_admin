'use client';
/* SINEMAX — Page: Import & Approve
   Bulk JSON import -> validation -> pending queue (localStorage) ->
   inspect/edit -> approve (upload into catalog) or reject. */
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '@/components/icons';
import { useApp } from '@/components/shell';
import { useCatalog } from '@/lib/catalog';
import { importQueue } from '@/lib/import-queue';
import {
  fmtDate, djLabel, Poster, Badge, TypeBadge, Btn, IconBtn,
  SearchInput, PillTabs, useToast, Overlay,
} from '@/components/ui';
import { ImportDrawer } from '@/components/import-drawer';

const IqIc = Icons;

const EXAMPLE_JSON = `{
  "version": 1,
  "media": [
    {
      "title": "Mlima wa Moto",
      "type": "movie",
      "description": "A lone ranger returns to settle an old score.",
      "poster_url": "https://example.com/posters/mlima-wa-moto.jpg",
      "country": "Tanzania",
      "year": 2026,
      "dj": "Afro",
      "genres": ["Action", "Thriller"],
      "tags": ["dubbed", "new-release"],
      "files": [
        { "label": "Full Movie", "season": null, "episode_number": 1, "download_url": "https://cdn.example.com/mlima-wa-moto.mp4" }
      ]
    },
    {
      "title": "Nyumba ya Mizimu",
      "type": "series",
      "description": "Secrets surface in an old family house.",
      "poster_url": "https://example.com/posters/nyumba.jpg",
      "country": "Tanzania",
      "year": 2026,
      "dj": "Mark",
      "genres": ["Drama", "Mystery"],
      "tags": ["trending"],
      "files": [
        { "label": "Episode 1 - The Door", "season": 1, "episode_number": 1, "download_url": "https://cdn.example.com/nyumba-s1e1.mp4" },
        { "label": "Episode 2 - The Key", "season": 1, "episode_number": 2, "download_url": "https://cdn.example.com/nyumba-s1e2.mp4" }
      ]
    }
  ]
}`;

/* ---------- import area: drop zone + paste alternative ---------- */
function ImportArea({ onImport, compact }) {
  const toast = useToast();
  const [drag, setDrag] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const fileRef = useRef(null);

  function readFiles(fileList) {
    const f = fileList && fileList[0];
    if (!f) return;
    if (!/\.json$/i.test(f.name) && f.type !== 'application/json') { toast('Please choose a .json file', 'err'); return; }
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result));
    reader.readAsText(f);
  }

  return (
    <div className="iq-import-grid">
      <div
        className={'upload-zone' + (compact ? '' : ' small') + (drag ? ' drag' : '')}
        onClick={() => fileRef.current && fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); readFiles(e.dataTransfer.files); }}
      >
        <div className="uic"><IqIc.uploadCloud /></div>
        <div className="u1">Drop your prepared <b>.json</b> file here, or click to browse</div>
        <div className="u2">Valid items join the pending queue below — nothing touches the catalog until you approve.</div>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }}
          onChange={e => { readFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <div className="iq-paste">
        {!pasteOpen ? (
          <button className="iq-paste-toggle" onClick={() => setPasteOpen(true)}>
            <IqIc.copy size={15} />Or paste JSON instead
          </button>
        ) : (
          <React.Fragment>
            <textarea className="textarea iq-paste-ta" rows={6} value={pasted}
              placeholder={'{ "version": 1, "media": [ … ] }'}
              onChange={e => setPasted(e.target.value)}></textarea>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" sm={true} onClick={() => { setPasteOpen(false); setPasted(''); }}>Cancel</Btn>
              <Btn variant="blue" sm={true} disabled={!pasted.trim()}
                onClick={() => { onImport(pasted); setPasted(''); setPasteOpen(false); }}>Validate &amp; add to queue</Btn>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* ---------- validation report ---------- */
function ImportReport({ report, onDismiss }) {
  if (!report) return null;
  const ok = report.errors.length === 0;
  return (
    <div className={'iq-report' + (ok ? ' ok' : '')}>
      <div className="iq-report-head">
        {ok ? <IqIc.check size={16} /> : <IqIc.alert size={16} />}
        <span>
          {report.added} of {report.total} item{report.total === 1 ? '' : 's'} parsed OK and added to the queue
          {report.skipped.length > 0 ? ' · ' + report.skipped.length + ' skipped (already pending)' : ''}
          {report.errors.length > 0 ? ' · ' + report.errors.length + ' problem' + (report.errors.length === 1 ? '' : 's') : ''}
        </span>
        <div className="grow"></div>
        <button className="icon-btn" title="Dismiss" onClick={onDismiss}><IqIc.x /></button>
      </div>
      {report.skipped.length > 0 && (
        <div className="iq-report-skips">Skipped — already in the pending queue: {report.skipped.map(t => '“' + t + '”').join(', ')}</div>
      )}
      {report.errors.length > 0 && (
        <ul className="iq-report-errs">
          {report.errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

/* ---------- sortable header cell ---------- */
function SortTh({ label, k, sort, onSort, num }) {
  const active = sort.key === k;
  return (
    <th
      className={(num ? 'num ' : '') + 'sortable' + (active ? ' sorted' : '')}
      onClick={() => onSort(k)}
    >
      {label}
      {active && (
        <span className="sort-ar">
          {sort.dir === 'desc' ? <IqIc.arrowDown size={12} /> : <IqIc.arrowUp size={12} />}
        </span>
      )}
    </th>
  );
}

/* ---------- queue row ---------- */
function QueueRow({ item, plan, selected, onOpen, onApprove, onDelete }) {
  const merge = plan.mode === 'merge';
  return (
    <tr className={selected ? 'selected' : ''} style={{ cursor: 'pointer' }} onClick={onOpen}>
      <td><div className="row-flex">
        <Poster media={item} w={38} h={54} radius={5} />
        <div className="title-cell">
          <span className="t">{item.title}</span>
          {item.description ? <span className="d">{item.description}</span> : null}
        </div>
      </div></td>
      <td><TypeBadge type={item.type} /></td>
      <td className="td-num">{item.year || <span className="dash">{'—'}</span>}</td>
      <td>{item.dj ? djLabel(item.dj) : <span className="dash">{'—'}</span>}</td>
      <td>{item.country || <span className="dash">{'—'}</span>}</td>
      <td className="td-num"><span className="cell-icon-num"><IqIc.video />{item.files.length}</span></td>
      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{fmtDate(item.imported_at)}</td>
      <td>
        {merge
          ? <Badge color="gold" icon={<IqIc.layers size={11} />}>{'EXISTS · +' + plan.addFiles.length + ' NEW'}</Badge>
          : <Badge color="teal">NEW TITLE</Badge>}
      </td>
      <td className="td-actions" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
          <Btn variant="blue" sm={true} icon={<IqIc.uploadCloud size={14} />} onClick={() => onApprove(item)}>Approve</Btn>
          <IconBtn icon={<IqIc.eye />} title="Inspect" onClick={onOpen} />
          <IconBtn icon={<IqIc.trash />} danger={true} title="Delete (remove from queue)" onClick={() => onDelete(item)} />
        </div>
      </td>
    </tr>
  );
}

/* ---------- approve confirm modal (non-destructive, blue) ---------- */
function ApproveModal({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="modal">
        <div className="modal-ic" style={{ background: 'rgba(45,142,255,0.14)', color: 'var(--blue)' }}><IqIc.uploadCloud size={24} /></div>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="modal-actions">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="blue" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- empty state ---------- */
function QueueEmpty({ onCopy }) {
  return (
    <div className="empty-dashed" style={{ padding: '44px 24px' }}>
      <div className="ei"><IqIc.inbox size={24} /></div>
      <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: 20, color: 'var(--muted)', letterSpacing: '0.4px' }}>Nothing awaiting approval</div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', maxWidth: 520, lineHeight: 1.6 }}>
        Prepare your media in bulk as a JSON file ({'{ "version": 1, "media": […] }'}) — each item needs a <b>title</b>, a <b>type</b> (movie / series) and its <b>files</b> with labels and direct video links. Drop the file above to validate and queue it for review.
      </div>
      <Btn variant="ghost" sm={true} icon={<IqIc.copy size={14} />} onClick={onCopy}>Copy example JSON</Btn>
    </div>
  );
}

/* ---------- main page ---------- */
export default function ImportApprove() {
  const db = useCatalog();
  const { beginUpload } = useApp();
  const toast = useToast();
  const [, setTick] = useState(0);
  useEffect(() => importQueue.subscribe(() => setTick(t => t + 1)), []);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [report, setReport] = useState(null);
  const [openQid, setOpenQid] = useState(null);
  const [confirm, setConfirm] = useState(null); // {kind:'approve'|'all', item?}
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  const all = importQueue.list();
  const plans = {};
  all.forEach(i => { plans[i.qid] = importQueue.plan(i, db); });

  const filtered = all.filter(i => {
    if (type !== 'all' && i.type !== type) return false;
    if (q) {
      const hay = (i.title + ' ' + i.dj + ' ' + i.country).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  function setSortKey(key) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' });
  }
  const sorted = !sort.key ? filtered : [...filtered].sort((a, b) => {
    let av, bv;
    switch (sort.key) {
      case 'year': av = a.year || 0; bv = b.year || 0; break;
      case 'files': av = a.files.length; bv = b.files.length; break;
      case 'imported': av = a.imported_at || ''; bv = b.imported_at || ''; break;
      case 'status': av = plans[a.qid].mode; bv = plans[b.qid].mode; break;
      default: av = (a[sort.key] || '').toLowerCase(); bv = (b[sort.key] || '').toLowerCase();
    }
    if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sort.dir === 'asc' ? av - bv : bv - av;
  });

  const openItem = openQid ? all.find(i => i.qid === openQid) : null;

  function doImport(text) {
    const r = importQueue.importJson(text);
    setReport(r);
    if (r.added > 0) toast(r.added + ' item' + (r.added === 1 ? '' : 's') + ' added to the pending queue', 'success');
    else if (r.errors.length) toast('Import failed validation — see the summary', 'err');
    else if (r.skipped.length) toast('All items were already pending — nothing added', 'info');
  }

  function doDelete(item) {
    importQueue.remove(item.qid);
    if (openQid === item.qid) setOpenQid(null);
    toast('“' + item.title + '” deleted — removed from queue', 'info');
  }

  function copyExample() {
    try { navigator.clipboard.writeText(EXAMPLE_JSON); toast('Example JSON copied to clipboard', 'info'); }
    catch (e) { toast('Couldn’t access the clipboard', 'err'); }
  }

  function summarize(item) {
    const p = plans[item.qid] || importQueue.plan(item, db);
    const noun = item.type === 'series' ? 'episode' : (item.files.length === 1 ? 'file' : 'part');
    if (p.mode === 'new') return { title: 'Approve “' + item.title + '”?', body: 'This uploads 1 media + ' + p.addFiles.length + ' ' + noun + (p.addFiles.length === 1 ? '' : 's') + ' to Supabase and publishes it to the Media Library.' };
    let body = 'This adds ' + p.addFiles.length + ' new ' + noun + (p.addFiles.length === 1 ? '' : 's') + ' to the existing “' + p.existing.title + '” — no duplicate title is created.';
    if (p.skipCount > 0) body += ' ' + p.skipCount + ' ' + noun + (p.skipCount === 1 ? '' : 's') + ' already exist and will be skipped.';
    return { title: 'Merge into existing “' + p.existing.title + '”?', body };
  }

  async function runApprove(item) {
    setConfirm(null);
    setOpenQid(null);
    try {
      const res = await beginUpload('Uploading “' + item.title + '”…', async () => importQueue.approve(item.qid, db));
      if (res) {
        toast(res.mode === 'new'
          ? '“' + res.title + '” published — ' + res.added + ' file' + (res.added === 1 ? '' : 's') + ' uploaded'
          : '“' + res.title + '” — ' + res.added + ' new file' + (res.added === 1 ? '' : 's') + ' merged in' + (res.skipped ? ', ' + res.skipped + ' skipped' : ''), 'success');
      }
    } catch (e) { /* beginUpload already toasts the failure */ }
  }

  async function runApproveAll() {
    setConfirm(null);
    setOpenQid(null);
    const list = [...all];
    try {
      const sum = await beginUpload('Uploading ' + list.length + ' pending item' + (list.length === 1 ? '' : 's') + '…', async () => {
        let media = 0, files = 0, merged = 0, skipped = 0;
        for (const i of list) {
          const res = await importQueue.approve(i.qid, db);
          if (!res) continue;
          if (res.mode === 'new') media++; else merged++;
          files += res.added; skipped += res.skipped;
        }
        return { media, files, merged, skipped };
      });
      toast(sum.media + ' new title' + (sum.media === 1 ? '' : 's') + (sum.merged ? ', ' + sum.merged + ' merged' : '') + ' · ' + sum.files + ' files uploaded' + (sum.skipped ? ' · ' + sum.skipped + ' skipped' : ''), 'success');
    } catch (e) { /* beginUpload already toasts the failure */ }
  }

  function approveAllSummary() {
    let media = 0, files = 0, merges = 0, skipped = 0;
    all.forEach(i => {
      const p = plans[i.qid];
      if (p.mode === 'new') media++; else merges++;
      files += p.addFiles.length; skipped += p.skipCount;
    });
    let body = 'This uploads everything in the queue: ' + media + ' new title' + (media === 1 ? '' : 's') + ' and ' + files + ' file' + (files === 1 ? '' : 's') + '.';
    if (merges) body += ' ' + merges + ' item' + (merges === 1 ? '' : 's') + ' will merge into existing titles.';
    if (skipped) body += ' ' + skipped + ' duplicate file' + (skipped === 1 ? '' : 's') + ' will be skipped.';
    return body;
  }

  return (
    <div className={'page fade-in' + (openItem ? ' iq-has-drawer' : '')} data-screen-label="Import & Approve">
      <ImportArea onImport={doImport} compact={all.length > 0} />
      <ImportReport report={report} onDismiss={() => setReport(null)} />

      <div className="toolbar" style={{ marginTop: 22 }}>
        <SearchInput value={q} onChange={setQ} placeholder={'Search pending by title, DJ, country…'} width={300} />
        <PillTabs value={type} onChange={setType}
          options={[{ value: 'all', label: 'All' }, { value: 'movie', label: 'Movies' }, { value: 'series', label: 'Series' }]} />
        <div className="grow"></div>
        <span className="results-count">{all.length} awaiting approval</span>
        {all.length > 1 && (
          <Btn variant="blue" sm={true} icon={<IqIc.uploadCloud size={14} />} onClick={() => setConfirm({ kind: 'all' })}>Approve all ({all.length})</Btn>
        )}
      </div>

      {all.length === 0 ? (
        <QueueEmpty onCopy={copyExample} />
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr>
              <SortTh label="Title" k="title" sort={sort} onSort={setSortKey} />
              <SortTh label="Type" k="type" sort={sort} onSort={setSortKey} />
              <SortTh label="Year" k="year" sort={sort} onSort={setSortKey} num />
              <SortTh label="DJ" k="dj" sort={sort} onSort={setSortKey} />
              <SortTh label="Country" k="country" sort={sort} onSort={setSortKey} />
              <SortTh label="Files" k="files" sort={sort} onSort={setSortKey} num />
              <SortTh label="Imported" k="imported" sort={sort} onSort={setSortKey} />
              <SortTh label="Status" k="status" sort={sort} onSort={setSortKey} />
              <th></th>
            </tr></thead>
            <tbody>
              {sorted.map(item => (
                <QueueRow key={item.qid} item={item} plan={plans[item.qid]} selected={item.qid === openQid}
                  onOpen={() => setOpenQid(item.qid)}
                  onApprove={it => setConfirm({ kind: 'approve', item: it })}
                  onDelete={doDelete} />
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 28, color: 'var(--muted2)' }}>No pending items match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {openItem && (
        <ImportDrawer item={openItem} plan={plans[openItem.qid]}
          onClose={() => setOpenQid(null)}
          onApprove={it => setConfirm({ kind: 'approve', item: it })}
          onReject={doDelete}
          onSave={(qid2, draft) => importQueue.update(qid2, draft)} />
      )}

      {confirm && confirm.kind === 'approve' && (
        <ApproveModal {...summarize(confirm.item)} confirmLabel="Approve & upload"
          onCancel={() => setConfirm(null)} onConfirm={() => runApprove(confirm.item)} />
      )}
      {confirm && confirm.kind === 'all' && (
        <ApproveModal title={'Approve all ' + all.length + ' pending items?'} body={approveAllSummary()}
          confirmLabel="Approve all" onCancel={() => setConfirm(null)} onConfirm={runApproveAll} />
      )}
    </div>
  );
}
