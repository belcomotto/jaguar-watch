// INA sSIyAH telemetric station definitions — fixed set, verified against the API.
// Coordinates in [lon, lat] (GeoJSON convention).
// Status, level, and anomaly are populated live by useInaGaugeData hook.

export const INA_TYPE_COLOR = {
  river_level:             '#4db8ff',
  meteo:                   '#f0a500',
  discharge_gauge_offline: '#6b7280',
};

export const INA_TYPE_LABEL = {
  river_level:             'River Level Gauge — Active',
  meteo:                   'Meteorological Station',
  discharge_gauge_offline: 'Discharge Gauge — Offline',
};

export const INA_STATIONS = [
  {
    id: 'ina-aguas-blancas',
    siteCode: 6548,
    name: 'Bermejo – Aguas Blancas',
    river: 'Bermejo',
    coordinates: [-64.387, -22.729],
    type: 'river_level',
    distanceFromPark: 450,
    position: 'far_upstream',
    varIdLevel: 2,
    varIdDaily: 2,
    status: 'pending',
  },
  {
    id: 'ina-embarcacion',
    siteCode: 2189,
    name: 'Bermejo – Embarcación',
    river: 'Bermejo',
    coordinates: [-64.082, -23.218],
    type: 'river_level',
    distanceFromPark: 310,
    position: 'upstream',
    varIdLevel: 2,
    varIdDaily: 2,
    status: 'pending',
  },
  {
    id: 'ina-pozo-sarmiento',
    siteCode: 2154,
    name: 'Bermejo – Pozo Sarmiento',
    river: 'Bermejo',
    coordinates: [-64.197, -23.141],
    type: 'discharge_gauge_offline',
    distanceFromPark: 350,
    position: 'far_upstream',
    varIdDischarge: 4,
    varIdLevel: 2,
    status: 'pending',
  },
  {
    id: 'ina-puerto-velaz',
    siteCode: 2194,
    name: 'Bermejo – Puerto Velaz',
    river: 'Bermejo',
    coordinates: [-61.483, -25.150],
    type: 'river_level',
    distanceFromPark: 75,
    position: 'downstream',
    varIdLevel: 2,
    varIdDaily: 2,
    status: 'pending',
  },
  {
    id: 'ina-puerto-lavalle',
    siteCode: 2193,
    name: 'Bermejo – Puerto Lavalle',
    river: 'Bermejo',
    coordinates: [-60.128, -25.651],
    type: 'river_level',
    distanceFromPark: 121,
    position: 'downstream',
    // varId 39 = daily mean series — used for 30-day baseline
    varIdLevel: 2,
    varIdDaily: 39,
    status: 'pending',
  },
  {
    id: 'ina-impenetrable',
    siteCode: 7308,
    name: 'PN Est. 1 El Impenetrable',
    river: null,
    coordinates: [-61.044, -25.053],
    type: 'meteo',
    distanceFromPark: 7.7,
    position: 'at_park',
    varIdTemp:     53,
    varIdWind:     55,
    varIdHumidity: 58,
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
