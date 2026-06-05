import { useCallback, useEffect, useRef, useState } from 'react';
import { GAUGES, toGeoJSON } from '../data/floodGauges';

const PUMP_SEQUENCE = [
  {
    coords: [-62.342466, -24.110932],
    title: 'Pump Fortín Belgrano',
    subtitle: 'Town pump · Chaco',
    body: 'The first intake we reach. Fortín Belgrano\'s municipal supply draws from the river — with no environmental assessment on file for how much it now takes.',
  },
  {
    coords: [-62.226627, -24.136969],
    title: 'Pump Ing. Juárez',
    subtitle: 'Big pump · Formosa',
    body: 'A large-scale draw for the town of Ingeniero Juárez — high-volume pumping, with nothing on record to offset the flow it removes.',
  },
  {
    coords: [-62.139708, -24.221221],
    title: 'Pump Tartagal',
    subtitle: 'Town pump · Chaco',
    body: 'A community intake for Tartagal, set on the river\'s south bank.',
  },
  {
    coords: [-61.864300, -24.313128],
    title: 'Pump Tres Pozos',
    subtitle: 'Town pump · Chaco',
    body: 'Tres Pozos — one of a string of rural intakes threaded along the river\'s middle reach.',
  },
  {
    coords: [-61.687704, -24.367092],
    title: 'Pump Laguna Yema',
    subtitle: 'Big pump · Formosa',
    body: 'A high-volume draw serving Laguna Yema, pressed against the park\'s buffer. As pasture and cropland spread here, the extractions stack up.',
  },
  {
    coords: [-61.713700, -24.386666],
    title: 'Small Pump',
    subtitle: 'Small pump · Chaco',
    body: 'An unregistered pump. No permit, no record of who runs it.',
  },
  {
    coords: [-61.701468, -24.407747],
    title: 'Non-registered extraction',
    subtitle: 'Small pump · Chaco',
    body: 'An informal draw — one of a cluster of undocumented diversions crowded into this bend.',
  },
  {
    coords: [-61.691121, -24.415603],
    title: 'Pump Sauzalito',
    subtitle: 'Town pump · Chaco',
    body: 'Sauzalito\'s municipal intake — the largest town on this Chaco stretch of the river.',
  },
  {
    coords: [-61.610063, -24.446073],
    title: 'Pump 2',
    subtitle: 'Small pump · Chaco',
    body: 'An unregistered pump, found only by field survey. No records exist.',
  },
  {
    coords: [-61.601205, -24.436692],
    title: 'Pump 3',
    subtitle: 'Small pump · Chaco',
    body: 'Another informal draw, low on the buffer\'s reach.',
  },
  {
    coords: [-61.583446, -24.460207],
    title: 'Pump Sumayen',
    subtitle: 'Town pump · Chaco',
    body: 'Subsistence water for the Indigenous community of Sumayen — drawn, but unmeasured.',
  },
  {
    coords: [-61.589357, -24.488601],
    title: 'Pump 5',
    subtitle: 'Small pump · Chaco',
    body: 'An unregistered pump where a side channel rejoins the main river.',
  },
  {
    coords: [-61.424589, -24.619062],
    title: 'Pump Wichí Pintado',
    subtitle: 'Town pump · Formosa',
    body: 'The farthest intake east: water for the Wichí community, downstream of the park.',
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

// ── Phase functions ────────────────────────────────────────────────────────
// Each phase is self-contained: resets relevant layers, sets overlay, animates.

async function phasePark({ go, ease, map, setOverlay }) {
  vis(map, ['buffer-fill','buffer-line','buffer-label',
            'pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'firms-halo','firms-icon'], false);
  gswReset(map, 'gsw_seasonality-layer');
  gswReset(map, 'gsw_transitions-layer');
  vis(map, ['park-fill','park-line','park-label'], true);
  setOverlay({
    id: 'park',
    title: 'El Impenetrable',
    subtitle: 'National Park',
    body: ' Here, 128,000 hectares of dry Chaco forest stretch to the horizon — knotted quebracho, palo santo and algarrobo so dense and thorny they gave this land its name: the Impenetrable. Protected by national law in 2014, it waited until 2017 for the first rangers to set foot inside. Ancient wilderness — only newly defended.',
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
  vis(map, ['pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'firms-halo','firms-icon'], false);
  setOverlay({
    id: 'buffer',
    title: 'Buffer Zone',
    subtitle: 'Monitoring Corridor',
    body: 'Beyond the park\'s edge lies its cushion. Developing a Buffer Area alongside local communities is what could help to mitigate the pressure from outside, giving the wildlife that shelters in the park room to roam, breed and move safely. ',
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
            'pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'firms-halo','firms-icon'], false);
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
    body: 'Watch four decades collapse into seconds. In pink, the cropland; in yellow, the pasture — together,the agricultural frontier, closing in from every side between 1985 and 2023. As it advances, the Gran Chaco fractures into ever-smaller fragments, and El Impenetrable is left as the last oasis of dry forest still whole enough to shelter its wildlife. This is why it needs protecting: attacked on every front, it has become the final refuge in a landscape being pulled apart.',
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

async function phaseRiver({ go, ease, pause, map, setOverlay }) {
  // Ensure mapbiomas and GSW layers are off (in case we jumped here via Back)
  if (map.getLayer('mapbiomas-layer'))
    map.setPaintProperty('mapbiomas-layer', 'raster-opacity', 0);
  gswReset(map, 'gsw_seasonality-layer');
  gswReset(map, 'gsw_transitions-layer');
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'pumps-icon','pumps-halo',
            'flood-halo','flood-icon',
            'firms-halo','firms-icon'], false);

  // ── Diagonal flight + first straight — Bermejo intro (no filters) ────────
  setOverlay({
    id: 'river',
    title: 'The Bermejo River',
    subtitle: null,
    body: 'The Bermejo — known here by its older name, the Teuco — winds more than 1,000 km of restless, shifting channels along the park\'s northern edge. We follow it upstream, west, to the first place where its water is being drawn.',
  });
  await go({
    center: [-61.25, -24.52],
    zoom: 11.5, pitch: 65, bearing: 290,
    duration: 5000,
    easing: t => 1 - Math.pow(1 - t, 4),
  });
  // First straight segment — still no filter, let the Bermejo text land
  await ease({ center: [-61.75, -24.40], bearing: 288, zoom: 11.5, pitch: 67, duration: 10000, easing: t => t });

  // ── Water Seasonality ────────────────────────────────────────────────────
  await gswFadeIn(pause, map, 'gsw_seasonality-layer');
  setOverlay({
    id: 'river-seasonality',
    title: 'Water Seasonality',
    subtitle: '1984–2021 · Global Surface Water',
    body: 'Water seasonality shows how many months per year surface water was present, averaged from 1984 to 2021. Light blue corresponds to 1 month per year, showing us the changing nature of the Bermejo.',
  });
  await ease({ center: [-62.05, -24.25], bearing: 285, zoom: 11.5, pitch: 68, duration: 10000, easing: t => t });

  // ── Water Transitions ────────────────────────────────────────────────────
  await gswFadeOut(pause, map, 'gsw_seasonality-layer');
  await gswFadeIn(pause, map, 'gsw_transitions-layer');
  setOverlay({
    id: 'river-transitions',
    title: 'Water Transitions',
    subtitle: '1984–2021 · Global Surface Water',
    body: 'The Bermejo river is alive, it pulses with every season. Light green, fuchsia and grey colors correspond to "New seasonal", "Lost seasonal" and "Ephemeral seasonal" correspondingly — showing us how each season creates new paths for life.',
  });
  await ease({ center: [-62.34, -24.11], bearing: 280, zoom: 12.0, pitch: 68, duration: 8000, easing: t => t });

  // Fade out before turning to face pumps
  await gswFadeOut(pause, map, 'gsw_transitions-layer');

  // 180° turn — now facing east, ready to tour pumps west → east
  await ease({ bearing: 100, zoom: 13.5, pitch: 72, duration: 3500, easing: t => 1 - Math.pow(1 - t, 3) });
}

async function phasePumps({ go, pause, map, setOverlay, setLitPumps }) {
  vis(map, ['park-fill','park-line','park-label',
            'buffer-fill','buffer-line','buffer-label',
            'flood-halo','flood-icon',
            'firms-halo','firms-icon'], false);
  gswReset(map, 'gsw_seasonality-layer');
  gswReset(map, 'gsw_transitions-layer');
  vis(map, ['pumps-icon','pumps-halo'], true);
  vis(map, ['overlay-place-labels'], true);
  setLitPumps([]);
  setOverlay({
    id: 'pumps-intro',
    title: 'Illegal Extraction Sites',
    subtitle: null,
    body: 'Thirteen points along the river draw its water — some are registered town and community supplies,others are unregistered pumps feeding cattle pasture and crops. Together they tap the same artery the park and its biodiversity depend on, with little or no monitoring of how much is taken — or what it leaves behind.',
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
  vis(map, ['pumps-icon','pumps-halo',
            'buffer-fill','buffer-line','buffer-label',
            'firms-halo','firms-icon',
            'overlay-place-labels'], false);
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
  vis(map, ['flood-halo','flood-icon'], true);
  setOverlay({
    id: 'gauges',
    title: 'Flood Monitoring',
    subtitle: 'GloFAS · Copernicus Emergency Management',
    body: 'The river is restless. These stations track its rising and falling across the Bermejo–Paraná basin, watched in near real-time from orbit. Carrying one of the heaviest sediment loads on the continent,the Bermejo floods hard and often — remaking its own course as it goes.',
  });
  await pause(5500);
}

async function phaseFires({ pause, map, setOverlay, firmsStatsRef }) {
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
  const runFromPhaseRef = useRef(null);

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
      runFromPhaseRef.current(goBackTo);
    } else {
      // Skip / stopTour
      setTouring(false);
      setCanGoBack(false);
    }
  }, [mapRef, setLitPumps]);

  useEffect(() => { runFromPhaseRef.current = runFromPhase; }, [runFromPhase]);

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
