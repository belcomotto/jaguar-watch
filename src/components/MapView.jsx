import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GAUGES, STATUS_COLORS, STATUS_LABELS, toGeoJSON } from '../data/floodGauges';

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

export default function MapView({ layers, mapRef, sentinel, months }) {
  const containerRef = useRef(null);

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
      // Atmospheric globe effect — space → blue horizon → terrain haze
      map.setFog({
        color:           'rgb(210, 220, 230)',
        'high-color':    'rgb(30, 80, 200)',
        'horizon-blend': 0.03,
        'space-color':   'rgb(8, 8, 22)',
        'star-intensity': 0.5,
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

      // ── Park boundary — white solid ───────────────────────────────────────
      map.addSource('park', { type: 'geojson', data: '/data/park_boundary.geojson' });
      map.addLayer({ id: 'park-fill', type: 'fill', source: 'park',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.08 } });
      map.addLayer({ id: 'park-line', type: 'line', source: 'park',
        paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-opacity': 0.9 } });

      // ── Buffer — white dashed ─────────────────────────────────────────────
      map.addSource('buffer', { type: 'geojson', data: '/data/buffer_area.geojson' });
      map.addLayer({ id: 'buffer-fill', type: 'fill', source: 'buffer',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.04 } });
      map.addLayer({ id: 'buffer-line', type: 'line', source: 'buffer',
        paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.7,
                 'line-dasharray': [5, 4] } });

      // ── Pump points ───────────────────────────────────────────────────────
      map.addSource('pumps', { type: 'geojson', data: '/data/pump_points.geojson' });
      map.addLayer({ id: 'pumps-halo', type: 'circle', source: 'pumps',
        paint: { 'circle-radius': 16, 'circle-color': '#63412F',
                 'circle-opacity': 0.22, 'circle-stroke-width': 0 } });
      map.addLayer({ id: 'pumps-dot', type: 'circle', source: 'pumps',
        paint: { 'circle-radius': 6, 'circle-color': '#63412F', 'circle-opacity': 1,
                 'circle-stroke-width': 1.5, 'circle-stroke-color': '#DED8CF' } });

      map.on('click', 'pumps-dot', (e) => {
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
      map.on('mouseenter', 'pumps-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'pumps-dot', () => { map.getCanvas().style.cursor = ''; });

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
        id: 'flood-dot',
        type: 'circle',
        source: 'flood-gauges',
        paint: {
          'circle-radius': 6,
          'circle-color': ['match', ['get', 'status'],
            'warning', STATUS_COLORS.warning,
            'watch',   STATUS_COLORS.watch,
            'advisory',STATUS_COLORS.advisory,
            STATUS_COLORS.normal,
          ],
          'circle-opacity': 1,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#DED8CF',
        },
        layout: { visibility: 'none' },
      });
      map.on('click', 'flood-dot', (e) => {
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
      map.on('mouseenter', 'flood-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'flood-dot', () => { map.getCanvas().style.cursor = ''; });

      // ── Globe intro dive ──────────────────────────────────────────────────
      if (skipIntro) {
        map.setMinZoom(6);
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
  }, []);

  // Sync GSW / park / pump layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const toggle = (id, vis) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
    };
    toggle('park-fill', layers.park);
    toggle('park-line', layers.park);
    toggle('park-label', layers.park);
    toggle('buffer-fill', layers.buffer);
    toggle('buffer-line', layers.buffer);
    toggle('buffer-label', layers.buffer);
    toggle('pumps-dot', layers.pumps);
    toggle('pumps-halo', layers.pumps);
    for (const id of Object.keys(GSW_LAYERS)) toggle(`${id}-layer`, layers[id]);
    toggle('flood-halo', layers.floodGauges);
    toggle('flood-dot',  layers.floodGauges);
  }, [layers]);

  // Load flood gauge data when layer is enabled
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers.floodGauges) return;
    const src = map.getSource('flood-gauges');
    if (!src) return;
    src.setData(toGeoJSON(GAUGES));
  }, [layers.floodGauges]);

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

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
