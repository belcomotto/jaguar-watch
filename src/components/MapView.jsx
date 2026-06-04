import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GAUGES, STATUS_COLORS, STATUS_LABELS, toGeoJSON } from '../data/floodGauges';
import MapLayerPanel from './MapLayerPanel';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const GSW_BOUNDS = [-62.5, -25.7, -60.4, -24.0];

const GSW_LAYERS = {
  gsw_seasonality: '/data/gsw_seasonality.png',
  gsw_extent:      '/data/gsw_extent.png',
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

const FIRMS_CONF_COLOR = ['match', ['get', 'confidence'],
  'h', '#ff2200', 'high', '#ff2200',
  'n', '#ff8800', 'nominal', '#ff8800',
  '#ffcc00',
];

// ── Canvas-drawn map icons ────────────────────────────────────────────────────
// Drawn at 2× so they stay crisp on retina. pixelRatio:2 tells Mapbox the
// logical size is half the canvas size.

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

export default function MapView({ layers, mapRef, sentinel, months, firmsGeoJSON, mapbiomas, onIntroComplete }) {
  const containerRef = useRef(null);
  const onIntroCompleteRef = useRef(onIntroComplete);
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
      map.addImage('pump-icon',      pumpIcon('#63412F'),               { pixelRatio: 2 });

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
        // fade-duration 0  → instant swap, no blank frame between years
        // resampling nearest → crisp class boundaries (no bilinear blurring)
        paint: { 'raster-opacity': 0, 'raster-fade-duration': 0, 'raster-resampling': 'nearest' },
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

      map.on('click', 'pumps-icon', (e) => {
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
        const p = e.features[0].properties;
        const color = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
        const label = STATUS_LABELS[p.status] || 'Awaiting live data';
        const isPending = p.status === 'pending';
        new mapboxgl.Popup({ className: 'pump-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:'IM Fell Double Pica',serif;padding:8px 12px;min-width:210px">
            <p style="font-size:14px;color:#DED8CF;margin-bottom:2px"><strong>${p.river} River</strong></p>
            <p style="font-size:12px;color:#aaa;margin-bottom:10px">${p.location}, ${p.country}</p>
            <div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:8px">
              <p style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${color};margin-bottom:${isPending ? 6 : 8}px">● ${label}</p>
              ${isPending ? `
                <p style="font-size:11px;color:#555;line-height:1.5">Live status, gauge level, tendency and forecast will populate here once the Flood Hub API is connected.</p>
              ` : `
                <p style="font-size:12px;color:#DED8CF">Level: ${p.level} m</p>
                ${p.tendency    ? `<p style="font-size:11px;color:#aaa;margin-top:4px">Tendency: <strong style="color:#DED8CF">${p.tendency}</strong></p>` : ''}
                ${p.issuedTime  ? `<p style="font-size:11px;color:#aaa;margin-top:4px">Alert issued: ${p.issuedTime}</p>` : ''}
                ${p.forecastedPeak ? `<p style="font-size:11px;color:#aaa;margin-top:4px">Peak forecast: <strong style="color:#DED8CF">${p.forecastedPeak}</strong></p>` : ''}
              `}
              <p style="font-size:10px;color:#444;margin-top:8px;font-style:italic">GloFAS · Copernicus Emergency Management</p>
              ${p.mock ? `<p style="font-size:10px;color:#555;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);font-style:italic">⚠ Test gauge — mock data for demonstration purposes only</p>` : ''}
            </div>
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
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [layers]);

  // Load flood gauge data when layer is enabled
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers.floodGauges) return;
    const src = map.getSource('flood-gauges');
    if (!src) return;
    src.setData(toGeoJSON(GAUGES));
  }, [layers.floodGauges]);

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
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('mapbiomas');
    if (!src) return;

    if (!mapbiomas?.enabled) {
      map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0);
      return;
    }

    const year = mapbiomas.year;
    const url = `/data/mapbiomas/mapbiomas_${year}.png`;
    src.updateImage({ url, coordinates: MAPBIOMAS_COORDS });
    map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0.85);

    // Preload the next 3 and previous 1 years so browser cache is warm
    for (const y of [year + 1, year + 2, year + 3, year - 1]) {
      if (y >= 1985 && y <= 2023) {
        const img = new window.Image();
        img.src = `/data/mapbiomas/mapbiomas_${y}.png`;
      }
    }
  }, [mapbiomas?.enabled, mapbiomas?.year, mapRef]);

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
