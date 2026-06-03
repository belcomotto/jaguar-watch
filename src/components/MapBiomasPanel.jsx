import { useState, useEffect, useRef } from 'react';
import styles from './MapBiomasPanel.module.css';

const FIRST_YEAR = 1985;
const LAST_YEAR  = 2023;
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

// Classes actually present in the research area (derived from raster unique values)
const LEGEND = [
  // Natural woody vegetation
  { hex: '#1f8d49', label: 'Leñosa cerrada' },
  { hex: '#7dc975', label: 'Leñosa abierta' },
  { hex: '#807a40', label: 'Leñosa dispersa' },
  { hex: '#026975', label: 'Leñosa inundable' },
  // Natural grassland
  { hex: '#c2d26b', label: 'Pastizal Cerrado' },
  { hex: '#a5b35b', label: 'Pastizal Abierto' },
  { hex: '#cbe286', label: 'Pastizal Disperso' },
  { hex: '#519799', label: 'Pastizal Inundable' },
  // Agriculture / land use
  { hex: '#edde8e', label: 'Pastura' },
  { hex: '#C27BA0', label: 'Cultivos anuales' },
  { hex: '#f99fff', label: 'Cultivo simple' },
  { hex: '#d84690', label: 'Cultivo múltiple' },
  { hex: '#d082de', label: 'Cultivo arbustivo' },
  { hex: '#7a5900', label: 'Plantación forestal' },
  // Non-vegetated / urban
  { hex: '#d4271e', label: 'Área urbana' },
  { hex: '#db4d4f', label: 'Otras no vegetadas' },
  { hex: '#ffa07a', label: 'Playas y dunas' },
  { hex: '#f5d5d5', label: 'Salares' },
  // Water
  { hex: '#2532e4', label: 'Cuerpo de agua' },
];

export default function MapBiomasPanel({ mapbiomas, setMapbiomas, compact = false }) {
  const [playing, setPlaying]   = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const intervalRef = useRef(null);

  // Animate through years
  useEffect(() => {
    if (!playing) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setMapbiomas(prev => {
        const next = prev.year >= LAST_YEAR ? FIRST_YEAR : prev.year + 1;
        return { ...prev, year: next };
      });
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [playing, setMapbiomas]);

  // Stop playback if layer is turned off
  useEffect(() => {
    if (!mapbiomas.enabled) setPlaying(false);
  }, [mapbiomas.enabled]);

  const toggle = () => setMapbiomas(prev => ({ ...prev, enabled: !prev.enabled }));
  const yearIdx = mapbiomas.year - FIRST_YEAR;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button
          className={`${styles.toggleBtn} ${mapbiomas.enabled ? styles.toggleOn : ''}`}
          onClick={toggle}
        >
          {mapbiomas.enabled ? 'On' : 'Off'}
        </button>
        <span className={styles.status}>MapBiomas · Col. 5 · 1985–2023</span>
      </div>

      <div className={`${styles.controls} ${!mapbiomas.enabled ? styles.disabled : ''}`}>
        <div className={styles.yearRow}>
          <span className={styles.yearNum}>{mapbiomas.year}</span>
          <button
            className={`${styles.playBtn} ${playing ? styles.playBtnActive : ''}`}
            onClick={() => setPlaying(p => !p)}
            disabled={!mapbiomas.enabled}
            title={playing ? 'Pause animation' : 'Play through years'}
          >
            {playing ? '⏸' : '▶'}
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={YEARS.length - 1}
          value={yearIdx}
          disabled={!mapbiomas.enabled}
          onChange={e => {
            setPlaying(false);
            setMapbiomas(prev => ({ ...prev, year: YEARS[+e.target.value] }));
          }}
          className={styles.slider}
        />
        <div className={styles.endLabels}>
          <span>1985</span>
          <span>2023</span>
        </div>
      </div>

      <button
        className={styles.legendToggle}
        onClick={() => setShowLegend(v => !v)}
      >
        {showLegend ? '▲' : '▼'} Legend
      </button>

      {showLegend && (
        <div className={styles.legendGrid}>
          {LEGEND.map(({ hex, label }) => (
            <div key={label} className={styles.legendRow}>
              <span className={styles.swatch} style={{ background: hex }} />
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
          <p className={styles.legendSource}>
            MapBiomas Gran Chaco · Col. 5 · 30 m
          </p>
        </div>
      )}
    </div>
  );
}
