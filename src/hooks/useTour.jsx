import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { GAUGES, toGeoJSON, STATUS_COLORS, STATUS_LABELS } from '../data/floodGauges';
import { INA_STATIONS, toGeoJSON as inaToGeoJSON, INA_TYPE_COLOR, INA_TYPE_LABEL } from '../data/inaGauges';

// ── Bilingual tour overlay text ───────────────────────────────────────────────

const TOUR_TEXT = {
  en: {
    park: {
      title: 'El Impenetrable',
      subtitle: 'National Park',
      body: ' Here, 128,000 hectares of dry Chaco forest stretch to the horizon — knotted quebracho, palo santo and algarrobo so dense and thorny they gave this land its name: the Impenetrable. Protected by national law in 2014, in 2017 the first rangers sat foot inside.',
    },
    buffer: {
      title: 'Buffer Zone',
      subtitle: 'Monitoring Corridor',
      body: "Beyond the park's edge lies its cushion. Developing a Buffer Area alongside local communities is what will help to mitigate the pressure from outside, giving the wildlife that shelters in the park room to roam, breed and move safely. ",
    },
    mapbiomas: {
      title: 'The Agricultural Frontier',
      subtitle: '1985–2023 · MapBiomas Gran Chaco',
      legend: [
        { color: '#db4fba', label: 'Cropland' },
        { color: '#ffd700', label: 'Pasture' },
      ],
      bodyHtml: '<strong>The agricultural frontier, closing in from every side (seen in pink and yellow)</strong> — and as it advances, the Gran Chaco fractures into ever-smaller fragments. El Impenetrable is left as the last oasis of dry forest still whole enough to shelter its wildlife - it has become the final refuge in a landscape being pulled apart.',
    },
    riverIntro: {
      title: 'The Bermejo River',
      subtitle: null,
      body: "The Bermejo — known here by its older name, the Teuco — winds more than 1,000 km of shifting channels along the park's northern edge. We follow it upstream, west, to the first place where its water is being drawn.",
    },
    riverSeasonality: {
      title: 'Water Seasonality',
      subtitle: '1984–2021 · Global Surface Water',
      legend: [
        { color: '#c7e9f7', label: '1 month / year' },
        { color: '#5dacc8', label: '6 months / year' },
        { color: '#0d47a1', label: '12 months — permanent' },
      ],
      body: 'Water seasonality shows how many months per year surface water was present, averaged from 1984 to 2021. The Bermejo pulses — pale blue where it appears only seasonally, deepening to permanent dark blue at its stable core.',
    },
    riverTransitions: {
      title: 'Water Transitions',
      subtitle: '1984–2021 · Global Surface Water',
      legend: [
        { color: '#b5e61d', label: 'New path' },
        { color: '#e6194b', label: 'Lost path' },
        { color: '#c3c3c3', label: 'General path' },
      ],
      body: 'The Bermejo river is alive, it pulses with every season. The color coding of these images shows us how each season creates new shapes on its course.',
    },
    pumpsIntro: {
      title: 'Illegal Extraction Sites',
      subtitle: null,
      body: 'Thirteen points along the river draw its water — some are registered town and community supplies, others are unregistered pumps feeding cattle pasture and crops. Together they tap the same artery the park and its biodiversity depend on, with little or no monitoring of how much is taken — or what it leaves behind.',
    },
    gauges: {
      title: 'Flood Monitoring',
      subtitle: 'GloFAS · Copernicus Emergency Management',
      bodyHtml: 'The river is restless. These are not on site stations but rather <strong>modeled stations</strong> that track rising and falling across the Bermejo–Paraná basin, watched in <strong>near real-time from orbit.</strong> Carrying one of the heaviest sediment loads on the continent, the Bermejo floods hard and often — remaking its own course as it goes.',
    },
    inaGauges: {
      title: 'The Monitoring Gap',
      subtitle: 'INA sSIyAH · Telemetric (In Territory)',
      bodyHtml: 'Six <strong>telemetric (in territory) stations</strong> cover the Bermejo corridor. Four river level gauges across the upper reaches and downstream of the park, provide the ground-truth reading that cross-checks the satellite models. Inside the park, a meteorological station watches conditions. El Colorado station holds the only discharge data ever published for the entire Bermejo (July – September 2024), then permanent silence. That 79-day record is the only time anyone measured how much water this river actually carries.',
    },
    fires: {
      title: 'Active Fire Alerts',
      subtitle: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21',
      body: 'Each point is a fire, caught from orbit and refreshed every 3 hours. In the Chaco, many are set on purpose — pasture burned to push the frontier deeper, sometimes right to the doorstep of protected land. The siege we began with, still burning.',
    },
    community: {
      title: 'Act · Actuar',
      subtitle: 'Community Monitoring',
      bodyHtml: '<strong>This map is built to be nurtured by the communities who know this territory.</strong> Through the Act panel, anyone can run their own investigation — on the ground or digitally — and contribute evidence directly to this map. Every observation, photograph, and testimony strengthens the collective record of what is happening to the land, the water, and the people who depend on them.',
    },
    popup: {
      awaitingData: 'Awaiting data',
      vsBaseline: 'vs baseline',
      offline: 'Offline · last reading Sep 2024',
      readings: (n, d) => `${n} readings · ${d}-day window only`,
      statusActive: 'ACTIVE',
      statusOffline: 'OFFLINE',
      statusLoading: 'LOADING…',
    },
  },
  es: {
    park: {
      title: 'El Impenetrable',
      subtitle: 'Parque Nacional',
      body: ' Aquí, 128.000 hectáreas de bosque chaqueño seco se extienden hasta el horizonte — quebracho anudado, palo santo y algarrobo tan denso y espinoso que le dio nombre a esta tierra: el Impenetrable. Protegido por ley nacional en 2014, en 2017 los primeros guardaparques pisaron su suelo.',
    },
    buffer: {
      title: 'Zona de Amortiguamiento',
      subtitle: 'Corredor de Monitoreo',
      body: 'Más allá del límite del parque se encuentra su zona de protección. Desarrollar un área de amortiguamiento junto a las comunidades locales es lo que ayudará a mitigar la presión exterior, dándole a la fauna que se refugia en el parque espacio para moverse, reproducirse y desplazarse con seguridad. ',
    },
    mapbiomas: {
      title: 'La Frontera Agropecuaria',
      subtitle: '1985–2023 · MapBiomas Gran Chaco',
      legend: [
        { color: '#db4fba', label: 'Cultivos' },
        { color: '#ffd700', label: 'Pasturas' },
      ],
      bodyHtml: '<strong>La frontera agropecuaria, cerrándose desde todos lados (en rosa y amarillo)</strong> — y a medida que avanza, el Gran Chaco se fragmenta en porciones cada vez más pequeñas. El Impenetrable queda como el último oasis de bosque seco todavía lo suficientemente entero como para albergar su fauna — se ha convertido en el último refugio de un paisaje que se desintegra.',
    },
    riverIntro: {
      title: 'El Río Bermejo',
      subtitle: null,
      body: 'El Bermejo — conocido aquí por su nombre antiguo, el Teuco — serpentea más de 1.000 km de canales cambiantes a lo largo del borde norte del parque. Lo seguimos hacia arriba, hacia el oeste, hasta el primer lugar donde su agua está siendo extraída.',
    },
    riverSeasonality: {
      title: 'Estacionalidad del Agua',
      subtitle: '1984–2021 · Aguas Superficiales Globales',
      legend: [
        { color: '#c7e9f7', label: '1 mes / año' },
        { color: '#5dacc8', label: '6 meses / año' },
        { color: '#0d47a1', label: '12 meses — permanente' },
      ],
      body: 'La estacionalidad del agua muestra cuántos meses por año estuvo presente agua superficial, promediada entre 1984 y 2021. El Bermejo pulsa — azul pálido donde solo aparece estacionalmente, profundizándose hasta azul permanente en su núcleo estable.',
    },
    riverTransitions: {
      title: 'Transiciones del Agua',
      subtitle: '1984–2021 · Aguas Superficiales Globales',
      legend: [
        { color: '#b5e61d', label: 'Cauce nuevo' },
        { color: '#e6194b', label: 'Cauce perdido' },
        { color: '#c3c3c3', label: 'Cauce general' },
      ],
      body: 'El río Bermejo está vivo, late con cada estación. La codificación de colores de estas imágenes nos muestra cómo cada estación crea nuevas formas en su curso.',
    },
    pumpsIntro: {
      title: 'Sitios de Extracción Ilegal',
      subtitle: null,
      body: 'Trece puntos a lo largo del río extraen su agua — algunos son suministros registrados de pueblos y comunidades, otros son bombas no registradas que alimentan pasturas y cultivos. En conjunto, sangran la misma arteria de la que dependen el parque y su biodiversidad, con poco o ningún monitoreo de cuánto se extrae — ni de lo que deja atrás.',
    },
    gauges: {
      title: 'Monitoreo de Crecidas',
      subtitle: 'GloFAS · Copernicus Emergency Management',
      bodyHtml: 'El río es inquieto. Estas no son estaciones en el territorio sino <strong>estaciones modeladas</strong> que rastrean subidas y bajadas a lo largo de la cuenca Bermejo–Paraná, monitoreadas en <strong>tiempo casi real desde el espacio.</strong> Con una de las mayores cargas de sedimentos del continente, el Bermejo crece fuerte y seguido — rehaciendo su propio curso a medida que avanza.',
    },
    inaGauges: {
      title: 'La Brecha de Monitoreo',
      subtitle: 'INA sSIyAH · Telemétrico (En Territorio)',
      bodyHtml: 'Seis <strong>estaciones telesimétricas (en territorio)</strong> cubren el corredor del Bermejo. Cuatro medidores de nivel de río en los tramos superiores y aguas abajo del parque aportan la lectura de campo que verifica los modelos satelitales. Dentro del parque, una estación meteorológica monitorea las condiciones. La estación El Colorado tiene el único dato de caudal publicado para todo el Bermejo (julio–septiembre 2024), y luego silencio permanente. Esos 79 días son la única vez que alguien midió cuánta agua lleva realmente este río.',
    },
    fires: {
      title: 'Alertas de Fuego Activo',
      subtitle: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21',
      body: 'Cada punto es un incendio, captado desde el espacio y actualizado cada 3 horas. En el Chaco, muchos son intencionales — pastizales quemados para empujar la frontera más adentro, a veces hasta el límite mismo de tierras protegidas. El cerco con el que empezamos, todavía ardiendo.',
    },
    community: {
      title: 'Actuar',
      subtitle: 'Monitoreo Comunitario',
      bodyHtml: '<strong>Este mapa está construido para ser nutrido por las comunidades que conocen este territorio.</strong> A través del panel Actuar, cualquier persona puede llevar adelante su propia investigación — en el terreno o digitalmente — y contribuir evidencia directamente a este mapa. Cada observación, fotografía y testimonio fortalece el registro colectivo de lo que le ocurre a la tierra, el agua y las personas que dependen de ellas.',
    },
    popup: {
      awaitingData: 'Esperando datos',
      vsBaseline: 'vs línea base',
      offline: 'Sin señal · última lectura sep 2024',
      readings: (n, d) => `${n} lecturas · solo ventana de ${d} días`,
      statusActive: 'ACTIVA',
      statusOffline: 'SIN SEÑAL',
      statusLoading: 'CARGANDO…',
    },
  },
};

// Spanish text overrides for each pump in PUMP_SEQUENCE order
const PUMP_TEXT_ES = [
  {
    title: 'Bomba Fortín Belgrano',
    subtitle: 'Bomba municipal · Chaco',
    body: 'La primera toma que encontramos. El suministro municipal de Fortín Belgrano extrae del río — sin evaluación ambiental que registre cuánto extrae hoy.',
    caption: 'Referencia de bomba de tamaño mediano',
  },
  {
    title: 'Bomba Ing. Juárez',
    subtitle: 'Bomba de gran escala · Formosa',
    body: 'Una extracción de gran volumen para el pueblo de Ingeniero Juárez — bombeo de alto caudal, sin ningún registro que compense el flujo que retira.',
    caption: 'Canalización del río para la bomba de Ingeniero Juárez',
  },
  {
    title: 'Bomba Tartagal',
    subtitle: 'Bomba municipal · Chaco',
    body: 'Una toma comunitaria para Tartagal, ubicada en la orilla sur del río.',
    caption: 'Referencia de bomba de tamaño mediano',
  },
  {
    title: 'Bomba Tres Pozos',
    subtitle: 'Bomba municipal · Chaco',
    body: 'Tres Pozos — una de una serie de tomas rurales encadenadas a lo largo del tramo medio del río.',
    caption: 'Referencia de bomba de tamaño mediano',
  },
  {
    title: 'Bomba Laguna Yema',
    subtitle: 'Bomba de gran escala · Formosa',
    body: 'Una extracción de alto volumen que abastece a Laguna Yema, aferrada al amortiguamiento del parque. A medida que las pasturas y cultivos avanzan aquí, las extracciones se acumulan.',
    caption: 'Imágenes de la bomba de Laguna Yema',
  },
  {
    title: 'Bomba pequeña',
    subtitle: 'Bomba pequeña · Chaco',
    body: 'Una bomba no registrada. Sin permiso, sin constancia de quién la opera.',
    caption: 'Referencia de bomba de tamaño pequeño',
  },
  {
    title: 'Extracción no registrada',
    subtitle: 'Bomba pequeña · Chaco',
    body: 'Una extracción informal — una de un grupo de desvíos no documentados concentrados en esta curva.',
    caption: 'Referencia de bomba de tamaño pequeño',
  },
  {
    title: 'Bomba Sauzalito',
    subtitle: 'Bomba municipal · Chaco',
    body: 'La toma municipal de Sauzalito — el pueblo más grande de este tramo chaqueño del río.',
    caption: 'Referencia de bomba de tamaño mediano',
  },
  {
    title: 'Bomba 2',
    subtitle: 'Bomba pequeña · Chaco',
    body: 'Una bomba no registrada, hallada únicamente en el relevamiento de campo. No existen registros.',
    caption: 'Referencia de bomba de tamaño pequeño',
  },
  {
    title: 'Bomba 3',
    subtitle: 'Bomba pequeña · Chaco',
    body: 'Otra extracción informal, en el extremo inferior del área de amortiguamiento.',
    caption: 'Referencia de bomba de tamaño pequeño',
  },
  {
    title: 'Bomba Sumayen',
    subtitle: 'Bomba municipal · Chaco',
    body: 'Agua de subsistencia para la comunidad indígena de Sumayen — extraída, pero sin medición.',
    caption: 'Referencia de bomba de tamaño mediano',
  },
  {
    title: 'Bomba 5',
    subtitle: 'Bomba pequeña · Chaco',
    body: 'Una bomba no registrada donde un canal lateral confluye con el río principal.',
    caption: 'Referencia de bomba de tamaño pequeño',
  },
  {
    title: 'Bomba Wichí Pintado',
    subtitle: 'Bomba municipal · Formosa',
    body: 'La toma más oriental: agua para la comunidad Wichí, aguas abajo del parque.',
    caption: 'Referencia de bomba de tamaño mediano',
  },
];

// ── Tour map-popup HTML builders ──────────────────────────────────────────────

function buildTourFloodPopupHtml(g, lang) {
  const p = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).popup;
  const STATUS_LABELS_ES = { high: 'Alta', nominal: 'Nominal', low: 'Baja', pending: p.awaitingData, error: p.awaitingData };
  const color = STATUS_COLORS[g.status] || STATUS_COLORS.pending;
  const labelEn = STATUS_LABELS[g.status] || p.awaitingData;
  const label = lang === 'es' ? (STATUS_LABELS_ES[g.status] || labelEn) : labelEn;
  const isPending = g.status === 'pending' || g.status === 'error' || g.discharge == null;
  const pctSign = g.baselinePct != null ? (g.baselinePct >= 0 ? `+${g.baselinePct}%` : `${g.baselinePct}%`) : '';
  return `<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:180px">
    <p style="font-size:14px;color:#DED8CF;margin:0 0 2px"><strong>${g.river} · ${g.location}</strong></p>
    <p style="font-size:11px;color:#888;margin:0 0 7px">${g.country}</p>
    <p style="font-size:12px;color:${color};margin:0">● ${label}</p>
    ${!isPending ? `<p style="font-size:12px;color:#aaa;margin:3px 0 0">${g.discharge} m³/s · ${pctSign} ${p.vsBaseline}</p>` : ''}
  </div>`;
}

function buildTourCommunityPopupHtml(feature) {
  const p = feature.properties;
  const title = p.title || 'Community observation';
  const type  = p.type_of_event ? p.type_of_event.replace(/_/g, ' ') : '';
  const date  = p.date_of_event ? String(p.date_of_event).slice(0, 10) : '';
  return `<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:150px;max-width:220px">
    <p style="font-size:13px;color:#DED8CF;margin:0 0 4px;font-weight:bold">${title}</p>
    ${type || date ? `<p style="font-size:11px;color:#888;margin:0;text-transform:capitalize">${[type, date].filter(Boolean).join(' · ')}</p>` : ''}
  </div>`;
}

function buildTourInaPopupHtml(s, lang) {
  const p = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).popup;
  const color = INA_TYPE_COLOR[s.type] || '#888';
  const typeLabel = INA_TYPE_LABEL[s.type] || s.type;
  const isPending = s.status === 'pending' || s.status == null;
  let detail = '';
  if (!isPending) {
    if (s.type === 'river_level' && s.level != null)
      detail = `<p style="font-size:12px;color:#aaa;margin:3px 0 0">${s.level} m · ${s.tendency || '—'}</p>`;
    else if (s.type === 'meteo' && s.temp != null)
      detail = `<p style="font-size:12px;color:#aaa;margin:3px 0 0">${s.temp}°C${s.humidity != null ? ' · ' + s.humidity + '% hum' : ''}</p>`;
    else if (s.type === 'discharge_gauge_offline')
      detail = `<p style="font-size:12px;color:#dc2626;margin:3px 0 0">${p.offline}</p>
        ${s.historicTotalRows != null ? `<p style="font-size:11px;color:#888;margin:2px 0 0">${p.readings(s.historicTotalRows, s.historicWindowDays)}</p>` : ''}`;
  }
  const statusText = s.type === 'discharge_gauge_offline' ? p.statusOffline
    : s.status === 'ok' ? p.statusActive
    : isPending ? p.statusLoading : String(s.status).toUpperCase();
  return `<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:190px">
    <p style="font-size:14px;color:#DED8CF;margin:0 0 2px"><strong>${s.name}</strong></p>
    <p style="font-size:11px;color:#888;margin:0 0 5px">${typeLabel}</p>
    <p style="font-size:12px;color:${color};margin:0">● ${statusText}</p>
    ${detail}
  </div>`;
}

const INGJUAREZ_PATH = [
  { center: [-62.22304284, -24.13589335], bearing: 18.65, zoom: 14.4 },
  { center: [-62.22262236, -24.13343552], bearing: 18.65, zoom: 14.4 },
  { center: [-62.25242520, -24.11361759], bearing: 18.66, zoom: 14.9 },
  { center: [-62.25071486, -24.11091132], bearing: 18.66, zoom: 13.7 },
  { center: [-62.21873361, -24.10529296], bearing: 18.66, zoom: 11.4 },
  { center: [-62.17548839, -24.09745275], bearing: 18.63, zoom: 12.5 },
  { center: [-62.09833163, -24.07028979], bearing: 18.62, zoom: 12.4 },
  { center: [-62.01228711, -24.06188487], bearing: 18.60, zoom: 12.4 },
  { center: [-61.91771632, -23.98399245], bearing: 18.58, zoom: 13.4 },
  { center: [-61.85584437, -23.90836973], bearing: 18.55, zoom: 13.4, pauseMs: 2000 },
];

const LAGYEMA_PATH = [
  { center: [-61.66252513, -24.35723653], bearing: 18.67, zoom: 10.9 },
  { center: [-61.64789872, -24.35825307], bearing: 18.65, zoom: 12.4 },
  { center: [-61.59427813, -24.37288856], bearing: 18.62, zoom: 10.6 },
  { center: [-61.53069008, -24.35168566], bearing: 18.58, zoom: 10.4 },
  { center: [-61.49029973, -24.34412275], bearing: 18.56, zoom: 12.7 },
  { center: [-61.43645773, -24.35483572], bearing: 18.52, zoom: 11.5 },
  { center: [-61.32971700, -24.34142759], bearing: 18.45, zoom: 10.4, pauseMs: 1500 },
  { center: [-61.23888409, -24.26025878], bearing: 18.21, zoom:  8.5, pauseMs: 2000 },
];

const WICHIPINTADO_PATH = [
  { center: [-61.4259, -24.6199], bearing: 185 },
  { center: [-61.4175, -24.6193], bearing: 255 },
  { center: [-61.4270, -24.6580], bearing: 182 },
  { center: [-61.4262, -24.6900], bearing: 180, pauseMs: 2000 },
];

const PARK_IMAGES = [
  '/media/park-01.jpg', '/media/park-02.jpg', '/media/park-03.jpg', '/media/park-04.jpg',
  '/media/park-05.jpg', '/media/park-06.jpg', '/media/park-07.jpg', '/media/park-08.jpg',
  '/media/park-09.jpg', '/media/park-10.jpg', '/media/park-11.jpg', '/media/park-12.jpg',
];

const BUFFER_IMAGES = [
  '/media/buffer-01.jpg', '/media/buffer-02.jpg', '/media/buffer-03.jpg', '/media/buffer-04.jpg',
  '/media/buffer-05.jpg', '/media/buffer-06.jpg', '/media/buffer-07.jpg', '/media/buffer-08.jpg',
  '/media/buffer-09.jpg', '/media/buffer-10.jpg', '/media/buffer-11.jpg', '/media/buffer-12.jpg',
  '/media/buffer-13.jpg',
];

const PUMP_SEQUENCE = [
  {
    coords: [-62.342466, -24.110932],
    title: 'Pump Fortín Belgrano',
    subtitle: 'Town pump · Chaco',
    body: "The first intake we reach. Fortín Belgrano's municipal supply draws from the river — with no environmental assessment on file for how much it now takes.",
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
  },
  {
    coords: [-62.226627, -24.136969],
    title: 'Pump Ing. Juárez',
    subtitle: 'Big pump · Formosa',
    body: 'A large-scale draw for the town of Ingeniero Juárez — high-volume pumping, with nothing on record to offset the flow it removes.',
    image: '/media/pump-ingjuarez.jpg',
    caption: 'Channelization of the river for the Ingeniero Juarez Pump',
    path: INGJUAREZ_PATH,
    waterPathLayer: 'waterpath-ingjuarez-layer',
    waterPathFile: '/data/waterpath_ingjuarez.geojson',
    waterPathFeatureIdx: 0,
    waterPathZoomOut: { center: [-62.05, -24.02], zoom: 9.5, pitch: 20, bearing: 30 },
  },
  {
    coords: [-62.139708, -24.221221],
    title: 'Pump Tartagal',
    subtitle: 'Town pump · Chaco',
    body: "A community intake for Tartagal, set on the river's south bank.",
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
  },
  {
    coords: [-61.864300, -24.313128],
    title: 'Pump Tres Pozos',
    subtitle: 'Town pump · Chaco',
    body: "Tres Pozos — one of a string of rural intakes threaded along the river's middle reach.",
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
    flyZoom: 13.50,
  },
  {
    coords: [-61.687704, -24.367092],
    title: 'Pump Laguna Yema',
    subtitle: 'Big pump · Formosa',
    body: "A high-volume draw serving Laguna Yema, pressed against the park's buffer. As pasture and cropland spread here, the extractions stack up.",
    imageStack: ['/media/pump-lagunaYema-1.jpg', '/media/pump-lagunaYema-2.jpg'],
    caption: 'Images of the Laguna Yema pump',
    path: LAGYEMA_PATH,
    waterPathLayer: 'waterpath-lagyema-layer',
    waterPathFile: '/data/waterpath_lagyema.geojson',
    waterPathFeatureIdx: 1,
    waterPathZoomOut: { center: [-61.46, -24.31], zoom: 10.0, pitch: 20, bearing: 30 },
  },
  {
    coords: [-61.713700, -24.386666],
    title: 'Small Pump',
    subtitle: 'Small pump · Chaco',
    body: 'An unregistered pump. No permit, no record of who runs it.',
    image: '/media/pump-small.jpg',
    caption: 'Small size pump reference',
  },
  {
    coords: [-61.701468, -24.407747],
    title: 'Non-registered extraction',
    subtitle: 'Small pump · Chaco',
    body: 'An informal draw — one of a cluster of undocumented diversions crowded into this bend.',
    image: '/media/pump-small.jpg',
    caption: 'Small size pump reference',
  },
  {
    coords: [-61.691121, -24.415603],
    title: 'Pump Sauzalito',
    subtitle: 'Town pump · Chaco',
    body: "Sauzalito's municipal intake — the largest town on this Chaco stretch of the river.",
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
  },
  {
    coords: [-61.610063, -24.446073],
    title: 'Pump 2',
    subtitle: 'Small pump · Chaco',
    body: 'An unregistered pump, found only by field survey. No records exist.',
    image: '/media/pump-small.jpg',
    caption: 'Small size pump reference',
  },
  {
    coords: [-61.601205, -24.436692],
    title: 'Pump 3',
    subtitle: 'Small pump · Chaco',
    body: "Another informal draw, low on the buffer's reach.",
    image: '/media/pump-small.jpg',
    caption: 'Small size pump reference',
  },
  {
    coords: [-61.583446, -24.460207],
    title: 'Pump Sumayen',
    subtitle: 'Town pump · Chaco',
    body: 'Subsistence water for the Indigenous community of Sumayen — drawn, but unmeasured.',
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
  },
  {
    coords: [-61.589357, -24.488601],
    title: 'Pump 5',
    subtitle: 'Small pump · Chaco',
    body: 'An unregistered pump where a side channel rejoins the main river.',
    image: '/media/pump-small.jpg',
    caption: 'Small size pump reference',
  },
  {
    coords: [-61.424589, -24.619062],
    title: 'Pump Wichí Pintado',
    subtitle: 'Town pump · Formosa',
    body: 'The farthest intake east: water for the Wichí community, downstream of the park.',
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
    path: WICHIPINTADO_PATH,
    waterPathLayer: 'waterpath-wichipintado-layer',
    waterPathFile: '/data/waterpath_wichipintado.geojson',
    waterPathFeatureIdx: 2,
    waterPathZoomOut: { center: [-61.424, -24.655], zoom: 11.5, pitch: 15, bearing: 0 },
  },
];

// Indices 8–11 have short body text — use half the normal viewing time
const SHORT_PAUSE_INDICES = new Set([8, 9, 10, 11]);

function makeGeoJSON(pumps) {
  return {
    type: 'FeatureCollection',
    features: pumps.map(({ coords: [lng, lat] }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {},
    })),
  };
}

function vis(map, ids, on) {
  ids.forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  });
}

function gswReset(map, layerId) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', 'none');
  map.setPaintProperty(layerId, 'raster-opacity', 0.85);
}

async function gswFadeIn(pause, map, layerId, steps = 14) {
  if (!map.getLayer(layerId)) return;
  map.setPaintProperty(layerId, 'raster-opacity', 0);
  map.setLayoutProperty(layerId, 'visibility', 'visible');
  for (let i = 1; i <= steps; i++) {
    map.setPaintProperty(layerId, 'raster-opacity', (i / steps) * 0.85);
    await pause(50);
  }
}

async function gswFadeOut(pause, map, layerId, steps = 14) {
  if (!map.getLayer(layerId)) return;
  for (let i = steps - 1; i >= 0; i--) {
    map.setPaintProperty(layerId, 'raster-opacity', (i / steps) * 0.85);
    await pause(50);
  }
  gswReset(map, layerId);
}

async function flyPath(ease, pause, path, pitch = 38, lineAnim = null) {
  const n = path.length;
  let revealedIdx = 0;

  for (let i = 0; i < n; i++) {
    const pt = path[i];

    const easePromise = ease({
      center: pt.center,
      zoom: 13.5,
      bearing: pt.bearing,
      pitch,
      duration: 1500,
      easing: t => t,
    });

    if (lineAnim) {
      const { map, sourceId, coords } = lineAnim;
      const t0 = Date.now();
      const loop = () => {
        const { lng, lat } = map.getCenter();
        let bestIdx = revealedIdx;
        let minDist = Infinity;
        for (let j = revealedIdx; j < coords.length; j++) {
          const dx = coords[j][0] - lng;
          const dy = coords[j][1] - lat;
          const d = dx * dx + dy * dy;
          if (d < minDist) { minDist = d; bestIdx = j; }
        }
        revealedIdx = bestIdx;
        if (revealedIdx >= 1) {
          const src = map.getSource(sourceId);
          if (src) src.setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {},
              geometry: { type: 'LineString', coordinates: coords.slice(0, revealedIdx + 1) } }],
          });
        }
        if (Date.now() - t0 < 1500) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    await easePromise;
    if (pt.pauseMs) await pause(pt.pauseMs);
  }
}

// ── Phase functions ────────────────────────────────────────────────────────

async function phasePark({ go, ease, pause, map, setOverlay, lang }) {
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon',
            'firms-halo','firms-icon'], false);
  gswReset(map, 'gsw_seasonality-layer');
  gswReset(map, 'gsw_transitions-layer');
  vis(map, ['park-fill','park-line','park-label'], true);

  setOverlay(null);

  await go({
    center: [-61.09, -24.95],
    zoom: 15, pitch: 0, bearing: 0,
    duration: 2500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });
  await ease({
    zoom: 8.5, pitch: 42, bearing: 20,
    duration: 3000,
    easing: t => t,
  });
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).park;
  setOverlay({ id: 'park', ...tt, images: PARK_IMAGES });
  await pause(12000);
}

async function phaseBuffer({ go, ease, map, setOverlay, lang }) {
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label'], true);
  vis(map, ['pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon',
            'firms-halo','firms-icon'], false);
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).buffer;
  setOverlay({ id: 'buffer', ...tt, images: BUFFER_IMAGES });
  await go({
    center: [-60.9, -24.6],
    zoom: 7.8, pitch: 40, bearing: 0,
    duration: 3500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });
  await ease({ bearing: 120,  duration: 5000, easing: t => t });
  await ease({ bearing: 240,  duration: 5000, easing: t => t });
  await ease({ bearing: 360,  duration: 5000, easing: t => t });
}

const MB_COORDS = [
  [-67.72560623728215, -17.536012661297182],
  [-55.75654322320206, -17.536012661297182],
  [-55.75654322320206, -33.87358290205051 ],
  [-67.72560623728215, -33.87358290205051 ],
];

async function phaseMapbiomas({ go, pause, map, setOverlay, lang }) {
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon',
            'firms-halo','firms-icon'], false);
  vis(map, ['park-fill','park-line','park-label'], true);

  if (map.getLayer('mapbiomas-layer'))
    map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');

  await go({
    center: [-62.5, -26.0],
    zoom: 5.5, pitch: 0, bearing: 0,
    duration: 4000,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  const src = map.getSource('mapbiomas');
  if (src) {
    src.updateImage({ url: '/data/mapbiomas/mapbiomas_1985.png', coordinates: MB_COORDS });
    map.setLayoutProperty('mapbiomas-layer', 'visibility', 'visible');
  }
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).mapbiomas;
  setOverlay({ id: 'mapbiomas', ...tt, year: 1985 });

  await pause(2500);

  for (let year = 1985; year <= 2023; year++) {
    const s = map.getSource('mapbiomas');
    if (s) s.updateImage({ url: `/data/mapbiomas/mapbiomas_${year}.png`, coordinates: MB_COORDS });
    setOverlay(prev => ({ ...prev, year }));
    await pause(500);
  }

  await pause(2000);

  if (map.getLayer('mapbiomas-layer'))
    map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');
}

// ── River phases ──────────────────────────────────────────────────────────────

async function phaseRiverIntro({ go, ease, map, setOverlay, lang }) {
  if (map.getLayer('mapbiomas-layer'))
    map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');
  gswReset(map, 'gsw_seasonality-layer');
  gswReset(map, 'gsw_transitions-layer');
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon',
            'firms-halo','firms-icon'], false);

  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).riverIntro;
  setOverlay({ id: 'river', ...tt, video: '/media/bermejo-popup.mov' });
  await go({
    center: [-61.25, -24.52],
    zoom: 11.5, pitch: 65, bearing: 290,
    duration: 5000,
    easing: t => 1 - Math.pow(1 - t, 4),
  });
  await ease({ center: [-61.75, -24.40], bearing: 288, zoom: 11.5, pitch: 67, duration: 13800, easing: t => t });
}

async function phaseRiverSeasonality({ go, ease, pause, map, setOverlay, lang }) {
  gswReset(map, 'gsw_transitions-layer');
  if (map.getLayer('mapbiomas-layer'))
    map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');

  await go({
    center: [-61.75, -24.40], bearing: 288, zoom: 11.5, pitch: 67,
    duration: 1500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  await gswFadeIn(pause, map, 'gsw_seasonality-layer');
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).riverSeasonality;
  setOverlay({ id: 'river-seasonality', ...tt });
  await ease({ center: [-62.05, -24.25], bearing: 285, zoom: 11.5, pitch: 68, duration: 10000, easing: t => t });
}

async function phaseRiverTransitions({ go, ease, pause, map, setOverlay, lang }) {
  gswReset(map, 'gsw_seasonality-layer');

  await go({
    center: [-62.05, -24.25], bearing: 285, zoom: 11.5, pitch: 68,
    duration: 1500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  await gswFadeIn(pause, map, 'gsw_transitions-layer');
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).riverTransitions;
  setOverlay({ id: 'river-transitions', ...tt });
  await ease({ center: [-62.34, -24.11], bearing: 280, zoom: 12.0, pitch: 68, duration: 8000, easing: t => t });

  await gswFadeOut(pause, map, 'gsw_transitions-layer');
  await ease({ bearing: 100, zoom: 13.5, pitch: 72, duration: 3500, easing: t => 1 - Math.pow(1 - t, 3) });
}

// ── Pump phases ───────────────────────────────────────────────────────────────

function pumpBaseSetup(map, setLitPumps, setOverlay, pumpIdx) {
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon',
            'firms-halo','firms-icon',
            'waterpath-ingjuarez-layer',
            'waterpath-lagyema-layer',
            'waterpath-wichipintado-layer'], false);
  gswReset(map, 'gsw_seasonality-layer');
  gswReset(map, 'gsw_transitions-layer');
  vis(map, ['pumps-icon','pumps-halo'], true);
  vis(map, ['overlay-place-labels'], true);
  if (pumpIdx != null) {
    setLitPumps(PUMP_SEQUENCE.slice(0, pumpIdx + 1));
  } else {
    setLitPumps([]);
  }
  setOverlay(null);
}

async function phasePumpsIntro({ pause, map, setOverlay, setLitPumps, lang }) {
  pumpBaseSetup(map, setLitPumps, setOverlay, null);
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).pumpsIntro;
  setOverlay({ id: 'pumps-intro', ...tt });
  await pause(9500);
}

function makePumpPhase(i) {
  return async function({ go, ease, pause, map, setOverlay, setLitPumps, lang }) {
    pumpBaseSetup(map, setLitPumps, setOverlay, i);

    const pump = PUMP_SEQUENCE[i];
    const [lng, lat] = pump.coords;
    await go({
      center: [lng, lat],
      zoom: pump.flyZoom ?? 13.5, pitch: 70,
      bearing: (map.getBearing() + 30) % 360,
      duration: 2800,
      easing: t => 1 - Math.pow(1 - t, 3),
    });
    const textOverride = lang === 'es' ? PUMP_TEXT_ES[i] : {};
    setOverlay({ id: `pump-${i}`, ...pump, ...textOverride });
    await pause(SHORT_PAUSE_INDICES.has(i) ? 1750 : 3500);

    if (pump.path) {
      let waterLineCoords = null;
      if (pump.waterPathFile && pump.waterPathLayer) {
        try {
          const r = await fetch(pump.waterPathFile);
          const gj = await r.json();
          waterLineCoords = gj.features[pump.waterPathFeatureIdx ?? 0]?.geometry?.coordinates ?? null;
        } catch { /* graceful fallback */ }
      }
      if (pump.waterPathLayer) {
        vis(map, [pump.waterPathLayer], true);
        const sourceId = pump.waterPathLayer.replace('-layer', '');
        const wlSrc = map.getSource(sourceId);
        if (wlSrc) wlSrc.setData({ type: 'FeatureCollection', features: [] });
      }
      const sourceId = pump.waterPathLayer?.replace('-layer', '');
      const lineAnim = (pump.waterPathLayer && waterLineCoords)
        ? { map, sourceId, coords: waterLineCoords }
        : null;
      await flyPath(ease, pause, pump.path, 38, lineAnim);
      if (pump.waterPathLayer) {
        const zo = pump.waterPathZoomOut;
        await ease({
          center: zo.center,
          zoom: zo.zoom, pitch: zo.pitch, bearing: zo.bearing,
          duration: 2000,
          easing: t => 1 - Math.pow(1 - t, 3),
        });
        await pause(1800);
        vis(map, [pump.waterPathLayer], false);
      }
    }
  };
}

const PUMP_PHASES = [phasePumpsIntro, ...PUMP_SEQUENCE.map((_, i) => makePumpPhase(i))];

async function phaseGauges({ go, pause, map, setOverlay, setLitPumps, floodGaugesRef, addTourPopup, lang }) {
  vis(map, ['pumps-icon','pumps-halo',
            'buffer-fill','buffer-line','buffer-label',
            'firms-halo','firms-icon',
            'ina-halo','ina-icon',
            'overlay-place-labels',
            'waterpath-ingjuarez-layer',
            'waterpath-lagyema-layer',
            'waterpath-wichipintado-layer'], false);
  vis(map, ['park-fill','park-line','park-label'], true);
  setLitPumps([]);
  setOverlay(null);

  await go({
    center: [-60.5, -25.0],
    zoom: 6.5, pitch: 10, bearing: 0,
    duration: 5000,
    easing: t => 1 - Math.pow(1 - t, 3),
  });
  await pause(600);

  const liveGauges = floodGaugesRef?.current ?? [];
  const displayGauges = liveGauges.length ? liveGauges : GAUGES;
  const gaugeSrc = map.getSource('flood-gauges');
  if (gaugeSrc) gaugeSrc.setData(toGeoJSON(displayGauges));
  vis(map, ['flood-halo','flood-icon'], true);

  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).gauges;
  setOverlay({ id: 'gauges', ...tt });

  displayGauges.forEach(g => {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 })
      .setLngLat(g.coordinates)
      .setHTML(buildTourFloodPopupHtml(g, lang))
      .addTo(map);
    addTourPopup(popup);
  });

  await pause(10000);
}

async function phaseInaGauges({ go, pause, map, setOverlay, inaStationsRef, addTourPopup, lang }) {
  vis(map, ['pumps-icon','pumps-halo',
            'buffer-fill','buffer-line','buffer-label',
            'firms-halo','firms-icon',
            'overlay-place-labels',
            'waterpath-ingjuarez-layer',
            'waterpath-lagyema-layer',
            'waterpath-wichipintado-layer'], false);
  vis(map, ['park-fill','park-line','park-label',
            'flood-halo','flood-icon'], true);
  setOverlay(null);

  await go({
    center: [-62.0, -24.6],
    zoom: 6.2, pitch: 12, bearing: 0,
    duration: 4500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });
  await pause(500);

  const liveStations = inaStationsRef?.current ?? [];
  const displayStations = liveStations.length ? liveStations : INA_STATIONS;
  const inaSrc = map.getSource('ina-stations');
  if (inaSrc) inaSrc.setData(inaToGeoJSON(displayStations));
  vis(map, ['ina-halo','ina-icon'], true);

  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).inaGauges;
  setOverlay({ id: 'ina-gauges', ...tt });

  displayStations.forEach(s => {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 })
      .setLngLat(s.coordinates)
      .setHTML(buildTourInaPopupHtml(s, lang))
      .addTo(map);
    addTourPopup(popup);
  });

  await pause(11000);
}

async function phaseFires({ pause, map, setOverlay, firmsStatsRef, lang }) {
  vis(map, ['ina-halo','ina-icon',
            'flood-halo','flood-icon'], false);
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'firms-halo','firms-icon'], true);
  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).fires;
  setOverlay({ id: 'fires', ...tt, stats: firmsStatsRef.current });
  await pause(5500);
}

async function phaseCommunity({ go, pause, map, setOverlay, communityDataRef, addTourPopup, lang }) {
  vis(map, ['firms-halo','firms-icon',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon'], false);
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'community-halo','community-icon'], true);

  await go({
    center: [-61.2, -24.85],
    zoom: 8.5, pitch: 30, bearing: 0,
    duration: 4000,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  const tt = (TOUR_TEXT[lang] ?? TOUR_TEXT.en).community;
  setOverlay({ id: 'community', ...tt });

  const features = communityDataRef?.current?.features ?? [];
  features.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 14 })
      .setLngLat([lng, lat])
      .setHTML(buildTourCommunityPopupHtml(f))
      .addTo(map);
    addTourPopup(popup);
  });

  await pause(9000);
}

// 3 river phases + 14 pump phases (1 intro + 13 individual) + 3 monitoring + 1 community = 24 total
const PHASES = [
  phasePark,
  phaseBuffer,
  phaseMapbiomas,
  phaseRiverIntro,
  phaseRiverSeasonality,
  phaseRiverTransitions,
  ...PUMP_PHASES,
  phaseGauges,
  phaseInaGauges,
  phaseFires,
  phaseCommunity,
];

// ── Hook ──────────────────────────────────────────────────────────────────

export function useTour(mapRef, { onComplete, firmsStats, floodGauges, inaStations, communityData, lang = 'en' } = {}) {
  const [overlay, setOverlay] = useState(null);
  const [touring, setTouring] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [paused, setPaused] = useState(false);

  const cancelled = useRef(false);
  const pausedRef = useRef(false);
  const stoppingForPause = useRef(false);
  const phaseRef = useRef(0);
  const goingBackTarget = useRef(-1);
  const onCompleteRef = useRef(onComplete);
  const firmsStatsRef = useRef(firmsStats);
  const floodGaugesRef = useRef(floodGauges ?? []);
  const inaStationsRef = useRef(inaStations ?? []);
  const communityDataRef = useRef(communityData ?? null);
  const tourPopupsRef = useRef([]);
  const runFromPhaseRef = useRef(null);
  const langRef = useRef(lang);

  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { firmsStatsRef.current = firmsStats; });
  useEffect(() => { floodGaugesRef.current = floodGauges ?? []; }, [floodGauges]);
  useEffect(() => { inaStationsRef.current = inaStations ?? []; }, [inaStations]);
  useEffect(() => { communityDataRef.current = communityData ?? null; }, [communityData]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const setLitPumps = useCallback((pumps) => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('tour-pumps');
    if (src) src.setData(makeGeoJSON(pumps));
  }, [mapRef]);

  const runFromPhase = useCallback(async (startPhase) => {
    const map = mapRef.current;
    if (!map) return;

    cancelled.current = false;
    pausedRef.current = false;
    setPaused(false);
    setTouring(true);
    setCanGoBack(startPhase > 0);
    setCanGoForward(startPhase < PHASES.length - 1);

    if (map.getLayer('mapbiomas-layer'))
      map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');

    const go = (opts) => new Promise((resolve, reject) => {
      if (cancelled.current) { reject(new Error('cancelled')); return; }
      const start = () => {
        map.flyTo(opts);
        map.once('moveend', () => {
          if (cancelled.current) reject(new Error('cancelled'));
          else resolve();
        });
      };
      if (pausedRef.current) {
        const wait = () => {
          if (cancelled.current) { reject(new Error('cancelled')); return; }
          if (!pausedRef.current) start();
          else setTimeout(wait, 100);
        };
        setTimeout(wait, 100);
        return;
      }
      start();
    });

    const ease = (opts) => new Promise((resolve, reject) => {
      if (cancelled.current) { reject(new Error('cancelled')); return; }

      function tryEase() {
        if (cancelled.current) { reject(new Error('cancelled')); return; }
        if (pausedRef.current) {
          const wait = () => {
            if (cancelled.current) { reject(new Error('cancelled')); return; }
            if (!pausedRef.current) tryEase();
            else setTimeout(wait, 100);
          };
          setTimeout(wait, 100);
          return;
        }
        map.easeTo(opts);
        map.once('moveend', () => {
          if (cancelled.current) { reject(new Error('cancelled')); return; }
          if (stoppingForPause.current) {
            const wait = () => {
              if (cancelled.current) { reject(new Error('cancelled')); return; }
              if (!pausedRef.current) tryEase();
              else setTimeout(wait, 100);
            };
            setTimeout(wait, 100);
          } else {
            resolve();
          }
        });
      }

      tryEase();
    });

    const pause = (ms) => new Promise((resolve, reject) => {
      if (cancelled.current) { reject(new Error('cancelled')); return; }
      let remaining = ms;
      let lastTick = Date.now();
      const tick = () => {
        if (cancelled.current) { reject(new Error('cancelled')); return; }
        const now = Date.now();
        if (!pausedRef.current) remaining -= (now - lastTick);
        lastTick = now;
        if (remaining <= 0) { resolve(); return; }
        setTimeout(tick, 100);
      };
      setTimeout(tick, 100);
    });

    const addTourPopup = (popup) => { tourPopupsRef.current.push(popup); };
    const ctx = {
      go, ease, pause, map, setOverlay, setLitPumps,
      firmsStatsRef, floodGaugesRef, inaStationsRef, communityDataRef, addTourPopup,
      lang: langRef.current,
    };

    let completing = true;
    try {
      for (let i = startPhase; i < PHASES.length; i++) {
        tourPopupsRef.current.forEach(p => p.remove());
        tourPopupsRef.current = [];
        phaseRef.current = i;
        setCanGoBack(i > 0);
        setCanGoForward(i < PHASES.length - 1);
        await PHASES[i](ctx);
      }
    } catch (e) {
      if (e.message !== 'cancelled') throw e;
      completing = false;
    }

    tourPopupsRef.current.forEach(p => p.remove());
    tourPopupsRef.current = [];
    setOverlay(null);
    setLitPumps([]);

    const goBackTo = goingBackTarget.current;
    goingBackTarget.current = -1;

    if (completing) {
      setTouring(false);
      setCanGoBack(false);
      setCanGoForward(false);
      setPaused(false);
      onCompleteRef.current?.();
    } else if (goBackTo >= 0) {
      runFromPhaseRef.current(goBackTo);
    } else {
      setTouring(false);
      setCanGoBack(false);
      setCanGoForward(false);
      setPaused(false);
    }
  }, [mapRef, setLitPumps]);

  useEffect(() => { runFromPhaseRef.current = runFromPhase; }, [runFromPhase]);

  const startTour = useCallback(() => runFromPhase(0), [runFromPhase]);

  const goBack = useCallback(() => {
    const prev = phaseRef.current - 1;
    if (prev < 0) return;
    goingBackTarget.current = prev;
    cancelled.current = true;
    mapRef.current?.stop();
  }, [mapRef]);

  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) {
      stoppingForPause.current = true;
      mapRef.current?.stop();
      stoppingForPause.current = false;
    }
  }, [mapRef]);

  const goForward = useCallback(() => {
    const next = phaseRef.current + 1;
    if (next >= PHASES.length) return;
    goingBackTarget.current = next;
    cancelled.current = true;
    mapRef.current?.stop();
  }, [mapRef]);

  const stopTour = useCallback(() => {
    goingBackTarget.current = -1;
    cancelled.current = true;
    pausedRef.current = false;
    mapRef.current?.stop();
    tourPopupsRef.current.forEach(p => p.remove());
    tourPopupsRef.current = [];
    setOverlay(null);
    setTouring(false);
    setCanGoBack(false);
    setCanGoForward(false);
    setPaused(false);
    setLitPumps([]);
  }, [setLitPumps, mapRef]);

  return { overlay, touring, startTour, stopTour, goBack, canGoBack, goForward, canGoForward, togglePause, paused };
}
