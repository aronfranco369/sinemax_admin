'use client';
/* SINEMAX — Shared UI primitives */
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Icons } from './icons';

const Ic = Icons;

/* ---------- formatting helpers ---------- */
export function fmtNum(n) {
  if (n == null) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K';
  return String(n);
}
export function fmtFull(n) { return (n || 0).toLocaleString('en-US'); }
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function djLabel(dj) { return dj ? `DJ ${dj}` : '—'; }

/* ---------- poster placeholder generator ---------- */
const POSTER_PALETTES = [
  ['#1A6FE8', '#19C3FB'], ['#7C5CFF', '#2D8EFF'], ['#22D3A6', '#1A6FE8'],
  ['#FF8A3D', '#FF5D7A'], ['#F4C13B', '#FF8A3D'], ['#FF5D7A', '#7C5CFF'],
  ['#2D8EFF', '#0A1628'], ['#19C3FB', '#1A6FE8'], ['#7C5CFF', '#11233D'],
];
export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
export function posterInitials(title) {
  const words = (title || '?').trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
export function Poster({ media, w, h, radius, showTitle }) {
  const url = media && media.poster_url;
  if (url) {
    return (
      <img
        src={url} alt={media.title}
        style={{ width: w, height: h, borderRadius: radius || 6, objectFit: 'cover', flex: 'none', display: 'block' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  const title = (media && media.title) || '';
  const idx = hashStr(title || 'x') % POSTER_PALETTES.length;
  const [c1, c2] = POSTER_PALETTES[idx];
  const angle = 120 + (hashStr(title) % 90);
  const wn = typeof w === 'number' ? w : 240;
  const big = wn >= 90;
  return (
    <div
      className="poster"
      style={{
        width: w, height: h, borderRadius: radius || 6,
        background: `linear-gradient(${angle}deg, ${c1}, ${c2})`,
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ textAlign: 'center', lineHeight: 0.9 }}>
        <div className="pst-title" style={{ fontSize: Math.max(9, Math.min(wn * 0.42, 46)) }}>{posterInitials(title)}</div>
        {showTitle && big && (
          <div className="pst-sub" style={{ fontSize: 10, marginTop: 6, padding: '0 8px', color: 'rgba(255,255,255,0.78)', whiteSpace: 'normal' }}>{title}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- badges ---------- */
export const ACCENT_HEX = {
  blue: '#2D8EFF', purple: '#7C5CFF', teal: '#22D3A6', gold: '#F4C13B',
  red: '#FF5D7A', orange: '#FF8A3D', blueBright: '#19C3FB',
};
export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
export function Badge({ color, children, icon }) {
  const hex = ACCENT_HEX[color] || color || '#2D8EFF';
  return (
    <span className="badge" style={{ background: hexA(hex, 0.14), border: `0.5px solid ${hexA(hex, 0.42)}`, color: hex }}>
      {icon}{children}
    </span>
  );
}
export function TypeBadge({ type }) {
  return type === 'series'
    ? <Badge color="purple">SERIES</Badge>
    : <Badge color="blue">MOVIE</Badge>;
}

/* ---------- buttons ---------- */
export function Btn({ variant, sm, icon, children, ...rest }) {
  const cls = ['btn', variant ? 'btn-' + variant : '', sm ? 'btn-sm' : ''].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{icon}{children}</button>;
}
export function IconBtn({ icon, danger, title, ...rest }) {
  return <button className={'icon-btn' + (danger ? ' danger' : '')} title={title} {...rest}>{icon}</button>;
}

/* ---------- field wrappers ---------- */
export function Field({ label, req, help, children }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}{req && <span className="req"> *</span>}</label>}
      {children}
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}
export function TextInput(props) {
  return <input className="input" {...props} />;
}
export function SearchInput({ value, onChange, placeholder, width }) {
  return (
    <div className="input-icon-wrap" style={{ width: width || 'auto' }}>
      <Ic.search className="lead" />
      <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/* ---------- dropdown chip ---------- */
export function DropdownChip({ label, value, options, onChange, allLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const set = value != null && value !== '';
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className={'dropdown-chip' + (set ? ' set' : '')} onClick={() => setOpen(o => !o)}>
        <span>{set ? value : label}</span>
        <Ic.chevDown className="caret" />
      </button>
      {open && (
        <div className="menu">
          <div
            className={'menu-item' + (!set ? ' sel' : '')}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {allLabel || ('All ' + label)}{!set && <Ic.check />}
          </div>
          {options.map(opt => (
            <div
              key={opt} className={'menu-item' + (value === opt ? ' sel' : '')}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}{value === opt && <Ic.check />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- tag input ---------- */
export function TagInput({ tags, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  function commitDraft() {
    const v = draft.trim().replace(/,$/, '').trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft('');
  }
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitDraft(); }
    else if (e.key === 'Backspace' && !draft && tags.length) { onChange(tags.slice(0, -1)); }
  }
  return (
    <div className="tag-input">
      {tags.map((t, i) => (
        <span key={t + i} className="chip">
          {t}
          <span className="chip-x" onClick={() => onChange(tags.filter((_, j) => j !== i))}><Ic.x /></span>
        </span>
      ))}
      <input
        value={draft} placeholder={tags.length ? '' : placeholder}
        onChange={e => setDraft(e.target.value)} onKeyDown={onKey} onBlur={commitDraft}
      />
    </div>
  );
}

/* ---------- segmented control ---------- */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map(opt => (
        <button
          key={opt.value}
          className={'seg' + (value === opt.value ? ' active' + (opt.value === 'series' ? ' purple' : '') : '')}
          onClick={() => onChange(opt.value)}
        >{opt.label}</button>
      ))}
    </div>
  );
}

/* ---------- pill tabs ---------- */
export function PillTabs({ value, onChange, options }) {
  return (
    <div className="pill-group">
      {options.map(opt => (
        <button
          key={opt.value} className={'pill' + (value === opt.value ? ' active' : '')}
          onClick={() => onChange(opt.value)}
        >{opt.label}</button>
      ))}
    </div>
  );
}

/* ---------- toast system ---------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind: kind || 'success' }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  const iconFor = k => (k === 'err' ? <Ic.alert /> : k === 'info' ? <Ic.bell /> : <Ic.check />);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={'toast ' + (t.kind === 'err' ? 'err' : t.kind === 'info' ? 'info' : '')}>
            <span className="ti">{iconFor(t.kind)}</span>
            <span className="tt">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() { return useContext(ToastCtx); }

/* ---------- modal shell ---------- */
export function Overlay({ children, onClose }) {
  useEffect(() => {
    function esc(e) { if (e.key === 'Escape' && onClose) onClose(); }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      {children}
    </div>
  );
}

/* ---------- table wrapper with a sticky h-scrollbar inside the card ---------- */
export function TableWrap({ children }) {
  const wrapRef = useRef(null);
  const barRef = useRef(null);
  const [scrollW, setScrollW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScrollW(el.scrollWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <div
        className="table-wrap" ref={wrapRef}
        onScroll={() => { if (barRef.current && wrapRef.current) barRef.current.scrollLeft = wrapRef.current.scrollLeft; }}
      >
        {children}
      </div>
      <div
        className="hscroll-sticky" ref={barRef}
        onScroll={() => { if (wrapRef.current && barRef.current) wrapRef.current.scrollLeft = barRef.current.scrollLeft; }}
      >
        <div style={{ width: scrollW, height: 1 }} />
      </div>
    </div>
  );
}

/* ---------- section divider ---------- */
export function SectionDivider({ label }) {
  return (
    <div className="section-divider">
      <span className="lbl">{label}</span>
      <span className="ln" />
    </div>
  );
}
