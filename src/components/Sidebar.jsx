import { useState } from 'react';
import styles from './Sidebar.module.css';
import { STATUS_COLORS, STATUS_LABELS } from '../data/floodGauges';
import MapBiomasPanel from './MapBiomasPanel';
import { useLang } from '../context/LangContext';

function getLayerInfo(lang) {
  const isEs = lang === 'es';
  return {
    park: {
      description: isEs
        ? 'El Parque Nacional El Impenetrable comprende 128.000 hectáreas de bosque chaqueño seco sobre las orillas del río Bermejo. Fue designado oficialmente en 2014 y recibió a sus primeros guardaparques en 2017. Creado tras el asesinato de Manuel Roseo en 2011 y una década de esfuerzo legal y de conservación. Es uno de los parques nacionales más nuevos y extensos de Argentina, y un refugio para la biodiversidad.'
        : "El Impenetrable National Park — 128,000 hectares of dry Chaco forest on the banks of the Bermejo River, officially designated in 2014, opened its doors to the first rangers on 2017. Created after the 2011 murder of Manuel Roseo and a decade of legal and conservation effort. One of Argentina's newest and largest national parks, and a stronghold for vast biodiversity.",
    },
    buffer: {
      description: isEs
        ? 'Zona de amortiguación y monitoreo que rodea el parque nacional. Incluye el lado de la provincia de Formosa de la antigua estancia La Fidelidad — aún en manos privadas — y las tierras adyacentes donde la presión agropecuaria, la extracción ilegal de agua y los incendios son más agudos. El monitoreo de esta zona documenta las fuerzas que avanzan sobre el núcleo protegido.'
        : "Buffer and monitoring zone surrounding the national park. Includes the Formosa province side of the former La Fidelidad estate — still privately held — and adjacent lands where agricultural pressure, illegal water extraction, and fire are most acute. Monitoring this zone documents the forces closing in on the protected core.",
    },
    pumps: {
      description: isEs
        ? '13 sitios de extracción de agua ilegal documentados a lo largo del río Bermejo, concentrados en el límite sur y este del parque. Cada bomba desvía agua del río para irrigar campos en el frente agropecuario en avance. Documentados mediante imágenes satelitales cruzadas con trabajo de campo.'
        : "13 illegal water extraction sites documented along the Bermejo River, concentrated along the park's southern and eastern boundary. Each pump diverts water from the river to irrigate fields on the advancing agricultural and pasture frontier. Documented through satellite imagery cross-referenced with field investigation.",
      legend: [
        { color: '#63412F', label: isEs ? 'Sitio de bombeo documentado' : 'Documented pump site' },
      ],
    },
    mapbiomas: {
      description: isEs
        ? 'Clasificación anual de cobertura del suelo de 1985 a 2023, producida por la iniciativa MapBiomas Gran Chaco. Registra cómo el bosque, la agricultura, los cuerpos de agua y otros usos del suelo han cambiado a lo largo de cuatro décadas. Usá el control deslizante para ver el avance de la frontera agropecuaria sobre el bosque chaqueño seco nativo.'
        : 'Annual land cover classification from 1985 to 2023, produced by the MapBiomas Gran Chaco initiative. Tracks how forest, agriculture, water bodies, and other land uses have shifted over four decades. Use the year slider to watch the agricultural frontier advance into native dry Chaco forest.',
    },
    gsw_seasonality: {
      description: isEs
        ? 'Muestra cuántos meses por año estuvo presente el agua superficial, promediado entre 1984 y 2021. Los valores van de 1 (el agua aparece un mes al año) a 12 (agua permanente todo el año).'
        : 'Shows how many months per year surface water was present, averaged from 1984 to 2021. Values range from 1 (water appears one month per year) to 12 (permanent water present all year round).',
      legend: isEs
        ? [
            { color: '#c7e9f7', label: '1 mes' },
            { color: '#92cfe0', label: '3 meses' },
            { color: '#5dacc8', label: '6 meses' },
            { color: '#2e7fb0', label: '9 meses' },
            { color: '#0d47a1', label: '12 meses — permanente' },
          ]
        : [
            { color: '#c7e9f7', label: '1 month' },
            { color: '#92cfe0', label: '3 months' },
            { color: '#5dacc8', label: '6 months' },
            { color: '#2e7fb0', label: '9 months' },
            { color: '#0d47a1', label: '12 months — permanent' },
          ],
    },
    gsw_transitions: {
      description: isEs
        ? 'Captura cómo cambió la naturaleza del agua superficial entre la época temprana (1984–1999) y la reciente (2000–2021), distinguiendo pérdidas, ganancias y cambios en la permanencia.'
        : 'Captures how the nature of surface water changed between the early epoch (1984–1999) and the late epoch (2000–2021), distinguishing losses, gains, and changes in permanence.',
      legend: isEs
        ? [
            { color: '#0000ff', label: 'Agua permanente' },
            { color: '#22b14c', label: 'Nueva permanente' },
            { color: '#d1102d', label: 'Permanente perdida' },
            { color: '#99d9ea', label: 'Agua estacional' },
            { color: '#b5e61d', label: 'Nueva estacional' },
            { color: '#e6194b', label: 'Estacional perdida' },
            { color: '#ff7f27', label: 'Estacional → permanente' },
            { color: '#ffc90e', label: 'Permanente → estacional' },
            { color: '#7f7f7f', label: 'Permanente efímera' },
            { color: '#c3c3c3', label: 'Estacional efímera' },
          ]
        : [
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
      description: isEs
        ? '5 puntos de control virtuales en los ríos Bermejo/Teuco, Pilcomayo y Paraguay. Los valores de caudal son modelados por el ensamble Copernicus GloFAS (vía Open-Meteo) — no son lecturas de estaciones físicas. La señal más confiable es la anomalía relativa (cómo el flujo actual se compara con la línea base de 30 días); los valores absolutos en m³/s son secundarios. Los niveles de color — Cerca de la Base / Elevado / Alto / Muy Alto — son umbrales del modelo, no alertas oficiales. La confianza del modelo varía según el río: alta para el Paraguay y el Bermejo inferior, baja para el Pilcomayo, de cauce trenzado y alta carga de sedimentos.'
        : '5 virtual gauge points on the Bermejo/Teuco, Pilcomayo, and Paraguay rivers. Discharge values are modelled by the Copernicus GloFAS ensemble (via Open-Meteo) — not gauge readings. The most reliable signal is the relative anomaly (how current flow compares to the 30-day baseline); absolute m³/s values are secondary. Colour levels — Near Baseline / Elevated / High / Very High — are model-based thresholds, not official agency warnings. Model confidence varies by river: high for the Paraguay and lower Bermejo, low for the braided, sediment-heavy Pilcomayo.',
      legend: [
        { color: STATUS_COLORS.normal,   label: STATUS_LABELS.normal,   round: true },
        { color: STATUS_COLORS.advisory, label: STATUS_LABELS.advisory, round: true },
        { color: STATUS_COLORS.watch,    label: STATUS_LABELS.watch,    round: true },
        { color: STATUS_COLORS.warning,  label: STATUS_LABELS.warning,  round: true },
      ],
    },
    inaStations: {
      description: isEs
        ? "6 estaciones telesimétricas (en territorio) del Instituto Nacional del Agua de Argentina (red INA sSIyAH). Aguas Blancas, Embarcación y Puerto Velaz miden el nivel del río en los tramos superior e inferior del Bermejo. Puerto Lavalle aporta una lectura observada real para contrastar el modelo GloFAS. La estación meteorológica del parque monitorea las condiciones dentro de El Impenetrable. El Colorado tiene los únicos datos de caudal publicados para el Bermejo — 454 lecturas en 79 días (julio–septiembre 2024), luego silencio. Es la única evidencia de cuánta agua lleva realmente este río."
        : "6 telemetric (in territory) stations from Argentina's National Water Institute (INA sSIyAH network). Aguas Blancas, Embarcación, and Puerto Velaz gauge river level across the upper and lower Bermejo reaches. Puerto Lavalle provides a real observed reading to cross-check the GloFAS model. The park meteorological station monitors conditions inside El Impenetrable. El Colorado holds the only discharge data ever published for the Bermejo — 454 readings over 79 days (July – September 2024), then silence. It is the only evidence of how much water the river actually carries.",
      legend: isEs
        ? [
            { color: '#4db8ff', label: 'Medidor de nivel de río — activo' },
            { color: '#f0a500', label: 'Estación meteorológica' },
            { color: '#6b7280', label: 'Medidor de caudal — fuera de línea' },
          ]
        : [
            { color: '#4db8ff', label: 'River level gauge — active' },
            { color: '#f0a500', label: 'Meteorological station' },
            { color: '#6b7280', label: 'Discharge gauge — offline' },
          ],
    },
    firms: {
      description: isEs
        ? 'Detecciones de incendio en tiempo cuasi real del sensor VIIRS de NASA a bordo del Suomi-NPP. Cada punto marca un píxel de 375 m con una anomalía térmica confirmada consistente con fuego activo. Los datos se actualizan aproximadamente cada 3 horas.'
        : "Near real-time fire detections from NASA's VIIRS sensor aboard Suomi-NPP. Each point marks a 375 m pixel with a confirmed thermal anomaly consistent with active fire. Data is updated approximately every 3 hours.",
      legend: isEs
        ? [
            { color: '#ff2200', label: 'Confianza alta' },
            { color: '#ff8800', label: 'Confianza nominal' },
            { color: '#ffcc00', label: 'Confianza baja' },
          ]
        : [
            { color: '#ff2200', label: 'High confidence' },
            { color: '#ff8800', label: 'Nominal confidence' },
            { color: '#ffcc00', label: 'Low confidence' },
          ],
    },
    community: {
      description: isEs
        ? 'Eventos de origen comunitario registrados a través del panel Actuar y verificados por el equipo de Jaguar Watch. Cada marcador representa una observación enviada — incendio, contaminación, extracción ilegal o testimonio — revisada antes de aparecer en el mapa.'
        : 'Community sourced events registered through the ACT panel and verified by the Jaguar Watch team. Each marker represents a submitted observation — fire, contamination, illegal extraction, or testimony — reviewed before appearing on the map.',
      legend: [
        { color: '#8b5cf6', label: isEs ? 'Envío comunitario verificado' : 'Verified community submission', round: true },
      ],
    },
  };
}

const SENT_BANDS = [
  { id: 'true_color', en: 'Color',    es: 'Color' },
  { id: 'ndwi',       en: 'NDWI',     es: 'NDWI' },
  { id: 'swir',       en: 'SWIR',     es: 'SWIR' },
  { id: 'moisture',   en: 'Moisture', es: 'Humedad' },
  { id: 'scene',      en: 'Scene',    es: 'Escena' },
];

const SENT_MINI_LEGEND = {
  ndwi: {
    type: 'gradient',
    gradient: 'linear-gradient(to right, #00e000, #88e888, #e8fce8, #ffffff, #cce8ff, #6699ff, #0033cc)',
    ticks: ['< −0.8', '0', '> 0.8'],
    endpoints: {
      en: { left: 'Land · no water', right: 'Open water' },
      es: { left: 'Suelo · sin agua', right: 'Agua abierta' },
    },
  },
  moisture: {
    type: 'gradient',
    gradient: 'linear-gradient(to right, #8b0000, #ff6600, #ffcc88, #fffff0, #ccddff, #1144dd)',
    ticks: ['< −0.8', '0', '> 0.8'],
    endpoints: {
      en: { left: 'Dry · bare soil', right: 'Dense moist canopy' },
      es: { left: 'Seco · suelo desnudo', right: 'Canopeo húmedo' },
    },
  },
  swir: {
    type: 'swatches',
    items: [
      { color: '#2d7a2d', en: 'Healthy vegetation', es: 'Vegetación sana' },
      { color: '#111111', en: 'Water',               es: 'Agua' },
      { color: '#8b6914', en: 'Bare soil',           es: 'Suelo desnudo' },
      { color: '#6b0a0a', en: 'Burned / fire scars', es: 'Quemado / cicatrices' },
      { color: '#a0a0a0', en: 'Urban / built-up',    es: 'Área urbana' },
    ],
  },
  scene: {
    type: 'swatches',
    items: [
      { color: '#00b300', en: 'Vegetation',        es: 'Vegetación' },
      { color: '#0000ff', en: 'Water',             es: 'Agua' },
      { color: '#ffff00', en: 'Not-vegetated',     es: 'Sin vegetación' },
      { color: '#663300', en: 'Cloud shadows',     es: 'Sombras de nube' },
      { color: '#c0c0c0', en: 'Cloud (med. prob.)',es: 'Nube (prob. media)' },
      { color: '#ffffff', en: 'Cloud (high prob.)',es: 'Nube (prob. alta)' },
      { color: '#add8e6', en: 'Thin cirrus',       es: 'Cirrus fino' },
      { color: '#595959', en: 'Cast shadows',      es: 'Sombras topográf.' },
      { color: '#808080', en: 'Unclassified',      es: 'No clasificado' },
      { color: '#000000', en: 'No data',           es: 'Sin datos' },
    ],
  },
};

function SentMiniLegend({ bandId, lang }) {
  const l = SENT_MINI_LEGEND[bandId];
  if (!l) return null;
  if (l.type === 'gradient') {
    const ep = l.endpoints ? (lang === 'es' ? l.endpoints.es : l.endpoints.en) : null;
    return (
      <div style={{ marginTop: 8 }}>
        <div className={styles.sentMiniGrad} style={{ background: l.gradient }} />
        <div className={styles.sentMiniTicks}>
          {l.ticks.map(t => <span key={t} className={styles.sentMiniTickLabel}>{t}</span>)}
        </div>
        {ep && (
          <div className={styles.sentMiniEndpoints}>
            <span>{ep.left}</span>
            <span style={{ textAlign: 'right' }}>{ep.right}</span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={styles.sentMiniSwatches}>
      {l.items.map(item => (
        <div key={item.en} className={styles.sentMiniSwatchRow}>
          <span className={styles.sentMiniSwatch}
            style={{
              background: item.color,
              borderColor: item.color === '#ffffff' ? 'rgba(222,216,207,0.5)' : undefined,
              outline: item.color === '#000000' ? '1px solid rgba(222,216,207,0.3)' : undefined,
            }}
          />
          <span className={styles.sentMiniSwatchLabel}>{lang === 'es' ? item.es : item.en}</span>
        </div>
      ))}
    </div>
  );
}

function SentinelSidebarPanel({ sentinelView, setSentinelView, g, lang }) {
  const { enabled, season, band } = sentinelView;
  return (
    <div className={styles.sentPanel}>
      <div className={styles.sentHead}>
        <button
          className={`${styles.sentToggle} ${enabled ? styles.sentToggleOn : ''}`}
          onClick={() => setSentinelView(prev => ({ ...prev, enabled: !prev.enabled }))}
        >
          {enabled ? g.sentOn : g.sentOff}
        </button>
        <span className={styles.sentStatus}>Sentinel-2 L2A</span>
      </div>

      <div className={styles.sentGrid2}>
        {['dry', 'wet'].map(s => (
          <button
            key={s}
            className={season === s ? styles.sentTabOn : styles.sentTab}
            onClick={() => setSentinelView(prev => ({ ...prev, season: s }))}
          >
            {s === 'dry' ? g.sentDry : g.sentWet}
            <span style={{ display: 'block', fontSize: 8, opacity: 0.75, textTransform: 'none', letterSpacing: '0.02em', marginTop: 2, fontFamily: 'inherit' }}>
              {s === 'dry' ? g.sentDryMonths : g.sentWetMonths}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.sentGrid5}>
        {SENT_BANDS.map(b => (
          <button
            key={b.id}
            className={band === b.id ? styles.sentTabOn : styles.sentTab}
            onClick={() => setSentinelView(prev => ({ ...prev, band: b.id }))}
          >
            {lang === 'es' ? b.es : b.en}
          </button>
        ))}
      </div>

      <SentMiniLegend bandId={band} lang={lang} />
    </div>
  );
}

const GROUPS = {
  en: {
    satellite: 'Satellite',
    satelliteSub: 'Sentinel-2 L2A · ESA / Copernicus',
    sentOn: 'On',
    sentOff: 'Off',
    sentDry: 'Dry Season',
    sentDryMonths: 'May – Oct',
    sentWet: 'Wet Season',
    sentWetMonths: 'Nov – Apr',
    protected: 'Protected Areas',
    landCover: 'Land Cover',
    landCoverSub: 'MapBiomas · Gran Chaco',
    aboutMapbiomas: 'About MapBiomas',
    gsw: 'Global Surface Water',
    gswSub: 'JRC / Copernicus · 1984–2021',
    extraction: 'Illegal Extraction',
    flood: 'Flood Monitoring',
    floodSub: 'GloFAS · Bermejo–Paraná',
    ina: 'INA Telemetric (In Territory) Stations',
    inaSub: 'INA sSIyAH · Observed data · 6 stations',
    fire: 'Fire Monitoring',
    fireSub: 'NASA FIRMS · VIIRS S-NPP · 5 days',
    community: 'Community',
    communitySub: 'Community sourced events registered through the ACT panel',
    layerPark: 'National Park',
    layerBuffer: 'Buffer / Monitoring Zone',
    layerSeasonality: 'Water Seasonality',
    layerTransitions: 'Water Transitions',
    layerPumps: 'Illegal Pump Sites',
    layerGauges: 'River Gauges',
    layerIna: 'INA Stations',
    layerFire: 'Active Fire Alerts',
    layerCommunity: 'Community',
    riverTitle: 'Bermejo River',
    riverText: "The Bermejo flows ~1,200 km from Bolivia through Chaco, discharging into the Paraguay River. Its highly dynamic meanders and sediment load make it one of South America's most ecologically significant rivers.",
    source: 'Source: JRC Global Surface Water Explorer · WGS 84 · Satellite: Mapbox / Maxar',
    descBtn: 'Description and legend',
  },
  es: {
    satellite: 'Satélite',
    satelliteSub: 'Sentinel-2 L2A · ESA / Copernicus',
    sentOn: 'Activo',
    sentOff: 'Inactivo',
    sentDry: 'Est. Seca',
    sentDryMonths: 'Mayo – Oct',
    sentWet: 'Est. Húmeda',
    sentWetMonths: 'Nov – Abr',
    protected: 'Áreas Protegidas',
    landCover: 'Cobertura del Suelo',
    landCoverSub: 'MapBiomas · Gran Chaco',
    aboutMapbiomas: 'Acerca de MapBiomas',
    gsw: 'Agua Superficial Global',
    gswSub: 'JRC / Copernicus · 1984–2021',
    extraction: 'Extracción Ilegal',
    flood: 'Monitoreo de Crecidas',
    floodSub: 'GloFAS · Bermejo–Paraná',
    ina: 'Estaciones Telesimétricas INA (En Territorio)',
    inaSub: 'INA sSIyAH · Datos observados · 6 estaciones',
    fire: 'Monitoreo de Incendios',
    fireSub: 'NASA FIRMS · VIIRS S-NPP · 5 días',
    community: 'Comunidad',
    communitySub: 'Eventos comunitarios registrados a través del panel Actuar',
    layerPark: 'Parque Nacional',
    layerBuffer: 'Zona de Amortiguación',
    layerSeasonality: 'Estacionalidad del Agua',
    layerTransitions: 'Transiciones del Agua',
    layerPumps: 'Sitios de Bombeo Ilegal',
    layerGauges: 'Estaciones de Caudal',
    layerIna: 'Estaciones INA',
    layerFire: 'Alertas de Incendio Activo',
    layerCommunity: 'Comunidad',
    riverTitle: 'Río Bermejo',
    riverText: 'El Bermejo recorre ~1.200 km desde Bolivia a través del Chaco, desembocando en el río Paraguay. Sus meandros altamente dinámicos y su carga de sedimentos lo convierten en uno de los ríos ecológicamente más significativos de América del Sur.',
    source: 'Fuente: JRC Global Surface Water Explorer · WGS 84 · Satélite: Mapbox / Maxar',
    descBtn: 'Descripción y leyenda',
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

function GswLayerRow({ layer, active, onToggle, layerInfo, descBtn }) {
  const [open, setOpen] = useState(false);
  const info = layerInfo[layer.id];
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
            onClick={() => setOpen(o => !o)} title={descBtn}>
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      {open && <InfoPanel info={info} />}
    </div>
  );
}

function InfoRow({ id, label, layerInfo, descBtn }) {
  const [open, setOpen] = useState(false);
  const info = layerInfo[id];
  if (!info) return null;
  return (
    <div className={styles.gswBlock}>
      <div className={`${styles.layerRow} ${styles.layerRowGsw}`}>
        <span style={{ flex: 1, paddingLeft: 6, fontSize: 11, color: 'var(--sand-dim)', opacity: 0.55 }}>{label}</span>
        <button className={`${styles.infoBtn} ${open ? styles.infoBtnOpen : ''}`}
          onClick={() => setOpen(o => !o)} title={descBtn}>
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && <InfoPanel info={info} />}
    </div>
  );
}


export default function Sidebar({ layers, setLayers, mapbiomas, setMapbiomas, sentinelView, setSentinelView }) {
  const { lang } = useLang();
  const g = GROUPS[lang] ?? GROUPS.en;
  const layerInfo = getLayerInfo(lang);
  const toggleLayer = (id) => setLayers(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.panelScroll}>

        {/* 1 — Protected Areas */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.protected}</span>
          </div>
          <GswLayerRow layer={{ id: 'park',   label: g.layerPark,   color: '#ffffff' }}             active={layers.park}   onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
          <GswLayerRow layer={{ id: 'buffer', label: g.layerBuffer, color: '#ffffff', dashed: true }} active={layers.buffer} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        {/* 2 — Land Cover / MapBiomas */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.landCover}</span>
            <span className={styles.groupSub}>{g.landCoverSub}</span>
          </div>
          <InfoRow id="mapbiomas" label={g.aboutMapbiomas} layerInfo={layerInfo} descBtn={g.descBtn} />
          <MapBiomasPanel mapbiomas={mapbiomas} setMapbiomas={setMapbiomas} />
        </div>

        {/* 2.5 — Satellite / Sentinel-2 */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.satellite}</span>
            <span className={styles.groupSub}>{g.satelliteSub}</span>
          </div>
          <SentinelSidebarPanel
            sentinelView={sentinelView}
            setSentinelView={setSentinelView}
            g={g}
            lang={lang}
          />
        </div>

        {/* 3 — Global Surface Water */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.gsw}</span>
            <span className={styles.groupSub}>{g.gswSub}</span>
          </div>
          <GswLayerRow layer={{ id: 'gsw_seasonality', label: g.layerSeasonality, color: '#5dacc8' }} active={layers.gsw_seasonality} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
          <GswLayerRow layer={{ id: 'gsw_transitions', label: g.layerTransitions,  color: '#ff7f27' }} active={layers.gsw_transitions} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        {/* 4 — Illegal Extraction */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.extraction}</span>
          </div>
          <GswLayerRow layer={{ id: 'pumps', label: g.layerPumps, color: '#63412F' }} active={layers.pumps} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        {/* 5 — Flood Monitoring */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.flood}</span>
            <span className={styles.groupSub}>{g.floodSub}</span>
          </div>
          <GswLayerRow layer={{ id: 'floodGauges', label: g.layerGauges, color: STATUS_COLORS.normal }} active={layers.floodGauges} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        {/* 6 — INA Telemetric Stations */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.ina}</span>
            <span className={styles.groupSub}>{g.inaSub}</span>
          </div>
          <GswLayerRow layer={{ id: 'inaStations', label: g.layerIna, color: '#4db8ff' }} active={layers.inaStations} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        {/* 7 — Fire Monitoring */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.fire}</span>
            <span className={styles.groupSub}>{g.fireSub}</span>
          </div>
          <GswLayerRow layer={{ id: 'firms', label: g.layerFire, color: '#ff4400' }} active={layers.firms} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        {/* 8 — Community */}
        <div className={styles.layerGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupLabel}>{g.community}</span>
            <span className={styles.groupSub}>{g.communitySub}</span>
          </div>
          <GswLayerRow layer={{ id: 'community', label: g.layerCommunity, color: '#8b5cf6' }} active={layers.community} onToggle={toggleLayer} layerInfo={layerInfo} descBtn={g.descBtn} />
        </div>

        <div className={styles.legend}>
          <p className={styles.legendTitle}>{g.riverTitle}</p>
          <p className={styles.legendText}>{g.riverText}</p>
          <div className={styles.legendDivider} />
          <p className={styles.legendText} style={{ fontStyle: 'italic', fontSize: 11 }}>
            {g.source}
          </p>
        </div>

      </div>
    </aside>
  );
}
