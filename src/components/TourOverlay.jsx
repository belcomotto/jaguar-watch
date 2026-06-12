import { useEffect, useRef, useState } from 'react';
import styles from './TourOverlay.module.css';

function Slideshow({ images }) {
  const [cur, setCur] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setCur(0);
    setTick(0);
    const id = setInterval(() => {
      setCur(i => (i + 1) % images.length);
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [images]);

  const prev = (cur - 1 + images.length) % images.length;

  return (
    <div className={styles.slideshowBox}>
      {tick > 0 && <img src={images[prev]} className={styles.slideImgBg} alt="" />}
      <img key={tick} src={images[cur]} className={styles.slideImgFg} alt="" />
    </div>
  );
}

export default function TourOverlay({ step, onSkip }) {
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
        <button className={styles.exitBtn} onClick={onSkip}>Exit ✕</button>
      </div>

      {step.title && <h3 className={styles.title}>{step.title}</h3>}
      {step.subtitle && <p className={styles.subtitle}>{step.subtitle}</p>}

      {(step.year != null || step.legend) && (
        <div className={styles.legendRow}>
          {step.year != null && (
            <span className={styles.yearCounter}>{step.year}</span>
          )}
          {step.legend?.map(({ color, label }) => (
            <span key={label} className={styles.legendItem}>
              <span className={styles.dot} style={{ background: color }} />
              <span className={styles.confLbl}>{label}</span>
            </span>
          ))}
        </div>
      )}

      {step.body && <p className={styles.body}>{step.body}</p>}
      {step.bodyHtml && <p className={styles.body} dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />}

      {step.video && (
        <div className={styles.mediaBox}>
          <video src={step.video} autoPlay loop muted playsInline className={styles.mediaImg} />
        </div>
      )}
      {step.images && !step.video && <Slideshow images={step.images} />}
      {step.imageStack && (
        <>
          {step.imageStack.map((src, i) => (
            <div key={i} className={styles.mediaBox} style={i > 0 ? { marginTop: 4 } : {}}>
              <img src={src} className={styles.mediaImg} alt="" />
            </div>
          ))}
        </>
      )}
      {step.image && !step.images && !step.imageStack && !step.video && (
        <div className={styles.mediaBox}>
          <img src={step.image} className={styles.mediaImg} alt="" />
        </div>
      )}
      {step.caption && <p className={styles.caption}>{step.caption}</p>}

      {s != null && (
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
