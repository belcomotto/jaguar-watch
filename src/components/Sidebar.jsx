import { useState } from 'react';
import styles from './Sidebar.module.css';
import { STATUS_COLORS, STATUS_LABELS } from '../data/floodGauges';
import MapBiomasPanel from './MapBiomasPanel';


const LAYER_INFO = {
  firms: {
    description: 'Near real-time fire detections from NASA\'s VIIRS sensor aboard Suomi-NPP. Each point marks a 375 m pixel with a confirmed thermal anomaly consistent with active fire. Data is updated approximately every 3 hours.',
    legend: [
      { color: '#ff2200', label: 'High confidence' },
      { color: '#ff8800', label: 'Nominal confidence' },
      { color: '#ffcc00', label: 'Low confidence' },
    ],
  },
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

// Legacy alias — GSW_INFO kept as reference for existing code
const GSW_INFO = LAYER_INFO;


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


export default function Sidebar({ layers, setLayers, mapbiomas, setMapbiomas }) {
  const toggleLayer = (id) => setLayers(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.panelScroll}>

        {/* 1 — Protected Areas */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Protected Areas</span>
          </div>
          <LayerRow layer={{ id: 'park',   label: 'National Park',            color: '#ffffff', desc: 'El Impenetrable, designated 2020' }}       active={layers.park}   onToggle={toggleLayer} />
          <LayerRow layer={{ id: 'buffer', label: 'Buffer / Monitoring Zone', color: '#ffffff', desc: 'Expanded monitoring area', dashed: true }} active={layers.buffer} onToggle={toggleLayer} />
        </div>

        {/* 2 — Land Cover / MapBiomas */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Land Cover</span>
            <span className={styles.groupSub}>MapBiomas · Gran Chaco</span>
          </div>
          <MapBiomasPanel mapbiomas={mapbiomas} setMapbiomas={setMapbiomas} />
        </div>

        {/* 3 — Global Surface Water */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Global Surface Water</span>
            <span className={styles.groupSub}>JRC / Copernicus · 1984–2021</span>
          </div>
          <GswLayerRow layer={{ id: 'gsw_seasonality', label: 'Water Seasonality', color: '#5dacc8', gsw: true }} active={layers.gsw_seasonality} onToggle={toggleLayer} />
          <GswLayerRow layer={{ id: 'gsw_transitions', label: 'Water Transitions', color: '#ff7f27', gsw: true }} active={layers.gsw_transitions} onToggle={toggleLayer} />
        </div>

        {/* 4 — Illegal Extraction */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Illegal Extraction</span>
          </div>
          <LayerRow layer={{ id: 'pumps', label: 'Illegal Pump Sites', color: '#63412F', desc: '13 documented sites on the Bermejo' }} active={layers.pumps} onToggle={toggleLayer} />
        </div>

        {/* 5 — Flood Monitoring */}
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

        {/* 6 — Fire Monitoring */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Fire Monitoring</span>
            <span className={styles.groupSub}>NASA FIRMS · VIIRS S-NPP · 5 days</span>
          </div>
          <GswLayerRow layer={{ id: 'firms', label: 'Active Fire Alerts', color: '#ff4400', gsw: true }} active={layers.firms} onToggle={toggleLayer} />
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
