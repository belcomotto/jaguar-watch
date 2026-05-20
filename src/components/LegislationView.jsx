import { useState } from 'react';
import styles from './ContentView.module.css';

const STATUS_COLORS = {
  green:  '#4caf50',
  orange: '#ffa500',
  red:    '#f44336',
};

const LAWS = [
  {
    code: 'Ley 26.331',
    title: 'Native Forest Protection Act (Ley de Bosques)',
    year: '2007',
    status: 'IN FORCE — PARTIALLY ENFORCED',
    statusColor: STATUS_COLORS.orange,
    body: "Argentina's landmark forest law requires all provinces to classify their native forests into three conservation categories: Category I (red — no intervention allowed), Category II (yellow — sustainable use only, no clearing), and Category III (green — partial transformation permitted). It created a national fund to compensate provinces that conserve native forests. The law prohibits clearing in red and yellow zones without environmental impact assessment and mandates participatory provincial land-use planning (Ordenamiento Territorial de Bosques Nativos, OTBN).",
    enforcer: 'National: Dirección Nacional de Bosques, under the Secretaría de Política Ambiental en Recursos Naturales. The Ministerio de Ambiente was dissolved in 2024; environmental functions now sit under Secretaría de Turismo y Ambiente, Jefatura de Gabinete de Ministros. Provincial (Chaco): Dirección de Bosques del Chaco, under the Ministerio de Producción. Provincial (Formosa): Dirección de Bosques de Formosa. Contact: bosques@ambiente.gob.ar',
    evidence: [
      '5 million hectares of Gran Chaco forest were destroyed in the first two decades of the 21st century. The Gran Chaco accounts for 87% of all deforestation in Argentina (source: Argentina\'s Ministry of Environment / Mongabay, 2020).',
      'In 2024 alone, Argentina lost 149,649 hectares of Gran Chaco forest, primarily from agriculture and fires (source: Greenpeace Argentina report, Feb 2025 / Mongabay).',
      'The categorization system is criticized as outdated and manipulable: provincial governments can reclassify forest zones to permit development in areas that should be protected.',
      'In Formosa province, 99,522 hectares of forest were cleared by machinery in four years (Mongabay, 2020).',
      'The buffer zone around El Impenetrable is classified under Chaco\'s OTBN as prohibiting bulldozer clearing but permitting selective extraction (silvopastoral management). Field observations confirm that large-scale selective logging occurs continuously around the park perimeter, often by operators without title to the land — a double violation of the forest law and of property law.',
      'The national conservation fund mandated by the law has been chronically underfunded, receiving a fraction of the 0.3% of the national budget originally stipulated.',
    ],
    links: [
      { label: 'Ley 26.331 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/135000-139999/136125/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-26331-136125' },
    ],
  },
  {
    code: 'Ley 26.996',
    title: 'Creation of Parque Nacional El Impenetrable',
    year: '2014 · inaugurated August 25, 2017',
    status: 'IN FORCE',
    statusColor: STATUS_COLORS.green,
    body: 'Accepted the transfer of domain and jurisdiction from the Province of Chaco and created the Parque Nacional El Impenetrable, protecting approximately 130,000 hectares of dry Chaco forest between the Bermejo/Teuco and Bermejito rivers. Voted unanimously in both chambers of Congress on October 22, 2014. The park is managed under the national parks system (Ley 22.351). It is the largest national park in northern Argentina.',
    enforcer: 'Administración de Parques Nacionales (APN) · President: Arq. Sergio Martín Álvarez (Decreto 380/2025, since June 2025, ad honorem) · Vice President: Abg. Pablo Leandro Ciocchini (Decreto 48/2026) · Contact: sprivada@apn.gob.ar · On the ground: Rewilding Argentina operates under a conservation and baseline agreement with APN.',
    evidence: [
      'The park was created from the expropriated Chaco-side lands of the former Estancia La Fidelidad (Ley provincial 6928/2011, expropriation; Ley 26.996/2014, national park designation).',
      'The Formosa side — approximately 100,000 hectares of the original La Fidelidad estate — remains in the hands of heirs, still entangled in succession proceedings. Rewilding Argentina is pursuing acquisition. Without this territory, the park lacks the complete ecological corridor its own legislation envisions.',
      'APN could not formally enter the territory until April 2017 due to judicial blockages. The arrival of uniformed park rangers was experienced as abrupt by local communities.',
      'The current APN administration (under Álvarez, appointed by Milei) is pursuing a privatization-oriented strategy focused on tourism revenue generation, which creates tension with the conservation and community-integration mission of the park.',
      'Park rangers have the legal authority to enforce (fiscalizar), but their capacity is limited compared to parks like Iguazú. There is no Prefectura Naval or Gendarmería presence on the Bermejo within the park boundaries due to the absence of formal ports.',
    ],
    links: [
      { label: 'Ley 26.996 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/238864/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-26996' },
    ],
  },
  {
    code: 'Ley 25.688',
    title: 'Environmental Water Management Act (Régimen de Gestión Ambiental de Aguas)',
    year: '2002',
    status: 'IN FORCE — VIOLATED',
    statusColor: STATUS_COLORS.red,
    body: 'Establishes minimum environmental standards for the preservation, use, and rational management of water. Declares river basins as indivisible environmental management units. Creates interjurisdictional basin committees. Article 6 requires permits from the competent authority for any water extraction.',
    enforcer: 'National: Instituto Nacional del Agua (INA) — ina@ina.gob.ar · Basin authority: COIRSA — Comité Interjurisdiccional del Río Bermejo (see entry #7) · Provincial (Chaco): Administración Provincial del Agua (APA) · Provincial (Formosa): Unidad Provincial Coordinadora del Agua (UPCA)',
    evidence: [
      'Tier 1 — Large provincial infrastructure (state-sanctioned but unassessed): The Ingeniero Juárez diversion (Formosa) channels the Bermejo itself into an oxbow lake (madrejón) where a permanent pump station extracts water through the Canal Santa Rita and the Arroyo Teuquito. The Laguna Yema complex captures Bermejo water via canal, feeding a 90km concrete-lined canal as far as Las Lomitas. The Formosa provincial government calls it "the most important work in the Bermejo basin." Their cumulative hydrological impact has never been assessed under Ley 25.688, which requires federal environmental review for significant interjurisdictional water use.',
      'Tier 2 — Municipal/community pumps: Towns and parajes along the river — Fortín Belgrano, El Tartagal, Tres Pozos, Sauzalito, Sumayen, Wichí Pintado — operate small pump stations that run 24/7, supplying drinking water. These are semi-formal; they serve basic needs but operate without federal permits.',
      'Tier 3 — Private extraction: Small pumps and hoses scattered along the riverbanks serving private ranchos for domestic consumption and livestock production. No permits, no registration, no monitoring.',
      'Upstream contamination (Salta): The Ingenio San Martín del Tabacal (owned by Seaboard Corporation, brand "Chango") discharges industrial waste through a canal with a strong putrid smell and whitish color directly into the Río Colorado, just upstream of its confluence with the Bermejo. The ingenio also maintains black wastewater pools (piletones) meters from the Bermejo floodplain, which overflow into the river during high water. The Asociación de Pescadores del Río Bermejo has formally denounced the diversion of three tributary rivers (Río Blanco, Río Pescado, Río Santa María) by the sugar operation. The Salta provincial environment secretariat took samples after a mass fish die-off and cyanobacteria event in 2022. Results were never published.',
    ],
    links: [
      { label: 'Ley 25.688 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/80000-84999/81032/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-25688-81032/texto' },
    ],
  },
  {
    code: 'Ley 25.675',
    title: 'General Environmental Law (Ley General del Ambiente)',
    year: '2002',
    status: 'IN FORCE — SELECTIVELY APPLIED',
    statusColor: STATUS_COLORS.orange,
    body: "Argentina's foundational environmental framework law, providing the constitutional basis (Article 41) for all environmental legislation. Establishes the precautionary principle, the polluter-pays principle, mandatory environmental impact assessment for any activity with significant environmental effects, citizen access to environmental information, and the right to participate in environmental decision-making. It sits above the specific water law (25.688) and forest law (26.331) and gives the entire protective framework its legal backbone.",
    enforcer: 'Secretaría de Turismo y Ambiente, Jefatura de Gabinete de Ministros (environmental functions absorbed after dissolution of Ministerio de Ambiente) · Contact: ambiente@jefatura.gob.ar',
    evidence: [
      'The sugar industry operations upstream on the Bermejo involve infrastructure installation, tributary diversion, and industrial waste discharge — all activities requiring environmental impact assessment under this law. No public assessment has been made available.',
      'The pump installations documented in this investigation involve permanent or semi-permanent infrastructure on river banks affecting a nationally significant watercourse. No environmental review has been conducted.',
      'The 2022 cyanobacteria crisis — confirmed by multiple communities along 300km of river, causing gastrointestinal illness and a mass fish die-off — triggered sample collection by the Salta provincial environment secretariat. No results were ever published, violating the law\'s principle of public access to environmental information (Article 16).',
    ],
    links: [
      { label: 'Ley 25.675 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/75000-79999/79980/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-25675-79980' },
    ],
  },
  {
    code: 'ILO Convention 169',
    title: 'Indigenous and Tribal Peoples Convention',
    year: '1989 · ratified by Argentina 2000 (Ley 24.071)',
    status: 'RATIFIED — VIOLATED IN THIS CASE',
    statusColor: STATUS_COLORS.red,
    body: 'Guarantees Indigenous peoples the right to free, prior, and informed consultation on any project affecting their territories, resources, and livelihoods. Requires governments to recognize Indigenous peoples\' rights to land, to protect their environment, and to ensure their participation in decisions about resource use. It is binding international law.',
    enforcer: 'National: Instituto Nacional de Asuntos Indígenas (INAI) · President: Claudio Avruj (appointed 2024) · Contact: inai@jus.gov.ar · International oversight: ILO Committee of Experts on the Application of Conventions and Recommendations. Note: INAI\'s national Indigenous registry (RENACI) was dissolved by Resolution 53/2024 in September 2024. In January 2026, INAI created a new system (SRARP, Resolution 228/2025) to centralize petitions from non-Indigenous claimants — effectively creating an institutional mechanism that prioritizes private property claims over Indigenous territorial rights.',
    evidence: [
      'The Argentine Chaco is home to approximately 200,000 Indigenous people from nine different peoples, predominantly Wichí and Qom (source: Greenpeace Argentina).',
      'The Bermejo River is central to these communities\' water access, fishing, and agricultural cycles. Water extraction directly affects their livelihoods.',
      'No formal consultation process was conducted for any of the pump sites documented in this investigation.',
      'The Milei government dissolved the national Indigenous registry (RENACI) in September 2024 and terminated the territorial emergency protection (Ley 26.160) in December 2024, systematically dismantling the institutional infrastructure through which consultation would normally occur.',
      'The ILO\'s Committee of Experts and the Inter-American Court of Human Rights have repeatedly affirmed that Convention 169 obligations persist regardless of domestic administrative changes.',
    ],
    links: [
      { label: 'ILO C169 full text — NORMLEX', url: 'https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:55:0::NO::P55_TYPE%2CP55_LANG%2CP55_DOCUMENT%2CP55_NODE:REV%2Cen%2CC169%2C%2FDocument' },
      { label: 'OHCHR', url: 'https://www.ohchr.org/en/instruments-mechanisms/instruments/indigenous-and-tribal-peoples-convention-1989-no-169' },
      { label: 'Argentine ratification — Ley 24.071 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/1541/norma.htm' },
    ],
  },
  {
    code: 'Ley 26.160',
    title: 'Emergency Land Tenure Act (Emergencia Territorial Indígena)',
    year: '2006',
    status: '⚠ TERMINATED — Decree 1083/2024',
    statusColor: STATUS_COLORS.red,
    body: 'Declared a national emergency regarding the possession and ownership of lands traditionally occupied by Indigenous communities. Suspended all evictions while the state conducted a formal land demarcation survey (relevamiento técnico-jurídico-catastral). Created a special fund for the process. Extended four times (2009, 2013, 2017, 2021) because the survey was never completed.',
    enforcer: 'Terminated by Decree 1083/2024, signed December 10, 2024 (Human Rights Day), by President Javier Milei and the full cabinet: Guillermo Francos, Gerardo Werthein, Luis Petri, Luis Caputo, Mariano Cúneo Libarona, Patricia Bullrich, Mario Lugones, Sandra Pettovello, Federico Sturzenegger.',
    evidence: [
      'The law was in force for 18 years. The survey it mandated was never completed — leaving thousands of communities in legal limbo.',
      'The Milei government\'s own decree acknowledges more than 250 active territorial conflicts but terminates protections anyway, stating that the suspension of evictions was causing "grave harm to the property rights of legitimate owners."',
      'In the El Impenetrable buffer zone, the most exposed population is criollos living on fiscal lands (tierras fiscales) — state-owned land that was historically encouraged for settlement but where formal title was never transferred. These families have occupied the land for generations but have no legal documentation. They are now vulnerable to displacement by soy operators or other agricultural interests.',
      'The termination of this law, combined with the dissolution of RENACI, means there is no institutional mechanism remaining to prevent evictions or to complete the territorial survey.',
      'Legal scholars and the CELS (Centro de Estudios Legales y Sociales) note that ILO Convention 169 and the Inter-American Court\'s 2020 ruling on communal land titling remain binding regardless of the decree — meaning the termination may be challenged internationally.',
    ],
    links: [
      { label: 'Ley 26.160 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/120000-124999/122499/texact.htm' },
      { label: 'Decree 1083/2024 — Boletín Oficial', url: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/317918/20241210' },
    ],
  },
  {
    code: 'COIRSA',
    title: 'Bermejo River Interstate Coordination Commission',
    year: 'Established 1994 — Tratado de la Cuenca del Río Bermejo',
    status: 'ACTIVE — ENFORCEMENT GAPS',
    statusColor: STATUS_COLORS.orange,
    body: 'Coordinates water use, navigation, and environmental management of the Bermejo and Pilcomayo basins. Any significant water extraction from the Bermejo requires COIRSA approval. Maintains monitoring stations along the river.',
    enforcer: 'Binational body: Argentina and Bolivia. Argentine side represented through the Ministerio de Relaciones Exteriores and the Instituto Nacional del Agua (INA). Provincial delegates from Chaco, Formosa, Salta, and Jujuy participate.',
    evidence: [
      'COIRSA has advisory power but no independent enforcement capacity — it can refer, recommend, and monitor, but cannot sanction violators.',
      'There are no functioning ports on the Argentine Bermejo, so Prefectura Naval (river police) has no established presence.',
      'Gendarmería Nacional has jurisdiction on land but is not consistently deployed in the El Impenetrable buffer zone.',
      'Field expeditions in December 2022 navigated 300km of the Bermejo from Salta to Chaco without encountering any law enforcement presence on the river at any point.',
      'The practical result: the river is effectively unpoliced. Fishing, hunting, timber extraction, and water diversion occur with no oversight. Field workers in the area describe the territory as still carrying the perception of tierra de nadie.',
    ],
    links: [
      { label: 'coirsa.org.ar', url: 'http://www.coirsa.org.ar' },
    ],
  },
  {
    code: 'Ley 24.051',
    title: 'Hazardous Waste Act (Ley de Residuos Peligrosos)',
    year: '1992',
    status: 'IN FORCE — POTENTIALLY VIOLATED',
    statusColor: STATUS_COLORS.orange,
    body: 'Regulates the generation, handling, transport, treatment, and final disposal of hazardous waste. Requires generators to register with authorities, maintain records, and ensure proper treatment. Establishes criminal liability for contamination causing harm to human health or the environment.',
    enforcer: 'Secretaría de Turismo y Ambiente (formerly Ministerio de Ambiente) · Provincial environmental authorities in Salta, Chaco, and Formosa.',
    evidence: [
      'The Ingenio San Martín del Tabacal (Seaboard Corporation) maintains black wastewater pools (piletones de agua negra) meters from the Bermejo River floodplain. Local residents report that during flood events, these pools overflow directly into the river.',
      'The discharge canal documented in December 2022 carried waste with a strong putrid smell and whitish color, characteristic of industrial sugar processing effluent (vinasse/vinaza).',
      'The Río San Francisco, a major Bermejo tributary, passes by the Ledesma sugar ingenio, the largest in Salta. Local fishermen report the river no longer has fish and that mass fish die-off events occur multiple times per year near its confluence with the Bermejo.',
      'If the effluent meets the definition of hazardous waste under the law\'s annexes (which include substances with ecotoxic or pathogenic characteristics), the discharge constitutes a violation carrying criminal penalties.',
      'Provincial environmental samples were collected after the 2022 cyanobacteria event. Results remain unpublished.',
    ],
    links: [
      { label: 'Ley 24.051 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/450/texact.htm' },
    ],
  },
];

const SUMMARY = [
  { num: 1, code: 'Ley 26.331', name: 'Ley de Bosques', year: 2007, status: 'IN FORCE — PARTIALLY ENFORCED', color: STATUS_COLORS.orange, url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/135000-139999/136125/norma.htm' },
  { num: 2, code: 'Ley 26.996', name: 'Parque Nacional', year: 2014, status: 'IN FORCE', color: STATUS_COLORS.green, url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/238864/norma.htm' },
  { num: 3, code: 'Ley 25.688', name: 'Aguas', year: 2002, status: 'IN FORCE — VIOLATED', color: STATUS_COLORS.red, url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/80000-84999/81032/norma.htm' },
  { num: 4, code: 'Ley 25.675', name: 'Ambiente General', year: 2002, status: 'IN FORCE — SELECTIVELY APPLIED', color: STATUS_COLORS.orange, url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/75000-79999/79980/norma.htm' },
  { num: 5, code: 'ILO C169', name: 'Pueblos Indígenas', year: 2000, status: 'RATIFIED — VIOLATED', color: STATUS_COLORS.red, url: 'https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:55:0::NO::P55_TYPE%2CP55_LANG%2CP55_DOCUMENT%2CP55_NODE:REV%2Cen%2CC169%2C%2FDocument' },
  { num: 6, code: 'Ley 26.160', name: 'Tierras Indígenas', year: 2006, status: '⚠ TERMINATED Dec 2024', color: STATUS_COLORS.red, url: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/317918/20241210' },
  { num: 7, code: 'COIRSA', name: 'Comité Bermejo', year: 1994, status: 'ACTIVE — ENFORCEMENT GAPS', color: STATUS_COLORS.orange, url: 'http://www.coirsa.org.ar' },
  { num: 8, code: 'Ley 24.051', name: 'Residuos Peligrosos', year: 1992, status: 'IN FORCE — POTENTIALLY VIOLATED', color: STATUS_COLORS.orange, url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/450/texact.htm' },
];

function LawCard({ law }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={styles.lawCard}>
      <div className={styles.lawMeta}>
        <span className={styles.lawCode}>{law.code}</span>
        <span className={styles.lawYear}>{law.year}</span>
      </div>
      <h3 className={styles.lawTitle}>{law.title}</h3>
      <div className={styles.lawStatus} style={{ marginBottom: 12 }}>
        <span className={styles.lawStatusDot} style={{ background: law.statusColor }} />
        <span className={styles.lawStatusText}>{law.status}</span>
      </div>
      <p className={styles.lawBody}>{law.body}</p>

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: open ? 'var(--sand)' : 'var(--brown)',
          padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {open ? '▲' : '▼'} {open ? 'Hide details' : 'Enforcement & evidence'}
      </button>

      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.02)', borderLeft: '2px solid var(--brown)', borderRadius: 2 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brown)', marginBottom: 4 }}>Enforcement authority</p>
            <p style={{ fontSize: 12, color: 'var(--sand-dim)', lineHeight: 1.6 }}>{law.enforcer}</p>
          </div>
          {law.evidence.map((item, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--sand-dim)', paddingLeft: 12, borderLeft: '1px solid rgba(99,65,47,0.3)' }}>
              {item}
            </p>
          ))}
        </div>
      )}

      {law.links?.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {law.links.map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: '#7ab84e', textDecoration: 'none', letterSpacing: '0.06em' }}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}
            >
              ↗ {label}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export default function LegislationView() {
  return (
    <div className={styles.view}>
      <div className={styles.scroll}>
        <header className={styles.viewHeader}>
          <h2 className={styles.viewTitle}>Legislation</h2>
          <p className={styles.viewLead}>
            A legal framework exists to protect El Impenetrable and the Bermejo River. Understanding where the law applies — and where it is being violated — is central to this investigation.
          </p>
        </header>

        <div className={styles.lawGrid}>
          {LAWS.map((law, i) => <LawCard key={i} law={law} />)}
        </div>

        {/* Summary table */}
        <div style={{ marginBottom: 40 }}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 16 }}>Legal Status Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,65,47,0.4)' }}>
                  {['#', 'Law / Instrument', 'Year', 'Status', 'Text'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brown)', fontWeight: 'normal' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUMMARY.map(row => (
                  <tr key={row.num} style={{ borderBottom: '1px solid rgba(222,216,207,0.06)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--brown)', fontSize: 11 }}>{row.num}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--sand)' }}>
                      <span style={{ fontWeight: 'bold' }}>{row.code}</span>
                      <span style={{ color: 'var(--sand-dim)', marginLeft: 6 }}>{row.name}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--sand-dim)' }}>{row.year}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--sand-dim)', fontSize: 11 }}>{row.status}</span>
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <a href={row.url} target="_blank" rel="noreferrer"
                        style={{ color: '#7ab84e', fontSize: 11, textDecoration: 'none' }}
                        onMouseOver={e => e.target.style.textDecoration = 'underline'}
                        onMouseOut={e => e.target.style.textDecoration = 'none'}
                      >↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal standing */}
        <div className={styles.legalNote}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 12 }}>Legal Standing of Documented Violations</h3>
          <p className={styles.sectionBody}>
            The water extraction sites and contamination sources documented in this investigation constitute apparent violations of Ley 25.688 (water extraction without permits), ILO Convention 169 (no consultation with affected Indigenous communities), Ley 25.675 (no environmental impact assessment), and potentially Ley 24.051 (if industrial discharge qualifies as hazardous waste) and Ley 26.331 (if associated infrastructure involved native forest clearing).
          </p>
          <p className={styles.sectionBody} style={{ marginTop: 10 }}>
            The termination of Ley 26.160 in December 2024 has removed the last institutional shield protecting communities in the buffer zone from displacement, making the evidence compiled here both a forensic record and an urgent policy instrument.
          </p>
          <p className={styles.sectionBody} style={{ marginTop: 10 }}>
            Evidence compiled — including satellite imagery, GPS coordinates, water samples, photographic documentation, and testimonial records from affected communities — has been preserved in a form admissible under Argentine procedural law.
          </p>
        </div>

        <footer className={styles.viewFooter}>
          <p><em>Legal analysis conducted as part of master's thesis research. Not legal advice. For formal legal proceedings, consult qualified Argentine counsel.</em></p>
          <p style={{ marginTop: 8 }}>
            Sources: <a href="https://servicios.infoleg.gob.ar" target="_blank" rel="noreferrer">InfoLEG</a> · <a href="https://www.boletinoficial.gob.ar" target="_blank" rel="noreferrer">Boletín Oficial de la República Argentina</a> · <a href="https://www.argentina.gob.ar" target="_blank" rel="noreferrer">Argentina.gob.ar</a> · <a href="https://normlex.ilo.org" target="_blank" rel="noreferrer">ILO NORMLEX</a> · <a href="https://www.ohchr.org" target="_blank" rel="noreferrer">OHCHR</a> · Mongabay · Greenpeace Argentina · CELS · Cultural Survival · Agencia Tierra Viva · Informe Los Leandros "Expedición Bermejo" (Dec 2022) · Interview with local stakeholders, Rewilding Argentina community liaison (2025).
          </p>
        </footer>
      </div>
    </div>
  );
}
