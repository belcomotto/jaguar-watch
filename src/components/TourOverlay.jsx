import { useEffect, useRef } from 'react';
import styles from './TourOverlay.module.css';

export default function TourOverlay({ step, onSkip, onBack, canGoBack, onForward, canGoForward, onPause, paused }) {
  const cardRef = useRef(null);

  // Fade out fully (350ms) then fade in on each step change
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove(styles.visible);
    const id = setTimeout(() => el.classList.add(styles.visible), 350);
    return () => clearTimeout(id);
  }, [step?.id]);

  if (!step) return null;

  const s = step.stats;

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Guided Tour</span>
        <div className={styles.headerActions}>
          {canGoBack && (
            <button className={styles.navBtn} onClick={onBack}>← Back</button>
          )}
          <button className={styles.navBtn} onClick={onPause}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          {canGoForward && (
            <button className={styles.navBtn} onClick={onForward}>Forward →</button>
          )}
          <button className={styles.exitBtn} onClick={onSkip}>Exit ✕</button>
        </div>
      </div>
      <h3 className={styles.title}>{step.title}</h3>
      {step.subtitle && <p className={styles.subtitle}>{step.subtitle}</p>}
      <p className={styles.body}>{step.body}</p>

      {s && (
        <div className={styles.statsBlock}>
          <div className={styles.statTotal}>
            <span className={styles.statNum}>{s.total}</span>
            <span className={styles.statLbl}>active detections · last 5 days</span>
          </div>
          <div className={styles.confRow}>
            <span className={styles.dot} style={{ background: '#ff2200' }} />
            <span className={styles.confVal}>{s.high}</span>
            <span className={styles.confLbl}>high</span>
            <span className={styles.dot} style={{ background: '#ff8800' }} />
            <span className={styles.confVal}>{s.nominal}</span>
            <span className={styles.confLbl}>nominal</span>
            <span className={styles.dot} style={{ background: '#ffcc00' }} />
            <span className={styles.confVal}>{s.low}</span>
            <span className={styles.confLbl}>low</span>
          </div>
          {s.lastDetection && (
            <p className={styles.statMeta}>Last detection: {s.lastDetection} · {s.fetchedAt}</p>
          )}
        </div>
      )}
    </div>
  );
}
