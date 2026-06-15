import { useEffect, useState } from 'react';
import styles from './KeyboardHintOverlay.module.css';
import { useLang } from '../context/LangContext';

const LABEL = {
  en: 'use the space and arrows to pause, move forward and back',
  es: 'usá el espacio y las flechas para pausar, avanzar y retroceder',
};

export default function KeyboardHintOverlay({ show }) {
  const [phase, setPhase] = useState('hidden'); // hidden | visible | fading
  const { lang } = useLang();

  useEffect(() => {
    if (!show) {
      setPhase('hidden');
      return;
    }
    setPhase('visible');
    const fadeTimer = setTimeout(() => setPhase('fading'), 5500);
    const hideTimer = setTimeout(() => setPhase('hidden'), 7000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [show]);

  if (phase === 'hidden') return null;

  return (
    <div className={`${styles.hint} ${phase === 'fading' ? styles.fading : ''}`}>
      <div className={styles.keys}>
        <span className={styles.key}>←</span>
        <span className={styles.keySpace}>Space</span>
        <span className={styles.key}>→</span>
      </div>
      <p className={styles.label}>{LABEL[lang] ?? LABEL.en}</p>
    </div>
  );
}
