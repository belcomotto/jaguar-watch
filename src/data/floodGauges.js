// Key river gauge stations in the Bermejo – Paraná basin.
// Coordinates and station names are real. Status is set to 'pending' until the
// Google Flood Hub API key is connected — at that point replace GAUGES with a
// live fetch and map floodStatus.severity to the status keys below.
//
// ── UPGRADE PATH ──────────────────────────────────────────────────────────────
// const res = await fetch(
//   `https://floodhub.googleapis.com/v1/gauges?key=${API_KEY}`,
//   { headers: { 'X-Goog-FieldMask': 'gaugeId,riverName,siteName,latLng,floodStatus' } }
// );
// floodStatus fields available: severity, tendency, issuedTime, forecastedPeakTime
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_COLORS = {
  warning:  '#dc2626',
  watch:    '#ea580c',
  advisory: '#d97706',
  normal:   '#16a34a',
  pending:  '#6b7280',
};

export const STATUS_LABELS = {
  warning:  'Flood Warning',
  watch:    'Flood Watch',
  advisory: 'Advisory',
  normal:   'Normal',
  pending:  'Awaiting live data',
};

export const GAUGES = [
  // ── Bermejo River (headwaters → confluence) ────────────────────────────────
  {
    id: 'bermejo-aguas-blancas',
    river: 'Bermejo', location: 'Aguas Blancas', country: 'ARG / BOL',
    coordinates: [-64.38, -22.74],
    status: 'pending',
  },
  {
    id: 'bermejo-oran',
    river: 'Bermejo', location: 'Orán', country: 'Argentina',
    coordinates: [-64.33, -23.13],
    status: 'pending',
  },
  {
    id: 'bermejo-embarcacion',
    river: 'Bermejo', location: 'Embarcación', country: 'Argentina',
    coordinates: [-64.10, -23.22],
    status: 'pending',
  },
  {
    id: 'bermejo-los-blancos',
    river: 'Bermejo', location: 'Los Blancos', country: 'Argentina',
    coordinates: [-62.60, -23.62],
    status: 'pending',
  },
  {
    id: 'bermejo-castelli',
    river: 'Bermejo', location: 'Juan José Castelli', country: 'Argentina',
    coordinates: [-60.95, -25.93],
    status: 'pending',
  },
  // ── DEMO GAUGE — mock data showing full popup layout ──────────────────────
  {
    id: 'bermejo-impenetrable-demo',
    river: 'Bermejo', location: 'El Impenetrable (demo)', country: 'Argentina',
    coordinates: [-61.52, -24.78],
    status: 'watch',
    level: 4.8,
    tendency: 'Rising',
    issuedTime: 'May 14, 2026 · 06:00 UTC',
    forecastedPeak: 'May 17, 2026 · ~18:00 UTC',
    mock: true,
  },
  // ── Pilcomayo River ────────────────────────────────────────────────────────
  {
    id: 'pilcomayo-mision',
    river: 'Pilcomayo', location: 'Misión La Paz', country: 'Argentina',
    coordinates: [-60.47, -22.44],
    status: 'pending',
  },
  // ── Paraguay River ─────────────────────────────────────────────────────────
  {
    id: 'paraguay-formosa',
    river: 'Paraguay', location: 'Formosa', country: 'Argentina',
    coordinates: [-58.18, -26.19],
    status: 'pending',
  },
  // ── Paraná River ───────────────────────────────────────────────────────────
  {
    id: 'parana-resistencia',
    river: 'Paraná', location: 'Resistencia', country: 'Argentina',
    coordinates: [-59.02, -27.46],
    status: 'pending',
  },
  {
    id: 'parana-corrientes',
    river: 'Paraná', location: 'Corrientes', country: 'Argentina',
    coordinates: [-58.83, -27.47],
    status: 'pending',
  },
  {
    id: 'parana-posadas',
    river: 'Paraná', location: 'Posadas', country: 'Argentina',
    coordinates: [-55.89, -27.37],
    status: 'pending',
  },
];

export function toGeoJSON(gauges) {
  return {
    type: 'FeatureCollection',
    features: gauges.map(({ coordinates, ...props }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: props,
    })),
  };
}
