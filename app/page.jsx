'use client';
/* SINEMAX — Dashboard (stats + engagement) */
import React, { useState } from 'react';
import { Icons } from '@/components/icons';
import {
  fmtNum, fmtFull, djLabel, hexA, ACCENT_HEX, hashStr,
  Poster, TypeBadge, PillTabs, TableWrap,
} from '@/components/ui';
import { useCatalog } from '@/lib/catalog';
import { useApp } from '@/components/shell';

function StatCard({ label, num, icon, accent, trend }) {
  const hex = ACCENT_HEX[accent] || accent;
  const IconComp = Icons[icon];
  const TrendIcon = trend < 0 ? Icons.arrowDown : Icons.arrowUp;
  return (
    <div className="stat" style={{ '--glow': hex }}>
      <div className="stat-icon" style={{ background: hexA(hex, 0.14), color: hex }}>
        <IconComp />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-num">{num}</div>
      {trend != null && (
        <div className={'stat-trend' + (trend < 0 ? ' down' : '')}>
          <TrendIcon />
          {Math.abs(trend) + '% vs last month'}
        </div>
      )}
    </div>
  );
}

function StatRow({ stats }) {
  return (
    <div className="stat-grid">
      <StatCard label="Total Titles" num={fmtFull(stats.totalTitles)} icon="film" accent="blue" trend={8} />
      <StatCard label="Total Files" num={fmtFull(stats.totalFiles)} icon="layers" accent="purple" trend={12} />
      <StatCard label="Total Views" num={fmtNum(stats.totalViews)} icon="eye" accent="teal" trend={23} />
      <StatCard label="Total Downloads" num={fmtNum(stats.totalDownloads)} icon="download" accent="gold" trend={5} />
    </div>
  );
}

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
          {sort.dir === 'desc' ? <Icons.arrowDown size={12} /> : <Icons.arrowUp size={12} />}
        </span>
      )}
    </th>
  );
}

function EngagementBody({ navigate }) {
  const db = useCatalog();
  const all = db.listMedia();
  const [range, setRange] = useState('all');
  const [tooltip, setTooltip] = useState(null);
  const [sort, setSort] = useState({ key: 'view_count', dir: 'desc' });

  const factor = range === '7' ? 0.12 : range === '30' ? 0.4 : 1;
  const scaled = all.map(m => ({
    ...m,
    v: Math.round(m.view_count * factor),
    d: Math.round(m.download_count * factor),
    fc: db.filesCount(m.id),
  }));

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mostActiveDay = DAYS[(hashStr(range) + 5) % 7];

  const chartData = [...scaled].sort((a, b) => b.v - a.v).slice(0, 12);
  const maxVal = Math.max(1, ...chartData.map(m => Math.max(m.v, m.d)));
  const ticks = 5;

  function setSortKey(key) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' });
  }
  const sorted = [...scaled].sort((a, b) => {
    let av, bv;
    switch (sort.key) {
      case 'title': av = a.title; bv = b.title; break;
      case 'type': av = a.type; bv = b.type; break;
      case 'dj': av = a.dj; bv = b.dj; break;
      case 'view_count': av = a.v; bv = b.v; break;
      case 'download_count': av = a.d; bv = b.d; break;
      case 'fc': av = a.fc; bv = b.fc; break;
      default: av = a.v; bv = b.v;
    }
    if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sort.dir === 'asc' ? av - bv : bv - av;
  });

  function niceTick(v) { return fmtNum(Math.round(v)); }

  return (
    <>
      {/* section header with range tabs */}
      <div className="flex aic" style={{ justifyContent: 'space-between', margin: '26px 0 14px' }}>
        <div>
          <div style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: 20, letterSpacing: '0.4px' }}>Engagement</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
            Most active day: <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{mostActiveDay}</span>
          </div>
        </div>
        <PillTabs
          value={range} onChange={setRange}
          options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: '30 days' }, { value: 'all', label: 'All time' }]}
        />
      </div>

      {/* bar chart */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Top 12 Titles — Views vs Downloads</div>
          <div className="chart-legend" style={{ margin: 0 }}>
            <div className="lg"><span className="sw" style={{ background: 'var(--blue)' }} />Views</div>
            <div className="lg"><span className="sw" style={{ background: 'var(--gold)' }} />Downloads</div>
          </div>
        </div>
        <div className="chart-wrap">
          <div className="chart">
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const frac = i / ticks;
              return (
                <div key={'g' + i} className="chart-grid-line" style={{ bottom: (frac * 100) + '%' }}>
                  <span className="chart-grid-label" style={{ bottom: 0 }}>{niceTick(maxVal * frac)}</span>
                </div>
              );
            })}
            {chartData.map(m => (
              <div
                key={m.id} className="chart-col"
                onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, m })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => navigate('edit', { id: m.id })}
                style={{ cursor: 'pointer' }}
              >
                <div className="chart-bars">
                  <div className="chart-bar views" style={{ height: Math.max(2, (m.v / maxVal) * 100) + '%' }} />
                  <div className="chart-bar downloads" style={{ height: Math.max(2, (m.d / maxVal) * 100) + '%' }} />
                </div>
                <div className="chart-xlabel" title={m.title}>{m.title.length > 14 ? m.title.slice(0, 13) + '…' : m.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div className="chart-tooltip" style={{ left: Math.min(tooltip.x + 14, window.innerWidth - 180), top: tooltip.y - 20 }}>
          <div className="ctt">{tooltip.m.title}</div>
          <div className="ctr">
            <span className="k"><span className="sw" style={{ background: 'var(--blue)' }} />Views</span>
            <span className="v">{fmtFull(tooltip.m.v)}</span>
          </div>
          <div className="ctr">
            <span className="k"><span className="sw" style={{ background: 'var(--gold)' }} />Downloads</span>
            <span className="v">{fmtFull(tooltip.m.d)}</span>
          </div>
        </div>
      )}

      {/* sortable table */}
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="card-head">
          <div className="card-title">All Titles by Engagement</div>
          <span className="results-count">{sorted.length + ' titles · click a column to sort'}</span>
        </div>
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Rank</th>
                <th>Poster</th>
                <SortTh label="Title" k="title" sort={sort} onSort={setSortKey} />
                <SortTh label="Type" k="type" sort={sort} onSort={setSortKey} />
                <SortTh label="DJ" k="dj" sort={sort} onSort={setSortKey} />
                <SortTh label="Views" k="view_count" sort={sort} onSort={setSortKey} num />
                <SortTh label="Downloads" k="download_count" sort={sort} onSort={setSortKey} num />
                <SortTh label="Files" k="fc" sort={sort} onSort={setSortKey} num />
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate('edit', { id: m.id })}>
                  <td><span className={'rank' + (i < 3 && sort.key === 'view_count' && sort.dir === 'desc' ? ' gold' : '')} style={{ fontSize: 15 }}>{i + 1}</span></td>
                  <td><Poster media={m} w={30} h={42} radius={4} /></td>
                  <td><span style={{ fontWeight: 600 }}>{m.title}</span></td>
                  <td><TypeBadge type={m.type} /></td>
                  <td style={{ color: 'var(--muted)' }}>{djLabel(m.dj)}</td>
                  <td className="td-num"><span className="cell-icon-num"><Icons.eye size={13} />{fmtFull(m.v)}</span></td>
                  <td className="td-num"><span className="cell-icon-num"><Icons.download size={13} />{fmtFull(m.d)}</span></td>
                  <td className="td-num">{m.fc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </>
  );
}

export default function Dashboard() {
  const db = useCatalog();
  const { navigate } = useApp();
  const stats = db.stats();

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: 26, letterSpacing: '0.4px' }}>Welcome back, Admin</div>
        <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 2 }}>Here{'’'}s what{'’'}s happening across your catalog today.</div>
      </div>
      <StatRow stats={stats} />
      <EngagementBody navigate={navigate} />
    </div>
  );
}
