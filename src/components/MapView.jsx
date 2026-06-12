import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { STATUS_COLORS, STATUS_LABELS, GRID_MATCH_COLOR, GRID_MATCH_LABEL } from '../data/floodGauges';
import { INA_TYPE_COLOR, INA_TYPE_LABEL } from '../data/inaGauges';
import MapLayerPanel from './MapLayerPanel';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const GSW_BOUNDS = [-62.5, -25.7, -60.4, -24.0];

const GSW_LAYERS = {
  gsw_seasonality: '/data/gsw_seasonality.png',
  gsw_transitions: '/data/gsw_transitions.png',
};

const IMAGE_COORDS = [
  [GSW_BOUNDS[0], GSW_BOUNDS[3]],
  [GSW_BOUNDS[2], GSW_BOUNDS[3]],
  [GSW_BOUNDS[2], GSW_BOUNDS[1]],
  [GSW_BOUNDS[0], GSW_BOUNDS[1]],
];

// MapBiomas image overlay — full Gran Chaco raster extent (nodata=0 → transparent)
// Bounds from rasterio: left=-67.7256, bottom=-33.8736, right=-55.7565, top=-17.5360
const MAPBIOMAS_COORDS = [
  [-67.72560623728215, -17.536012661297182],  // NW
  [-55.75654322320206, -17.536012661297182],  // NE
  [-55.75654322320206, -33.87358290205051 ],  // SE
  [-67.72560623728215, -33.87358290205051 ],  // SW
];

// Landing position — matches the 3D perspective in the reference screenshot
const LANDING = { center: [-61.35, -25.1], zoom: 9.5, pitch: 55, bearing: 5 };

// Skip the intro animation on tab re-visits within the same page session
let introPlayed = false;

function sentinelUrl(band, date) {
  return `/sentinel/${band}/${date}.png`;
}

const preloadCache = {};
function preload(url) {
  if (preloadCache[url]) return;
  const img = new window.Image();
  img.src = url;
  preloadCache[url] = img;
}

function adjacentMonths(months, currentIdx, radius = 4) {
  const result = [];
  for (let i = Math.max(0, currentIdx - radius); i <= Math.min(months.length - 1, currentIdx + radius); i++) {
    result.push(months[i]);
  }
  return result;
}

const TYPE_DISPLAY = {
  river: 'River related / Relacionado al río',
  deforestation: 'Deforestation / Desmonte',
  fire: 'Fire / Incendio',
  contamination: 'Contamination / Contaminación',
  poaching: 'Poaching & illegal fishing / Caza y pesca ilegal',
  testimony: 'Testimony / Testimonio',
  other: 'Other / Otro',
};
const EVIDENCE_DISPLAY = {
  photo_video: 'Photo or video / Foto o video',
  satellite: 'Satellite image / Imagen satelital',
  document: 'Official document or report / Documento o informe oficial',
  direct_observation: 'Direct observation / Observación directa',
  secondhand: 'Secondhand account / Relato de terceros',
  other: 'Other / Otro',
};
const CONFIDENCE_DISPLAY = {
  witnessed: 'I witnessed this directly / Lo presencié directamente',
  confident: "I'm fairly confident / Estoy bastante seguro/a",
  suspicion: "It's a suspicion / Es una sospecha",
};

const FIRMS_CONF_COLOR = ['match', ['get', 'confidence'],
  'h', '#ff2200', 'high', '#ff2200',
  'n', '#ff8800', 'nominal', '#ff8800',
  '#ffcc00',
];

// ── Canvas-drawn map icons ────────────────────────────────────────────────────
// Drawn at 2× so they stay crisp on retina. pixelRatio:2 tells Mapbox the
// logical size is half the canvas size.

function communityIcon() {
  return makeIcon((ctx, S) => {
    const cx = S / 2;
    const r = S * 0.36;
    ctx.beginPath();
    ctx.arc(cx, cx, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cx, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  });
}

function makeIcon(drawFn, size = 24) {
  const px = size * 2;
  const c = document.createElement('canvas');
  c.width = px; c.height = px;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  drawFn(ctx, size);
  return ctx.getImageData(0, 0, px, px);
}

function flameIcon(color) {
  return makeIcon((ctx, S) => {
    const cx = S / 2;
    const flamePath = () => {
      ctx.beginPath();
      ctx.moveTo(cx, S - 2);
      ctx.bezierCurveTo(cx - 7, S - 3, cx - 8, S - 8, cx - 5, S - 12);
      ctx.bezierCurveTo(cx - 3, S - 15, cx - 2, S - 17, cx - 1, 2);
      ctx.bezierCurveTo(cx + 2, S - 17, cx + 3, S - 15, cx + 5, S - 12);
      ctx.bezierCurveTo(cx + 8, S - 8, cx + 7, S - 3, cx, S - 2);
      ctx.closePath();
    };
    // white border
    flamePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // colour fill
    flamePath();
    ctx.fillStyle = color;
    ctx.fill();
    // inner glow
    ctx.fillStyle = 'rgba(255,240,120,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx, S - 8, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function wavesIcon(color) {
  return makeIcon((ctx, S) => {
    ctx.lineCap = 'round';
    for (const y of [S * 0.3, S * 0.52, S * 0.74]) {
      const wave = () => {
        ctx.beginPath();
        ctx.moveTo(2, y);
        ctx.bezierCurveTo(S * 0.27, y - S * 0.17, S * 0.48, y + S * 0.17, S * 0.67, y);
        ctx.bezierCurveTo(S * 0.82, y - S * 0.12, S - 3, y + S * 0.05, S - 2, y);
      };
      // white border (drawn first, wider)
      wave();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4;
      ctx.stroke();
      // colour on top
      wave();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  });
}

function pumpIcon(color) {
  return makeIcon((ctx, S) => {
    const draw = (stroke) => {
      if (stroke) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
      } else {
        ctx.fillStyle = color;
      }
      // motor body
      ctx.beginPath();
      ctx.arc(S * 0.4, S * 0.42, S * 0.25, 0, Math.PI * 2);
      stroke ? ctx.stroke() : ctx.fill();
      // horizontal outlet pipe
      ctx.beginPath();
      ctx.roundRect(S * 0.6, S * 0.33, S * 0.35, S * 0.18, 2);
      stroke ? ctx.stroke() : ctx.fill();
      // vertical intake pipe
      ctx.beginPath();
      ctx.roundRect(S * 0.32, S * 0.65, S * 0.17, S * 0.28, 2);
      stroke ? ctx.stroke() : ctx.fill();
    };
    draw(true);  // white border pass
    draw(false); // colour fill pass
  });
}

function stationIcon(color, offline = false) {
  return makeIcon((ctx, S) => {
    const cx = S / 2;
    const r  = S * 0.36;
    // white border
    ctx.beginPath();
    ctx.arc(cx, cx, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    // coloured fill
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cx); ctx.lineTo(cx + r * 0.6, cx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cx - r * 0.6); ctx.lineTo(cx, cx + r * 0.6); ctx.stroke();
    if (offline) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.55, cx - r * 0.55);
      ctx.lineTo(cx - r * 0.55, cx + r * 0.55);
      ctx.stroke();
    }
  });
}

const WATER_PATH_PUMPS = [
  { coords: [-62.226627, -24.136969], sourceId: 'waterpath-ingjuarez',   file: '/data/waterpath_ingjuarez.geojson',   featureIdx: 0 },
  { coords: [-61.687704, -24.367092], sourceId: 'waterpath-lagyema',     file: '/data/waterpath_lagyema.geojson',     featureIdx: 1 },
  { coords: [-61.424589, -24.619062], sourceId: 'waterpath-wichipintado', file: '/data/waterpath_wichipintado.geojson', featureIdx: 2 },
];

export default function MapView({ layers, mapRef, sentinel, months, firmsGeoJSON, floodGeoJSON, floodGauges, inaGeoJSON, inaStations, mapbiomas, communityGeoJSON, actMode, actPin, onActPick, onIntroComplete }) {
  const containerRef = useRef(null);
  const onIntroCompleteRef = useRef(onIntroComplete);
  const inaStationsRef = useRef([]);
  const floodGaugesRef = useRef([]);
  const actModeRef = useRef(false);
  const onActPickRef = useRef(onActPick);
  const actMarkerRef = useRef(null);
  const [overlays, setOverlays] = useState({ borders: false, places: false });

  const handleOverlayChange = (key, val) => setOverlays(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    const skipIntro = introPlayed;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      projection: 'globe',
      center: skipIntro ? LANDING.center : [-61.45, -24.9],
      zoom:   skipIntro ? LANDING.zoom   : 1.5,
      pitch:  skipIntro ? LANDING.pitch  : 0,
      bearing: skipIntro ? LANDING.bearing : 0,
      maxZoom: 16,
      // minZoom set after intro lands so globe can start at zoom 1.5
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    mapRef.current = map;

    map.on('load', async () => {
      // ── Custom marker icons ───────────────────────────────────────────────
      map.addImage('flame-h', flameIcon('#ff2200'), { pixelRatio: 2 });
      map.addImage('flame-n', flameIcon('#ff8800'), { pixelRatio: 2 });
      map.addImage('flame-l', flameIcon('#ffcc00'), { pixelRatio: 2 });
      map.addImage('waves-warning',  wavesIcon(STATUS_COLORS.warning),  { pixelRatio: 2 });
      map.addImage('waves-watch',    wavesIcon(STATUS_COLORS.watch),    { pixelRatio: 2 });
      map.addImage('waves-advisory', wavesIcon(STATUS_COLORS.advisory), { pixelRatio: 2 });
      map.addImage('waves-normal',   wavesIcon(STATUS_COLORS.normal),   { pixelRatio: 2 });
      map.addImage('waves-pending',  wavesIcon(STATUS_COLORS.pending),  { pixelRatio: 2 });
      map.addImage('pump-icon',       pumpIcon('#63412F'),                                   { pixelRatio: 2 });
      map.addImage('station-level',  stationIcon(INA_TYPE_COLOR.river_level),              { pixelRatio: 2 });
      map.addImage('station-meteo',  stationIcon(INA_TYPE_COLOR.meteo),                    { pixelRatio: 2 });
      map.addImage('station-offline',stationIcon(INA_TYPE_COLOR.discharge_gauge_offline, true), { pixelRatio: 2 });

      // ── Mapbox Streets overlay (borders + place labels) ──────────────────
      map.addSource('mapbox-streets', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8',
      });
      map.addLayer({
        id: 'overlay-country-border',
        type: 'line',
        source: 'mapbox-streets',
        'source-layer': 'admin',
        filter: ['==', ['get', 'admin_level'], 0],
        paint: {
          'line-color': 'rgba(255,255,255,0.85)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 10, 2],
          'line-dasharray': [3, 2],
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'overlay-province-border',
        type: 'line',
        source: 'mapbox-streets',
        'source-layer': 'admin',
        filter: ['==', ['get', 'admin_level'], 1],
        paint: {
          'line-color': 'rgba(255,255,255,0.5)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 10, 1.5],
          'line-dasharray': [4, 3],
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'overlay-place-labels',
        type: 'symbol',
        source: 'mapbox-streets',
        'source-layer': 'place_label',
        layout: {
          'text-field': ['coalesce', ['get', 'name_es'], ['get', 'name']],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'],
            6,  ['match', ['get', 'type'], ['city'], 13, ['town'], 10, 8],
            14, ['match', ['get', 'type'], ['city'], 18, ['town'], 14, 11],
          ],
          'text-anchor': 'top',
          'text-offset': [0, 0.2],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          visibility: 'none',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.75)',
          'text-halo-width': 1.5,
          'text-halo-blur': 0.5,
        },
      });

      // Atmospheric globe effect — space → blue horizon → terrain haze
      map.setFog({
        color:           'rgb(210, 220, 230)',
        'high-color':    'rgb(30, 80, 200)',
        'horizon-blend': 0.03,
        'space-color':   'rgb(8, 8, 22)',
        'star-intensity': 0.5,
      });

      // ── MapBiomas land-cover overlay ─────────────────────────────────────
      const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjkB6QAAAABJRU5ErkJggg==';
      map.addSource('mapbiomas', { type: 'image', url: BLANK, coordinates: MAPBIOMAS_COORDS });
      map.addLayer({
        id: 'mapbiomas-layer',
        type: 'raster',
        source: 'mapbiomas',
        paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 0, 'raster-resampling': 'nearest' },
        layout: { visibility: 'none' },
      });

      // ── Sentinel image source ─────────────────────────────────────────────
      map.addSource('sentinel', {
        type: 'image',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjkB6QAAAABJRU5ErkJggg==',
        coordinates: IMAGE_COORDS,
      });
      map.addLayer({
        id: 'sentinel-layer',
        type: 'raster',
        source: 'sentinel',
        paint: { 'raster-opacity': 0, 'raster-fade-duration': 400 },
      });

      // ── Park boundary — white solid (hidden until tour/explore activates) ──
      map.addSource('park', { type: 'geojson', data: '/data/park_boundary.geojson' });
      map.addLayer({ id: 'park-fill', type: 'fill', source: 'park',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.08 },
        layout: { visibility: 'none' } });
      map.addLayer({ id: 'park-line', type: 'line', source: 'park',
        paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-opacity': 0.9 },
        layout: { visibility: 'none' } });

      // ── Buffer — white dashed (hidden until activated) ────────────────────
      map.addSource('buffer', { type: 'geojson', data: '/data/buffer_area.geojson' });
      map.addLayer({ id: 'buffer-fill', type: 'fill', source: 'buffer',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.04 },
        layout: { visibility: 'none' } });
      map.addLayer({ id: 'buffer-line', type: 'line', source: 'buffer',
        paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.7,
                 'line-dasharray': [5, 4] },
        layout: { visibility: 'none' } });

      // ── Pump points (hidden until activated) ─────────────────────────────
      map.addSource('pumps', { type: 'geojson', data: '/data/pump_points.geojson' });
      map.addLayer({ id: 'pumps-halo', type: 'circle', source: 'pumps',
        paint: { 'circle-radius': 16, 'circle-color': '#63412F',
                 'circle-opacity': 0.22, 'circle-stroke-width': 0 },
        layout: { visibility: 'none' } });
      map.addLayer({ id: 'pumps-icon', type: 'symbol', source: 'pumps',
        layout: { 'icon-image': 'pump-icon', 'icon-size': 0.72,
                  'icon-allow-overlap': true, 'icon-ignore-placement': true,
                  visibility: 'none' } });

      // ── Water path interactive fade ───────────────────────────────────────
      let activeWaterPathId = null;
      let pumpJustClicked = false;

      function fadeLineOpacity(layerId, targetOpacity, onDone) {
        const from = map.getPaintProperty(layerId, 'line-opacity') ?? 0;
        const dur = 600, t0 = Date.now();
        if (targetOpacity > 0) map.setLayoutProperty(layerId, 'visibility', 'visible');
        const step = () => {
          const t = Math.min((Date.now() - t0) / dur, 1);
          if (map.getLayer(layerId)) map.setPaintProperty(layerId, 'line-opacity', from + (targetOpacity - from) * t);
          if (t < 1) requestAnimationFrame(step);
          else {
            if (targetOpacity === 0) map.setLayoutProperty(layerId, 'visibility', 'none');
            onDone?.();
          }
        };
        requestAnimationFrame(step);
      }

      async function showWaterPath(wp) {
        const src = map.getSource(wp.sourceId);
        if (!src) return;
        const gj = await fetch(wp.file).then(r => r.json());
        const coords = gj.features[wp.featureIdx]?.geometry?.coordinates;
        if (coords) src.setData({ type: 'FeatureCollection', features: [
          { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        ]});
        fadeLineOpacity(`${wp.sourceId}-layer`, 0.75);
      }

      function hideWaterPath(sourceId) {
        fadeLineOpacity(`${sourceId}-layer`, 0, () => {
          map.getSource(sourceId)?.setData({ type: 'FeatureCollection', features: [] });
        });
      }

      map.on('click', 'pumps-icon', (e) => {
        if (actModeRef.current) return;
        pumpJustClicked = true;
        const [lng, lat] = e.features[0].geometry.coordinates;
        const wp = WATER_PATH_PUMPS.find(p =>
          Math.abs(p.coords[0] - lng) < 0.001 && Math.abs(p.coords[1] - lat) < 0.001
        );
        if (wp) {
          if (activeWaterPathId === wp.sourceId) {
            hideWaterPath(wp.sourceId);
            activeWaterPathId = null;
          } else {
            if (activeWaterPathId) hideWaterPath(activeWaterPathId);
            activeWaterPathId = wp.sourceId;
            showWaterPath(wp);
          }
        }
        const props = e.features[0].properties;
        new mapboxgl.Popup({ className: 'pump-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:180px">
            <h4 style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#63412F;margin-bottom:6px">Illegal Pump Site</h4>
            ${Object.entries(props).filter(([k]) => k !== 'id' && !k.startsWith('_')).map(([k, v]) =>
              `<p style="font-size:13px;margin:2px 0"><span style="color:#888">${k}:</span> ${v ?? '—'}</p>`
            ).join('')}
          </div>`)
          .addTo(map);
      });

      // Clicking anywhere else — drop pin in actMode, or fade out active water path
      map.on('click', (e) => {
        if (actModeRef.current) {
          onActPickRef.current?.({ lat: e.lngLat.lat.toFixed(5), lng: e.lngLat.lng.toFixed(5) });
          return;
        }
        if (!pumpJustClicked && activeWaterPathId) {
          hideWaterPath(activeWaterPathId);
          activeWaterPathId = null;
        }
        pumpJustClicked = false;
      });

      map.on('mouseenter', 'pumps-icon', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'pumps-icon', () => { map.getCanvas().style.cursor = ''; });

      // ── GSW image overlays ────────────────────────────────────────────────
      for (const [id, file] of Object.entries(GSW_LAYERS)) {
        map.addSource(id, { type: 'image', url: file, coordinates: IMAGE_COORDS });
        map.addLayer({ id: `${id}-layer`, type: 'raster', source: id,
          paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 300 },
          layout: { visibility: 'none' } });
      }

      // ── Flood gauge stations ──────────────────────────────────────────────
      map.addSource('flood-gauges', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'flood-halo',
        type: 'circle',
        source: 'flood-gauges',
        paint: {
          'circle-radius': 15,
          'circle-color': ['match', ['get', 'status'],
            'warning', STATUS_COLORS.warning,
            'watch',   STATUS_COLORS.watch,
            'advisory',STATUS_COLORS.advisory,
            STATUS_COLORS.normal,
          ],
          'circle-opacity': 0.2,
          'circle-stroke-width': 0,
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'flood-icon',
        type: 'symbol',
        source: 'flood-gauges',
        layout: {
          'icon-image': ['match', ['get', 'status'],
            'warning',  'waves-warning',
            'watch',    'waves-watch',
            'advisory', 'waves-advisory',
            'pending',  'waves-pending',
            'waves-normal',
          ],
          'icon-size': 0.72,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          visibility: 'none',
        },
      });
      map.on('click', 'flood-icon', (e) => {
        if (actModeRef.current) return;
        const p = e.features[0].properties;
        // Look up live gauge data from ref — GeoJSON properties may lag behind React state
        const g = floodGaugesRef.current.find(x => x.id === p.id) ?? p;
        const color     = STATUS_COLORS[g.status]     || STATUS_COLORS.pending;
        const label     = STATUS_LABELS[g.status]     || 'Awaiting model data';
        const gmColor   = GRID_MATCH_COLOR[g.gridMatch] || '#888';
        const gmLabel   = GRID_MATCH_LABEL[g.gridMatch] || '';
        const isPending = g.status === 'pending' || g.status === 'error' || g.noData;

        // Plain-language flow sentence
        const absPct    = g.baselinePct != null ? Math.abs(g.baselinePct) : null;
        const dirWord   = g.baselinePct >= 0 ? 'above' : 'below';
        const flowLine  = absPct == null ? ''
          : absPct < 10 ? 'Flow is within its typical seasonal range'
          : `Flow is ${absPct}% ${dirWord} its typical level for this time of year`;
        const tendPart  = g.tendency === 'Rising'  ? ', and rising'
          : g.tendency === 'Falling' ? ', and falling'
          : g.tendency === 'Steady'  ? ', holding steady' : '';

        // Plain-language outlook
        const forecastRatio = g.baselineMedian > 0 ? g.forecastPeak / g.baselineMedian : 0;
        const forecastLevel = forecastRatio >= 3 ? 'well above normal'
          : forecastRatio >= 2 ? 'above normal'
          : forecastRatio >= 1.5 ? 'slightly above normal'
          : 'within normal range';
        const alreadyPeaking = g.discharge != null && g.forecastPeak != null && g.discharge >= g.forecastPeak;
        const outlookLine = alreadyPeaking
          ? 'Currently at or near peak — expected to recede over the next 7 days.'
          : g.forecastPeakDate
            ? `Next 7 days: peak expected <strong>${g.forecastPeakDate}</strong>, ${forecastLevel}.`
            : '';

        // Technical detail
        const pctSign   = g.baselinePct != null
          ? (g.baselinePct >= 0 ? `+${g.baselinePct}%` : `${g.baselinePct}%`) : '';
        const spreadText = (g.forecastSpreadLow != null && g.forecastSpreadHigh != null)
          ? ` [${g.forecastSpreadLow}–${g.forecastSpreadHigh} ensemble]` : '';

        new mapboxgl.Popup({ className: 'pump-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:'IM Fell Double Pica',serif;padding:10px 14px;min-width:250px">
            <p style="font-size:15px;color:#DED8CF;margin-bottom:1px"><strong>${g.river} · ${g.location}</strong></p>
            <p style="font-size:12px;color:#888;margin-bottom:9px">${g.country} · GloFAS model point</p>
            <div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:9px">
              <p style="font-size:13px;letter-spacing:.07em;text-transform:uppercase;color:${color};margin-bottom:7px">● ${label}</p>
              ${isPending
                ? `<p style="font-size:13px;color:#777;line-height:1.5">Fetching model data…</p>`
                : `<p style="font-size:14px;color:#DED8CF;line-height:1.55;margin-bottom:5px">${flowLine}${tendPart}.</p>
                   ${outlookLine ? `<p style="font-size:13px;color:#aaa;line-height:1.5;margin-bottom:0">${outlookLine}</p>` : ''}`
              }
            </div>
            ${!isPending ? `
            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:10px">
              <p style="font-size:13px;color:#aaa;margin-bottom:3px">${g.discharge} m³/s today · 7-day forecast: ${g.forecastPeak} m³/s${spreadText} · ${pctSign} vs baseline</p>
              <p style="font-size:13px;color:${gmColor};margin-bottom:3px">${gmLabel}</p>
              <p style="font-size:13px;color:#aaa;margin-bottom:6px">model run: ${g.modelRunDate || '—'}</p>
              <p style="font-size:12px;color:#999;line-height:1.4;font-style:italic">Simulation, not a gauge reading — situational awareness only</p>
            </div>` : `
            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:10px">
              <p style="font-size:13px;color:${gmColor}">${gmLabel}</p>
            </div>`}
          </div>`)
          .addTo(map);
      });
      map.on('mouseenter', 'flood-icon', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'flood-icon', () => { map.getCanvas().style.cursor = ''; });

      // ── FIRMS fire alerts ─────────────────────────────────────────────────
      map.addSource('firms', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'firms-halo',
        type: 'circle',
        source: 'firms',
        paint: {
          'circle-radius': 14,
          'circle-color': FIRMS_CONF_COLOR,
          'circle-opacity': 0.18,
          'circle-stroke-width': 0,
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'firms-icon',
        type: 'symbol',
        source: 'firms',
        layout: {
          'icon-image': ['match', ['get', 'confidence'],
            'h', 'flame-h', 'high', 'flame-h',
            'n', 'flame-n', 'nominal', 'flame-n',
            'flame-l',
          ],
          'icon-size': 0.72,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          visibility: 'none',
        },
      });
      map.on('click', 'firms-icon', (e) => {
        if (actModeRef.current) return;
        const p = e.features[0].properties;
        const confLabel = { h: 'High', high: 'High', n: 'Nominal', nominal: 'Nominal', l: 'Low', low: 'Low' }[p.confidence] ?? p.confidence;
        new mapboxgl.Popup({ className: 'pump-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:180px">
            <h4 style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#ff4400;margin-bottom:6px">Active Fire Detection</h4>
            <p style="font-size:13px;margin:2px 0"><span style="color:#888">Date:</span> ${p.acq_date} ${p.acq_time?.slice(0,2)}:${p.acq_time?.slice(2,4)} UTC</p>
            <p style="font-size:13px;margin:2px 0"><span style="color:#888">Confidence:</span> ${confLabel}</p>
            <p style="font-size:13px;margin:2px 0"><span style="color:#888">Fire power:</span> ${p.frp ? p.frp.toFixed(1) + ' MW' : '—'}</p>
            <p style="font-size:13px;margin:2px 0"><span style="color:#888">Time of day:</span> ${p.daynight === 'D' ? 'Day' : 'Night'}</p>
            <p style="font-size:10px;color:#555;margin-top:6px;font-style:italic">NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · ~3h latency</p>
          </div>`)
          .addTo(map);
      });
      map.on('mouseenter', 'firms-icon', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'firms-icon', () => { map.getCanvas().style.cursor = ''; });

      // ── INA telemetric stations ───────────────────────────────────────────
      map.addSource('ina-stations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'ina-halo',
        type: 'circle',
        source: 'ina-stations',
        paint: {
          'circle-radius': 16,
          'circle-color': ['match', ['get', 'type'],
            'river_level',             INA_TYPE_COLOR.river_level,
            'meteo',                   INA_TYPE_COLOR.meteo,
            INA_TYPE_COLOR.discharge_gauge_offline,
          ],
          'circle-opacity': 0.2,
          'circle-stroke-width': 0,
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'ina-icon',
        type: 'symbol',
        source: 'ina-stations',
        layout: {
          'icon-image': ['match', ['get', 'type'],
            'river_level', 'station-level',
            'meteo',       'station-meteo',
            'station-offline',
          ],
          'icon-size': 0.72,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          visibility: 'none',
        },
      });

      map.on('click', 'ina-icon', (e) => {
        if (actModeRef.current) return;
        const p = e.features[0].properties;
        // Use live station data from ref — GeoJSON properties may be stale if fetches
        // completed after the last setData() call
        const s = inaStationsRef.current.find(st => st.id === p.id) ?? p;

        const color     = INA_TYPE_COLOR[s.type] || '#888';
        const typeLabel = INA_TYPE_LABEL[s.type] || s.type;
        const isPending = s.status === 'pending' || s.status == null;
        const distLabel = s.distanceFromPark != null ? `${s.distanceFromPark} km from park` : '';

        let body = '';
        if (isPending) {
          body = `<p style="font-size:13px;color:#777;font-style:italic;padding-top:8px;border-top:1px solid rgba(255,255,255,0.12);margin-top:4px">Fetching INA data…</p>`;
        } else if (s.type === 'river_level') {
          const anomSign = s.anomalyPct != null ? (s.anomalyPct >= 0 ? '+' : '') : '';
          body = `<div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:9px;margin-top:4px">
            <p style="font-size:14px;color:#DED8CF;margin-bottom:5px">Level: <strong>${s.level ?? '—'} m</strong> · ${s.tendency ?? '—'}</p>
            ${s.anomalyPct != null ? `<p style="font-size:13px;color:#aaa;margin-bottom:2px">${anomSign}${s.anomalyPct}% vs 30-day mean (baseline: ${s.baselineMean} m)</p>` : ''}
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:9px">
            <p style="font-size:12px;color:#888;margin-bottom:2px">Observed gauge reading — contrasts with GloFAS model for this reach</p>
            <p style="font-size:12px;color:#888;margin-bottom:2px">Last reading: ${s.latestDate ? String(s.latestDate).slice(0,16).replace('T',' ') : '—'}</p>
            <p style="font-size:12px;color:#666;font-style:italic">INA sSIyAH · varId 2 · ~1h latency</p>
          </div>`;
        } else if (s.type === 'meteo') {
          const hasData = s.temp != null || s.wind != null || s.humidity != null;
          body = `<div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:9px;margin-top:4px">
            ${hasData
              ? `${s.temp     != null ? `<p style="font-size:14px;color:#DED8CF;margin-bottom:4px">Temperature: <strong>${s.temp}°C</strong></p>` : ''}
                 ${s.humidity != null ? `<p style="font-size:14px;color:#DED8CF;margin-bottom:4px">Humidity: <strong>${s.humidity}%</strong></p>` : ''}
                 ${s.wind     != null ? `<p style="font-size:14px;color:#DED8CF;margin-bottom:4px">Wind: <strong>${s.wind} km/h</strong></p>` : ''}`
              : `<p style="font-size:13px;color:#777;font-style:italic">No meteorological data available from this station</p>`
            }
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:9px">
            <p style="font-size:12px;color:#666;font-style:italic">INA sSIyAH · varId 53 (temp) / 58 (humidity) / 55 (wind)</p>
          </div>`;
        } else if (s.type === 'discharge_gauge_offline') {
          const lastDateStr = s.lastDate ? String(s.lastDate).slice(0, 10) : null;
          const daysAgoText = s.daysSinceUpdate != null ? `${s.daysSinceUpdate} days` : null;
          const hasHistory = s.historicTotalRows != null;
          body = `<div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:9px;margin-top:4px">
            <p style="font-size:13px;color:#dc2626;margin-bottom:7px">● Offline — silent since September 2024</p>
            <p style="font-size:13px;color:#aaa;line-height:1.55">The only discharge data ever published for the Bermejo in the INA record — ${hasHistory ? `<strong>${s.historicTotalRows} readings</strong> compressed into a <strong>${s.historicWindowDays}-day window</strong>, then permanent silence.` : 'a brief window of monitoring, then permanent silence.'}</p>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:9px">
            ${hasHistory ? `
            <p style="font-size:12px;color:#aaa;margin-bottom:3px">Data window: ${s.historicWindowStart} – ${s.historicWindowEnd}</p>
            <p style="font-size:12px;color:#aaa;margin-bottom:5px">Range: ${s.historicDischargeMin}–${s.historicDischargeMax} m³/s · Mean: ${s.historicDischargeMean} m³/s</p>` : ''}
            ${lastDateStr
              ? `<p style="font-size:13px;color:#ef4444;font-weight:bold;margin-bottom:4px">Last reading: ${lastDateStr}${daysAgoText ? ` (${daysAgoText} ago)` : ''}</p>`
              : `<p style="font-size:12px;color:#888;margin-bottom:4px">Last reading: unknown</p>`
            }
            <p style="font-size:12px;color:#666;font-style:italic">INA sSIyAH · varId 4 (discharge m³/s)</p>
          </div>`;
        }

        new mapboxgl.Popup({ className: 'pump-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:'IM Fell Double Pica',serif;padding:10px 14px;min-width:240px">
            <p style="font-size:15px;color:#DED8CF;margin-bottom:1px"><strong>${s.name}</strong></p>
            <p style="font-size:12px;color:#888;margin-bottom:5px">${typeLabel}${distLabel ? ' · ' + distLabel : ''}</p>
            <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:${color};margin-bottom:0">● ${s.type === 'discharge_gauge_offline' ? 'OFFLINE' : s.status === 'ok' ? 'ACTIVE' : (String(s.status || 'PENDING')).toUpperCase()}</p>
            ${body}
          </div>`)
          .addTo(map);
      });
      map.on('mouseenter', 'ina-icon', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'ina-icon', () => { map.getCanvas().style.cursor = ''; });

      // ── Community submissions ─────────────────────────────────────────────
      map.addImage('community-pin', communityIcon(), { pixelRatio: 2 });
      map.addSource('community', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'community-halo',
        type: 'circle',
        source: 'community',
        paint: {
          'circle-radius': 18,
          'circle-color': '#8b5cf6',
          'circle-opacity': 0.22,
          'circle-stroke-width': 0,
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'community-icon',
        type: 'symbol',
        source: 'community',
        layout: {
          'icon-image': 'community-pin',
          'icon-size': 0.72,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          visibility: 'none',
        },
      });

      map.on('click', 'community-icon', (e) => {
        if (actModeRef.current) return;
        const p = e.features[0].properties;
        const notesRow = p.notes
          ? `<div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;margin-top:12px">
               <p style="font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:5px">Notes</p>
               <p style="font-size:14px;color:#DED8CF;line-height:1.55">${p.notes}</p>
             </div>` : '';
        new mapboxgl.Popup({ className: 'pump-popup', closeButton: false, maxWidth: '480px' })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:'IM Fell Double Pica',serif;padding:14px 18px;min-width:450px;max-width:480px">
            <p style="font-size:17px;color:#DED8CF;margin-bottom:3px"><strong>${p.title}</strong></p>
            <p style="font-size:12px;color:#8b5cf6;letter-spacing:.07em;text-transform:uppercase;margin-bottom:12px">Community Submission</p>
            <div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:12px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin-bottom:12px">
                <div>
                  <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:3px">Type of event</p>
                  <p style="font-size:14px;color:#DED8CF">${TYPE_DISPLAY[p.type_of_event] ?? p.type_of_event}</p>
                </div>
                <div>
                  <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:3px">Date</p>
                  <p style="font-size:14px;color:#DED8CF">${p.date_of_event ?? '—'}</p>
                </div>
                <div>
                  <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:3px">Evidence</p>
                  <p style="font-size:14px;color:#DED8CF">${EVIDENCE_DISPLAY[p.evidence_type] ?? p.evidence_type}</p>
                </div>
                <div>
                  <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:3px">Confidence</p>
                  <p style="font-size:14px;color:#DED8CF">${CONFIDENCE_DISPLAY[p.confidence] ?? p.confidence}</p>
                </div>
              </div>
              <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:5px">Description</p>
              <p style="font-size:14px;color:#DED8CF;line-height:1.6;margin-bottom:10px">${p.description}</p>
              <p style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#888;margin-bottom:5px">Evidence detail</p>
              <p style="font-size:14px;color:#DED8CF;line-height:1.55">${p.evidence_detail}</p>
            </div>
            ${notesRow}
          </div>`)
          .addTo(map);
      });
      map.on('mouseenter', 'community-icon', () => { if (!actModeRef.current) map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'community-icon', () => { if (!actModeRef.current) map.getCanvas().style.cursor = ''; });

      // ── Globe intro dive ──────────────────────────────────────────────────
      // ── Tour pump highlight source + layers (start empty) ────────────────
      map.addSource('tour-pumps', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'tour-pumps-glow',
        type: 'circle',
        source: 'tour-pumps',
        paint: {
          'circle-radius': 22,
          'circle-color': '#f4a261',
          'circle-opacity': 0.28,
          'circle-stroke-width': 0,
        },
      });
      map.addLayer({
        id: 'tour-pumps-dot',
        type: 'circle',
        source: 'tour-pumps',
        paint: {
          'circle-radius': 7,
          'circle-color': '#f4a261',
          'circle-opacity': 1,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff8f0',
        },
      });

      // ── Water path lines (hidden until tour activates) ───────────────────
      for (const id of ['waterpath-ingjuarez', 'waterpath-lagyema', 'waterpath-wichipintado']) {
        map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: `${id}-layer`,
          type: 'line',
          source: id,
          paint: { 'line-color': '#4db8ff', 'line-width': 2.5, 'line-opacity': 0.75 },
          layout: { visibility: 'none' },
        });
      }

      if (skipIntro) {
        map.setMinZoom(6);
        onIntroCompleteRef.current?.();
      } else {
        setTimeout(() => {
          map.flyTo({
            ...LANDING,
            duration: 5500,
            easing: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
          });
          map.once('moveend', () => {
            map.setMinZoom(6);
            introPlayed = true;
            onIntroCompleteRef.current?.();
          });
        }, 1800);
      }

      // ── Icone Pro labels (canvas-rendered so custom font works on map) ────
      // Mapbox glyph system only supports hosted fonts; canvas lets us use Icone Pro.
      // icon-pitch-alignment:'map' makes the sprites tilt with the 3D perspective.
      await document.fonts.load('normal 42px "Icone Pro"');

      function makeLabel(lines) {
        const fs = 42, lsp = 5, lh = 58, px = 28, py = 18;
        const tmp = document.createElement('canvas').getContext('2d');
        tmp.font = `${fs}px "Icone Pro","IM Fell Double Pica"`;
        tmp.letterSpacing = lsp + 'px';
        const lw = lines.map(l => tmp.measureText(l).width + l.length * lsp);
        const W = Math.ceil(Math.max(...lw) + px * 2);
        const H = Math.ceil(lines.length * lh + py * 2);
        const c = document.createElement('canvas');
        c.width = W * 2; c.height = H * 2;
        const ctx = c.getContext('2d');
        ctx.scale(2, 2);
        ctx.font = `${fs}px "Icone Pro","IM Fell Double Pica"`;
        ctx.letterSpacing = lsp + 'px';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 9;
        ctx.fillStyle = '#ffffff';
        lines.forEach((line, i) => ctx.fillText(line, W / 2, py + i * lh));
        return ctx.getImageData(0, 0, W * 2, H * 2);
      }

      map.addImage('park-text-img',   makeLabel(['"EL IMPENETRABLE"', 'NATIONAL PARK']), { pixelRatio: 2 });
      map.addImage('buffer-text-img', makeLabel(['BUFFER/', 'MONITORING ZONE']),         { pixelRatio: 2 });

      const labelLayer = (id, img, coords, rotate) => ({
        id,
        type: 'symbol',
        source: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [{ type: 'Feature',
            geometry: { type: 'Point', coordinates: coords }, properties: {} }] },
        },
        layout: {
          'icon-image': img,
          'icon-size':   ['interpolate', ['linear'], ['zoom'], 7, 0.26, 9.5, 0.54, 12, 0.88],
          'icon-rotate': rotate,
          'icon-pitch-alignment':    'map',
          'icon-rotation-alignment': 'map',
          'icon-anchor': 'center',
          'icon-allow-overlap':    true,
          'icon-ignore-placement': true,
          visibility: 'none',
        },
      });

      map.addLayer(labelLayer('park-label',   'park-text-img',   [-61.0938351, -24.9459928], 45));
      map.addLayer(labelLayer('buffer-label', 'buffer-text-img', [-60.9113167, -24.7631305], 45));

      // Match initial visibility to companion polygon layers
      if (map.getLayoutProperty('park-fill',   'visibility') === 'visible')
        map.setLayoutProperty('park-label',   'visibility', 'visible');
      if (map.getLayoutProperty('buffer-fill', 'visibility') === 'visible')
        map.setLayoutProperty('buffer-label', 'visibility', 'visible');
    });

    return () => map.remove();
  }, [mapRef]);

  // Sync GSW / park / pump layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const toggle = (id, vis) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
      };
      toggle('park-fill', layers.park);
      toggle('park-line', layers.park);
      toggle('park-label', layers.park);
      toggle('buffer-fill', layers.buffer);
      toggle('buffer-line', layers.buffer);
      toggle('buffer-label', layers.buffer);
      toggle('pumps-icon', layers.pumps);
      toggle('pumps-halo', layers.pumps);
      for (const id of Object.keys(GSW_LAYERS)) toggle(`${id}-layer`, layers[id]);
      toggle('flood-halo', layers.floodGauges);
      toggle('flood-icon', layers.floodGauges);
      toggle('firms-halo', layers.firms);
      toggle('firms-icon', layers.firms);
      toggle('ina-halo',        layers.inaStations);
      toggle('ina-icon',        layers.inaStations);
      toggle('community-halo',  layers.community);
      toggle('community-icon',  layers.community);
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [layers]);

  // Push live flood gauge data into the map source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !floodGeoJSON) return;
    const apply = () => {
      const src = map.getSource('flood-gauges');
      if (src) src.setData(floodGeoJSON);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [floodGeoJSON, mapRef]);

  // Push FIRMS data into the map source whenever it loads.
  // On production the API may respond before the Mapbox style finishes loading,
  // so defer setData to the load event when the source isn't ready yet.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firmsGeoJSON) return;

    const apply = () => {
      const src = map.getSource('firms');
      if (src) src.setData(firmsGeoJSON);
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [firmsGeoJSON, mapRef]);

  // Sync Sentinel layer visibility + image
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const src = map.getSource('sentinel');
    const lyr = map.getLayer('sentinel-layer');
    if (!src || !lyr) return;

    if (!sentinel.enabled) {
      map.setPaintProperty('sentinel-layer', 'raster-opacity', 0);
      return;
    }

    if (months?.length) {
      const idx = months.indexOf(sentinel.date);
      for (const m of adjacentMonths(months, idx)) {
        preload(sentinelUrl(sentinel.band, m));
      }
    }

    const url = sentinelUrl(sentinel.band, sentinel.date);
    src.updateImage({ url, coordinates: IMAGE_COORDS });
    map.setPaintProperty('sentinel-layer', 'raster-opacity', 0.92);
  }, [sentinel.enabled, sentinel.band, sentinel.date, months]);

  // Sync MapBiomas layer — instant swap (fade-duration 0) + preload neighbours
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource('mapbiomas');
    if (!src) return;

    if (!mapbiomas?.enabled) {
      if (map.getLayer('mapbiomas-layer'))
        map.setLayoutProperty('mapbiomas-layer', 'visibility', 'none');
      return;
    }

    const year = mapbiomas.year;
    const url = `/data/mapbiomas/mapbiomas_${year}.png`;
    src.updateImage({ url, coordinates: MAPBIOMAS_COORDS });
    if (map.getLayer('mapbiomas-layer'))
      map.setLayoutProperty('mapbiomas-layer', 'visibility', 'visible');

    // Preload adjacent years so the browser cache is warm for slider navigation
    for (const y of [year + 1, year + 2, year + 3, year - 1]) {
      if (y >= 1985 && y <= 2023) {
        const img = new window.Image();
        img.src = `/data/mapbiomas/mapbiomas_${y}.png`;
      }
    }
  }, [mapbiomas?.enabled, mapbiomas?.year, mapRef]);

  // Push live INA station data into the map source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !inaGeoJSON) return;
    const apply = () => {
      const src = map.getSource('ina-stations');
      if (src) src.setData(inaGeoJSON);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [inaGeoJSON, mapRef]);

  // Keep refs in sync so click handlers always read latest fetched values
  useEffect(() => {
    inaStationsRef.current = inaStations ?? [];
  }, [inaStations]);

  useEffect(() => {
    floodGaugesRef.current = floodGauges ?? [];
  }, [floodGauges]);

  // Keep actMode and onActPick refs in sync
  useEffect(() => { actModeRef.current = actMode ?? false; }, [actMode]);
  useEffect(() => { onActPickRef.current = onActPick; }, [onActPick]);

  // Crosshair cursor when actMode is on
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    canvas.style.cursor = actMode ? 'crosshair' : '';
  }, [actMode, mapRef]);

  // Sync actPin to a drop-pin marker on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (actMarkerRef.current) {
      actMarkerRef.current.remove();
      actMarkerRef.current = null;
    }
    if (!actPin) return;
    const el = document.createElement('div');
    el.style.cssText = `
      width:18px;height:18px;border-radius:50%;
      background:#22c55e;border:2.5px solid #fff;
      box-shadow:0 0 0 3px rgba(34,197,94,0.4);
      pointer-events:none;
    `;
    actMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([parseFloat(actPin.lng), parseFloat(actPin.lat)])
      .addTo(map);
  }, [actPin, mapRef]);

  // Push community GeoJSON into the map source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !communityGeoJSON) return;
    const apply = () => {
      const src = map.getSource('community');
      if (src) src.setData(communityGeoJSON);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [communityGeoJSON, mapRef]);

  // Sync borders / place-label overlay visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const tog = (id, on) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
      };
      tog('overlay-country-border',  overlays.borders);
      tog('overlay-province-border', overlays.borders);
      tog('overlay-place-labels',    overlays.places);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [overlays, mapRef]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <MapLayerPanel overlays={overlays} onChange={handleOverlayChange} />
    </div>
  );
}
