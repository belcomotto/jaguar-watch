import { useState, useEffect } from 'react';

// Bounding box covering the Bermejo river basin
const BBOX = '-62.5,-25.7,-60.4,-24.0';
const DAYS = 5;

// All three 375 m VIIRS products — fetched in parallel and merged
const PRODUCTS = ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT'];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']));
  });
}

export function toFirmsGeoJSON(rows) {
  return {
    type: 'FeatureCollection',
    features: rows
      .filter(r => r.latitude && r.longitude)
      .map(r => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
        },
        properties: {
          confidence: r.confidence ?? 'n',
          acq_date:   r.acq_date ?? '',
          acq_time:   r.acq_time ?? '',
          frp:        parseFloat(r.frp) || 0,
          daynight:   r.daynight ?? '',
          satellite:  r.satellite ?? '',
        },
      })),
  };
}

export function useFirmsData() {
  const [rows,      setRows]      = useState([]);
  const [geojson,   setGeojson]   = useState({ type: 'FeatureCollection', features: [] });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    const key = import.meta.env.VITE_FIRMS_KEY;

    // Fetch all three VIIRS products in parallel, merge results
    Promise.allSettled(
      PRODUCTS.map(product =>
        fetch(`/firms-api/api/area/csv/${key}/${product}/${BBOX}/${DAYS}`)
          .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
          })
          .then(parseCSV)
      )
    ).then(results => {
      const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message);
      const merged = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      if (merged.length === 0 && errors.length > 0) {
        setError(errors.join('; '));
        setLoading(false);
        return;
      }

      setRows(merged);
      setGeojson(toFirmsGeoJSON(merged));
      setFetchedAt(new Date());
      setLoading(false);
    });
  }, []);

  return { rows, geojson, loading, error, fetchedAt };
}
