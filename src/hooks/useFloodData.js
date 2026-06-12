import { useState, useEffect, useRef } from 'react';
import { GAUGES, toGeoJSON } from '../data/floodGauges';

function fetchWithTimeout(url, ms = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(err => { clearTimeout(timer); throw err; });
}

const TODAY = new Date().toISOString().slice(0, 10);

function arrayMedian(arr) {
  const sorted = arr.filter(v => v != null && !isNaN(v) && v > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function classifyStatus(todayQ, forecast7Max, baselineMedian) {
  if (!baselineMedian || baselineMedian < 0.01) return 'normal';
  const ratio = Math.max(todayQ, forecast7Max) / baselineMedian;
  if (ratio >= 3.0) return 'warning';
  if (ratio >= 2.0) return 'watch';
  if (ratio >= 1.5) return 'advisory';
  return 'normal';
}

function classifyTendency(pastValues) {
  const vals = pastValues.filter(v => v != null && !isNaN(v));
  if (vals.length < 6) return 'Steady';
  const n = vals.length;
  const firstHalf  = vals.slice(0, Math.floor(n / 2));
  const secondHalf = vals.slice(Math.floor(n / 2));
  const avgFirst  = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const change = (avgSecond - avgFirst) / (avgFirst || 1);
  if (change > 0.10) return 'Rising';
  if (change < -0.10) return 'Falling';
  return 'Steady';
}

async function fetchGauge(gauge) {
  const [lon, lat] = gauge.coordinates;
  const url = [
    'https://flood-api.open-meteo.com/v1/flood',
    `?latitude=${lat}&longitude=${lon}`,
    '&daily=river_discharge,river_discharge_median,river_discharge_max,river_discharge_p25,river_discharge_p75',
    '&past_days=30&forecast_days=16&timezone=UTC',
  ].join('');

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const { time, river_discharge, river_discharge_median, river_discharge_max, river_discharge_p25, river_discharge_p75 } = data.daily;

  // Find today's index
  let todayIdx = time.indexOf(TODAY);
  if (todayIdx < 0) todayIdx = 30; // fallback

  // Past 30 days for baseline + tendency
  const pastQ = river_discharge.slice(0, todayIdx).filter(v => v != null);
  const baselineMedian = arrayMedian(pastQ);
  const todayQ = river_discharge[todayIdx] ?? 0;

  // Percent vs baseline
  const baselinePct = baselineMedian > 0.01
    ? Math.round(((todayQ - baselineMedian) / baselineMedian) * 100)
    : null;

  // 7-day forecast (indices todayIdx+1 … todayIdx+7)
  const fw    = river_discharge.slice(todayIdx + 1, todayIdx + 8);
  const fwMax = river_discharge_max.slice(todayIdx + 1, todayIdx + 8);
  const fwP25 = river_discharge_p25?.slice(todayIdx + 1, todayIdx + 8) ?? [];
  const fwP75 = river_discharge_p75?.slice(todayIdx + 1, todayIdx + 8) ?? [];

  const forecast7Median = Math.max(...fw.filter(v => v != null), 0);
  const forecast7Max    = Math.max(...fwMax.filter(v => v != null), 0);

  // Ensemble spread over the forecast window — p25/p75 are only meaningful for future days
  const forecastSpreadLow  = Math.min(...fwP25.filter(v => v != null && v > 0));
  const forecastSpreadHigh = Math.max(...fwP75.filter(v => v != null && v > 0));

  const peakIdx = fw.indexOf(Math.max(...fw.filter(v => v != null)));
  const forecastPeakDate = peakIdx >= 0 ? time[todayIdx + 1 + peakIdx] : null;

  const tendency = classifyTendency(pastQ.slice(-12));
  const status   = classifyStatus(todayQ, forecast7Max, baselineMedian);

  const round1 = v => (v != null && !isNaN(v) && isFinite(v)) ? Math.round(v * 10) / 10 : null;

  return {
    ...gauge,
    status,
    discharge:          round1(todayQ),
    forecastPeak:       round1(forecast7Median),
    forecastPeakMax:    round1(forecast7Max),
    forecastSpreadLow:  round1(forecastSpreadLow),
    forecastSpreadHigh: round1(forecastSpreadHigh),
    forecastPeakDate,
    baselineMedian:     round1(baselineMedian),
    baselinePct,
    tendency,
    modelRunDate:       TODAY,
    noData: todayQ === 0 && baselineMedian === 0,
  };
}

export function useFloodData() {
  const [gauges,    setGauges]    = useState(GAUGES);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const pendingRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    pendingRef.current = GAUGES.length;

    GAUGES.forEach((g, i) => {
      fetchGauge(g)
        .then(result => {
          if (cancelled) return;
          setGauges(prev => prev.map((st, idx) => idx === i ? result : st));
          setFetchedAt(new Date());
        })
        .catch(err => {
          if (cancelled) return;
          setGauges(prev => prev.map((st, idx) => idx === i ? { ...st, status: 'error' } : st));
          setError(err?.message ?? 'fetch error');
        })
        .finally(() => {
          if (cancelled) return;
          pendingRef.current -= 1;
          if (pendingRef.current === 0) setLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, []);

  // Derive GeoJSON from gauges so MapView always gets the latest snapshot
  return { gauges, geojson: toGeoJSON(gauges), loading, error, fetchedAt };
}
