import styles from './WelcomeModal.module.css';
import { useLang } from '../context/LangContext';

const T = {
  en: {
    eyebrow: 'Gran Chaco Region · Argentina',
    title: 'El Impenetrable',
    subtitle: 'National Park & Bermejo River',
    body: "The Bermejo is Argentina's last free-flowing river — and the sediment it carries feeds the entire Paraná basin. The 128,000 hectares (equivalent to the city of Rome) of protected dry Chaco forest on its banks are home to jaguars, giant anteaters, and dozens of communities who have lived here for centuries.",
    highlight: 'This map is a forensic record of the forces threatening both: the advancing agricultural frontier, intentional fires, and the illegal water pumps documented along its banks.',
    btnTour: 'Take a Guided Tour',
    btnExplore: 'Explore the Evidence',
  },
  es: {
    eyebrow: 'Región del Gran Chaco · Argentina',
    title: 'El Impenetrable',
    subtitle: 'Parque Nacional y Río Bermejo',
    body: 'El Bermejo es el último río de libre flujo de Argentina — y el sedimento que transporta alimenta toda la cuenca del Paraná. Las 128.000 hectáreas (equivalente a la ciudad de Roma) de bosque chaqueño seco protegido en sus orillas albergan jaguares, osos hormigueros gigantes y decenas de comunidades que han vivido aquí durante siglos.',
    highlight: 'Este mapa es un registro forense de las fuerzas que los amenazan: el avance de la frontera agropecuaria, los incendios intencionales y las bombas de agua ilegales documentadas a lo largo de sus orillas.',
    btnTour: 'Iniciar el recorrido guiado',
    btnExplore: 'Explorar la evidencia',
  },
};

export default function WelcomeModal({ onTour, onExplore }) {
  const { lang } = useLang();
  const t = T[lang] ?? T.en;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.videoCol}>
          <video
            src="/media/intro-clip.mov"
            autoPlay
            loop
            muted
            playsInline
            className={styles.introVideo}
          />
        </div>
        <div className={styles.contentCol}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h2 className={styles.title}>{t.title}</h2>
          <p className={styles.subtitle}>{t.subtitle}</p>
          <p className={styles.body}>
            {t.body} <strong>{t.highlight}</strong>
          </p>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={onTour}>
              {t.btnTour}
            </button>
            <button className={styles.btnGhost} onClick={onExplore}>
              {t.btnExplore}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
