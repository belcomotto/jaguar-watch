import { useMemo } from 'react';
import baseStyles from './ContentView.module.css';
import styles from './AnalyzeView.module.css';
import MapBiomasPanel from './MapBiomasPanel';

const CONF_COLOR = { h: '#ff2200', high: '#ff2200', n: '#ff8800', nominal: '#ff8800', l: '#ffcc00', low: '#ffcc00' };

function StatusDot({ color }) {
  return <span className={styles.statusDot} style={{ background: color }} />;
}

export default function AnalyzeView({ firmsRows, firmsLoading, firmsError, firmsFetchedAt, mapbiomas, setMapbiomas, inaStations, inaLoading }) {
  const counts = useMemo(() => {
    if (!firmsRows?.length) return { total: 0, high: 0, nominal: 0, low: 0 };
    const high    = firmsRows.filter(r => r.confidence === 'h' || r.confidence === 'high').length;
    const low     = firmsRows.filter(r => r.confidence === 'l' || r.confidence === 'low').length;
    const nominal = firmsRows.length - high - low;
    return { total: firmsRows.length, high, nominal, low };
  }, [firmsRows]);

  const lastDetection = useMemo(() => {
    if (!firmsRows?.length) return null;
    return [...firmsRows.map(r => r.acq_date).filter(Boolean)].sort().at(-1);
  }, [firmsRows]);

  return (
    <div className={baseStyles.view}>
      <div className={baseStyles.scroll}>

        <header className={baseStyles.viewHeader}>
          <h2 className={baseStyles.viewTitle}>Analyze</h2>
          <p className={baseStyles.viewLead}>
            <em>Live environmental intelligence for the Bermejo basin — fire, flood, and satellite data explained.</em>
          </p>
        </header>

        {/* ── Sentinel-2 ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Satellite Monitoring</span>
            <span className={styles.cardSub}>ESA Copernicus · Sentinel-2 L2A · 10 m resolution</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>Planned: NDWI water index, true-color composites, and scene classification over the Bermejo corridor to track seasonal flooding and deforestation pressure along El Impenetrable's borders.</p>
            <div className={styles.statusRow}>
              <StatusDot color="#f0a500" />
              <span className={styles.statusText}>Not yet live · imagery pipeline in development</span>
            </div>
          </div>
        </div>

        {/* ── MapBiomas Land Cover ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Land Cover Change</span>
            <span className={styles.cardSub}>MapBiomas Gran Chaco · Collection 5 · 30 m · 1985–2023</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>Annual 30 m land-cover classification using Landsat imagery, 1985–2023. Slide through the years to watch the agricultural frontier advance into dry Chaco forest — or use the play button to animate the full 38-year sequence.</p>
            <div className={styles.divider} />
            <MapBiomasPanel mapbiomas={mapbiomas} setMapbiomas={setMapbiomas} />
          </div>
        </div>

        {/* ── Flood Monitoring ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Flood Monitoring</span>
            <span className={styles.cardSub}>Open-Meteo · Copernicus GloFAS ensemble · Bermejo–Paraguay basin</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>Modelled discharge for 5 virtual gauge points on the Bermejo/Teuco, Pilcomayo, and Paraguay rivers. The headline figure is the <strong>anomaly vs the 30-day baseline</strong> — how unusual current flow is relative to its seasonal norm. That ratio is what GloFAS does reliably. Raw m³/s values and a p25–p75 ensemble spread are secondary.</p>
            <p className={styles.desc} style={{ marginTop: 10 }}>Status levels — Near Baseline / Elevated / High / Very High — are model thresholds against that baseline, not official warnings. See <em>Data Sources</em> below for full limitations by river.</p>
            <div className={styles.statusRow}>
              <StatusDot color="#16a34a" />
              <span className={styles.statusText}>Live · Open-Meteo Flood API · no API key required · 5 virtual gauge points active</span>
            </div>
          </div>
        </div>

        {/* ── INA Telemetric Stations ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>INA Observed Gauges</span>
            <span className={styles.cardSub}>INA sSIyAH · Argentina National Water Institute · 3 stations</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>
              Three telemetric stations from INA's sSIyAH network provide observed data to cross-check the GloFAS models.
              <strong> Puerto Lavalle</strong> measures actual river level on the lower Bermejo, 121 km downstream of the park — a real reading against the model signal.
              <strong> Pozo Sarmiento</strong>, 350 km upstream near the Bolivian border, holds the only discharge gauge on the entire Bermejo — and it is currently offline.
              That silence is the monitoring gap: without it, no agency can say how much water is entering Argentina's Chaco.
            </p>
            <div className={styles.divider} />

            {inaLoading && (
              <p className={styles.statusText} style={{ fontStyle: 'italic' }}>Loading INA station data…</p>
            )}

            {!inaLoading && (() => {
              const pl = inaStations?.find(s => s.id === 'ina-puerto-lavalle');
              const ps = inaStations?.find(s => s.id === 'ina-pozo-sarmiento');
              const meteo = inaStations?.find(s => s.id === 'ina-impenetrable');
              const plOk  = pl?.status === 'ok';
              return (
                <>
                  <div className={styles.statGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{plOk ? `${pl.level} m` : '—'}</span>
                      <span className={styles.statLabel}>Bermejo at Puerto Lavalle</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statValue} style={{ color: plOk && pl.anomalyPct != null ? (pl.anomalyPct >= 0 ? '#ff8800' : '#4db8ff') : undefined }}>
                        {plOk && pl.anomalyPct != null ? `${pl.anomalyPct >= 0 ? '+' : ''}${pl.anomalyPct}%` : '—'}
                      </span>
                      <span className={styles.statLabel}>vs 30-day mean</span>
                    </div>
                  </div>
                  <div className={styles.statusRow} style={{ marginTop: 10 }}>
                    <StatusDot color="#4db8ff" />
                    <span className={styles.statusText}>
                      Puerto Lavalle · {plOk ? `${pl.level} m · ${pl.tendency}` : 'awaiting data'}
                    </span>
                  </div>
                  {meteo?.status === 'ok' && (meteo.temp != null || meteo.humidity != null || meteo.wind != null) && (
                    <div className={styles.statusRow} style={{ marginTop: 6 }}>
                      <StatusDot color="#f0a500" />
                      <span className={styles.statusText}>
                        PN El Impenetrable
                        {meteo.temp     != null ? ` · ${meteo.temp}°C` : ''}
                        {meteo.humidity != null ? ` · ${meteo.humidity}% humidity` : ''}
                        {meteo.wind     != null ? ` · ${meteo.wind} km/h wind` : ''}
                      </span>
                    </div>
                  )}
                  <div className={styles.statusRow} style={{ marginTop: 6 }}>
                    <StatusDot color="#dc2626" />
                    <span className={styles.statusText}>
                      Pozo Sarmiento · Offline — the only discharge gauge on the Bermejo
                      {ps?.daysSinceUpdate != null ? ` · last data ${ps.daysSinceUpdate}d ago` : ''}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* ── FIRMS Fire Alerts ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Active Fire Detections</span>
            <span className={styles.cardSub}>NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · 375 m · last 5 days</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>The Fire Information for Resource Management System (FIRMS) distributes near real-time active fire data from NASA's VIIRS sensors aboard three satellites — Suomi-NPP, NOAA-20, and NOAA-21. All three 375 m products are fetched in parallel and merged to maximise detection coverage. Each pixel marks a thermal anomaly consistent with fire at the time of satellite overpass. Fire detections in the Bermejo corridor are a direct indicator of deforestation pressure, agricultural burning, and land-clearing in the buffer zone.</p>

            <p className={styles.desc} style={{ marginTop: 10 }}>Data latency is approximately <strong>3 hours</strong> from satellite acquisition. Confidence levels — high (H), nominal (N), low (L) — reflect the algorithm's certainty that the anomaly is an active fire rather than a hot surface or data artefact.</p>

            <div className={styles.divider} />

            {firmsLoading && (
              <p className={styles.statusText} style={{ fontStyle: 'italic' }}>Loading fire data…</p>
            )}

            {firmsError && (
              <p className={styles.statusText} style={{ color: '#c0392b' }}>
                Could not reach FIRMS API: {firmsError}. Check network or API key.
              </p>
            )}

            {!firmsLoading && !firmsError && (
              <>
                <div className={styles.statGrid}>
                  <div className={styles.statBox}>
                    <span className={styles.statValue}>{counts.total}</span>
                    <span className={styles.statLabel}>total detections</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.confDot} style={{ background: CONF_COLOR.h }} />
                    <span className={styles.statValue}>{counts.high}</span>
                    <span className={styles.statLabel}>high confidence</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.confDot} style={{ background: CONF_COLOR.n }} />
                    <span className={styles.statValue}>{counts.nominal}</span>
                    <span className={styles.statLabel}>nominal</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.confDot} style={{ background: CONF_COLOR.l }} />
                    <span className={styles.statValue}>{counts.low}</span>
                    <span className={styles.statLabel}>low confidence</span>
                  </div>
                </div>
                <div className={styles.statusRow} style={{ marginTop: 14 }}>
                  <StatusDot color="#ff2200" />
                  <span className={styles.statusText}>
                    Live · last detection <strong>{lastDetection || '—'}</strong> · retrieved {firmsFetchedAt?.toLocaleTimeString() || '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Data Sources ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Data Sources</span>
            <span className={styles.cardSub}>What each dataset is, how we use it, and what it cannot tell us</span>
          </div>
          <div className={styles.cardBody}>

            <p className={styles.subLabel}>NASA FIRMS · VIIRS S-NPP + NOAA-20 + NOAA-21 · 375 m · ~3 h latency</p>
            <p className={styles.desc}>Satellite-detected thermal anomalies from three polar-orbiting satellites, merged into a single near-real-time feed. We colour each point by algorithm confidence (High / Nominal / Low) and display the last 5 days. <em>What it cannot tell us:</em> whether an anomaly is an active fire, an agricultural burn, or a hot surface. Smoke and cloud cover can suppress detections or create gaps in coverage.</p>

            <div className={styles.divider} />

            <p className={styles.subLabel}>Open-Meteo / Copernicus GloFAS v4 · 0.05° grid (~5 km) · ensemble model</p>
            <p className={styles.desc}>Modelled river discharge from the Global Flood Awareness System — no physical gauges. We use the ratio of current modelled discharge to the 30-day baseline as the primary risk signal, and display the p25–p75 ensemble spread as a measure of model uncertainty. <em>What it cannot tell us:</em> actual water levels. The <strong>Pilcomayo</strong> is braided, sediment-heavy, and partly regulated — its channel shifts seasonally and GloFAS is likely to represent it poorly. Treat its readings with extra caution (model confidence: low). This is not an authoritative warning system; consult INA or SENAMHI for operational decisions.</p>

            <div className={styles.divider} />

            <p className={styles.subLabel}>MapBiomas Gran Chaco · Collection 5 · Landsat 30 m · 1985–2023</p>
            <p className={styles.desc}>Annual land-cover classification trained on Landsat imagery using machine-learning algorithms and local ground-truth data. We display it as a time-lapse overlay to track deforestation and agricultural expansion. <em>What it cannot tell us:</em> changes after 2023; features below ~1 ha (the minimum mapping unit); or the difference between degraded and structurally intact forest within a single classified pixel.</p>

            <div className={styles.divider} />

            <p className={styles.subLabel}>JRC Global Surface Water Explorer · Landsat 30 m · 1984–2021</p>
            <p className={styles.desc}>Landsat-derived record of where and how long surface water was present. Two static overlays: <em>seasonality</em> (average months per year water was detected, 1984–2021) and <em>transitions</em> (gains and losses of permanent vs seasonal water between the early 1984–1999 and late 2000–2021 epochs). <em>What it cannot tell us:</em> conditions after 2021; cloud-masked periods appear as dry even when water may have been present.</p>

          </div>
        </div>

        <footer className={baseStyles.viewFooter}>
          <p>NASA FIRMS NRT · Copernicus GloFAS via Open-Meteo · MapBiomas Collection 5 · JRC Global Surface Water Explorer · ESA Copernicus / Sentinel-2 L2A (pipeline)</p>
        </footer>

      </div>
    </div>
  );
}
