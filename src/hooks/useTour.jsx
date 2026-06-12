import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { GAUGES, toGeoJSON, STATUS_COLORS, STATUS_LABELS } from '../data/floodGauges';
import { INA_STATIONS, toGeoJSON as inaToGeoJSON, INA_TYPE_COLOR, INA_TYPE_LABEL } from '../data/inaGauges';

// ── Tour map-popup HTML builders (compact, shown during animation) ────────────

function buildTourFloodPopupHtml(g) {
  const color = STATUS_COLORS[g.status] || STATUS_COLORS.pending;
  const label = STATUS_LABELS[g.status] || 'Awaiting data';
  const isPending = g.status === 'pending' || g.status === 'error' || g.discharge == null;
  const pctSign = g.baselinePct != null ? (g.baselinePct >= 0 ? `+${g.baselinePct}%` : `${g.baselinePct}%`) : '';
  return `<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:180px">
    <p style="font-size:14px;color:#DED8CF;margin:0 0 2px"><strong>${g.river} · ${g.location}</strong></p>
    <p style="font-size:11px;color:#888;margin:0 0 7px">${g.country}</p>
    <p style="font-size:12px;color:${color};margin:0">● ${label}</p>
    ${!isPending ? `<p style="font-size:12px;color:#aaa;margin:3px 0 0">${g.discharge} m³/s · ${pctSign} vs baseline</p>` : ''}
  </div>`;
}

function buildTourInaPopupHtml(s) {
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
      detail = `<p style="font-size:12px;color:#dc2626;margin:3px 0 0">Offline · last reading Sep 2024</p>
        ${s.historicTotalRows != null ? `<p style="font-size:11px;color:#888;margin:2px 0 0">${s.historicTotalRows} readings · ${s.historicWindowDays}-day window only</p>` : ''}`;
  }
  return `<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:190px">
    <p style="font-size:14px;color:#DED8CF;margin:0 0 2px"><strong>${s.name}</strong></p>
    <p style="font-size:11px;color:#888;margin:0 0 5px">${typeLabel}</p>
    <p style="font-size:12px;color:${color};margin:0">● ${
      s.type === 'discharge_gauge_offline' ? 'OFFLINE'
      : s.status === 'ok' ? 'ACTIVE'
      : isPending ? 'LOADING…' : String(s.status).toUpperCase()
    }</p>
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
    body: 'The first intake we reach. Fortín Belgrano\'s municipal supply draws from the river — with no environmental assessment on file for how much it now takes.',
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
    body: 'A community intake for Tartagal, set on the river\'s south bank.',
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
  },
  {
    coords: [-61.864300, -24.313128],
    title: 'Pump Tres Pozos',
    subtitle: 'Town pump · Chaco',
    body: 'Tres Pozos — one of a string of rural intakes threaded along the river\'s middle reach.',
    image: '/media/pump-town.jpg',
    caption: 'Medium size pump reference',
    flyZoom: 13.50,
  },
  {
    coords: [-61.687704, -24.367092],
    title: 'Pump Laguna Yema',
    subtitle: 'Big pump · Formosa',
    body: 'A high-volume draw serving Laguna Yema, pressed against the park\'s buffer. As pasture and cropland spread here, the extractions stack up.',
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
    body: 'Sauzalito\'s municipal intake — the largest town on this Chaco stretch of the river.',
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
    body: 'Another informal draw, low on the buffer\'s reach.',
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

async function phasePark({ go, ease, pause, map, setOverlay }) {
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
  setOverlay({
    id: 'park',
    title: 'El Impenetrable',
    subtitle: 'National Park',
    body: ' Here, 128,000 hectares of dry Chaco forest stretch to the horizon — knotted quebracho, palo santo and algarrobo so dense and thorny they gave this land its name: the Impenetrable. Protected by national law in 2014, in 2017 the first rangers sat foot inside.',
    images: PARK_IMAGES,
  });
  await pause(12000);
}

async function phaseBuffer({ go, ease, map, setOverlay }) {
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label'], true);
  vis(map, ['pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'ina-halo','ina-icon',
            'firms-halo','firms-icon'], false);
  setOverlay({
    id: 'buffer',
    title: 'Buffer Zone',
    subtitle: 'Monitoring Corridor',
    body: 'Beyond the park\'s edge lies its cushion. Developing a Buffer Area alongside local communities is what will help to mitigate the pressure from outside, giving the wildlife that shelters in the park room to roam, breed and move safely. ',
    images: BUFFER_IMAGES,
  });
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

async function phaseMapbiomas({ go, pause, map, setOverlay }) {
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
  setOverlay({
    id: 'mapbiomas',
    title: 'The Agricultural Frontier',
    subtitle: '1985–2023 · MapBiomas Gran Chaco',
    year: 1985,
    legend: [
      { color: '#db4fba', label: 'Cropland' },
      { color: '#ffd700', label: 'Pasture' },
    ],
    bodyHtml: '<strong>The agricultural frontier, closing in from every side (seen in pink and yellow)</strong> — and as it advances, the Gran Chaco fractures into ever-smaller fragments. El Impenetrable is left as the last oasis of dry forest still whole enough to shelter its wildlife - it has become the final refuge in a landscape being pulled apart.',
  });

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

// ── River phases (3 individual phases) ───────────────────────────────────────

async function phaseRiverIntro({ go, ease, map, setOverlay }) {
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

  setOverlay({
    id: 'river',
    title: 'The Bermejo River',
    subtitle: null,
    body: 'The Bermejo — known here by its older name, the Teuco — winds more than 1,000 km of shifting channels along the park\'s northern edge. We follow it upstream, west, to the first place where its water is being drawn.',
    video: '/media/bermejo-popup.mov',
  });
  await go({
    center: [-61.25, -24.52],
    zoom: 11.5, pitch: 65, bearing: 290,
    duration: 5000,
    easing: t => 1 - Math.pow(1 - t, 4),
  });
  await ease({ center: [-61.75, -24.40], bearing: 288, zoom: 11.5, pitch: 67, duration: 13800, easing: t => t });
}

async function phaseRiverSeasonality({ go, ease, pause, map, setOverlay }) {
  gswReset(map, 'gsw_transitions-layer');
  if (map.getLayer('mapbiomas-layer'))
    map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');

  // Quick entry shot so Back navigation lands at a sensible position
  await go({
    center: [-61.75, -24.40], bearing: 288, zoom: 11.5, pitch: 67,
    duration: 1500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  await gswFadeIn(pause, map, 'gsw_seasonality-layer');
  setOverlay({
    id: 'river-seasonality',
    title: 'Water Seasonality',
    subtitle: '1984–2021 · Global Surface Water',
    legend: [
      { color: '#c7e9f7', label: '1 month / year' },
      { color: '#5dacc8', label: '6 months / year' },
      { color: '#0d47a1', label: '12 months — permanent' },
    ],
    body: 'Water seasonality shows how many months per year surface water was present, averaged from 1984 to 2021. The Bermejo pulses — pale blue where it appears only seasonally, deepening to permanent dark blue at its stable core.',
  });
  await ease({ center: [-62.05, -24.25], bearing: 285, zoom: 11.5, pitch: 68, duration: 10000, easing: t => t });
}

async function phaseRiverTransitions({ go, ease, pause, map, setOverlay }) {
  gswReset(map, 'gsw_seasonality-layer');

  // Quick entry shot
  await go({
    center: [-62.05, -24.25], bearing: 285, zoom: 11.5, pitch: 68,
    duration: 1500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  await gswFadeIn(pause, map, 'gsw_transitions-layer');
  setOverlay({
    id: 'river-transitions',
    title: 'Water Transitions',
    subtitle: '1984–2021 · Global Surface Water',
    legend: [
      { color: '#b5e61d', label: 'New path' },
      { color: '#e6194b', label: 'Lost path' },
      { color: '#c3c3c3', label: 'General path' },
    ],
    body: 'The Bermejo river is alive, it pulses with every season. The color coding of these images shows us how each season creates new shapes on its course.',
  });
  await ease({ center: [-62.34, -24.11], bearing: 280, zoom: 12.0, pitch: 68, duration: 8000, easing: t => t });

  await gswFadeOut(pause, map, 'gsw_transitions-layer');
  await ease({ bearing: 100, zoom: 13.5, pitch: 72, duration: 3500, easing: t => 1 - Math.pow(1 - t, 3) });
}

// ── Pump phases (1 intro + 13 individual) ────────────────────────────────────

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

async function phasePumpsIntro({ pause, map, setOverlay, setLitPumps }) {
  pumpBaseSetup(map, setLitPumps, setOverlay, null);

  setOverlay({
    id: 'pumps-intro',
    title: 'Illegal Extraction Sites',
    subtitle: null,
    body: 'Thirteen points along the river draw its water — some are registered town and community supplies, others are unregistered pumps feeding cattle pasture and crops. Together they tap the same artery the park and its biodiversity depend on, with little or no monitoring of how much is taken — or what it leaves behind.',
  });
  await pause(9500); // 6500 + 3000 extra
}

function makePumpPhase(i) {
  return async function({ go, ease, pause, map, setOverlay, setLitPumps }) {
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
    setOverlay({ id: `pump-${i}`, ...pump });
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

async function phaseGauges({ go, pause, map, setOverlay, setLitPumps, floodGaugesRef, addTourPopup }) {
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

  setOverlay({
    id: 'gauges',
    title: 'Flood Monitoring',
    subtitle: 'GloFAS · Copernicus Emergency Management',
    bodyHtml: 'The river is restless. These are not on site stations but rather <strong>modeled stations</strong> that track rising and falling across the Bermejo–Paraná basin, watched in <strong>near real-time from orbit.</strong> Carrying one of the heaviest sediment loads on the continent, the Bermejo floods hard and often — remaking its own course as it goes.',
  });

  // Fade in an individual popup at each gauge position
  displayGauges.forEach(g => {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 })
      .setLngLat(g.coordinates)
      .setHTML(buildTourFloodPopupHtml(g))
      .addTo(map);
    addTourPopup(popup);
  });

  await pause(7000);
}

async function phaseInaGauges({ go, pause, map, setOverlay, inaStationsRef, addTourPopup }) {
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

  setOverlay({
    id: 'ina-gauges',
    title: 'The Monitoring Gap',
    subtitle: 'INA sSIyAH · Telemetric (In Territory)',
    body: 'Six telemetric (in territory) stations cover the Bermejo corridor. Three gauge river level across the upper reaches — Aguas Blancas at the Bolivian border, Embarcación, and Puerto Velaz. Puerto Lavalle, 121 km downstream of the park, provides the ground-truth reading that cross-checks the satellite models. Inside the park, a meteorological station watches conditions. El Colorado holds the only discharge data ever published for the entire Bermejo — 454 readings over 79 days (July – September 2024), then permanent silence. That 79-day record is the only time anyone measured how much water this river actually carries.',
  });

  // Fade in an individual popup at each station
  displayStations.forEach(s => {
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 })
      .setLngLat(s.coordinates)
      .setHTML(buildTourInaPopupHtml(s))
      .addTo(map);
    addTourPopup(popup);
  });

  await pause(9000);
}

async function phaseFires({ pause, map, setOverlay, firmsStatsRef }) {
  vis(map, ['ina-halo','ina-icon'], false);
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'firms-halo','firms-icon'], true);
  setOverlay({
    id: 'fires',
    title: 'Active Fire Alerts',
    subtitle: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21',
    body: 'Each point is a fire, caught from orbit and refreshed every 3 hours. In the Chaco, many are set on purpose — pasture burned to push the frontier deeper, sometimes right to the doorstep of protected land. The siege we began with, still burning.',
    stats: firmsStatsRef.current,
  });
  await pause(5500);
}

// 3 river phases + 14 pump phases (1 intro + 13 individual) = 6 + 14 = 23 total
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
];

// ── Hook ──────────────────────────────────────────────────────────────────

export function useTour(mapRef, { onComplete, firmsStats, floodGauges, inaStations } = {}) {
  const [overlay, setOverlay] = useState(null);
  const [touring, setTouring] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [paused, setPaused] = useState(false);

  const cancelled = useRef(false);
  const pausedRef = useRef(false);
  const stoppingForPause = useRef(false); // true only during the synchronous map.stop() call in togglePause
  const phaseRef = useRef(0);
  const goingBackTarget = useRef(-1);
  const onCompleteRef = useRef(onComplete);
  const firmsStatsRef = useRef(firmsStats);
  const floodGaugesRef = useRef(floodGauges ?? []);
  const inaStationsRef = useRef(inaStations ?? []);
  const tourPopupsRef = useRef([]);
  const runFromPhaseRef = useRef(null);

  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { firmsStatsRef.current = firmsStats; });
  useEffect(() => { floodGaugesRef.current = floodGauges ?? []; }, [floodGauges]);
  useEffect(() => { inaStationsRef.current = inaStations ?? []; }, [inaStations]);

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

      // Retry loop: if map.stop() fires moveend due to a pause (not natural completion),
      // we re-run easeTo from the current position so the arc continues in the same direction.
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
            // Paused mid-arc — wait for unpause then retry the same easeTo from current pos
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
    const ctx = { go, ease, pause, map, setOverlay, setLitPumps, firmsStatsRef, floodGaugesRef, inaStationsRef, addTourPopup };

    let completing = true;
    try {
      for (let i = startPhase; i < PHASES.length; i++) {
        // Close popups from the previous phase before starting the next
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
      // map.stop() fires 'moveend' synchronously — flag lets ease/go detect the cause
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
