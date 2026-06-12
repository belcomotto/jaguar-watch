import styles from './TopBar.module.css';

const NAV = [
  { id: 'Discover',    label: 'Discover' },
  { id: 'History',     label: 'History' },
  { id: 'Legislation', label: 'Legislation' },
  { id: 'Analyze',     label: 'Analyze' },
  { id: 'Act',         label: 'Act' },
];

export default function TopBar({ activeTab, setActiveTab }) {
  return (
    <header className={styles.topBar}>
      <h1 className={styles.title}>Jaguar Watch</h1>
      <nav className={styles.nav}>
        {NAV.map(({ id, label }) => (
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
  );
}
