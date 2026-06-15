import { useMemo, useCallback } from 'react';
import baseStyles from './ContentView.module.css';
import styles from './AnalyzeView.module.css';
import MapBiomasPanel from './MapBiomasPanel';
import MapBiomasCoverageChart from './MapBiomasCoverageChart';
import { useLang } from '../context/LangContext';

const CONF_COLOR = { h: '#ff2200', high: '#ff2200', n: '#ff8800', nominal: '#ff8800', l: '#ffcc00', low: '#ffcc00' };

const BANDS = [
  { key: 'true_color', labelEn: 'True Color',  labelEs: 'Color Real',     thumb: '/data/sentinel/thumb_true_color.png' },
  { key: 'ndwi',       labelEn: 'NDWI',         labelEs: 'NDWI',           thumb: '/data/sentinel/thumb_ndwi.png' },
  { key: 'swir',       labelEn: 'SWIR',         labelEs: 'SWIR',           thumb: '/data/sentinel/thumb_swir.png' },
  { key: 'moisture',   labelEn: 'Moisture',     labelEs: 'Humedad',        thumb: '/data/sentinel/thumb_moisture.png' },
  { key: 'scene',      labelEn: 'Scene Class',  labelEs: 'Clasificación',  thumb: '/data/sentinel/thumb_scene.png' },
];

const BAND_DESC = {
  en: {
    true_color: 'Natural color composite (Bands 4-3-2). Vegetation appears green, bare soil tan/brown, water dark. The reference view for spotting deforestation edges and land-use change.',
    ndwi:       'The Normalized Difference Water Index (NDWI) is most appropriate for water body mapping. Values of water bodies are larger than 0.5. Vegetation has smaller values. Built-up features have positive values between zero and 0.2.',
    swir:       'Short-wave infrared (SWIR) measurements help estimate how much water is present in plants and soil, as water absorbs SWIR wavelengths. In this composite, vegetation appears in shades of green, soils and built-up areas in various shades of brown, and water appears black. Newly burned land reflects strongly in SWIR bands — valuable for mapping fire damage and deforestation scars.',
    moisture:   'The Normalized Difference Moisture Index (NDMI) determines vegetation water content and monitors droughts. The range is −1 to 1. Negative values (approaching −1) correspond to barren soil. Values around zero (−0.2 to 0.4) indicate water stress. High positive values (0.4 to 1) represent dense canopy without water stress.',
    scene:      'Scene classification distinguishes between cloudy, clear, and water pixels from Sentinel-2 data using ESA\'s L2A algorithm. Twelve categories cover clouds, vegetation, soils, water, and snow. Useful for assessing scene quality before interpreting other bands.',
  },
  es: {
    true_color: 'Composición en color natural (Bandas 4-3-2). La vegetación aparece verde, el suelo desnudo beige/marrón, el agua oscura. La vista de referencia para detectar bordes de deforestación y cambio de uso del suelo.',
    ndwi:       'El Índice de Diferencia Normalizada de Agua (NDWI) es ideal para el mapeo de cuerpos de agua. Los cuerpos de agua tienen valores superiores a 0.5. La vegetación tiene valores menores. Las áreas construidas presentan valores positivos entre cero y 0.2.',
    swir:       'Las mediciones de infrarrojo de onda corta (SWIR) estiman el contenido de agua en plantas y suelo. En esta composición, la vegetación aparece en tonos verdes, los suelos y áreas urbanas en tonos marrones, y el agua en negro. Las áreas quemadas reflejan fuertemente en SWIR — útil para mapear daños por fuego y cicatrices de desmonte.',
    moisture:   'El Índice de Humedad de Diferencia Normalizada (NDMI) determina el contenido de agua en la vegetación y monitorea sequías. El rango va de −1 a 1. Los valores negativos corresponden a suelo desnudo. Los valores alrededor de cero (−0.2 a 0.4) indican estrés hídrico. Los valores altos positivos (0.4 a 1) representan dosel denso sin estrés hídrico.',
    scene:      'La clasificación de escena distingue entre píxeles nublados, claros y de agua en datos Sentinel-2 mediante el algoritmo L2A de ESA. Se proveen doce categorías que incluyen nubes, vegetación, suelos, agua y nieve. Útil para evaluar la calidad de la escena antes de interpretar otras bandas.',
  },
};

// Color legends rendered below the band description
const BAND_LEGEND = {
  ndwi: {
    type: 'gradient',
    gradient: 'linear-gradient(to right, #00e000, #88e888, #e8fce8, #ffffff, #cce8ff, #6699ff, #0033cc)',
    ticks: ['< −0.8', '0', '0.8'],
    endpoints: {
      en: { left: 'Land · no water body', right: 'Open water surface' },
      es: { left: 'Suelo · sin agua',     right: 'Superficie de agua' },
    },
  },
  moisture: {
    type: 'gradient',
    gradient: 'linear-gradient(to right, #8b0000, #cc2200, #ff6600, #ffcc88, #fffff0, #ccddff, #6688ff, #1144dd)',
    ticks: ['< −0.8', '−0.24', '0', '0.24', '> 0.8'],
    endpoints: {
      en: { left: 'Dry · bare soil', right: 'Dense moist canopy' },
      es: { left: 'Seco · suelo desnudo', right: 'Canopeo húmedo' },
    },
  },
  swir: {
    type: 'swatches',
    items: [
      { color: '#2d7a2d', en: 'Healthy vegetation',  es: 'Vegetación sana' },
      { color: '#111111', en: 'Water',                es: 'Agua' },
      { color: '#8b6914', en: 'Soil / bare land',     es: 'Suelo desnudo' },
      { color: '#6b0a0a', en: 'Burned / fire scars',  es: 'Quemado / cicatrices' },
      { color: '#a0a0a0', en: 'Urban / built-up',     es: 'Área urbana' },
    ],
  },
  scene: {
    type: 'swatches',
    items: [
      { color: '#00b300', en: 'Vegetation',             es: 'Vegetación' },
      { color: '#0000ff', en: 'Water',                  es: 'Agua' },
      { color: '#ffff00', en: 'Not-vegetated',          es: 'Sin vegetación' },
      { color: '#808080', en: 'Unclassified',           es: 'No clasificado' },
      { color: '#663300', en: 'Cloud shadows',          es: 'Sombras de nubes' },
      { color: '#c0c0c0', en: 'Cloud (med. prob.)',     es: 'Nube (prob. media)' },
      { color: '#ffffff', en: 'Cloud (high prob.)',     es: 'Nube (prob. alta)' },
      { color: '#add8e6', en: 'Thin cirrus',            es: 'Cirrus fino' },
      { color: '#ff0000', en: 'Saturated pixel',        es: 'Píxel saturado' },
      { color: '#595959', en: 'Cast shadows',           es: 'Sombras topográficas' },
      { color: '#ff69b4', en: 'Snow or ice',            es: 'Nieve o hielo' },
      { color: '#000000', en: 'No data',                es: 'Sin datos' },
    ],
  },
};

function GradientLegend({ gradient, ticks, endpoints, lang }) {
  const ep = endpoints ? (lang === 'es' ? endpoints.es : endpoints.en) : null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        height: 11,
        borderRadius: 2,
        background: gradient,
        border: '1px solid rgba(222,216,207,0.18)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {ticks.map(label => (
          <span key={label} style={{ fontSize: 9, color: 'var(--sand-dim)', letterSpacing: '0.04em', fontFamily: "'IM Fell Double Pica', serif" }}>
            {label}
          </span>
        ))}
      </div>
      {ep && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--sand-dim)', fontFamily: "'IM Fell Double Pica', serif" }}>{ep.left}</span>
          <span style={{ fontSize: 11, color: 'var(--sand-dim)', fontFamily: "'IM Fell Double Pica', serif", textAlign: 'right' }}>{ep.right}</span>
        </div>
      )}
    </div>
  );
}

function SwatchLegend({ items, lang }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px', marginTop: 12 }}>
      {items.map(item => (
        <div key={item.en} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2, flexShrink: 0, display: 'inline-block',
            background: item.color,
            border: item.color === '#ffffff' ? '1px solid rgba(222,216,207,0.5)' : '1px solid rgba(0,0,0,0.2)',
          }} />
          <span style={{ fontSize: 10, color: 'var(--sand-dim)', lineHeight: 1, fontFamily: "'IM Fell Double Pica', serif" }}>
            {lang === 'es' ? item.es : item.en}
          </span>
        </div>
      ))}
    </div>
  );
}

function BandLegend({ bandKey, lang }) {
  const legend = BAND_LEGEND[bandKey];
  if (!legend) return null;
  if (legend.type === 'gradient') return <GradientLegend gradient={legend.gradient} ticks={legend.ticks} endpoints={legend.endpoints} lang={lang} />;
  if (legend.type === 'swatches') return <SwatchLegend items={legend.items} lang={lang} />;
  return null;
}

const T = {
  en: {
    title: 'Analyze',
    lead: 'Live environmental intelligence for the Bermejo basin — fire, flood, and satellite data explained.',
    satTitle: 'Satellite Monitoring',
    satSub: 'ESA Copernicus · Sentinel-2 L2A · 10 m resolution',
    satLink: '↗ Open Copernicus Browser',
    satSeasonDry: 'Dry Season',
    satSeasonWet: 'Wet Season',
    satSeasonDrySub: 'Jul 2016 vs Jul 2025',
    satSeasonWetSub: 'Dec 2015 vs Jan 2026',
    satOn: 'On',
    satOff: 'Off',
    satActive: 'Drag the divider on the map to compare epochs',
    satDesc: 'The Bermejo river follows a hydrological cycle with a wet season from November to April — making the river turbid from high sediment flow — and a dry season from May to October, when the river runs clearer. Sentinel-2 L2A imagery is actively used to understand how the territory changes over time. Analyze shifts in land moisture, deforestation, the meandering river, contaminants, and vegetation health. Compare two dates 10 years apart for both seasons across five spectral bands by dragging the divider on the map.',
    lcTitle: 'Land Cover Change',
    lcSub: 'MapBiomas Gran Chaco · Collection 5 · 30 m · 1985–2023',
    lcLink: '↗ Open MapBiomas',
    lcDesc: 'Annual 30 m land-cover classification using Landsat imagery, 1985–2023. Slide through the years to watch the agricultural frontier advance into dry Chaco forest — or use the play button to animate the full 38-year sequence. Click any bar in the chart below to jump the map to that year.',
    floodTitle: 'Flood Monitoring',
    floodSub: 'Open-Meteo · Copernicus GloFAS ensemble · Bermejo–Paraguay basin',
    floodLink: '↗ Open Copernicus Flood Map',
    floodDesc1: 'Modelled discharge for 5 virtual gauge points on the Bermejo/Teuco, Pilcomayo, and Paraguay rivers. The headline figure is the anomaly vs the 30-day baseline — how unusual current flow is relative to its seasonal norm. That ratio is what GloFAS does reliably. Raw m³/s values and a p25–p75 ensemble spread are secondary.',
    floodDesc2: 'Status levels — Near Baseline / Elevated / High / Very High — are model thresholds against that baseline, not official warnings. See Data Sources below for full limitations by river.',
    floodStatus: 'Live · Open-Meteo Flood API · no API key required · 5 virtual gauge points active',
    inaTitle: 'INA Observed Gauges',
    inaSub: 'INA sSIyAH · Argentina National Water Institute · 4 river-level stations',
    inaLink: '↗ Open INA Alert Map',
    inaDesc: (
      <>
        Four telemetric stations from INA's sSIyAH network measure actual river level along the Bermejo corridor:
        <strong> Aguas Blancas</strong> (upper reaches, Bolivia border),
        <strong> Embarcación</strong> (mid-river confluence zone),
        <strong> Puerto Velaz</strong>, and
        <strong> Puerto Lavalle</strong> (lower Bermejo, 121 km downstream of the park).
        <strong> El Colorado</strong> holds the only discharge data ever published for the Bermejo — 454 readings over 79 days (July–September 2024), then permanent silence.
        That 79-day record is the only time anyone measured how much water this river actually carries.
      </>
    ),
    inaLoading: 'Loading INA station data…',
    inaNoStations: 'No active river-level stations',
    bermejo: 'Bermejo at',
    vs30: 'vs 30-day mean',
    coloradoOffline: 'El Colorado · Offline — 454 readings, 79-day window only (Jul–Sep 2024)',
    coloradoSilent: '· silent',
    firmsTitle: 'Active Fire Detections',
    firmsSub: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · 375 m · last 5 days',
    firmsLink: '↗ Open FIRMS Map',
    firmsDesc1: 'The Fire Information for Resource Management System (FIRMS) distributes near real-time active fire data from NASA\'s VIIRS sensors aboard three satellites — Suomi-NPP, NOAA-20, and NOAA-21. All three 375 m products are fetched in parallel and merged to maximise detection coverage. Each pixel marks a thermal anomaly consistent with fire at the time of satellite overpass. Fire detections in the Bermejo corridor are a direct indicator of deforestation pressure, agricultural burning, and land-clearing in the buffer zone.',
    firmsDesc2: (
      <>Data latency is approximately <strong>3 hours</strong> from satellite acquisition. Confidence levels — high (H), nominal (N), low (L) — reflect the algorithm's certainty that the anomaly is an active fire rather than a hot surface or data artefact.</>
    ),
    firmsLoading: 'Loading fire data…',
    firmsError: 'Could not reach FIRMS API:',
    firmsErrorSuffix: 'Check network or API key.',
    totalDet: 'total detections',
    highConf: 'high confidence',
    nominal: 'nominal',
    lowConf: 'low confidence',
    liveDetection: 'Live · last detection',
    retrieved: '· retrieved',
    dsTitle: 'Data Sources',
    dsSub: 'What each dataset is, how we use it, and what it cannot tell us',
    ds1label: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · 375 m · ~3 h latency',
    ds1desc: 'Satellite-detected thermal anomalies from three polar-orbiting satellites, merged into a single near-real-time feed. We colour each point by algorithm confidence (High / Nominal / Low) and display the last 5 days. What it cannot tell us: whether an anomaly is an active fire, an agricultural burn, or a hot surface. Smoke and cloud cover can suppress detections or create gaps in coverage.',
    ds2label: 'Open-Meteo / Copernicus GloFAS v4 · 0.05° grid (~5 km) · ensemble model',
    ds2desc: (
      <>Modelled river discharge from the Global Flood Awareness System — no physical gauges. We use the ratio of current modelled discharge to the 30-day baseline as the primary risk signal, and display the p25–p75 ensemble spread as a measure of model uncertainty. <em>What it cannot tell us:</em> actual water levels. The <strong>Pilcomayo</strong> is braided, sediment-heavy, and partly regulated — its channel shifts seasonally and GloFAS is likely to represent it poorly. Treat its readings with extra caution (model confidence: low). This is not an authoritative warning system; consult INA or SENAMHI for operational decisions.</>
    ),
    ds3label: 'MapBiomas Gran Chaco · Collection 5 · Landsat 30 m · 1985–2023',
    ds3desc: (
      <>Annual land-cover classification trained on Landsat imagery using machine-learning algorithms and local ground-truth data. We display it as a time-lapse overlay to track deforestation and agricultural expansion. <em>What it cannot tell us:</em> changes after 2023; features below ~1 ha (the minimum mapping unit); or the difference between degraded and structurally intact forest within a single classified pixel.</>
    ),
    ds4label: 'JRC Global Surface Water Explorer · Landsat 30 m · 1984–2021',
    ds4desc: (
      <>Landsat-derived record of where and how long surface water was present. Two static overlays: <em>seasonality</em> (average months per year water was detected, 1984–2021) and <em>transitions</em> (gains and losses of permanent vs seasonal water between the early 1984–1999 and late 2000–2021 epochs). <em>What it cannot tell us:</em> conditions after 2021; cloud-masked periods appear as dry even when water may have been present.</>
    ),
    footer: 'NASA FIRMS NRT · Copernicus GloFAS via Open-Meteo · MapBiomas Collection 5 · JRC Global Surface Water Explorer · ESA Copernicus / Sentinel-2 L2A (pipeline)',
  },
  es: {
    title: 'Analizar',
    lead: 'Inteligencia ambiental en vivo para la cuenca del Bermejo — incendios, crecidas y datos satelitales explicados.',
    satTitle: 'Monitoreo Satelital',
    satSub: 'ESA Copernicus · Sentinel-2 L2A · resolución 10 m',
    satLink: '↗ Abrir Copernicus Browser',
    satSeasonDry: 'Estación Seca',
    satSeasonWet: 'Estación Húmeda',
    satSeasonDrySub: 'Jul 2016 vs Jul 2025',
    satSeasonWetSub: 'Dic 2015 vs Ene 2026',
    satOn: 'Activo',
    satOff: 'Inactivo',
    satActive: 'Arrastrá el divisor en el mapa para comparar épocas',
    satDesc: 'El río Bermejo sigue un ciclo hidrológico con una estación húmeda de noviembre a abril — que torna el río turbio por el alto flujo de sedimentos — y una estación seca de mayo a octubre, cuando el río corre más claro. Las imágenes Sentinel-2 L2A se utilizan activamente para comprender cómo cambia el territorio a lo largo del tiempo. Analizá los cambios en la humedad del suelo, la deforestación, el río meandroso, los contaminantes y la salud de la vegetación. Comparé dos fechas con 10 años de diferencia para ambas estaciones en cinco bandas espectrales arrastrando el divisor en el mapa.',
    lcTitle: 'Cambio en Cobertura del Suelo',
    lcSub: 'MapBiomas Gran Chaco · Colección 5 · 30 m · 1985–2023',
    lcLink: '↗ Abrir MapBiomas',
    lcDesc: 'Clasificación anual de cobertura del suelo a 30 m usando imágenes Landsat, 1985–2023. Deslizá por los años para observar el avance de la frontera agropecuaria sobre el bosque chaqueño seco — o usá el botón de reproducción para animar la secuencia completa de 38 años. Hacé clic en cualquier barra del gráfico para llevar el mapa a ese año.',
    floodTitle: 'Monitoreo de Crecidas',
    floodSub: 'Open-Meteo · Ensamble GloFAS Copernicus · cuenca Bermejo–Paraguay',
    floodLink: '↗ Abrir Mapa de Crecidas Copernicus',
    floodDesc1: 'Caudal modelado para 5 puntos de control virtuales en los ríos Bermejo/Teuco, Pilcomayo y Paraguay. La cifra principal es la anomalía vs la línea base de 30 días — qué tan inusual es el flujo actual en relación a su norma estacional. Eso es lo que GloFAS hace de manera confiable. Los valores brutos en m³/s y el rango de ensamble p25–p75 son secundarios.',
    floodDesc2: 'Los niveles de estado — Cerca de la Base / Elevado / Alto / Muy Alto — son umbrales del modelo contra esa línea base, no alertas oficiales. Ver Fuentes de Datos más abajo para las limitaciones completas por río.',
    floodStatus: 'En vivo · Open-Meteo Flood API · sin clave de API · 5 puntos de control virtuales activos',
    inaTitle: 'Estaciones Observadas INA',
    inaSub: 'INA sSIyAH · Instituto Nacional del Agua · 4 estaciones de nivel de río',
    inaLink: '↗ Abrir Mapa de Alertas INA',
    inaDesc: (
      <>
        Cuatro estaciones telesimétricas de la red sSIyAH del INA miden el nivel real del río a lo largo del corredor del Bermejo:
        <strong> Aguas Blancas</strong> (tramos superiores, frontera con Bolivia),
        <strong> Embarcación</strong> (zona de confluencia del río medio),
        <strong> Puerto Velaz</strong> y
        <strong> Puerto Lavalle</strong> (Bermejo inferior, 121 km aguas abajo del parque).
        <strong> El Colorado</strong> tiene los únicos datos de caudal publicados para el Bermejo — 454 lecturas en 79 días (julio–septiembre 2024), luego silencio permanente.
        Ese registro de 79 días es la única vez que alguien midió cuánta agua lleva realmente este río.
      </>
    ),
    inaLoading: 'Cargando datos de estaciones INA…',
    inaNoStations: 'Sin estaciones de nivel de río activas',
    bermejo: 'Bermejo en',
    vs30: 'vs media 30 días',
    coloradoOffline: 'El Colorado · Fuera de línea — 454 lecturas, ventana de 79 días (jul–sep 2024)',
    coloradoSilent: '· silencio',
    firmsTitle: 'Detecciones de Incendio Activo',
    firmsSub: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · 375 m · últimos 5 días',
    firmsLink: '↗ Abrir Mapa FIRMS',
    firmsDesc1: 'El Sistema de Información de Incendios para la Gestión de Recursos (FIRMS) distribuye datos de fuego activo en tiempo cuasi real de los sensores VIIRS de NASA a bordo de tres satélites — Suomi-NPP, NOAA-20 y NOAA-21. Los tres productos de 375 m se obtienen en paralelo y se combinan para maximizar la cobertura de detección. Cada píxel marca una anomalía térmica consistente con fuego al momento del paso del satélite. Las detecciones de incendio en el corredor del Bermejo son un indicador directo de la presión de deforestación, quema agrícola y habilitación de tierras en la zona de amortiguación.',
    firmsDesc2: (
      <>La latencia de los datos es de aproximadamente <strong>3 horas</strong> desde la adquisición satelital. Los niveles de confianza — alta (H), nominal (N), baja (L) — reflejan la certeza del algoritmo de que la anomalía es un incendio activo y no una superficie caliente o un artefacto de datos.</>
    ),
    firmsLoading: 'Cargando datos de incendios…',
    firmsError: 'No se pudo acceder a la API de FIRMS:',
    firmsErrorSuffix: 'Verificá la red o la clave de API.',
    totalDet: 'detecciones totales',
    highConf: 'confianza alta',
    nominal: 'nominal',
    lowConf: 'confianza baja',
    liveDetection: 'En vivo · última detección',
    retrieved: '· obtenido',
    dsTitle: 'Fuentes de Datos',
    dsSub: 'Qué es cada conjunto de datos, cómo lo usamos y qué no puede decirnos',
    ds1label: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · 375 m · ~3 h latencia',
    ds1desc: 'Anomalías térmicas detectadas por satélite de tres satélites de órbita polar, fusionadas en un único feed de tiempo cuasi real. Coloreamos cada punto por la confianza del algoritmo (Alta / Nominal / Baja) y mostramos los últimos 5 días. Lo que no puede decirnos: si una anomalía es un incendio activo, una quema agrícola o una superficie caliente. El humo y la nubosidad pueden suprimir detecciones o crear brechas en la cobertura.',
    ds2label: 'Open-Meteo / Copernicus GloFAS v4 · cuadrícula 0,05° (~5 km) · modelo de ensamble',
    ds2desc: (
      <>Caudal fluvial modelado por el Sistema Global de Alerta de Inundaciones — sin estaciones físicas. Usamos el cociente entre el caudal modelado actual y la línea base de 30 días como la señal de riesgo principal, y mostramos el rango de ensamble p25–p75 como medida de incertidumbre del modelo. <em>Lo que no puede decirnos:</em> niveles reales del agua. El <strong>Pilcomayo</strong> es trenzado, de alta carga de sedimentos y parcialmente regulado — su cauce cambia estacionalmente y GloFAS probablemente lo represente mal. Interpretá sus lecturas con precaución adicional (confianza del modelo: baja). Esto no es un sistema de alerta autorizado; consultá al INA o SENAMHI para decisiones operativas.</>
    ),
    ds3label: 'MapBiomas Gran Chaco · Colección 5 · Landsat 30 m · 1985–2023',
    ds3desc: (
      <>Clasificación anual de cobertura del suelo entrenada con imágenes Landsat usando algoritmos de aprendizaje automático y datos de campo locales. La mostramos como superposición de lapso de tiempo para rastrear la deforestación y la expansión agrícola. <em>Lo que no puede decirnos:</em> cambios posteriores a 2023; elementos por debajo de ~1 ha (la unidad mínima de mapeo); o la diferencia entre bosque degradado y estructuralmente intacto dentro de un único píxel clasificado.</>
    ),
    ds4label: 'JRC Global Surface Water Explorer · Landsat 30 m · 1984–2021',
    ds4desc: (
      <>Registro derivado de Landsat sobre dónde y cuánto tiempo estuvo presente el agua superficial. Dos coberturas estáticas: <em>estacionalidad</em> (promedio de meses por año en que se detectó agua, 1984–2021) y <em>transiciones</em> (ganancias y pérdidas de agua permanente vs estacional entre las épocas temprana 1984–1999 y reciente 2000–2021). <em>Lo que no puede decirnos:</em> condiciones posteriores a 2021; los períodos con nubosidad aparecen como secos incluso cuando pudo haber habido agua.</>
    ),
    footer: 'NASA FIRMS NRT · Copernicus GloFAS via Open-Meteo · MapBiomas Colección 5 · JRC Global Surface Water Explorer · ESA Copernicus / Sentinel-2 L2A (pipeline)',
  },
};

function StatusDot({ color }) {
  return <span className={styles.statusDot} style={{ background: color }} />;
}

export default function AnalyzeView({ firmsRows, firmsLoading, firmsError, firmsFetchedAt, mapbiomas, setMapbiomas, inaStations, inaLoading, sentinelView, setSentinelView }) {
  const { lang } = useLang();
  const t = T[lang] ?? T.en;

  const counts = useMemo(() => {
    if (!firmsRows?.length) return { total: 0, high: 0, nominal: 0, low: 0 };
    const high    = firmsRows.filter(r => r.confidence === 'h' || r.confidence === 'high').length;
    const low     = firmsRows.filter(r => r.confidence === 'l' || r.confidence === 'low').length;
    const nominal = firmsRows.length - high - low;
    return { total: firmsRows.length, high, nominal, low };
  }, [firmsRows]);

  const lastDetection = useMemo(() => {
    if (!firmsRows?.length) return null;
    return [...firmsRows.map(r => r.acq_date).filter(Boolean)].sort().at(-1);
  }, [firmsRows]);

  const handleCoverageYearChange = useCallback(
    y => setMapbiomas(prev => ({ ...prev, year: y, enabled: true })),
    [setMapbiomas]
  );

  return (
    <div className={baseStyles.view}>
      <div className={baseStyles.scroll}>

        <header className={baseStyles.viewHeader}>
          <h2 className={baseStyles.viewTitle}>{t.title}</h2>
          <p className={baseStyles.viewLead}>
            <em>{t.lead}</em>
          </p>
        </header>

        {/* ── Sentinel-2 ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{t.satTitle}</span>
              <a href="https://browser.dataspace.copernicus.eu/?zoom=5&lat=50.16282&lng=20.78613&themeId=DEFAULT-THEME&demSource3D=%22MAPZEN%22&cloudCoverage=30&dateMode=SINGLE" target="_blank" rel="noreferrer" className={styles.cardLink}>{t.satLink}</a>
            </div>
            <span className={styles.cardSub}>{t.satSub}</span>
          </div>
          <div className={styles.cardBody}>
            {/* Description */}
            <p className={styles.desc}>{t.satDesc}</p>

            {/* ON / OFF toggle — MapBiomas style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, marginBottom: 6 }}>
              <button
                onClick={() => setSentinelView(prev => ({ ...prev, enabled: !prev.enabled }))}
                style={{
                  fontFamily: "'Icone Pro', 'IM Fell Double Pica', serif",
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '5px 14px',
                  background: sentinelView.enabled ? 'var(--green)' : 'transparent',
                  border: sentinelView.enabled ? '1px solid var(--green)' : '1px solid rgba(184,116,58,0.55)',
                  borderRadius: 3,
                  color: sentinelView.enabled ? '#faf9f7' : '#b8743a',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {sentinelView.enabled ? t.satOn : t.satOff}
              </button>
              {sentinelView.enabled && (
                <span className={styles.statusText} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot color="#16a34a" />{t.satActive}
                </span>
              )}
            </div>

            <div className={styles.divider} />

            {/* Season tabs — full width, 2 equal columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              {['dry', 'wet'].map(s => (
                <button
                  key={s}
                  className={sentinelView.season === s ? styles.tabActive : styles.tab}
                  onClick={() => setSentinelView(prev => ({ ...prev, season: s }))}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  {s === 'dry' ? t.satSeasonDry : t.satSeasonWet}
                  <span style={{ display: 'block', fontSize: 9, opacity: 0.7, letterSpacing: '0.05em', textTransform: 'none', marginTop: 2, fontFamily: 'inherit' }}>
                    {s === 'dry' ? t.satSeasonDrySub : t.satSeasonWetSub}
                  </span>
                </button>
              ))}
            </div>

            {/* Band tabs — full width, 5 equal columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 16 }}>
              {BANDS.map(b => (
                <button
                  key={b.key}
                  className={sentinelView.band === b.key ? styles.tabActive : styles.tab}
                  onClick={() => setSentinelView(prev => ({ ...prev, band: b.key }))}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  {lang === 'es' ? b.labelEs : b.labelEn}
                </button>
              ))}
            </div>

            {/* Thumbnail + description + legend */}
            {(() => {
              const activeBand = BANDS.find(b => b.key === sentinelView.band);
              const desc = BAND_DESC[lang]?.[sentinelView.band] ?? BAND_DESC.en[sentinelView.band];
              return (
                <div className={styles.bandRow}>
                  {activeBand?.thumb && (
                    <img src={activeBand.thumb} alt={activeBand.labelEn} className={styles.bandThumb} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className={styles.bandDesc}>{desc}</p>
                    <BandLegend bandKey={sentinelView.band} lang={lang} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── MapBiomas Land Cover ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{t.lcTitle}</span>
              <a href="https://plataforma.mapbiomas.org/coverage/coverage_lclu?tl[id]=1&tl[themeKey]=coverage&tl[subthemeKey]=coverage_lclu&tl[pixelValues][]=3&tl[pixelValues][]=4&tl[pixelValues][]=45&tl[pixelValues][]=6&tl[pixelValues][]=43&tl[pixelValues][]=42&tl[pixelValues][]=44&tl[pixelValues][]=11&tl[pixelValues][]=15&tl[pixelValues][]=57&tl[pixelValues][]=58&tl[pixelValues][]=36&tl[pixelValues][]=9&tl[pixelValues][]=23&tl[pixelValues][]=24&tl[pixelValues][]=25&tl[pixelValues][]=61&tl[pixelValues][]=26&tl[pixelValues][]=27&tl[year]=2021&tl[legendKey]=default&t[regionKey]=chaco&t[ids][]=2-4-1&t[divisionCategoryId]=1" target="_blank" rel="noreferrer" className={styles.cardLink}>{t.lcLink}</a>
            </div>
            <span className={styles.cardSub}>{t.lcSub}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>{t.lcDesc}</p>
            <div className={styles.divider} />
            <MapBiomasPanel mapbiomas={mapbiomas} setMapbiomas={setMapbiomas} />
            <MapBiomasCoverageChart
              year={mapbiomas.year}
              onYearChange={handleCoverageYearChange}
            />
          </div>
        </div>

        {/* ── Flood Monitoring ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{t.floodTitle}</span>
              <a href="https://global-flood.emergency.copernicus.eu/react/map" target="_blank" rel="noreferrer" className={styles.cardLink}>{t.floodLink}</a>
            </div>
            <span className={styles.cardSub}>{t.floodSub}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>{t.floodDesc1}</p>
            <p className={styles.desc} style={{ marginTop: 10 }}>{t.floodDesc2}</p>
            <div className={styles.statusRow}>
              <StatusDot color="#16a34a" />
              <span className={styles.statusText}>{t.floodStatus}</span>
            </div>
          </div>
        </div>

        {/* ── INA Telemetric Stations ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{t.inaTitle}</span>
              <a href="https://alerta.ina.gob.ar/pub/mapa" target="_blank" rel="noreferrer" className={styles.cardLink}>{t.inaLink}</a>
            </div>
            <span className={styles.cardSub}>{t.inaSub}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>{t.inaDesc}</p>
            <div className={styles.divider} />

            {inaLoading && (
              <p className={styles.statusText} style={{ fontStyle: 'italic' }}>{t.inaLoading}</p>
            )}

            {!inaLoading && (() => {
              const riverStations = (inaStations ?? []).filter(s => s.type === 'river_level');
              const activeStations = riverStations.filter(s => s.status === 'ok');
              const ec = inaStations?.find(s => s.id === 'ina-el-colorado');
              const meteo = inaStations?.find(s => s.id === 'ina-impenetrable');
              return (
                <>
                  {activeStations.map((s, i) => (
                    <div key={s.id}>
                      {i > 0 && <div className={styles.divider} />}
                      <div className={styles.statGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.statBox}>
                          <span className={styles.statValue}>{`${s.level} m`}</span>
                          <span className={styles.statLabel}>{t.bermejo} {s.name}</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.statValue} style={{ color: s.anomalyPct != null ? (s.anomalyPct >= 0 ? '#ff8800' : '#4db8ff') : undefined }}>
                            {s.anomalyPct != null ? `${s.anomalyPct >= 0 ? '+' : ''}${s.anomalyPct}%` : '—'}
                          </span>
                          <span className={styles.statLabel}>{t.vs30}</span>
                        </div>
                      </div>
                      <div className={styles.statusRow} style={{ marginTop: 10 }}>
                        <StatusDot color="#4db8ff" />
                        <span className={styles.statusText}>
                          {s.name} · {s.level} m · {s.tendency}
                        </span>
                      </div>
                    </div>
                  ))}
                  {activeStations.length === 0 && (
                    <p className={styles.statusText} style={{ fontStyle: 'italic' }}>{t.inaNoStations}</p>
                  )}
                  {meteo?.status === 'ok' && (meteo.temp != null || meteo.humidity != null || meteo.wind != null) && (
                    <div className={styles.statusRow} style={{ marginTop: 6 }}>
                      <StatusDot color="#f0a500" />
                      <span className={styles.statusText}>
                        PN El Impenetrable
                        {meteo.temp     != null ? ` · ${meteo.temp}°C` : ''}
                        {meteo.humidity != null ? ` · ${meteo.humidity}% humidity` : ''}
                        {meteo.wind     != null ? ` · ${meteo.wind} km/h wind` : ''}
                      </span>
                    </div>
                  )}
                  <div className={styles.statusRow} style={{ marginTop: 6 }}>
                    <StatusDot color="#6b7280" />
                    <span className={styles.statusText}>
                      {t.coloradoOffline}
                      {ec?.daysSinceUpdate != null ? ` ${t.coloradoSilent} ${ec.daysSinceUpdate}d` : ''}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* ── FIRMS Fire Alerts ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{t.firmsTitle}</span>
              <a href="https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@-60.1,-25.2,6.4z" target="_blank" rel="noreferrer" className={styles.cardLink}>{t.firmsLink}</a>
            </div>
            <span className={styles.cardSub}>{t.firmsSub}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>{t.firmsDesc1}</p>
            <p className={styles.desc} style={{ marginTop: 10 }}>{t.firmsDesc2}</p>

            <div className={styles.divider} />

            {firmsLoading && (
              <p className={styles.statusText} style={{ fontStyle: 'italic' }}>{t.firmsLoading}</p>
            )}

            {firmsError && (
              <p className={styles.statusText} style={{ color: '#c0392b' }}>
                {t.firmsError} {firmsError}. {t.firmsErrorSuffix}
              </p>
            )}

            {!firmsLoading && !firmsError && (
              <>
                <div className={styles.statGrid}>
                  <div className={styles.statBox}>
                    <span className={styles.statValue}>{counts.total}</span>
                    <span className={styles.statLabel}>{t.totalDet}</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.confDot} style={{ background: CONF_COLOR.h }} />
                    <span className={styles.statValue}>{counts.high}</span>
                    <span className={styles.statLabel}>{t.highConf}</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.confDot} style={{ background: CONF_COLOR.n }} />
                    <span className={styles.statValue}>{counts.nominal}</span>
                    <span className={styles.statLabel}>{t.nominal}</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.confDot} style={{ background: CONF_COLOR.l }} />
                    <span className={styles.statValue}>{counts.low}</span>
                    <span className={styles.statLabel}>{t.lowConf}</span>
                  </div>
                </div>
                <div className={styles.statusRow} style={{ marginTop: 14 }}>
                  <StatusDot color="#ff2200" />
                  <span className={styles.statusText}>
                    {t.liveDetection} <strong>{lastDetection || '—'}</strong> {t.retrieved} {firmsFetchedAt?.toLocaleTimeString() || '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Data Sources ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>{t.dsTitle}</span>
            <span className={styles.cardSub}>{t.dsSub}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.subLabel}>{t.ds1label}</p>
            <p className={styles.desc}>{t.ds1desc}</p>
            <div className={styles.divider} />
            <p className={styles.subLabel}>{t.ds2label}</p>
            <p className={styles.desc}>{t.ds2desc}</p>
            <div className={styles.divider} />
            <p className={styles.subLabel}>{t.ds3label}</p>
            <p className={styles.desc}>{t.ds3desc}</p>
            <div className={styles.divider} />
            <p className={styles.subLabel}>{t.ds4label}</p>
            <p className={styles.desc}>{t.ds4desc}</p>
          </div>
        </div>

        <footer className={baseStyles.viewFooter}>
          <p>{t.footer}</p>
        </footer>

      </div>
    </div>
  );
}
