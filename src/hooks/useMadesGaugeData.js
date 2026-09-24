import { useEffect, useRef, useState } from 'react';
import { MADES_STATIONS, toGeoJSON } from '../data/madesGauges';

// TODO: verify this endpoint by inspecting network requests on
// https://siaguapy.mades.gov.py/monitoreo-cuencas-y-acuiferos/mapa
// (open DevTools → Network → XHR/Fetch while the map loads)
const MADES_BASE = 'https://siaguapy.mades.gov.py';

function isoDate(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
const today = () => isoDate(new Date());

function fetchWithTimeout(url, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(err => { clearTimeout(timer); throw err; });
}

function parseLevel(res) {
  // Handles both array and {data:[...]} envelope shapes
  const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  return rows
    .filter(d => d.valor != null || d.value != null || d.nivel != null)
    .sort((a, b) => new Date(b.fecha || b.timestart || b.timestamp || 0)
                  - new Date(a.fecha || a.timestart || a.timestamp || 0));
}

async function fetchStation(s) {
  const from = daysAgo(7);
  const to   = today();

  // siteId = internal integer ID from siaguapy.mades.gov.py/historico-datos/{siteId}/{slug}
  // TODO: confirm exact endpoint by inspecting Network tab (XHR/Fetch) on that page
  const id = s.siteId;
  const candidates = [
    `${MADES_BASE}/api/estaciones/${id}/datos?desde=${from}&hasta=${to}`,
    `${MADES_BASE}/api/datos-historicos/${id}?fechaInicio=${from}&fechaFin=${to}`,
    `${MADES_BASE}/api/nivel?estacion=${id}&desde=${from}&hasta=${to}`,
    `${MADES_BASE}/api/historico/${id}?desde=${from}&hasta=${to}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(url, 8000);
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      if (!json) continue;

      const rows = parseLevel(json);
      if (!rows.length) continue;

      const latest    = rows[0];
      const rawLevel  = latest.valor ?? latest.value ?? latest.nivel;
      const level     = rawLevel != null ? Math.round(parseFloat(rawLevel) * 100) / 100 : null;
      const latestDate = latest.fecha || latest.timestart || latest.timestamp || null;

      const vals = rows.map(d => parseFloat(d.valor ?? d.value ?? d.nivel)).filter(v => !isNaN(v));
      const baselineMean = vals.length
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
        : null;

      const recent = vals.slice(0, 3);
      let tendency = 'Steady';
      if (recent.length >= 2) {
        const diff = recent[0] - recent[recent.length - 1];
        if (diff > 0.05)       tendency = 'Rising';
        else if (diff < -0.05) tendency = 'Falling';
      }

      return { ...s, status: level != null ? 'ok' : 'no_data', level, latestDate, baselineMean, tendency };
    } catch {
      // try next candidate
    }
  }

  // All attempts failed — likely CORS or endpoint unknown.
  // Station will still appear on the map at its coordinates.
  return { ...s, status: 'no_data' };
}

export function useMadesGaugeData() {
  const [stations, setStations] = useState(() => MADES_STATIONS);
  const [loading, setLoading]   = useState(true);
  const pendingRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    pendingRef.current = MADES_STATIONS.length;

    MADES_STATIONS.forEach((s, i) => {
      fetchStation(s)
        .then(result => {
          if (cancelled) return;
          setStations(prev => prev.map((st, idx) => idx === i ? result : st));
        })
        .catch(() => {
          if (cancelled) return;
          setStations(prev => prev.map((st, idx) => idx === i ? { ...st, status: 'no_data' } : st));
        })
        .finally(() => {
          if (cancelled) return;
          pendingRef.current -= 1;
          if (pendingRef.current === 0) setLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, []);

  return { stations, geojson: toGeoJSON(stations), loading };
}
