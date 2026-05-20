import { useState } from 'react';
import styles from './Sidebar.module.css';
import { STATUS_COLORS, STATUS_LABELS } from '../data/floodGauges';

const SENTINEL_BANDS = [
  { id: 'true-color',           label: 'True Color' },
  { id: 'ndvi',                 label: 'NDVI' },
  { id: 'ndwi',                 label: 'NDWI' },
  { id: 'moisture-index',       label: 'Moisture' },
  { id: 'scene-classification', label: 'Scene Class.' },
];

function buildMonths() {
  const months = [];
  const now = new Date();
  let y = 2015, m = 6;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

const MONTHS = buildMonths();

function formatDateLabel(dateStr) {
  const [y, m] = dateStr.split('-');
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-GB', {
    month: 'short', year: 'numeric',
  });
}

const GSW_INFO = {
  gsw_seasonality: {
    description: 'Shows how many months per year surface water was present, averaged from 1984 to 2021. Values range from 1 (water appears one month per year) to 12 (permanent water present all year round).',
    legend: [
      { color: '#c7e9f7', label: '1 month' },
      { color: '#92cfe0', label: '3 months' },
      { color: '#5dacc8', label: '6 months' },
      { color: '#2e7fb0', label: '9 months' },
      { color: '#0d47a1', label: '12 months — permanent' },
    ],
  },
  gsw_extent: {
    description: 'The maximum spatial extent of surface water ever detected across all years of observation (1984–2021). A location is shown if it was covered by water at least once in any year.',
    legend: [
      { color: '#0077bb', label: 'Water detected at least once' },
    ],
  },
  gsw_transitions: {
    description: 'Captures how the nature of surface water changed between the early epoch (1984–1999) and the late epoch (2000–2021), distinguishing losses, gains, and changes in permanence.',
    legend: [
      { color: '#0000ff', label: 'Permanent water' },
      { color: '#22b14c', label: 'New permanent' },
      { color: '#d1102d', label: 'Lost permanent' },
      { color: '#99d9ea', label: 'Seasonal water' },
      { color: '#b5e61d', label: 'New seasonal' },
      { color: '#e6194b', label: 'Lost seasonal' },
      { color: '#ff7f27', label: 'Seasonal → permanent' },
      { color: '#ffc90e', label: 'Permanent → seasonal' },
      { color: '#7f7f7f', label: 'Ephemeral permanent' },
      { color: '#c3c3c3', label: 'Ephemeral seasonal' },
    ],
  },
};

const LAYER_GROUPS = [
  {
    label: 'Protected Areas',
    layers: [
      { id: 'park',   label: 'National Park',            color: '#ffffff', desc: 'El Impenetrable, designated 2020' },
      { id: 'buffer', label: 'Buffer / Monitoring Zone', color: '#ffffff', desc: 'Expanded monitoring area', dashed: true },
    ],
  },
  {
    label: 'Illegal Extraction',
    layers: [
      { id: 'pumps', label: 'Illegal Pump Sites', color: '#63412F', desc: '13 documented sites on the Bermejo' },
    ],
  },
  {
    label: 'Global Surface Water',
    sublabel: 'JRC / Copernicus · 1984–2021',
    layers: [
      { id: 'gsw_seasonality', label: 'Water Seasonality', color: '#5dacc8', gsw: true },
      { id: 'gsw_extent',      label: 'Max Water Extent',  color: '#0077bb', gsw: true },
      { id: 'gsw_transitions', label: 'Water Transitions', color: '#ff7f27', gsw: true },
    ],
  },
];

function GswLayerRow({ layer, active, onToggle }) {
  const [open, setOpen] = useState(false);
  const info = GSW_INFO[layer.id];
  return (
    <div className={styles.gswBlock}>
      <div className={`${styles.layerRow} ${styles.layerRowGsw} ${active ? styles.layerActive : ''}`}>
        <button className={styles.layerToggleArea} onClick={() => onToggle(layer.id)}>
          <span className={styles.layerSwatch}
            style={{ background: active ? layer.color : 'transparent', borderColor: layer.color }} />
          <span className={styles.layerLabel}>{layer.label}</span>
          <span className={`${styles.layerDot} ${active ? styles.layerDotOn : ''}`} />
        </button>
        <button className={`${styles.infoBtn} ${open ? styles.infoBtnOpen : ''}`}
          onClick={() => setOpen(o => !o)} title="Description and legend">
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && (
        <div className={styles.gswInfo}>
          <p className={styles.gswDesc}>{info.description}</p>
          <div className={styles.gswLegend}>
            {info.legend.map(({ color, label }) => (
              <div key={label} className={styles.gswLegendRow}>
                <span className={styles.gswSwatch} style={{ background: color }} />
                <span className={styles.gswLegendLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LayerRow({ layer, active, onToggle }) {
  return (
    <button
      className={`${styles.layerRow} ${active ? styles.layerActive : ''}`}
      onClick={() => onToggle(layer.id)}
      title={layer.desc}
    >
      <span className={styles.layerSwatch} style={{
        background: active ? layer.color : 'transparent',
        borderColor: layer.color,
        borderStyle: layer.dashed ? 'dashed' : 'solid',
      }} />
      <span className={styles.layerLabel}>{layer.label}</span>
      <span className={`${styles.layerDot} ${active ? styles.layerDotOn : ''}`} />
    </button>
  );
}

function SentinelPanel({ sentinel, setSentinel }) {
  const monthIndex = MONTHS.indexOf(sentinel.date);
  return (
    <div className={styles.sentinelPanel}>
      <div className={styles.sentinelHeader}>
        <button
          className={`${styles.sentinelToggle} ${sentinel.enabled ? styles.sentinelToggleOn : ''}`}
          onClick={() => setSentinel(s => ({ ...s, enabled: !s.enabled }))}
        >
          {sentinel.enabled ? 'On' : 'Off'}
        </button>
        <span className={styles.sentinelStatus}>
          Sentinel-2 L2A · locally cached
        </span>
      </div>
      <div className={styles.bandGrid}>
        {SENTINEL_BANDS.map(b => (
          <button
            key={b.id}
            className={`${styles.bandBtn} ${sentinel.band === b.id ? styles.bandBtnActive : ''}`}
            onClick={() => setSentinel(s => ({ ...s, band: b.id }))}
            disabled={!sentinel.enabled}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className={styles.timeSlider}>
        <div className={styles.timeLabel}>
          <span className={styles.timeLabelDate}>{formatDateLabel(sentinel.date)}</span>
          <span className={styles.timeLabelSub}>max 30% cloud cover</span>
        </div>
        <input
          type="range"
          min={0}
          max={MONTHS.length - 1}
          value={monthIndex}
          disabled={!sentinel.enabled}
          onChange={e => setSentinel(s => ({ ...s, date: MONTHS[+e.target.value] }))}
          className={styles.timeRange}
        />
        <div className={styles.timeEndLabels}>
          <span>Jan 2015</span>
          <span>{formatDateLabel(MONTHS[MONTHS.length - 1])}</span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ layers, setLayers, sentinel, setSentinel }) {
  const toggleLayer = (id) => setLayers(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.panelScroll}>

        {LAYER_GROUPS.map(group => (
          <div key={group.label} className={styles.layerGroup}>
            <div className={styles.groupHeader}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.sublabel && <span className={styles.groupSub}>{group.sublabel}</span>}
            </div>
            {group.layers.map(layer =>
              layer.gsw ? (
                <GswLayerRow key={layer.id} layer={layer}
                  active={layers[layer.id]} onToggle={toggleLayer} />
              ) : (
                <LayerRow key={layer.id} layer={layer}
                  active={layers[layer.id]} onToggle={toggleLayer} />
              )
            )}
          </div>
        ))}

        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Flood Monitoring</span>
            <span className={styles.groupSub}>GloFAS · Bermejo–Paraná</span>
          </div>
          <LayerRow
            layer={{ id: 'floodGauges', label: 'River Gauges', color: STATUS_COLORS.normal, desc: '10 monitoring stations' }}
            active={layers.floodGauges}
            onToggle={toggleLayer}
          />
          {layers.floodGauges && (
            <div className={styles.gswInfo} style={{ paddingTop: 6 }}>
              <p className={styles.gswDesc} style={{ marginBottom: 6 }}>
                10 stations · Bermejo, Pilcomayo, Paraguay, Paraná.
                Status updates live once Flood Hub API is connected.
              </p>
              {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'pending').map(([key, color]) => (
                <div key={key} className={styles.gswLegendRow}>
                  <span className={styles.gswSwatch} style={{ background: color, borderRadius: '50%' }} />
                  <span className={styles.gswLegendLabel}>{STATUS_LABELS[key]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Sentinel-2 Imagery</span>
            <span className={styles.groupSub}>Copernicus · 2015–present</span>
          </div>
          <SentinelPanel sentinel={sentinel} setSentinel={setSentinel} />
        </div>

        <div className={styles.legend}>
          <p className={styles.legendTitle}>Bermejo River</p>
          <p className={styles.legendText}>
            The Bermejo flows ~1,200 km from Bolivia through Chaco, discharging into the Paraguay River.
            Its highly dynamic meanders and sediment load make it one of South America's most ecologically significant rivers.
          </p>
          <div className={styles.legendDivider} />
          <p className={styles.legendText} style={{ fontStyle: 'italic', fontSize: 11 }}>
            Source: JRC Global Surface Water Explorer · WGS 84 · Satellite: Mapbox / Maxar
          </p>
        </div>

      </div>
    </aside>
  );
}
