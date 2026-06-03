import { useMemo } from 'react';
import baseStyles from './ContentView.module.css';
import styles from './AnalyzeView.module.css';
import MapBiomasPanel from './MapBiomasPanel';

const CONF_COLOR = { h: '#ff2200', high: '#ff2200', n: '#ff8800', nominal: '#ff8800', l: '#ffcc00', low: '#ffcc00' };

function StatusDot({ color }) {
  return <span className={styles.statusDot} style={{ background: color }} />;
}

export default function AnalyzeView({ firmsRows, firmsLoading, firmsError, firmsFetchedAt, mapbiomas, setMapbiomas }) {
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
            <p className={styles.subLabel}>River Dynamics</p>
            <p className={styles.desc}>The NDWI (Normalized Difference Water Index) and Moisture Index layers track seasonal flooding, water-body extent, and soil moisture along the Bermejo. Toggle these layers across months to observe how the river swells and retreats with the wet season — and how that pattern shifts over years.</p>
            <p className={styles.subLabel} style={{ marginTop: 14 }}>Agricultural Frontier</p>
            <p className={styles.desc}>True Color composites and Scene Classification reveal land-use change and deforestation pressure along El Impenetrable's borders. Compared year by year, these bands expose the rate at which the dry Chaco forest is being converted to soy and cattle pasture.</p>
            <div className={styles.statusRow}>
              <StatusDot color="#f0a500" />
              <span className={styles.statusText}>Imagery pipeline in development · local cache available for selected months · 2015–present</span>
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
            <p className={styles.desc}>Annual land-use and land-cover classification for the Gran Chaco ecoregion from MapBiomas Collection 5. Each pixel is classified into one of 19 categories — native woody vegetation, grassland types, pasture, annual crops, water, and urban areas — using Landsat imagery and machine-learning algorithms trained on ground-truth data.</p>
            <p className={styles.desc} style={{ marginTop: 10 }}>Slide through 1985–2023 to observe 38 years of deforestation, agricultural expansion, and land conversion along the Bermejo corridor. Use the play button to animate the full time series.</p>
            <div className={styles.divider} />
            <MapBiomasPanel mapbiomas={mapbiomas} setMapbiomas={setMapbiomas} />
          </div>
        </div>

        {/* ── Flood Monitoring ── */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Flood Monitoring</span>
            <span className={styles.cardSub}>Google Flood Hub · GloFAS · Bermejo–Paraná basin</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>Real-time river level readings and flood alert status for 10 monitoring stations across the Bermejo, Pilcomayo, Paraguay, and Paraná rivers. When live, this layer will display current flood warning levels (Normal / Advisory / Watch / Warning) and forecast trends derived from the Global Flood Awareness System (GloFAS).</p>
            <p className={styles.desc} style={{ marginTop: 10 }}>Data latency is approximately 6 hours. Stations are already mapped on the DISCOVER layer — status indicators will populate automatically once the API key is active.</p>
            <div className={styles.statusRow}>
              <StatusDot color="#aaa" />
              <span className={styles.statusText}>API key pending · 10 stations mapped and ready</span>
            </div>
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

        <footer className={baseStyles.viewFooter}>
          <p>Sources: NASA FIRMS (VIIRS S-NPP + NOAA-20 + NOAA-21 NRT) · Google Flood Hub / GloFAS · ESA Copernicus / Sentinel-2 L2A · JRC Global Surface Water Explorer</p>
        </footer>

      </div>
    </div>
  );
}
