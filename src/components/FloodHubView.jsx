import styles from './ContentView.module.css';

export default function FloodHubView() {
  return (
    <div className={styles.view} style={{ overflow: 'hidden' }}>
      <div className={styles.floodHeader}>
        <h2 className={styles.viewTitle} style={{ marginBottom: 6 }}>Flood Hub</h2>
        <p className={styles.viewLead} style={{ marginBottom: 0 }}>
          Real-time flood alerts and river level forecasts via Google Research's Flood Hub — centred on the Bermejo basin.
        </p>
      </div>
      <iframe
        className={styles.floodFrame}
        src="https://sites.research.google/floods/l/-25.0/-61.45/8?layers=1,6"
        title="Google Flood Hub — Bermejo River"
        allow="geolocation"
      />
    </div>
  );
}
