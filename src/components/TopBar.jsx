import styles from './TopBar.module.css';
import { useLang } from '../context/LangContext';

const NAV = {
  en: [
    { id: 'Discover',    label: 'Explore' },
    { id: 'History',     label: 'History' },
    { id: 'Legislation', label: 'Legislation' },
    { id: 'Analyze',     label: 'Analyze' },
    { id: 'Act',         label: 'Act' },
  ],
  es: [
    { id: 'Discover',    label: 'Explorar' },
    { id: 'History',     label: 'Historia' },
    { id: 'Legislation', label: 'Legislación' },
    { id: 'Analyze',     label: 'Analizar' },
    { id: 'Act',         label: 'Actuar' },
  ],
};

export default function TopBar({ activeTab, setActiveTab }) {
  const { lang, setLang } = useLang();
  const nav = NAV[lang] ?? NAV.en;

  return (
    <>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Jaguar Rivers Watch</h1>
        <nav className={styles.nav}>
          {nav.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.navBtn} ${activeTab === id ? styles.navActive : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <a
          href="https://www.jaguarrivers.com/en"
          target="_blank"
          rel="noreferrer"
          className={styles.jriLogo}
        >
          <img src="/JRI_LOGO_white.png" alt="Jaguar Rivers Initiative" />
        </a>
      </header>

      <div className={styles.langToggle}>
        <button
          className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
          onClick={() => setLang('en')}
        >EN</button>
        <span className={styles.langSep}>|</span>
        <button
          className={`${styles.langBtn} ${lang === 'es' ? styles.langActive : ''}`}
          onClick={() => setLang('es')}
        >ES</button>
      </div>
    </>
  );
}
