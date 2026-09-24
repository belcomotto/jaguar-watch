// MADES Paraguay — SIAguaPY telemetric station definitions
// Source: https://siaguapy.mades.gov.py/monitoreo-cuencas-y-acuiferos/mapa
// Coordinates in [lon, lat] (GeoJSON convention — note: user supplied lat,lon).
// Status and level are populated live by useMadesGaugeData hook.

export const MADES_COLOR = '#10b981'; // emerald — distinct from INA blue/orange

export const MADES_TYPE_LABEL = {
  en: 'River Level Gauge — MADES Paraguay',
  es: 'Estación de nivel — MADES Paraguay',
};

export const MADES_STATIONS = [
  // ── Pilcomayo ───────────────────────────────────────────────────────────
  {
    id: 'mades-villa-montes',
    siteId: 45,
    name: 'Pilcomayo – Villa Montes',
    river: 'Pilcomayo',
    country: 'BO',
    coordinates: [-63.5034, -21.2609],
    status: 'pending',
  },
  {
    id: 'mades-mision-la-paz',
    siteId: 44,
    name: 'Pilcomayo – Misión La Paz CTN',
    river: 'Pilcomayo',
    country: 'AR',
    coordinates: [-62.5186, -22.3782],
    status: 'pending',
  },
  {
    id: 'mades-pozo-hondo',
    siteId: 29,
    name: 'Pilcomayo – Pozo Hondo',
    river: 'Pilcomayo',
    country: 'AR',
    coordinates: [-62.5185, -22.4778],
    status: 'pending',
  },

  // ── Río Paraguay ────────────────────────────────────────────────────────
  {
    id: 'mades-puerto-ladario',
    siteId: 1,
    name: 'Paraguay – Puerto Ladario',
    river: 'Paraguay',
    country: 'BR',
    coordinates: [-57.6019, -19.0050],
    status: 'pending',
  },
  {
    id: 'mades-bahia-negra',
    siteId: 6,
    name: 'Paraguay – Bahía Negra',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-58.3000, -20.2270],
    status: 'pending',
  },
  {
    id: 'mades-fuerte-olimpo',
    siteId: 5,
    name: 'Paraguay – Fuerte Olimpo',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-57.8708, -21.0375],
    status: 'pending',
  },
  {
    id: 'mades-isla-margarita',
    siteId: 4,
    name: 'Paraguay – Isla Margarita',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-57.9727, -21.6246],
    status: 'pending',
  },
  {
    id: 'mades-vallemi',
    siteId: 7,
    name: 'Paraguay – Vallemí',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-58.0461, -22.1347],
    status: 'pending',
  },
  {
    id: 'mades-concepcion',
    siteId: 8,
    name: 'Paraguay – Concepción',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-57.4300, -23.4400],
    status: 'pending',
  },
  {
    id: 'mades-puerto-antequera',
    siteId: 10,
    name: 'Paraguay – Puerto Antequera',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-57.1700, -24.1000],
    status: 'pending',
  },
  {
    id: 'mades-rosario',
    siteId: 9,
    name: 'Paraguay – Rosario',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-57.1659, -24.4278],
    status: 'pending',
  },
  {
    id: 'mades-villeta',
    siteId: 11,
    name: 'Paraguay – Villeta',
    river: 'Paraguay',
    country: 'PY',
    coordinates: [-57.5752, -25.5067],
    status: 'pending',
  },

  // ── Paraná ──────────────────────────────────────────────────────────────
  {
    id: 'mades-salto-guaira',
    siteId: 18,
    name: 'Paraná – Salto del Guairá',
    river: 'Paraná',
    country: 'PY',
    coordinates: [-54.3530, -24.0320],
    status: 'pending',
  },
  {
    id: 'mades-ciudad-del-este',
    siteId: 19,
    name: 'Paraná – Ciudad del Este',
    river: 'Paraná',
    country: 'PY',
    coordinates: [-54.6120, -25.5190],
    status: 'pending',
  },
];

export function toGeoJSON(stations) {
  return {
    type: 'FeatureCollection',
    features: stations.map(({ coordinates, ...props }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: props,
    })),
  };
}
