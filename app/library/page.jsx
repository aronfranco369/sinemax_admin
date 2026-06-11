'use client';
/* SINEMAX — Page 2: Media Library */
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '@/components/icons';
import { useApp } from '@/components/shell';
import { useCatalog } from '@/lib/catalog';
import { fmtNum, fmtDate, djLabel, Poster, TypeBadge, Btn, IconBtn, SearchInput, DropdownChip, PillTabs, TableWrap } from '@/components/ui';

const MlIc = Icons;

const LIB_SORT_OPTS = [
  { id: 'new', label: 'Date added · Newest', key: 'created_at', dir: 'desc' },
  { id: 'old', label: 'Date added · Oldest', key: 'created_at', dir: 'asc' },
  { id: 'upd', label: 'Recently updated', key: 'updated_at', dir: 'desc' },
  { id: 'az', label: 'Title · A → Z', key: 'title', dir: 'asc' },
  { id: 'za', label: 'Title · Z → A', key: 'title', dir: 'desc' },
  { id: 'yr', label: 'Year · Newest', key: 'year', dir: 'desc' },
  { id: 'vw', label: 'Views · High → Low', key: 'view_count', dir: 'desc' },
  { id: 'dl', label: 'Downloads · High → Low', key: 'download_count', dir: 'desc' },
];

function libCompare(a, b, key, dir) {
  let av, bv;
  switch (key) {
    case 'title': av = (a.title || '').toLowerCase(); bv = (b.title || '').toLowerCase(); break;
    case 'year': av = a.year || 0; bv = b.year || 0; break;
    case 'view_count': av = a.view_count || 0; bv = b.view_count || 0; break;
    case 'download_count': av = a.download_count || 0; bv = b.download_count || 0; break;
    case 'updated_at': av = new Date(a.updated_at || a.created_at); bv = new Date(b.updated_at || b.created_at); break;
    default: av = new Date(a.created_at); bv = new Date(b.created_at);
  }
  if (av < bv) return dir === 'asc' ? -1 : 1;
  if (av > bv) return dir === 'asc' ? 1 : -1;
  return 0;
}

function SortChip({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const cur = LIB_SORT_OPTS.find(o => o.id === value) || LIB_SORT_OPTS[0];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="dropdown-chip set" onClick={() => setOpen(o => !o)} style={{ height: 36 }}>
        <MlIc.sliders size={14} />
        <span>{'Sort: ' + cur.label}</span>
        <MlIc.chevDown className="caret" />
      </button>
      {open && (
        <div className="menu" style={{ right: 0, left: 'auto', minWidth: 210 }}>
          {LIB_SORT_OPTS.map(o => (
            <div
              key={o.id} className={'menu-item' + (o.id === value ? ' sel' : '')}
              onClick={() => { onChange(o.id); setOpen(false); }}
            >
              {o.label}{o.id === value && <MlIc.check />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MediaLibrary() {
  const db = useCatalog();
  const { navigate, requestDelete, requestBulkDelete } = useApp();
  const all = db.listMedia();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [country, setCountry] = useState('');
  const [year, setYear] = useState('');
  const [dj, setDj] = useState('');
  const [sortId, setSortId] = useState('new');
  const [selected, setSelected] = useState(new Set());

  const sortOpt = LIB_SORT_OPTS.find(o => o.id === sortId) || LIB_SORT_OPTS[0];

  const countries = db.distinct('country');
  const years = [...new Set(all.map(m => m.year))].filter(Boolean).sort((a, b) => b - a).map(String);
  const djs = db.distinct('dj').map(d => 'DJ ' + d);

  const filtered = all.filter(m => {
    if (type !== 'all' && m.type !== type) return false;
    if (country && m.country !== country) return false;
    if (year && String(m.year) !== year) return false;
    if (dj && ('DJ ' + m.dj) !== dj) return false;
    if (q) {
      const s = q.toLowerCase();
      const hay = (m.title + ' ' + m.dj + ' ' + m.country + ' ' + m.genres.join(' ')).toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
  const sorted = [...filtered].sort((a, b) => libCompare(a, b, sortOpt.key, sortOpt.dir));

  // clicking a column header selects the matching sort (toggles direction where it makes sense)
  function headerSort(key, pair) {
    // pair: [descId, ascId]
    setSortId(prev => prev === pair[0] ? pair[1] : pair[0]);
  }
  function sortArrow(keys) {
    if (!keys.includes(sortId)) return null;
    return (
      <span className="sort-ar">
        {sortOpt.dir === 'desc' ? <MlIc.arrowDown size={12} /> : <MlIc.arrowUp size={12} />}
      </span>
    );
  }

  const hasFilters = q || type !== 'all' || country || year || dj;
  function clearFilters() { setQ(''); setType('all'); setCountry(''); setYear(''); setDj(''); }

  function toggle(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const allVisibleSelected = filtered.length > 0 && filtered.every(m => selected.has(m.id));
  function toggleAll() {
    setSelected(prev => {
      const n = new Set(prev);
      if (allVisibleSelected) filtered.forEach(m => n.delete(m.id));
      else filtered.forEach(m => n.add(m.id));
      return n;
    });
  }

  const selCount = selected.size;

  return (
    <div className="page fade-in">
      {/* toolbar */}
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder={'Search by title, DJ, country…'} width={320} />
        <PillTabs
          value={type} onChange={setType}
          options={[{ value: 'all', label: 'All' }, { value: 'movie', label: 'Movie' }, { value: 'series', label: 'Series' }]}
        />
        <DropdownChip label="Country" value={country} options={countries} onChange={setCountry} />
        <DropdownChip label="Year" value={year} options={years} onChange={setYear} />
        <DropdownChip label="DJ" value={dj} options={djs} onChange={setDj} />
        <SortChip value={sortId} onChange={setSortId} />
        <div className="grow" />
        {hasFilters && <Btn variant="red-ghost" sm icon={<MlIc.x size={15} />} onClick={clearFilters}>Clear filters</Btn>}
        <Btn variant="blue" icon={<MlIc.plus />} onClick={() => navigate('add')}>Add New Media</Btn>
      </div>
      <div className="results-count" style={{ marginBottom: 14 }}>
        {filtered.length + ' title' + (filtered.length === 1 ? '' : 's') + (hasFilters ? ' · filtered' : '')}
      </div>

      {/* bulk bar */}
      {selCount > 0 && (
        <div className="bulk-bar">
          <span className="cnt">{selCount + ' selected'}</span>
          <div className="grow" />
          <Btn variant="danger" sm icon={<MlIc.trash size={15} />} onClick={() => requestBulkDelete([...selected], () => setSelected(new Set()))}>Delete Selected</Btn>
          <Btn variant="ghost" sm onClick={() => setSelected(new Set())}>Clear Selection</Btn>
        </div>
      )}

      {/* table or empty */}
      {filtered.length === 0
        ? <EmptyLibrary hasFilters={hasFilters} onClear={clearFilters} onAdd={() => navigate('add')} />
        : (
          <div className="card" style={{ padding: 0 }}>
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" className="cbx" checked={allVisibleSelected} onChange={toggleAll} />
                    </th>
                    <th>Poster</th>
                    <th className={'sortable' + (['az', 'za'].includes(sortId) ? ' sorted' : '')} onClick={() => headerSort('title', ['za', 'az'])}>Title{sortArrow(['az', 'za'])}</th>
                    <th>Type</th>
                    <th>Country</th>
                    <th>DJ</th>
                    <th className={'sortable' + (sortId === 'yr' ? ' sorted' : '')} onClick={() => headerSort('year', ['yr', 'yr'])}>Year{sortArrow(['yr'])}</th>
                    <th>Genres</th>
                    <th className={'num sortable' + (sortId === 'vw' ? ' sorted' : '')} onClick={() => headerSort('view_count', ['vw', 'vw'])}>Views{sortArrow(['vw'])}</th>
                    <th className={'num sortable' + (sortId === 'dl' ? ' sorted' : '')} onClick={() => headerSort('download_count', ['dl', 'dl'])}>Downloads{sortArrow(['dl'])}</th>
                    <th>Files</th>
                    <th className={'sortable' + (['new', 'old', 'upd'].includes(sortId) ? ' sorted' : '')} onClick={() => headerSort('created_at', ['new', 'old'])}>Added{sortArrow(['new', 'old', 'upd'])}</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(m => {
                    const fc = db.filesCount(m.id);
                    const isSel = selected.has(m.id);
                    return (
                      <tr key={m.id} className={isSel ? 'selected' : ''}>
                        <td><input type="checkbox" className="cbx" checked={isSel} onChange={() => toggle(m.id)} /></td>
                        <td><Poster media={m} w={32} h={44} radius={4} /></td>
                        <td>
                          <div className="title-cell">
                            <span className="t">{m.title}</span>
                            <span className="d">{m.description}</span>
                          </div>
                        </td>
                        <td><TypeBadge type={m.type} /></td>
                        <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{m.country}</td>
                        <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{djLabel(m.dj)}</td>
                        <td style={{ color: 'var(--muted)' }}>{m.year}</td>
                        <td><GenreChips genres={m.genres} /></td>
                        <td className="td-num"><span className="cell-icon-num"><MlIc.eye size={13} />{fmtNum(m.view_count)}</span></td>
                        <td className="td-num"><span className="cell-icon-num"><MlIc.download size={13} />{fmtNum(m.download_count)}</span></td>
                        <td>
                          {fc > 0
                            ? <span className="link-blue" onClick={() => navigate('edit', { id: m.id })}>{fc + ' file' + (fc === 1 ? '' : 's')}</span>
                            : <span className="dash">{'—'}</span>}
                        </td>
                        <td style={{ color: 'var(--muted2)', whiteSpace: 'nowrap', fontSize: 12.5 }}>{fmtDate(m.created_at)}</td>
                        <td className="td-actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <IconBtn icon={<MlIc.edit />} title="Edit" onClick={() => navigate('edit', { id: m.id })} />
                            <IconBtn icon={<MlIc.trash />} danger title="Delete" onClick={() => requestDelete(m)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}
    </div>
  );
}

function GenreChips({ genres }) {
  const shown = genres.slice(0, 2);
  const extra = genres.length - shown.length;
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {shown.map(g => <span key={g} className="chip" style={{ padding: '2px 8px', fontSize: 11 }}>{g}</span>)}
      {extra > 0 && <span style={{ fontSize: 11, color: 'var(--muted2)', fontWeight: 600 }}>{'+' + extra + ' more'}</span>}
    </div>
  );
}

function EmptyLibrary({ hasFilters, onClear, onAdd }) {
  if (hasFilters) {
    return (
      <div className="card">
        <div className="empty-big">
          <div className="zero">0</div>
          <div className="e1">No matches</div>
          <div className="e2">No titles match your current filters.</div>
          <Btn variant="ghost" onClick={onClear}>Clear filters</Btn>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="empty-big">
        <div className="zero">0</div>
        <div className="e1">No media yet</div>
        <div className="e2">Add your first movie or series to get started</div>
        <Btn variant="blue" icon={<MlIc.plus />} onClick={onAdd}>Add New Media</Btn>
      </div>
    </div>
  );
}
