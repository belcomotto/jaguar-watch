import { useEffect, useRef, useState } from 'react';
import { INA_STATIONS, toGeoJSON } from '../data/inaGauges';

const BASE = 'https://alerta.ina.gob.ar/pub/datos/';

function inaRelUrl(siteCode, varId, relDays = 7) {
  return `${BASE}datos&siteCode=${siteCode}&varId=${varId}&timeStart=T${relDays}&timeEnd=TODAY&format=json`;
}
function inaAbsUrl(siteCode, varId, fromDate, toDate) {
  return `${BASE}datos&siteCode=${siteCode}&varId=${varId}&timeStart=${fromDate}&timeEnd=${toDate}&format=json`;
}

function isoDate(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
const today = () => isoDate(new Date());

// Wrap fetch with an AbortController timeout so slow/hung requests don't block forever
function fetchWithTimeout(url, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(err => { clearTimeout(timer); throw err; });
}

function parseRows(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

function sortedDesc(rows) {
  return [...rows]
    .filter(d => d.valor != null)
    .sort((a, b) => new Date(b.timestart || b.fecha) - new Date(a.timestart || a.fecha));
}

async function fetchRiverLevel(s) {
  try {
    const [raw7, rawBaseline] = await Promise.all([
      fetchWithTimeout(inaAbsUrl(s.siteCode, s.varIdLevel, daysAgo(7), today()))
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetchWithTimeout(inaAbsUrl(s.siteCode, s.varIdDaily, daysAgo(30), today()))
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    const rows7        = sortedDesc(parseRows(raw7));
    const rowsBaseline = parseRows(rawBaseline).filter(d => d.valor != null);

    const latest     = rows7[0];
    const level      = latest ? Math.round(parseFloat(latest.valor) * 100) / 100 : null;
    const latestDate = latest?.timestart || latest?.fecha || null;

    const vals = rowsBaseline.map(d => parseFloat(d.valor)).filter(v => !isNaN(v));
    const baselineMean = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
      : null;

    const recent = rows7.slice(0, 3).map(d => parseFloat(d.valor)).filter(v => !isNaN(v));
    let tendency = 'Steady';
    if (recent.length >= 2) {
      const diff = recent[0] - recent[recent.length - 1];
      if (diff > 0.05)       tendency = 'Rising';
      else if (diff < -0.05) tendency = 'Falling';
    }

    const anomalyPct = (level != null && baselineMean != null && baselineMean > 0)
      ? Math.round(((level - baselineMean) / baselineMean) * 100)
      : null;

    return { ...s, status: level != null ? 'ok' : 'no_data', level, latestDate, baselineMean, anomalyPct, tendency };
  } catch {
    return { ...s, status: 'error' };
  }
}

async function fetchMeteo(s) {
  try {
    const [tempRes, windRes, humRes] = await Promise.allSettled([
      fetchWithTimeout(inaRelUrl(s.siteCode, 53, 7)).then(r => r.ok ? r.json() : null).catch(() => null),
      fetchWithTimeout(inaRelUrl(s.siteCode, 55, 7)).then(r => r.ok ? r.json() : null).catch(() => null),
      fetchWithTimeout(inaRelUrl(s.siteCode, 58, 7)).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    const tempRows = sortedDesc(parseRows(tempRes.status === 'fulfilled' ? tempRes.value : null));
    const windRows = sortedDesc(parseRows(windRes.status === 'fulfilled' ? windRes.value : null));
    const humRows  = sortedDesc(parseRows(humRes.status  === 'fulfilled' ? humRes.value  : null));

    const temp     = tempRows[0] ? Math.round(parseFloat(tempRows[0].valor) * 10) / 10 : null;
    const wind     = windRows[0] ? Math.round(parseFloat(windRows[0].valor) * 10) / 10 : null;
    const humidity = humRows[0]  ? Math.round(parseFloat(humRows[0].valor))             : null;

    return { ...s, status: 'ok', temp, wind, humidity };
  } catch {
    return { ...s, status: 'ok', temp: null, wind: null, humidity: null };
  }
}

async function fetchDischargeOffline(s) {
  try {
    // Search 2 years back — discharge data is sparse or absent on this gauge
    const rawDischarge = await fetchWithTimeout(inaAbsUrl(s.siteCode, s.varIdDischarge, daysAgo(730), today()))
      .then(r => r.ok ? r.json() : null).catch(() => null);
    const dischargeRows = sortedDesc(parseRows(rawDischarge));
    const latestDischarge = dischargeRows[0];

    let lastDate = latestDischarge?.timestart || latestDischarge?.fecha || null;
    const discharge = latestDischarge ? Math.round(parseFloat(latestDischarge.valor) * 10) / 10 : null;

    // When discharge is absent, fall back to level series for last-active evidence
    if (!lastDate && s.varIdLevel) {
      const rawLevel = await fetchWithTimeout(inaAbsUrl(s.siteCode, s.varIdLevel, daysAgo(730), today()))
        .then(r => r.ok ? r.json() : null).catch(() => null);
      const levelRows = sortedDesc(parseRows(rawLevel));
      const latestLevel = levelRows[0];
      lastDate = latestLevel?.timestart || latestLevel?.fecha || null;
    }

    const daysSinceUpdate = lastDate
      ? Math.floor((Date.now() - new Date(lastDate)) / 86400000)
      : null;
    const isStale = !lastDate || daysSinceUpdate > 14;

    return { ...s, status: isStale ? 'offline' : 'ok', discharge, lastDate, daysSinceUpdate, isStale };
  } catch {
    return { ...s, status: 'offline', isStale: true, discharge: null, lastDate: null, daysSinceUpdate: null };
  }
}

function fetchStation(s) {
  if (s.type === 'river_level')             return fetchRiverLevel(s);
  if (s.type === 'meteo')                   return fetchMeteo(s);
  if (s.type === 'discharge_gauge_offline') return fetchDischargeOffline(s);
  return Promise.resolve(s);
}

export function useInaGaugeData() {
  const [stations, setStations] = useState(() => INA_STATIONS);
  const [loading, setLoading]   = useState(true);
  const pendingRef = useRef(0); // count of in-flight fetches

  useEffect(() => {
    let cancelled = false;
    pendingRef.current = INA_STATIONS.length;

    // Fetch each station independently — update the state as each one resolves
    // so the map and UI show data as soon as it arrives rather than waiting for all 3
    INA_STATIONS.forEach((s, i) => {
      fetchStation(s)
        .then(result => {
          if (cancelled) return;
          setStations(prev => prev.map((st, idx) => idx === i ? result : st));
        })
        .catch(() => {
          if (cancelled) return;
          setStations(prev => prev.map((st, idx) => idx === i ? { ...st, status: 'error' } : st));
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
