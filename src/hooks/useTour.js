import { useCallback, useEffect, useRef, useState } from 'react';
import { GAUGES, toGeoJSON } from '../data/floodGauges';

const PUMP_SEQUENCE = [
  {
    coords: [-62.342466, -24.110932],
    title: 'Toma Fortín Belgrano',
    subtitle: 'Toma de pueblo · Chaco',
    body: 'Municipal water intake at Fortín Belgrano. No environmental impact assessment on record for the current extraction volume.',
  },
  {
    coords: [-62.226627, -24.136969],
    title: 'Toma Ing. Juárez',
    subtitle: 'Toma grande · Formosa',
    body: 'Large-scale extraction serving the town of Ingeniero Juárez. High-volume pumping with no documented flow compensation measure.',
  },
  {
    coords: [-62.139708, -24.221221],
    title: 'Toma Tartagal',
    subtitle: 'Toma de pueblo · Chaco',
    body: 'Community intake serving the settlement of Tartagal on the Bermejo\'s south bank.',
  },
  {
    coords: [-61.864300, -24.313128],
    title: 'Toma Tres Pozos',
    subtitle: 'Toma de pueblo · Chaco',
    body: 'Extraction point at Tres Pozos — one of several rural intakes in the mid-Bermejo corridor.',
  },
  {
    coords: [-61.687704, -24.367092],
    title: 'Toma Laguna Yema',
    subtitle: 'Toma grande · Formosa',
    body: 'High-volume extraction serving Laguna Yema. Located near the park\'s eastern buffer, raising cumulative extraction concerns.',
  },
  {
    coords: [-61.713700, -24.386666],
    title: 'Tomita',
    subtitle: 'Toma pequeña · Chaco',
    body: 'Unregistered small-scale pump. No permit or municipal association on record.',
  },
  {
    coords: [-61.701468, -24.407747],
    title: 'Extracción sin registro',
    subtitle: 'Toma pequeña · Chaco',
    body: 'Informal extraction point — part of a cluster of undocumented diversions in this reach.',
  },
  {
    coords: [-61.691121, -24.415603],
    title: 'Toma Sauzalito',
    subtitle: 'Toma de pueblo · Chaco',
    body: 'Municipal intake for Sauzalito — the main town on this stretch of the Bermejo within Chaco province.',
  },
  {
    coords: [-61.610063, -24.446073],
    title: 'Toma 2',
    subtitle: 'Toma pequeña · Chaco',
    body: 'Small unregistered pump identified during field verification. No operational records available.',
  },
  {
    coords: [-61.601205, -24.436692],
    title: 'Toma 3',
    subtitle: 'Toma pequeña · Chaco',
    body: 'Informal extraction point near the lower buffer zone reach.',
  },
  {
    coords: [-61.583446, -24.460207],
    title: 'Toma Sumayen',
    subtitle: 'Toma de pueblo · Chaco',
    body: 'Documented intake at the Indigenous community of Sumayen. Water access for subsistence, though extraction volumes are unmonitored.',
  },
  {
    coords: [-61.589357, -24.488601],
    title: 'Toma 5',
    subtitle: 'Toma pequeña · Chaco',
    body: 'Unregistered pump at the convergence of a secondary channel and the main Bermejo course.',
  },
  {
    coords: [-61.424589, -24.619062],
    title: 'Toma Wichí Pintado',
    subtitle: 'Toma de pueblo · Formosa',
    body: 'Easternmost documented extraction point, serving the Wichí community downstream from the park\'s eastern boundary.',
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

// ── Phase functions ────────────────────────────────────────────────────────
// Each phase is self-contained: resets relevant layers, sets overlay, animates.

async function phasePark({ go, ease, map, setOverlay }) {
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'pumps-dot','pumps-halo',
            'flood-halo','flood-dot',
            'firms-halo','firms-dot'], false);
  vis(map, ['park-fill','park-line','park-label'], true);
  setOverlay({
    id: 'park',
    title: 'El Impenetrable',
    subtitle: 'National Park',
    body: '508,000 hectares of dry Chaco forest — designated in 2020, one of Argentina\'s newest and largest protected areas.',
  });
  // Dive to ground level at park centre
  await go({
    center: [-61.09, -24.95],
    zoom: 15, pitch: 0, bearing: 0,
    duration: 2500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });
  // Pull back slowly to reveal the park polygon
  await ease({
    zoom: 8.5, pitch: 42, bearing: 20,
    duration: 7000,
    easing: t => t,
  });
}

async function phaseBuffer({ go, ease, map, setOverlay }) {
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label'], true);
  vis(map, ['pumps-dot','pumps-halo',
            'flood-halo','flood-dot',
            'firms-halo','firms-dot'], false);
  setOverlay({
    id: 'buffer',
    title: 'Buffer Zone',
    subtitle: 'Monitoring Corridor',
    body: 'The expanded perimeter covers the areas where deforestation pressure and agricultural encroachment are most acute.',
  });
  await go({
    center: [-60.9, -24.6],
    zoom: 7.8, pitch: 40, bearing: 0,
    duration: 3500,
    easing: t => 1 - Math.pow(1 - t, 3),
  });
  // CW 360° via 3×120° arcs (avoids the ambiguous ±180° flip)
  await ease({ bearing: 120,  duration: 5000, easing: t => t });
  await ease({ bearing: 240,  duration: 5000, easing: t => t });
  await ease({ bearing: 360,  duration: 5000, easing: t => t });
}

// Full Gran Chaco raster corners (EPSG:4326) — matches the generated PNG extent
const MB_COORDS = [
  [-67.72560623728215, -17.536012661297182],
  [-55.75654322320206, -17.536012661297182],
  [-55.75654322320206, -33.87358290205051 ],
  [-67.72560623728215, -33.87358290205051 ],
];

async function phaseMapbiomas({ go, pause, map, setOverlay }) {
  // Turn off all vector layers; park stays on for reference
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'pumps-dot','pumps-halo',
            'flood-halo','flood-dot',
            'firms-halo','firms-dot'], false);
  vis(map, ['park-fill','park-line','park-label'], true);

  // Turn off any leftover mapbiomas visibility from a previous run
  if (map.getLayer('mapbiomas-layer'))
    map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0);

  // Pull back to a Gran Chaco overview centred on the park
  await go({
    center: [-62.5, -26.0],
    zoom: 5.5, pitch: 0, bearing: 0,
    duration: 4000,
    easing: t => 1 - Math.pow(1 - t, 3),
  });

  // Show 1985 baseline and set overlay
  const src = map.getSource('mapbiomas');
  if (src) {
    src.updateImage({ url: '/data/mapbiomas/mapbiomas_1985.png', coordinates: MB_COORDS });
    map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0.85);
  }
  setOverlay({
    id: 'mapbiomas',
    title: 'The Agricultural Frontier',
    subtitle: '1985–2023 · MapBiomas Gran Chaco',
    body: 'Thirty-eight years of land-cover transformation across the Gran Chaco. The agricultural frontier has advanced aggressively from every direction — compressing the habitat available for jaguars, giant anteaters, and the communities who depend on it. El Impenetrable has become an ecological oasis: a last refuge in a landscape under siege, where logging of key species and poaching are high-probability occurrences at its margins.',
  });

  await pause(2500); // let first frame settle

  // Animate 1985 → 2023 at 500 ms/frame
  for (let year = 1985; year <= 2023; year++) {
    const s = map.getSource('mapbiomas');
    if (s) s.updateImage({ url: `/data/mapbiomas/mapbiomas_${year}.png`, coordinates: MB_COORDS });
    await pause(500);
  }

  await pause(2000); // hold on 2023

  // Fade out before transitioning to next phase
  if (map.getLayer('mapbiomas-layer'))
    map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0);
}

async function phaseRiver({ go, ease, map, setOverlay }) {
  // Ensure mapbiomas is off (in case we jumped here via Back)
  if (map.getLayer('mapbiomas-layer'))
    map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0);
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'pumps-dot','pumps-halo',
            'flood-halo','flood-dot',
            'firms-halo','firms-dot'], false);
  setOverlay({
    id: 'river',
    title: 'The Bermejo River',
    subtitle: null,
    body: '1,200 km of shifting meanders — flying west from the buffer\'s eastern edge to the first extraction point at Fortín Belgrano.',
  });
  // Drone flight west along the river (bearing ~285–290° = WNW)
  await go({
    center: [-61.25, -24.52],
    zoom: 11.5, pitch: 65, bearing: 290,
    duration: 5000,
    easing: t => 1 - Math.pow(1 - t, 4),
  });
  await ease({ center: [-61.75, -24.40], bearing: 288, zoom: 11.5, pitch: 67, duration: 5000, easing: t => t });
  await ease({ center: [-62.05, -24.25], bearing: 285, zoom: 11.5, pitch: 68, duration: 5000, easing: t => t });
  await ease({ center: [-62.34, -24.11], bearing: 280, zoom: 12.0, pitch: 68, duration: 4000, easing: t => t });
  // 180° turn — now facing east, ready to tour pumps west → east
  await ease({ bearing: 100, zoom: 13.5, pitch: 72, duration: 3500, easing: t => 1 - Math.pow(1 - t, 3) });
}

async function phasePumps({ go, pause, map, setOverlay, setLitPumps }) {
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'flood-halo','flood-dot',
            'firms-halo','firms-dot'], false);
  vis(map, ['pumps-dot','pumps-halo'], true);
  setLitPumps([]);
  setOverlay({
    id: 'pumps-intro',
    title: 'Illegal Extraction Sites',
    subtitle: null,
    body: '13 unauthorised pump operations documented along the Bermejo — extracting water for agriculture beyond the park\'s eastern boundary.',
  });
  await pause(2500);

  const lit = [];
  for (let i = 0; i < PUMP_SEQUENCE.length; i++) {
    const pump = PUMP_SEQUENCE[i];
    const [lng, lat] = pump.coords;
    await go({
      center: [lng, lat],
      zoom: 13.5, pitch: 70,
      bearing: (map.getBearing() + 30) % 360,
      duration: 2800,
      easing: t => 1 - Math.pow(1 - t, 3),
    });
    lit.push(pump);
    setLitPumps([...lit]);
    setOverlay({ id: `pump-${i}`, ...pump });
    await pause(SHORT_PAUSE_INDICES.has(i) ? 1750 : 3500);
  }
}

async function phaseGauges({ go, pause, map, setOverlay, setLitPumps }) {
  vis(map, ['pumps-dot','pumps-halo',
            'buffer-fill','buffer-line','buffer-label',
            'firms-halo','firms-dot'], false);
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

  const gaugeSrc = map.getSource('flood-gauges');
  if (gaugeSrc) gaugeSrc.setData(toGeoJSON(GAUGES));
  vis(map, ['flood-halo','flood-dot'], true);
  setOverlay({
    id: 'gauges',
    title: 'Flood Monitoring',
    subtitle: 'GloFAS · Copernicus Emergency Management',
    body: 'River level stations across the Bermejo–Paraná basin, monitored in near real-time by the Global Flood Awareness System. The Bermejo\'s sediment load makes it one of South America\'s most flood-prone corridors.',
  });
  await pause(5500);
}

async function phaseFires({ pause, map, setOverlay, firmsStatsRef }) {
  vis(map, ['firms-halo','firms-dot'], true);
  setOverlay({
    id: 'fires',
    title: 'Active Fire Alerts',
    subtitle: 'NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21',
    body: 'Near real-time thermal anomalies updated every ~3 hours. Many fires in the Chaco are intentional — burning pasture to expand the agricultural frontier into protected areas.',
    stats: firmsStatsRef.current,
  });
  await pause(5500);
}

const PHASES = [phasePark, phaseBuffer, phaseMapbiomas, phaseRiver, phasePumps, phaseGauges, phaseFires];

// ── Hook ──────────────────────────────────────────────────────────────────

export function useTour(mapRef, { onComplete, firmsStats } = {}) {
  const [overlay, setOverlay] = useState(null);
  const [touring, setTouring] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const cancelled = useRef(false);
  const phaseRef = useRef(0);
  const goingBackTarget = useRef(-1);
  const onCompleteRef = useRef(onComplete);
  const firmsStatsRef = useRef(firmsStats);

  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { firmsStatsRef.current = firmsStats; });

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
    setTouring(true);
    setCanGoBack(startPhase > 0);

    // Reset transient direct-manipulation layers so each phase starts clean
    if (map.getLayer('mapbiomas-layer'))
      map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0);

    // Build animation helpers that read cancelled on every tick
    const go = (opts) => new Promise((resolve, reject) => {
      if (cancelled.current) { reject(new Error('cancelled')); return; }
      map.flyTo(opts);
      map.once('moveend', () => {
        if (cancelled.current) reject(new Error('cancelled'));
        else resolve();
      });
    });

    const ease = (opts) => new Promise((resolve, reject) => {
      if (cancelled.current) { reject(new Error('cancelled')); return; }
      map.easeTo(opts);
      map.once('moveend', () => {
        if (cancelled.current) reject(new Error('cancelled'));
        else resolve();
      });
    });

    // Poll every 100ms so cancellation takes effect quickly even during long pauses
    const pause = (ms) => new Promise((resolve, reject) => {
      if (cancelled.current) { reject(new Error('cancelled')); return; }
      const end = Date.now() + ms;
      const tick = () => {
        if (cancelled.current) { reject(new Error('cancelled')); return; }
        const rem = end - Date.now();
        if (rem <= 0) { resolve(); return; }
        setTimeout(tick, Math.min(rem, 100));
      };
      setTimeout(tick, Math.min(ms, 100));
    });

    const ctx = { go, ease, pause, map, setOverlay, setLitPumps, firmsStatsRef };

    let completing = true;
    try {
      for (let i = startPhase; i < PHASES.length; i++) {
        phaseRef.current = i;
        setCanGoBack(i > 0);
        await PHASES[i](ctx);
      }
    } catch (e) {
      if (e.message !== 'cancelled') throw e;
      completing = false;
    }

    setOverlay(null);
    setLitPumps([]);

    const goBackTo = goingBackTarget.current;
    goingBackTarget.current = -1;

    if (completing) {
      setTouring(false);
      setCanGoBack(false);
      onCompleteRef.current?.();
    } else if (goBackTo >= 0) {
      // Re-enter from the previous phase (tail-call, no setTimeout needed)
      runFromPhase(goBackTo);
    } else {
      // Skip / stopTour
      setTouring(false);
      setCanGoBack(false);
    }
  }, [mapRef, setLitPumps]);

  const startTour = useCallback(() => runFromPhase(0), [runFromPhase]);

  const goBack = useCallback(() => {
    const prev = phaseRef.current - 1;
    if (prev < 0) return;
    goingBackTarget.current = prev;
    cancelled.current = true;
    mapRef.current?.stop(); // triggers moveend immediately if an animation is running
  }, [mapRef]);

  const stopTour = useCallback(() => {
    goingBackTarget.current = -1;
    cancelled.current = true;
    mapRef.current?.stop();
    setOverlay(null);
    setTouring(false);
    setCanGoBack(false);
    setLitPumps([]);
  }, [setLitPumps, mapRef]);

  return { overlay, touring, startTour, stopTour, goBack, canGoBack };
}
