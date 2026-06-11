'use client';
/* SINEMAX — App shell: Sidebar, Topbar, delete modals, upload overlay,
   app-level actions context. Routing is real Next.js routes. */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from './icons';
import { Btn, Overlay, ToastProvider, useToast } from './ui';
import { CatalogProvider, useCatalog } from '@/lib/catalog';

const ShIc = Icons;

export const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/' },
  { key: 'library', label: 'Media Library', icon: 'film', href: '/library' },
  { key: 'add', label: 'Add New Media', icon: 'plusCircle', href: '/add' },
  { key: 'import', label: 'Import & Approve', icon: 'inbox', href: '/import' },
  { key: 'config', label: 'Configuration', icon: 'settings', href: '/config' },
];

const CRUMB = {
  dashboard: 'Dashboard', library: 'Media Library', add: 'Add New Media',
  edit: 'Edit Media', import: 'Import & Approve', config: 'Configuration',
};

function pageKey(pathname) {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/library')) return 'library';
  if (pathname.startsWith('/add')) return 'add';
  if (pathname.startsWith('/edit')) return 'edit';
  if (pathname.startsWith('/import')) return 'import';
  if (pathname.startsWith('/config')) return 'config';
  return 'dashboard';
}

/* ---------- app-level actions context ---------- */
const AppCtx = createContext(null);
export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <AppShell>');
  return ctx;
}

function Sidebar({ page, navigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo-mark">SX</div>
        <div className="wordmark">SINEMAX <span>ADMIN</span></div>
      </div>
      <nav className="nav">
        {NAV.map(it => {
          const active = page === it.key || (it.key === 'add' && page === 'edit');
          const IconComp = ShIc[it.icon];
          return (
            <button
              key={it.key} className={'nav-item' + (active ? ' active' : '')}
              onClick={() => navigate(it.key)} title={it.label}
            >
              <IconComp />
              <span className="nav-label">{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="side-user">
          <div className="avatar">AD</div>
          <div className="side-user-meta">
            <div className="nm">Admin</div>
            <div className="em">admin@sinemax.tz</div>
          </div>
        </div>
        <button className="side-logout">
          <ShIc.logout />
          <span className="side-logout-text">Log out</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({ page, navigate, onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="crumb">
        <button className="collapse-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          <ShIc.menu size={16} />
        </button>
        <span className="crumb-root">SINEMAX</span>
        <span className="crumb-sep"><ShIc.chevRight size={15} /></span>
        <span className="crumb-cur">{CRUMB[page] || 'Dashboard'}</span>
      </div>
      <div className="topbar-right">
        <button className="bell" title="Notifications">
          <ShIc.bell />
          <span className="dot" />
        </button>
        <Btn variant="blue" icon={<ShIc.plus />} onClick={() => navigate('add')}>New Media</Btn>
      </div>
    </header>
  );
}

/* Delete confirmation modal */
function DeleteModal({ media, fileCount, onCancel, onConfirm }) {
  const n = fileCount != null ? fileCount : 0;
  return (
    <Overlay onClose={onCancel}>
      <div className="modal">
        <div className="modal-ic danger"><ShIc.alert size={24} /></div>
        <h3>{`Delete "${media ? media.title : ''}"?`}</h3>
        <p>{`This will permanently remove the media and all ${n} associated file${n === 1 ? '' : 's'}. This action cannot be undone.`}</p>
        <div className="modal-actions">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="red-fill" onClick={onConfirm}>Delete Permanently</Btn>
        </div>
      </div>
    </Overlay>
  );
}

/* Generic confirm modal (for files / bulk) */
export function ConfirmModal({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="modal">
        <div className="modal-ic danger"><ShIc.alert size={24} /></div>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="modal-actions">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="red-fill" onClick={onConfirm}>{confirmLabel || 'Delete'}</Btn>
        </div>
      </div>
    </Overlay>
  );
}

/* Full-screen upload progress overlay */
function UploadOverlay({ label, pct }) {
  return (
    <div className="overlay" style={{ cursor: 'progress' }}>
      <div className="upload-overlay-card">
        <div className="ic"><ShIc.uploadCloud size={32} /></div>
        <div className="lbl">{label || 'Uploading…'}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: pct + '%' }} />
        </div>
        <div className="pct">{Math.round(pct) + '%'}</div>
        <div className="hint">Please don&apos;t close this tab</div>
      </div>
    </div>
  );
}

function ShellInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const page = pageKey(pathname);
  const db = useCatalog();
  const toast = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    function onResize() { setNarrow(window.innerWidth < 1024); }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const effectiveCollapsed = collapsed || narrow;

  const [deleteTarget, setDeleteTarget] = useState(null); // { media, fileCount }
  const [bulkTarget, setBulkTarget] = useState(null); // { ids, onDone }
  const [upload, setUpload] = useState(null); // { label, pct }
  const uploadRef = useRef(null);

  function navigate(pageName, params) {
    const it = NAV.find(n => n.key === pageName);
    if (pageName === 'edit' && params && params.id) router.push('/edit/' + params.id);
    else router.push(it ? it.href : '/');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }

  /* Run async `work` behind the full-screen progress overlay. */
  async function beginUpload(label, work) {
    setUpload({ label, pct: 0 });
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(90, pct + Math.random() * 11 + 4);
      setUpload(u => (u ? { ...u, pct } : u));
    }, 180);
    try {
      const res = work ? await work() : null;
      clearInterval(iv);
      setUpload({ label, pct: 100 });
      await new Promise(r => setTimeout(r, 350));
      setUpload(null);
      return res;
    } catch (e) {
      clearInterval(iv);
      setUpload(null);
      toast('Upload failed: ' + (e.message || e), 'err');
      throw e;
    }
  }
  uploadRef.current = beginUpload;

  function requestDelete(media) {
    setDeleteTarget({ media, fileCount: db.filesCount(media.id) });
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget.media;
    setDeleteTarget(null);
    try {
      await db.deleteMedia(id);
      toast('Deleted "' + title + '"', 'info');
      if (page === 'edit') navigate('library');
    } catch (e) {
      toast('Delete failed: ' + (e.message || e), 'err');
    }
  }
  function requestBulkDelete(ids, onDone) { setBulkTarget({ ids, onDone }); }
  async function confirmBulkDelete() {
    if (!bulkTarget) return;
    const { ids, onDone } = bulkTarget;
    setBulkTarget(null);
    try {
      await db.deleteManyMedia(ids);
      onDone && onDone();
      toast(ids.length + ' titles deleted', 'info');
    } catch (e) {
      toast('Delete failed: ' + (e.message || e), 'err');
    }
  }

  const app = { navigate, requestDelete, requestBulkDelete, beginUpload };

  return (
    <AppCtx.Provider value={app}>
      <div className={'app' + (effectiveCollapsed ? ' collapsed' : '')}>
        <Sidebar page={page} navigate={navigate} />
        <div className="main">
          <Topbar page={page} navigate={navigate} onToggleSidebar={() => setCollapsed(c => !c)} />
          <div key={pathname} className="fade-in">
            {db.loading
              ? (
                <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: 14 }}>
                  <div className="spinner" />
                  <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Loading catalog from Supabase…</div>
                </div>
              )
              : db.error
                ? (
                  <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: 14 }}>
                    <div className="modal-ic danger"><ShIc.alert size={24} /></div>
                    <div style={{ color: 'var(--ink)', fontWeight: 600 }}>Couldn&apos;t load the catalog</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{db.error}</div>
                    <Btn variant="blue" icon={<ShIc.refresh size={15} />} onClick={db.refresh}>Retry</Btn>
                  </div>
                )
                : children}
          </div>
        </div>
      </div>
      {deleteTarget && (
        <DeleteModal
          media={deleteTarget.media} fileCount={deleteTarget.fileCount}
          onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        />
      )}
      {bulkTarget && (
        <ConfirmModal
          title={'Delete ' + bulkTarget.ids.length + ' titles?'}
          body={'This will permanently remove ' + bulkTarget.ids.length + ' selected titles and all their associated files. This action cannot be undone.'}
          confirmLabel={'Delete ' + bulkTarget.ids.length + ' titles'}
          onCancel={() => setBulkTarget(null)} onConfirm={confirmBulkDelete}
        />
      )}
      {upload && <UploadOverlay label={upload.label} pct={upload.pct} />}
    </AppCtx.Provider>
  );
}

export default function AppShell({ children }) {
  return (
    <CatalogProvider>
      <ToastProvider>
        <ShellInner>{children}</ShellInner>
      </ToastProvider>
    </CatalogProvider>
  );
}
