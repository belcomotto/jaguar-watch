import { useState } from 'react';
import styles from './MapLayerPanel.module.css';

const ITEMS = [
  {
    key: 'borders',
    label: 'Borders',
    icon: (
      <svg viewBox="0 0 18 14" width="15" height="11" fill="none">
        <line x1="1" y1="2.5" x2="17" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/>
        <line x1="1" y1="7"   x2="17" y2="7"   stroke="currentColor" strokeWidth="1"   strokeDasharray="3 2" strokeLinecap="round" opacity=".55"/>
        <line x1="1" y1="11.5" x2="17" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'places',
    label: 'Places',
    icon: (
      <svg viewBox="0 0 14 18" width="10" height="13" fill="none">
        <circle cx="7" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="7" cy="6.5" r="1.5" fill="currentColor"/>
        <line x1="7" y1="11" x2="7" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function LayersIcon({ active }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
      stroke={active ? '#3a7a2a' : '#333'}
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,1.5 15,5.5 8,9.5 1,5.5"/>
      <polyline points="1,9 8,13 15,9"/>
    </svg>
  );
}

export default function MapLayerPanel({ overlays, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.flyout}>
          {ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`${styles.btn} ${overlays[key] ? styles.active : ''}`}
              onClick={() => onChange(key, !overlays[key])}
            >
              <span className={styles.iconWrap}>{icon}</span>
              {label}
              <span className={`${styles.dot} ${overlays[key] ? styles.dotOn : ''}`} />
            </button>
          ))}
        </div>
      )}
      <button
        className={`${styles.trigger} ${open ? styles.triggerActive : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Map layers"
      >
        <LayersIcon active={open} />
      </button>
    </div>
  );
}
