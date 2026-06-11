/* SINEMAX — Icon set (stroke-based, currentColor) */
import React from 'react';

function mk(paths, opts = {}) {
  return function Icon({ size, sw, ...props }) {
    return (
      <svg
        width={size || 18} height={size || 18} viewBox="0 0 24 24"
        fill={opts.fill || 'none'} stroke={opts.fill ? 'none' : 'currentColor'}
        strokeWidth={sw || 1.9} strokeLinecap="round" strokeLinejoin="round"
        {...props}
      >
        {paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
    );
  };
}
function mkRaw(children) {
  return function Icon({ size, sw, ...props }) {
    return (
      <svg
        width={size || 18} height={size || 18} viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        strokeWidth={sw || 1.9} strokeLinecap="round" strokeLinejoin="round"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const Icons = {
  grid: mk(['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M13 13h7v7h-7z', 'M4 13h7v7H4z']),
  film: mkRaw([
    <rect key={0} x={3} y={4} width={18} height={16} rx={2} />,
    <path key={1} d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />,
  ]),
  plusCircle: mkRaw([
    <circle key={0} cx={12} cy={12} r={9} />,
    <path key={1} d="M12 8v8M8 12h8" />,
  ]),
  layers: mk(['M12 3 2 8l10 5 10-5-10-5z', 'M2 13l10 5 10-5', 'M2 18l10 5 10-5']),
  barChart: mkRaw([
    <path key={0} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  ]),
  settings: mkRaw([
    <circle key={0} cx={12} cy={12} r={3} />,
    <path key={1} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
  ]),
  eye: mkRaw([
    <path key={0} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />,
    <circle key={1} cx={12} cy={12} r={3} />,
  ]),
  download: mk(['M12 3v12', 'M7 11l5 4 5-4', 'M5 21h14']),
  bell: mkRaw([
    <path key={0} d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />,
    <path key={1} d="M13.7 21a2 2 0 0 1-3.4 0" />,
  ]),
  plus: mk(['M12 5v14', 'M5 12h14']),
  search: mkRaw([
    <circle key={0} cx={11} cy={11} r={7} />,
    <path key={1} d="M21 21l-4.3-4.3" />,
  ]),
  edit: mk(['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z']),
  trash: mk(['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6M14 11v6']),
  x: mk(['M18 6 6 18', 'M6 6l12 12']),
  chevDown: mk(['M6 9l6 6 6-6']),
  chevRight: mk(['M9 6l6 6-6 6']),
  chevLeft: mk(['M15 6l-6 6 6 6']),
  arrowUp: mk(['M12 19V5', 'M5 12l7-7 7 7']),
  arrowDown: mk(['M12 5v14', 'M19 12l-7 7-7-7']),
  check: mk(['M20 6 9 17l-5-5']),
  uploadCloud: mkRaw([
    <path key={0} d="M16 16l-4-4-4 4" />,
    <path key={1} d="M12 12v9" />,
    <path key={2} d="M20.4 18.6A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3" />,
  ]),
  copy: mkRaw([
    <rect key={0} x={9} y={9} width={12} height={12} rx={2} />,
    <path key={1} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />,
  ]),
  link: mk(['M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5', 'M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5']),
  drag: mkRaw([
    <circle key={0} cx={9} cy={6} r={1.4} fill="currentColor" stroke="none" />,
    <circle key={1} cx={9} cy={12} r={1.4} fill="currentColor" stroke="none" />,
    <circle key={2} cx={9} cy={18} r={1.4} fill="currentColor" stroke="none" />,
    <circle key={3} cx={15} cy={6} r={1.4} fill="currentColor" stroke="none" />,
    <circle key={4} cx={15} cy={12} r={1.4} fill="currentColor" stroke="none" />,
    <circle key={5} cx={15} cy={18} r={1.4} fill="currentColor" stroke="none" />,
  ]),
  logout: mk(['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']),
  alert: mkRaw([
    <path key={0} d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
    <path key={1} d="M12 9v4M12 17h.01" />,
  ]),
  video: mkRaw([
    <path key={0} d="m23 7-7 5 7 5V7z" />,
    <rect key={1} x={1} y={5} width={15} height={14} rx={2} />,
  ]),
  calendar: mkRaw([
    <rect key={0} x={3} y={4} width={18} height={18} rx={2} />,
    <path key={1} d="M16 2v4M8 2v4M3 10h18" />,
  ]),
  flame: mk(['M12 2c1 3-1 5-2 6.5C9 10 8.5 12 10 13.5c.5-1 1-1.5 2-2 1 1.5 1.5 3 0 5 3-1 5-4 4-7.5-1-3.5-4-5-4-7z']),
  star: mk(['M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.5 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z']),
  sliders: mkRaw([
    <path key={0} d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />,
    <path key={1} d="M1 14h6M9 8h6M17 16h6" />,
  ]),
  refresh: mk(['M21 2v6h-6', 'M3 12a9 9 0 0 1 15-6.7L21 8', 'M3 22v-6h6', 'M21 12a9 9 0 0 1-15 6.7L3 16']),
  inbox: mkRaw([
    <path key={0} d="M22 12h-6l-2 3h-4l-2-3H2" />,
    <path key={1} d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5z" />,
  ]),
  menu: mk(['M3 6h18M3 12h18M3 18h18']),
};

export default Icons;
