import styles from './WelcomeModal.module.css';

export default function WelcomeModal({ onTour, onExplore }) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Gran Chaco Region · Argentina</p>
        <h2 className={styles.title}>El Impenetrable</h2>
        <p className={styles.subtitle}>National Park &amp; Bermejo River</p>
        <p className={styles.body}>
          The Bermejo is Argentina's last free-flowing river — and the sediment it carries feeds the entire Paraná basin.
          The 128,000 hectares of protected dry Chaco forest on its banks are home to jaguars, giant anteaters, and dozens
          of communities who have lived here for centuries. This map is a forensic record of the forces threatening both:
          the advancing agricultural frontier, intentional fires, and the illegal water pumps documented along its banks.
          Take a guided tour, or explore the evidence on your own.
        </p>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onTour}>
            Take a Guided Tour
          </button>
          <button className={styles.btnGhost} onClick={onExplore}>
            Explore the Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
