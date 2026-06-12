import { useState } from 'react';
import styles from './Sidebar.module.css';
import { STATUS_COLORS, STATUS_LABELS } from '../data/floodGauges';
import MapBiomasPanel from './MapBiomasPanel';


const LAYER_INFO = {
  park: {
    description: 'El Impenetrable National Park — 128,000 hectares of dry Chaco forest on the banks of the Bermejo River, officially designated in 2014, opened its doors to the first rangers on 2017. Created after the 2011 murder of Manuel Roseo and a decade of legal and conservation effort. One of Argentina\'s newest and largest national parks, and a stronghold for vast biodiversity.',
  },
  buffer: {
    description: 'Buffer and monitoring zone surrounding the national park. Includes the Formosa province side of the former La Fidelidad estate — still privately held — and adjacent lands where agricultural pressure, illegal water extraction, and fire are most acute. Monitoring this zone documents the forces closing in on the protected core.',
  },
  pumps: {
    description: '13 illegal water extraction sites documented along the Bermejo River, concentrated along the park\'s southern and eastern boundary. Each pump diverts water from the river to irrigate fields on the advancing agricultural and pasture frontier. Documented through satellite imagery cross-referenced with field investigation.',
    legend: [
      { color: '#63412F', label: 'Documented pump site' },
    ],
  },
  mapbiomas: {
    description: 'Annual land cover classification from 1985 to 2023, produced by the MapBiomas Gran Chaco initiative. Tracks how forest, agriculture, water bodies, and other land uses have shifted over four decades. Use the year slider to watch the agricultural frontier advance into native dry Chaco forest.',
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
  floodGauges: {
    description: '5 virtual gauge points on the Bermejo/Teuco, Pilcomayo, and Paraguay rivers. Discharge values are modelled by the Copernicus GloFAS ensemble (via Open-Meteo) — not gauge readings. The most reliable signal is the relative anomaly (how current flow compares to the 30-day baseline); absolute m³/s values are secondary. Colour levels — Near Baseline / Elevated / High / Very High — are model-based thresholds, not official agency warnings. Model confidence varies by river: high for the Paraguay and lower Bermejo, low for the braided, sediment-heavy Pilcomayo.',
    legend: [
      { color: STATUS_COLORS.normal,   label: STATUS_LABELS.normal,   round: true },
      { color: STATUS_COLORS.advisory, label: STATUS_LABELS.advisory, round: true },
      { color: STATUS_COLORS.watch,    label: STATUS_LABELS.watch,    round: true },
      { color: STATUS_COLORS.warning,  label: STATUS_LABELS.warning,  round: true },
    ],
  },
  inaStations: {
    description: '6 telemetric (in territory) stations from Argentina\'s National Water Institute (INA sSIyAH network). Aguas Blancas, Embarcación, and Puerto Velaz gauge river level across the upper and lower Bermejo reaches. Puerto Lavalle provides a real observed reading to cross-check the GloFAS model. The park meteorological station monitors conditions inside El Impenetrable. El Colorado holds the only discharge data ever published for the Bermejo — 454 readings over 79 days (July – September 2024), then silence. It is the only evidence of how much water the river actually carries.',
    legend: [
      { color: '#4db8ff', label: 'River level gauge — active' },
      { color: '#f0a500', label: 'Meteorological station' },
      { color: '#6b7280', label: 'Discharge gauge — offline' },
    ],
  },
  firms: {
    description: 'Near real-time fire detections from NASA\'s VIIRS sensor aboard Suomi-NPP. Each point marks a 375 m pixel with a confirmed thermal anomaly consistent with active fire. Data is updated approximately every 3 hours.',
    legend: [
      { color: '#ff2200', label: 'High confidence' },
      { color: '#ff8800', label: 'Nominal confidence' },
      { color: '#ffcc00', label: 'Low confidence' },
    ],
  },
  community: {
    description: 'Community sourced events registered through the ACT panel and verified by the Jaguar Watch team. Each marker represents a submitted observation — fire, contamination, illegal extraction, or testimony — reviewed before appearing on the map.',
    legend: [
      { color: '#8b5cf6', label: 'Verified community submission', round: true },
    ],
  },
};


function InfoPanel({ info }) {
  if (!info) return null;
  return (
    <div className={styles.gswInfo}>
      <p className={styles.gswDesc}>{info.description}</p>
      {info.legend && (
        <div className={styles.gswLegend}>
          {info.legend.map(({ color, label, round }) => (
            <div key={label} className={styles.gswLegendRow}>
              <span className={styles.gswSwatch}
                style={{ background: color, borderRadius: round ? '50%' : undefined }} />
              <span className={styles.gswLegendLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GswLayerRow({ layer, active, onToggle }) {
  const [open, setOpen] = useState(false);
  const info = LAYER_INFO[layer.id];
  return (
    <div className={styles.gswBlock}>
      <div className={`${styles.layerRow} ${styles.layerRowGsw} ${active ? styles.layerActive : ''}`}>
        <button className={styles.layerToggleArea} onClick={() => onToggle(layer.id)}>
          <span className={styles.layerSwatch}
            style={{
              background: active ? layer.color : 'transparent',
              borderColor: layer.color,
              borderStyle: layer.dashed ? 'dashed' : 'solid',
            }} />
          <span className={styles.layerLabel}>{layer.label}</span>
          <span className={`${styles.layerDot} ${active ? styles.layerDotOn : ''}`} />
        </button>
        {info && (
          <button className={`${styles.infoBtn} ${open ? styles.infoBtnOpen : ''}`}
            onClick={() => setOpen(o => !o)} title="Description and legend">
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      {open && <InfoPanel info={info} />}
    </div>
  );
}

// Info-only toggle for sections that have their own panel (e.g. MapBiomas)
function InfoRow({ id, label }) {
  const [open, setOpen] = useState(false);
  const info = LAYER_INFO[id];
  if (!info) return null;
  return (
    <div className={styles.gswBlock}>
      <div className={`${styles.layerRow} ${styles.layerRowGsw}`}>
        <span style={{ flex: 1, paddingLeft: 6, fontSize: 11, color: 'var(--sand-dim)', opacity: 0.55 }}>{label}</span>
        <button className={`${styles.infoBtn} ${open ? styles.infoBtnOpen : ''}`}
          onClick={() => setOpen(o => !o)} title="Description">
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && <InfoPanel info={info} />}
    </div>
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
          <GswLayerRow layer={{ id: 'park',   label: 'National Park',            color: '#ffffff' }}             active={layers.park}   onToggle={toggleLayer} />
          <GswLayerRow layer={{ id: 'buffer', label: 'Buffer / Monitoring Zone', color: '#ffffff', dashed: true }} active={layers.buffer} onToggle={toggleLayer} />
        </div>

        {/* 2 — Land Cover / MapBiomas */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Land Cover</span>
            <span className={styles.groupSub}>MapBiomas · Gran Chaco</span>
          </div>
          <InfoRow id="mapbiomas" label="About MapBiomas" />
          <MapBiomasPanel mapbiomas={mapbiomas} setMapbiomas={setMapbiomas} />
        </div>

        {/* 3 — Global Surface Water */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Global Surface Water</span>
            <span className={styles.groupSub}>JRC / Copernicus · 1984–2021</span>
          </div>
          <GswLayerRow layer={{ id: 'gsw_seasonality', label: 'Water Seasonality', color: '#5dacc8' }} active={layers.gsw_seasonality} onToggle={toggleLayer} />
          <GswLayerRow layer={{ id: 'gsw_transitions', label: 'Water Transitions',  color: '#ff7f27' }} active={layers.gsw_transitions} onToggle={toggleLayer} />
        </div>

        {/* 4 — Illegal Extraction */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Illegal Extraction</span>
          </div>
          <GswLayerRow layer={{ id: 'pumps', label: 'Illegal Pump Sites', color: '#63412F' }} active={layers.pumps} onToggle={toggleLayer} />
        </div>

        {/* 5 — Flood Monitoring */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Flood Monitoring</span>
            <span className={styles.groupSub}>GloFAS · Bermejo–Paraná</span>
          </div>
          <GswLayerRow layer={{ id: 'floodGauges', label: 'River Gauges', color: STATUS_COLORS.normal }} active={layers.floodGauges} onToggle={toggleLayer} />
        </div>

        {/* 6 — INA Telemetric Stations */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>INA Telemetric (In Territory) Stations</span>
            <span className={styles.groupSub}>INA sSIyAH · Observed data · 6 stations</span>
          </div>
          <GswLayerRow layer={{ id: 'inaStations', label: 'INA Stations', color: '#4db8ff' }} active={layers.inaStations} onToggle={toggleLayer} />
        </div>

        {/* 7 — Fire Monitoring */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Fire Monitoring</span>
            <span className={styles.groupSub}>NASA FIRMS · VIIRS S-NPP · 5 days</span>
          </div>
          <GswLayerRow layer={{ id: 'firms', label: 'Active Fire Alerts', color: '#ff4400' }} active={layers.firms} onToggle={toggleLayer} />
        </div>

        {/* 8 — Community */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>Community / Comunidad</span>
            <span className={styles.groupSub}>community sourced events registered through the ACT panel</span>
          </div>
          <GswLayerRow layer={{ id: 'community', label: 'Community / Comunidad', color: '#8b5cf6' }} active={layers.community} onToggle={toggleLayer} />
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
