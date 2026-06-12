// River gauge stations in the Bermejo – Paraná basin.
// Coordinates are snapped to confirmed GloFAS v4 0.05° grid pixels on the main river channel.
// Status, discharge, and tendency are populated live by useFloodData hook.
// Values are MODELLED (GloFAS simulation), not physical gauge readings.

export const STATUS_COLORS = {
  warning:  '#dc2626',
  watch:    '#ea580c',
  advisory: '#d97706',
  normal:   '#16a34a',
  pending:  '#6b7280',
};

// Labels are intentionally softer than official agency terminology —
// these thresholds are model-based ratios against a statistical baseline,
// not authoritative flood warnings.
export const STATUS_LABELS = {
  warning:  'Very High vs Baseline',
  watch:    'High vs Baseline',
  advisory: 'Elevated vs Baseline',
  normal:   'Near Baseline',
  pending:  'Awaiting model data',
};

// How well the GloFAS v4 0.05° grid cell represents the actual river at each point.
// Braided, sediment-laden, or partly regulated rivers score poorly.
export const GRID_MATCH_COLOR = {
  good:     '#16a34a',
  moderate: '#d97706',
  poor:     '#dc2626',
};

export const GRID_MATCH_LABEL = {
  good:     'Model confidence: high',
  moderate: 'Model confidence: moderate',
  poor:     'Model confidence: low — braided / regulated river',
};

export const GAUGES = [
  // ── Bermejo / Teuco River ──────────────────────────────────────────────────
  {
    id: 'bermejo-park',
    river: 'Bermejo/Teuco',
    location: 'Park Boundary',
    country: 'Argentina',
    coordinates: [-62.43, -24.08],
    gridMatch: 'moderate',
    status: 'pending',
  },
  {
    id: 'bermejo-lower',
    river: 'Bermejo',
    location: 'Lower Chaco',
    country: 'Argentina',
    coordinates: [-60.03, -25.73],
    gridMatch: 'good',
    status: 'pending',
  },
  {
    id: 'bermejo-confluence',
    river: 'Bermejo',
    location: 'Paraguay Confluence',
    country: 'Argentina',
    coordinates: [-58.83, -26.53],
    gridMatch: 'good',
    status: 'pending',
  },
  // ── Pilcomayo River ───────────────────────────────────────────────────────
  {
    id: 'pilcomayo-laguna-yema',
    river: 'Pilcomayo',
    location: 'Laguna Yema area',
    country: 'Argentina',
    coordinates: [-59.12, -23.72],
    gridMatch: 'poor',
    status: 'pending',
  },
  // ── Paraguay River ────────────────────────────────────────────────────────
  {
    id: 'paraguay-formosa',
    river: 'Paraguay',
    location: 'Formosa',
    country: 'Argentina',
    coordinates: [-58.18, -26.19],
    gridMatch: 'good',
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
