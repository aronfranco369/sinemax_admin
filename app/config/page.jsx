'use client';
/* SINEMAX — Configuration (settings) */
import React, { useState } from 'react';
import { Icons } from '@/components/icons';
import { Btn, Field, TextInput, SectionDivider, useToast } from '@/components/ui';
import { useCatalog } from '@/lib/catalog';
import { SUPABASE_URL } from '@/lib/supabaseClient';

export default function Configuration() {
  const toast = useToast();
  const db = useCatalog();
  const stats = db.stats();
  const [cdn, setCdn] = useState('https://cdn.sinemax.tz');

  return (
    <div className="page page-narrow fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        <div className="card card-pad">
          <SectionDivider label="Backend" />
          <Field label="Supabase project URL">
            <TextInput defaultValue={SUPABASE_URL} readOnly style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }} />
          </Field>
          <Field label="CDN base URL" help="Prepended to uploaded file paths.">
            <TextInput value={cdn} onChange={e => setCdn(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: 26, color: 'var(--blue)' }}>media</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{stats.totalTitles + ' rows'}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: 26, color: 'var(--purple)' }}>files</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{db.allFilesCount() + ' rows'}</div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <SectionDivider label="Preferences" />
          <ToggleRow label="Email me on upload failures" desc="Get notified if a transcode job fails." value={false} onChange={() => {}} />
          <ToggleRow label="Show trending badges" desc="Highlight high-view titles in the catalog." value={true} onChange={() => {}} />
        </div>

        <div className="card card-pad" style={{ gridColumn: '1 / -1' }}>
          <SectionDivider label="Data" />
          <div className="flex aic" style={{ justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Reload catalog</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Re-fetch the media and files tables from Supabase.</div>
            </div>
            <Btn
              variant="blue" icon={<Icons.refresh size={15} />}
              onClick={() => { db.refresh(); toast('Catalog reloaded from Supabase', 'info'); }}
            >Refresh data</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex aic" style={{ justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '0.5px solid var(--line)' }}>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted2)', marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 42, height: 24, borderRadius: 20, border: 'none', flex: 'none', cursor: 'pointer',
          background: value ? 'var(--blue)' : 'var(--panel2)', position: 'relative', transition: 'background 0.15s',
          boxShadow: value ? '0 0 0 1px var(--blue)' : '0 0 0 1px var(--line2)',
        }}
      >
        <span style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </button>
    </div>
  );
}
