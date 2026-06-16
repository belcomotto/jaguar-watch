import { useRef, useState, useEffect } from 'react';
import styles from './ContentView.module.css';
import { useLang } from '../context/LangContext';

const STATUS_COLORS = {
  green:  '#4caf50',
  orange: '#ffa500',
  red:    '#f44336',
};

const LAWS_EN = [
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
    images: [
      { src: '/images/legislation/native-forest-deforestation-povedano-2016.jpg', caption: 'Deforestation in Chaco and Formosa, 2016. Photo: Hernán Povedano.' },
      { src: '/images/legislation/native-forest-satellite-deforestation-1.png',   caption: 'Satellite image analysis of illegal selective deforestation in the El Impenetrable buffer zone.' },
      { src: '/images/legislation/native-forest-satellite-deforestation-2.png',   caption: 'Satellite image analysis of illegal selective deforestation in the El Impenetrable buffer zone.' },
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
    images: [
      { src: '/images/history/aug-2017-1.jpg', caption: 'August 25, 2017 — official inauguration of Parque Nacional El Impenetrable.' },
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
    images: [
      { src: '/images/legislation/env-water-rio-colorado.png',           caption: 'Rio Colorado outlet into the Bermejo' },
      { src: '/images/legislation/env-water-satellite-rio-colorado.png', caption: 'Satellite view of Rio Colorado outlet into the Bermejo' },
      { src: '/images/legislation/env-water-wasteland-bermejo.png',      caption: 'Wasteland in the shores of the Bermejo' },
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
    images: [
      { src: '/images/legislation/general-env-water-pump.png',         caption: 'Model of medium size water pump along the Bermejo' },
      { src: '/images/legislation/general-env-bermejo-green-2022.jpg', caption: 'Satellite image of the Bermejo turned green in November 2022' },
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
    images: [
      { src: '/images/legislation/hazardous-dead-boga.png', caption: 'Dead Boga — fish kill on the Bermejo' },
    ],
    links: [
      { label: 'Ley 24.051 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/450/texact.htm' },
    ],
  },
];

const LAWS_ES = [
  {
    code: 'Ley 26.331',
    title: 'Ley de Protección de Bosques Nativos (Ley de Bosques)',
    year: '2007',
    status: 'EN VIGOR — APLICACIÓN PARCIAL',
    statusColor: STATUS_COLORS.orange,
    body: 'La ley forestal emblema de Argentina exige que todas las provincias clasifiquen sus bosques nativos en tres categorías de conservación: Categoría I (rojo — sin intervención permitida), Categoría II (amarillo — solo uso sustentable, sin desmonte), y Categoría III (verde — transformación parcial permitida). Creó un fondo nacional para compensar a las provincias que conserven sus bosques nativos. La ley prohíbe el desmonte en zonas rojas y amarillas sin evaluación de impacto ambiental y exige una planificación participativa del uso del suelo a nivel provincial (Ordenamiento Territorial de Bosques Nativos, OTBN).',
    enforcer: 'Nacional: Dirección Nacional de Bosques, dependiente de la Secretaría de Política Ambiental en Recursos Naturales. El Ministerio de Ambiente fue disuelto en 2024; las funciones ambientales pasaron a la Secretaría de Turismo y Ambiente, Jefatura de Gabinete de Ministros. Provincial (Chaco): Dirección de Bosques del Chaco, dependiente del Ministerio de Producción. Provincial (Formosa): Dirección de Bosques de Formosa. Contacto: bosques@ambiente.gob.ar',
    evidence: [
      '5 millones de hectáreas de bosque del Gran Chaco fueron destruidas en las primeras dos décadas del siglo XXI. El Gran Chaco representa el 87% de toda la deforestación en Argentina (fuente: Ministerio de Ambiente de Argentina / Mongabay, 2020).',
      'Solo en 2024, Argentina perdió 149.649 hectáreas de bosque chaqueño, principalmente por agricultura e incendios (fuente: informe de Greenpeace Argentina, feb 2025 / Mongabay).',
      'El sistema de categorización es criticado por estar desactualizado y ser manipulable: los gobiernos provinciales pueden reclasificar zonas de bosque para permitir el desarrollo en áreas que deberían estar protegidas.',
      'En la provincia de Formosa, 99.522 hectáreas de bosque fueron desmontadas con maquinaria en cuatro años (Mongabay, 2020).',
      'La zona de amortiguamiento alrededor de El Impenetrable está clasificada bajo el OTBN chaqueño como prohibida para el desmonte con topadoras, pero permite la extracción selectiva (manejo silvopastoril). Observaciones de campo confirman que la tala selectiva a gran escala ocurre de forma continua alrededor del perímetro del parque, frecuentemente por operadores sin título sobre la tierra — una doble violación de la ley forestal y de la ley de propiedad.',
      'El fondo nacional de conservación establecido por la ley ha estado crónicamente subfinanciado, recibiendo una fracción del 0,3% del presupuesto nacional originalmente estipulado.',
    ],
    images: [
      { src: '/images/legislation/native-forest-deforestation-povedano-2016.jpg', caption: 'Deforestación en Chaco y Formosa, 2016. Foto: Hernán Povedano.' },
      { src: '/images/legislation/native-forest-satellite-deforestation-1.png',   caption: 'Análisis de imagen satelital de deforestación selectiva ilegal en la zona de amortiguamiento de El Impenetrable.' },
      { src: '/images/legislation/native-forest-satellite-deforestation-2.png',   caption: 'Análisis de imagen satelital de deforestación selectiva ilegal en la zona de amortiguamiento de El Impenetrable.' },
    ],
    links: [
      { label: 'Ley 26.331 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/135000-139999/136125/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-26331-136125' },
    ],
  },
  {
    code: 'Ley 26.996',
    title: 'Creación del Parque Nacional El Impenetrable',
    year: '2014 · inaugurado el 25 de agosto de 2017',
    status: 'EN VIGOR',
    statusColor: STATUS_COLORS.green,
    body: 'Aceptó la transferencia de dominio y jurisdicción de la Provincia del Chaco y creó el Parque Nacional El Impenetrable, protegiendo aproximadamente 130.000 hectáreas de bosque chaqueño seco entre los ríos Bermejo/Teuco y Bermejito. Aprobada por unanimidad en ambas cámaras del Congreso el 22 de octubre de 2014. El parque es administrado bajo el sistema de parques nacionales (Ley 22.351). Es el parque nacional más grande del norte argentino.',
    enforcer: 'Administración de Parques Nacionales (APN) · Presidente: Arq. Sergio Martín Álvarez (Decreto 380/2025, desde junio de 2025, ad honorem) · Vicepresidente: Abg. Pablo Leandro Ciocchini (Decreto 48/2026) · Contacto: sprivada@apn.gob.ar · En el territorio: Rewilding Argentina opera bajo un acuerdo de conservación y monitoreo con la APN.',
    evidence: [
      'El parque fue creado a partir de las tierras expropiadas del lado chaqueño de la ex Estancia La Fidelidad (Ley provincial 6928/2011, expropiación; Ley 26.996/2014, designación como parque nacional).',
      'El lado formoseño — aproximadamente 100.000 hectáreas de la estancia La Fidelidad original — permanece en manos de herederos, todavía enredado en sucesiones judiciales. Rewilding Argentina está buscando adquirirlo. Sin ese territorio, el parque carece del corredor ecológico completo que su propia legislación prevé.',
      'La APN no pudo ingresar formalmente al territorio hasta abril de 2017 por bloqueos judiciales. La llegada de guardaparques uniformados fue vivida como abrupta por las comunidades locales.',
      'La actual administración de la APN (bajo Álvarez, designado por Milei) lleva adelante una estrategia orientada a la privatización enfocada en la generación de ingresos por turismo, lo que crea tensión con la misión de conservación e integración comunitaria del parque.',
      'Los guardaparques tienen la autoridad legal para fiscalizar, pero su capacidad es limitada en comparación con parques como Iguazú. No hay presencia de Prefectura Naval ni de Gendarmería en el Bermejo dentro de los límites del parque por la ausencia de puertos formales.',
    ],
    images: [
      { src: '/images/history/aug-2017-1.jpg', caption: '25 de agosto de 2017 — inauguración oficial del Parque Nacional El Impenetrable.' },
    ],
    links: [
      { label: 'Ley 26.996 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/238864/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-26996' },
    ],
  },
  {
    code: 'Ley 25.688',
    title: 'Ley de Gestión Ambiental de Aguas (Régimen de Gestión Ambiental de Aguas)',
    year: '2002',
    status: 'EN VIGOR — VIOLADA',
    statusColor: STATUS_COLORS.red,
    body: 'Establece presupuestos mínimos ambientales para la preservación, aprovechamiento y uso racional del agua. Declara a las cuencas hidrológicas como unidades indivisibles de gestión ambiental. Crea comités de cuenca interjurisdiccionales. El artículo 6 exige permiso de la autoridad competente para cualquier extracción de agua.',
    enforcer: 'Nacional: Instituto Nacional del Agua (INA) — ina@ina.gob.ar · Autoridad de cuenca: COIRSA — Comité Interjurisdiccional del Río Bermejo (ver entrada #7) · Provincial (Chaco): Administración Provincial del Agua (APA) · Provincial (Formosa): Unidad Provincial Coordinadora del Agua (UPCA)',
    evidence: [
      'Nivel 1 — Gran infraestructura provincial (sancionada por el Estado sin evaluación): La derivación de Ingeniero Juárez (Formosa) canaliza el propio Bermejo hacia un lago de meandro (madrejón) donde una estación de bombeo permanente extrae agua a través del Canal Santa Rita y el Arroyo Teuquito. El complejo de Laguna Yema capta agua del Bermejo vía canal, alimentando un canal revestido de hormigón de 90 km hasta Las Lomitas. El gobierno provincial de Formosa lo llama "la obra más importante de la cuenca del Bermejo". Su impacto hidrológico acumulado nunca fue evaluado bajo la Ley 25.688, que exige revisión ambiental federal para uso interjurisdiccional significativo de agua.',
      'Nivel 2 — Bombas municipales/comunitarias: Pueblos y parajes a lo largo del río — Fortín Belgrano, El Tartagal, Tres Pozos, Sauzalito, Sumayen, Wichí Pintado — operan pequeñas estaciones de bombeo que funcionan las 24 horas, abasteciendo agua potable. Son semiformales; cubren necesidades básicas pero operan sin permisos federales.',
      'Nivel 3 — Extracción privada: Pequeñas bombas y mangueras dispersas a lo largo de la ribera que abastecen ranchos privados para consumo doméstico y producción ganadera. Sin permisos, sin registro, sin monitoreo.',
      'Contaminación aguas arriba (Salta): El Ingenio San Martín del Tabacal (propiedad de Seaboard Corporation, marca "Chango") descarga residuos industriales a través de un canal con fuerte olor putrefacto y color blanquecino directamente en el Río Colorado, justo antes de su confluencia con el Bermejo. El ingenio también mantiene piletas de agua negra (piletones) a metros de la planicie de inundación del Bermejo, que desbordan al río durante las crecidas. La Asociación de Pescadores del Río Bermejo denunció formalmente la derivación de tres ríos tributarios (Río Blanco, Río Pescado, Río Santa María) por la empresa azucarera. La secretaría provincial de ambiente de Salta tomó muestras tras una mortandad de peces masiva y un evento de cianobacterias en 2022. Los resultados nunca fueron publicados.',
    ],
    images: [
      { src: '/images/legislation/env-water-rio-colorado.png',           caption: 'Salida del Río Colorado al Bermejo' },
      { src: '/images/legislation/env-water-satellite-rio-colorado.png', caption: 'Vista satelital de la salida del Río Colorado al Bermejo' },
      { src: '/images/legislation/env-water-wasteland-bermejo.png',      caption: 'Zona degradada en las orillas del Bermejo' },
    ],
    links: [
      { label: 'Ley 25.688 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/80000-84999/81032/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-25688-81032/texto' },
    ],
  },
  {
    code: 'Ley 25.675',
    title: 'Ley General del Ambiente',
    year: '2002',
    status: 'EN VIGOR — APLICACIÓN SELECTIVA',
    statusColor: STATUS_COLORS.orange,
    body: 'Ley marco ambiental fundacional de Argentina, que provee la base constitucional (artículo 41) para toda la legislación ambiental. Establece el principio precautorio, el principio contaminador-pagador, la evaluación de impacto ambiental obligatoria para cualquier actividad con efectos ambientales significativos, el acceso ciudadano a la información ambiental y el derecho a participar en las decisiones sobre el uso de los recursos. Está por encima de la ley específica de aguas (25.688) y de la ley forestal (26.331) y le da a todo el marco protector su columna vertebral legal.',
    enforcer: 'Secretaría de Turismo y Ambiente, Jefatura de Gabinete de Ministros (funciones ambientales absorbidas tras la disolución del Ministerio de Ambiente) · Contacto: ambiente@jefatura.gob.ar',
    evidence: [
      'Las operaciones de la industria azucarera aguas arriba en el Bermejo implican instalación de infraestructura, desvío de afluentes y descarga de residuos industriales — todas actividades que requieren evaluación de impacto ambiental bajo esta ley. Ninguna evaluación ha sido puesta a disposición del público.',
      'Las instalaciones de bombeo documentadas en esta investigación involucran infraestructura permanente o semipermanente en riberas que afectan un curso de agua de importancia nacional. No se realizó ninguna revisión ambiental.',
      'La crisis de cianobacterias de 2022 — confirmada por múltiples comunidades a lo largo de 300 km de río, causando enfermedades gastrointestinales y una mortandad masiva de peces — generó la recolección de muestras por parte de la secretaría provincial de ambiente de Salta. Los resultados nunca fueron publicados, violando el principio de acceso público a la información ambiental de la ley (artículo 16).',
    ],
    images: [
      { src: '/images/legislation/general-env-water-pump.png',         caption: 'Modelo de bomba de agua de tamaño mediano a orillas del Bermejo' },
      { src: '/images/legislation/general-env-bermejo-green-2022.jpg', caption: 'Imagen satelital del Bermejo que se tiñó de verde en noviembre de 2022' },
    ],
    links: [
      { label: 'Ley 25.675 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/75000-79999/79980/norma.htm' },
      { label: 'Argentina.gob.ar', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-25675-79980' },
    ],
  },
  {
    code: 'ILO Convention 169',
    title: 'Convenio sobre Pueblos Indígenas y Tribales',
    year: '1989 · ratificado por Argentina en 2000 (Ley 24.071)',
    status: 'RATIFICADA — VIOLADA EN ESTE CASO',
    statusColor: STATUS_COLORS.red,
    body: 'Garantiza a los pueblos indígenas el derecho a la consulta libre, previa e informada sobre cualquier proyecto que afecte sus territorios, recursos y medios de vida. Exige a los gobiernos reconocer los derechos de los pueblos indígenas sobre sus tierras, proteger su ambiente y garantizar su participación en las decisiones sobre el uso de los recursos. Es derecho internacional vinculante.',
    enforcer: 'Nacional: Instituto Nacional de Asuntos Indígenas (INAI) · Presidente: Claudio Avruj (designado en 2024) · Contacto: inai@jus.gov.ar · Supervisión internacional: Comité de Expertos en Aplicación de Convenios y Recomendaciones de la OIT. Nota: el registro nacional indígena (RENACI) del INAI fue disuelto por Resolución 53/2024 en septiembre de 2024. En enero de 2026, el INAI creó un nuevo sistema (SRARP, Resolución 228/2025) para centralizar peticiones de reclamantes no indígenas — creando efectivamente un mecanismo institucional que prioriza los derechos de propiedad privada por sobre los derechos territoriales indígenas.',
    evidence: [
      'El Chaco argentino es hogar de aproximadamente 200.000 personas indígenas de nueve pueblos diferentes, predominantemente Wichí y Qom (fuente: Greenpeace Argentina).',
      'El Río Bermejo es central para el acceso al agua, la pesca y los ciclos agrícolas de estas comunidades. La extracción de agua afecta directamente sus medios de vida.',
      'No se realizó ningún proceso de consulta formal para ninguno de los sitios de bombeo documentados en esta investigación.',
      'El gobierno de Milei disolvió el registro nacional indígena (RENACI) en septiembre de 2024 y puso fin a la protección de emergencia territorial (Ley 26.160) en diciembre de 2024, desmantelando sistemáticamente la infraestructura institucional a través de la cual normalmente se realizaría la consulta.',
      'El Comité de Expertos de la OIT y la Corte Interamericana de Derechos Humanos han reafirmado reiteradamente que las obligaciones del Convenio 169 persisten independientemente de los cambios administrativos domésticos.',
    ],
    links: [
      { label: 'ILO C169 full text — NORMLEX', url: 'https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:55:0::NO::P55_TYPE%2CP55_LANG%2CP55_DOCUMENT%2CP55_NODE:REV%2Cen%2CC169%2C%2FDocument' },
      { label: 'OHCHR', url: 'https://www.ohchr.org/en/instruments-mechanisms/instruments/indigenous-and-tribal-peoples-convention-1989-no-169' },
      { label: 'Ratificación argentina — Ley 24.071 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/1541/norma.htm' },
    ],
  },
  {
    code: 'Ley 26.160',
    title: 'Ley de Emergencia en Materia de Posesión y Propiedad de Tierras Indígenas (Emergencia Territorial Indígena)',
    year: '2006',
    status: '⚠ DEROGADA — Decreto 1083/2024',
    statusColor: STATUS_COLORS.red,
    body: 'Declaró la emergencia nacional en materia de posesión y propiedad de las tierras ocupadas tradicionalmente por comunidades indígenas. Suspendió todos los desalojos mientras el Estado realizaba un relevamiento formal de demarcación de tierras (relevamiento técnico-jurídico-catastral). Creó un fondo especial para el proceso. Extendida cuatro veces (2009, 2013, 2017, 2021) porque el relevamiento nunca fue completado.',
    enforcer: 'Derogada por el Decreto 1083/2024, firmado el 10 de diciembre de 2024 (Día de los Derechos Humanos), por el Presidente Javier Milei y el gabinete completo: Guillermo Francos, Gerardo Werthein, Luis Petri, Luis Caputo, Mariano Cúneo Libarona, Patricia Bullrich, Mario Lugones, Sandra Pettovello, Federico Sturzenegger.',
    evidence: [
      'La ley estuvo vigente durante 18 años. El relevamiento que mandataba nunca fue completado — dejando miles de comunidades en un limbo jurídico.',
      'El propio decreto del gobierno de Milei reconoce más de 250 conflictos territoriales activos, pero pone fin a las protecciones de todos modos, señalando que la suspensión de los desalojos causaba "grave daño a los derechos de propiedad de legítimos propietarios".',
      'En la zona de amortiguamiento de El Impenetrable, la población más expuesta son los criollos que viven en tierras fiscales (tierras del Estado) — que históricamente fueron incentivados para poblar pero donde nunca se transfirieron títulos formales. Estas familias han ocupado la tierra por generaciones pero no tienen documentación legal. Ahora son vulnerables al desplazamiento por parte de operadores sojeros u otros intereses agrícolas.',
      'La derogación de esta ley, combinada con la disolución del RENACI, significa que no queda ningún mecanismo institucional para prevenir desalojos ni para completar el relevamiento territorial.',
      'Juristas y el CELS (Centro de Estudios Legales y Sociales) señalan que el Convenio 169 de la OIT y el fallo de la Corte Interamericana de 2020 sobre titulación de tierras comunales siguen siendo vinculantes independientemente del decreto — lo que significa que la derogación puede ser impugnada internacionalmente.',
    ],
    links: [
      { label: 'Ley 26.160 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/120000-124999/122499/texact.htm' },
      { label: 'Decreto 1083/2024 — Boletín Oficial', url: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/317918/20241210' },
    ],
  },
  {
    code: 'COIRSA',
    title: 'Comité Interjurisdiccional del Río Bermejo',
    year: 'Establecido en 1994 — Tratado de la Cuenca del Río Bermejo',
    status: 'ACTIVA — BRECHAS DE APLICACIÓN',
    statusColor: STATUS_COLORS.orange,
    body: 'Coordina el uso del agua, la navegación y la gestión ambiental de las cuencas del Bermejo y el Pilcomayo. Cualquier extracción significativa de agua del Bermejo requiere la aprobación de COIRSA. Mantiene estaciones de monitoreo a lo largo del río.',
    enforcer: 'Organismo binacional: Argentina y Bolivia. La parte argentina está representada a través del Ministerio de Relaciones Exteriores y el Instituto Nacional del Agua (INA). Participan delegados provinciales de Chaco, Formosa, Salta y Jujuy.',
    evidence: [
      'COIRSA tiene poder consultivo pero no capacidad de aplicación independiente — puede derivar, recomendar y monitorear, pero no puede sancionar a los infractores.',
      'No hay puertos en funcionamiento en el Bermejo argentino, por lo que la Prefectura Naval (policía fluvial) no tiene presencia establecida.',
      'La Gendarmería Nacional tiene jurisdicción en tierra pero no está desplegada consistentemente en la zona de amortiguamiento de El Impenetrable.',
      'Las expediciones de campo en diciembre de 2022 navegaron 300 km del Bermejo desde Salta hasta Chaco sin encontrar ningún agente de las fuerzas de seguridad en el río en ningún momento.',
      'El resultado práctico: el río está efectivamente sin patrullaje. La pesca, la caza, la extracción de madera y las derivaciones de agua ocurren sin supervisión alguna. Los trabajadores de campo en la zona describen al territorio como portando todavía la percepción de tierra de nadie.',
    ],
    links: [
      { label: 'coirsa.org.ar', url: 'http://www.coirsa.org.ar' },
    ],
  },
  {
    code: 'Ley 24.051',
    title: 'Ley de Residuos Peligrosos',
    year: '1992',
    status: 'EN VIGOR — POSIBLEMENTE VIOLADA',
    statusColor: STATUS_COLORS.orange,
    body: 'Regula la generación, manejo, transporte, tratamiento y disposición final de residuos peligrosos. Exige a los generadores registrarse ante las autoridades, llevar registros y garantizar el tratamiento adecuado. Establece responsabilidad penal por contaminación que cause daño a la salud humana o al ambiente.',
    enforcer: 'Secretaría de Turismo y Ambiente (ex Ministerio de Ambiente) · Autoridades ambientales provinciales de Salta, Chaco y Formosa.',
    evidence: [
      'El Ingenio San Martín del Tabacal (Seaboard Corporation) mantiene piletas de agua negra (piletones de agua negra) a metros de la planicie de inundación del Río Bermejo. Residentes locales reportan que durante las crecidas, estas piletas desbordan directamente al río.',
      'El canal de descarga documentado en diciembre de 2022 transportaba residuos con fuerte olor putrefacto y color blanquecino, característico del efluente industrial del procesamiento de azúcar (vinaza).',
      'El Río San Francisco, un importante afluente del Bermejo, pasa por el Ingenio Ledesma, el más grande de Salta. Pescadores locales reportan que el río ya no tiene peces y que eventos de mortandad masiva ocurren varias veces al año cerca de su confluencia con el Bermejo.',
      'Si el efluente cumple con la definición de residuo peligroso según los anexos de la ley (que incluyen sustancias con características ecotóxicas o patogénicas), la descarga constituye una violación que conlleva sanciones penales.',
      'Las muestras ambientales provinciales recolectadas tras el evento de cianobacterias de 2022 permanecen sin publicar.',
    ],
    images: [
      { src: '/images/legislation/hazardous-dead-boga.png', caption: 'Boga muerta — mortandad de peces en el Bermejo' },
    ],
    links: [
      { label: 'Ley 24.051 — InfoLEG', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/450/texact.htm' },
    ],
  },
];

const SUMMARY_EN = [
  { num: 1, code: 'Ley 26.331', name: 'Ley de Bosques',       year: 2007, status: 'IN FORCE — PARTIALLY ENFORCED',   color: STATUS_COLORS.orange },
  { num: 2, code: 'Ley 26.996', name: 'Parque Nacional',      year: 2014, status: 'IN FORCE',                         color: STATUS_COLORS.green  },
  { num: 3, code: 'Ley 25.688', name: 'Aguas',                year: 2002, status: 'IN FORCE — VIOLATED',              color: STATUS_COLORS.red    },
  { num: 4, code: 'Ley 25.675', name: 'Ambiente General',     year: 2002, status: 'IN FORCE — SELECTIVELY APPLIED',   color: STATUS_COLORS.orange },
  { num: 5, code: 'ILO C169',   name: 'Pueblos Indígenas',    year: 2000, status: 'RATIFIED — VIOLATED',              color: STATUS_COLORS.red    },
  { num: 6, code: 'Ley 26.160', name: 'Tierras Indígenas',    year: 2006, status: '⚠ TERMINATED Dec 2024',           color: STATUS_COLORS.red    },
  { num: 7, code: 'COIRSA',     name: 'Comité Bermejo',       year: 1994, status: 'ACTIVE — ENFORCEMENT GAPS',        color: STATUS_COLORS.orange },
  { num: 8, code: 'Ley 24.051', name: 'Residuos Peligrosos',  year: 1992, status: 'IN FORCE — POTENTIALLY VIOLATED',  color: STATUS_COLORS.orange },
];

const SUMMARY_ES = [
  { num: 1, code: 'Ley 26.331', name: 'Ley de Bosques',       year: 2007, status: 'EN VIGOR — APLICACIÓN PARCIAL',   color: STATUS_COLORS.orange },
  { num: 2, code: 'Ley 26.996', name: 'Parque Nacional',      year: 2014, status: 'EN VIGOR',                         color: STATUS_COLORS.green  },
  { num: 3, code: 'Ley 25.688', name: 'Aguas',                year: 2002, status: 'EN VIGOR — VIOLADA',               color: STATUS_COLORS.red    },
  { num: 4, code: 'Ley 25.675', name: 'Ambiente General',     year: 2002, status: 'EN VIGOR — APLICACIÓN SELECTIVA',  color: STATUS_COLORS.orange },
  { num: 5, code: 'ILO C169',   name: 'Pueblos Indígenas',    year: 2000, status: 'RATIFICADA — VIOLADA',             color: STATUS_COLORS.red    },
  { num: 6, code: 'Ley 26.160', name: 'Tierras Indígenas',    year: 2006, status: '⚠ DEROGADA Dic 2024',             color: STATUS_COLORS.red    },
  { num: 7, code: 'COIRSA',     name: 'Comité Bermejo',       year: 1994, status: 'ACTIVA — BRECHAS DE APLICACIÓN',   color: STATUS_COLORS.orange },
  { num: 8, code: 'Ley 24.051', name: 'Residuos Peligrosos',  year: 1992, status: 'EN VIGOR — POSIBLEMENTE VIOLADA',  color: STATUS_COLORS.orange },
];

const UI = {
  en: {
    title: 'Legislation',
    lead: 'A legal framework exists to protect El Impenetrable and the Bermejo River. Understanding where the law applies — and where it is being violated — is central to this investigation.',
    summaryTitle: 'Legal Status Summary',
    summaryHint: 'Click a row to jump to its detail.',
    tableHeaders: ['#', 'Law / Instrument', 'Year', 'Status'],
    detailsBtn: 'Enforcement & evidence',
    hideBtn: 'Hide details',
    enforcement: 'Enforcement authority',
    standingTitle: 'Legal Standing of Documented Violations',
    standingBody1: 'The water extraction sites and contamination sources documented in this investigation constitute apparent violations of Ley 25.688 (water extraction without permits), ILO Convention 169 (no consultation with affected Indigenous communities), Ley 25.675 (no environmental impact assessment), and potentially Ley 24.051 (if industrial discharge qualifies as hazardous waste) and Ley 26.331 (if associated infrastructure involved native forest clearing).',
    standingBody2: 'The termination of Ley 26.160 in December 2024 has removed the last institutional shield protecting communities in the buffer zone from displacement, making the evidence compiled here both a forensic record and an urgent policy instrument.',
    standingBody3: 'Evidence compiled — including satellite imagery, GPS coordinates, water samples, photographic documentation, and testimonial records from affected communities — has been preserved in a form admissible under Argentine procedural law.',
    footerDisclaimer: "Legal analysis conducted as part of master's thesis research. Not legal advice. For formal legal proceedings, consult qualified Argentine counsel.",
    footerSources: 'Sources:',
  },
  es: {
    title: 'Legislación',
    lead: 'Existe un marco legal para proteger El Impenetrable y el Río Bermejo. Comprender dónde se aplica la ley — y dónde está siendo violada — es central para esta investigación.',
    summaryTitle: 'Resumen de Estado Legal',
    summaryHint: 'Hacé clic en una fila para ir a su detalle.',
    tableHeaders: ['#', 'Ley / Instrumento', 'Año', 'Estado'],
    detailsBtn: 'Aplicación y evidencia',
    hideBtn: 'Ocultar detalles',
    enforcement: 'Autoridad de aplicación',
    standingTitle: 'Fundamento Legal de las Violaciones Documentadas',
    standingBody1: 'Los sitios de extracción de agua y las fuentes de contaminación documentadas en esta investigación constituyen aparentes violaciones a la Ley 25.688 (extracción de agua sin permisos), el Convenio 169 de la OIT (sin consulta a las comunidades indígenas afectadas), la Ley 25.675 (sin evaluación de impacto ambiental), y potencialmente la Ley 24.051 (si las descargas industriales califican como residuos peligrosos) y la Ley 26.331 (si la infraestructura asociada implicó desmonte de bosque nativo).',
    standingBody2: 'La derogación de la Ley 26.160 en diciembre de 2024 eliminó el último escudo institucional que protegía a las comunidades de la zona de amortiguamiento del desplazamiento, convirtiendo la evidencia aquí compilada en tanto un registro forense como un instrumento de política urgente.',
    standingBody3: 'La evidencia recopilada — incluyendo imágenes satelitales, coordenadas GPS, muestras de agua, documentación fotográfica y registros testimoniales de comunidades afectadas — ha sido preservada en una forma admisible bajo el derecho procesal argentino.',
    footerDisclaimer: 'Análisis legal realizado en el marco de investigación de tesis de maestría. No constituye asesoramiento legal. Para procedimientos judiciales formales, consultá a un abogado argentino calificado.',
    footerSources: 'Fuentes:',
  },
};

function LawCard({ law, id, onImageClick, t }) {
  const [open, setOpen] = useState(false);
  return (
    <article id={id} className={styles.lawCard}>
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

      {law.images?.length > 0 && (
        <div className={styles.imgStrip} style={{ marginTop: 14, marginBottom: 4 }}>
          {law.images.map((img, j) => (
            <img
              key={j}
              src={img.src}
              alt={img.caption}
              className={styles.imgStripItem}
              loading="lazy"
              onClick={() => onImageClick(img)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: open ? 'var(--sand)' : 'var(--brown)',
          padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {open ? '▲' : '▼'} {open ? t.hideBtn : t.detailsBtn}
      </button>

      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.02)', borderLeft: '2px solid var(--brown)', borderRadius: 2 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brown)', marginBottom: 4 }}>{t.enforcement}</p>
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

const CONTENT_TAB = {
  position: 'fixed', top: '50%', transform: 'translateY(-50%)',
  zIndex: 11, width: 22, height: 56,
  background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
  borderLeft: 'none', borderRadius: '0 5px 5px 0',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', backdropFilter: 'blur(12px)',
  boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
  fontSize: 14, color: 'var(--brown)', userSelect: 'none',
  padding: 0, transition: 'left 0.28s ease',
};

export default function LegislationView() {
  const scrollRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { lang } = useLang();
  const t    = UI[lang]      ?? UI.en;
  const laws = lang === 'es' ? LAWS_ES    : LAWS_EN;
  const summary = lang === 'es' ? SUMMARY_ES : SUMMARY_EN;

  useEffect(() => { setZoomed(false); }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  function scrollToLaw(num) {
    const el = document.getElementById(`law-${num}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
    <div className={`${styles.view}${collapsed ? ` ${styles.viewCollapsed}` : ''}`}>
      <div className={styles.scroll} ref={scrollRef}>
        <header className={styles.viewHeader}>
          <h2 className={styles.viewTitle}>{t.title}</h2>
          <p className={styles.viewLead}>{t.lead}</p>
        </header>

        <div style={{ marginBottom: 48 }}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 4 }}>{t.summaryTitle}</h3>
          <p style={{ fontSize: 11, color: 'var(--sand-dim)', fontStyle: 'italic', marginBottom: 14 }}>{t.summaryHint}</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,65,47,0.4)' }}>
                  {t.tableHeaders.map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brown)', fontWeight: 'normal' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map(row => (
                  <tr
                    key={row.num}
                    onClick={() => scrollToLaw(row.num)}
                    style={{ borderBottom: '1px solid rgba(222,216,207,0.06)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(222,216,207,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '9px 10px', color: 'var(--brown)', fontSize: 11 }}>{row.num}</td>
                    <td style={{ padding: '9px 10px', color: 'var(--sand)' }}>
                      <span style={{ fontWeight: 'bold' }}>{row.code}</span>
                      <span style={{ color: 'var(--sand-dim)', marginLeft: 6 }}>{row.name}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: 'var(--sand-dim)' }}>{row.year}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--sand-dim)', fontSize: 11 }}>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.lawGrid}>
          {laws.map((law, i) => <LawCard key={i} law={law} id={`law-${i + 1}`} onImageClick={setLightbox} t={t} />)}
        </div>

        <div className={styles.legalNote}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 12 }}>{t.standingTitle}</h3>
          <p className={styles.sectionBody}>{t.standingBody1}</p>
          <p className={styles.sectionBody} style={{ marginTop: 10 }}>{t.standingBody2}</p>
          <p className={styles.sectionBody} style={{ marginTop: 10 }}>{t.standingBody3}</p>
        </div>

        <footer className={styles.viewFooter}>
          <p><em>{t.footerDisclaimer}</em></p>
          <p style={{ marginTop: 8 }}>
            {t.footerSources} <a href="https://servicios.infoleg.gob.ar" target="_blank" rel="noreferrer">InfoLEG</a> · <a href="https://www.boletinoficial.gob.ar" target="_blank" rel="noreferrer">Boletín Oficial de la República Argentina</a> · <a href="https://www.argentina.gob.ar" target="_blank" rel="noreferrer">Argentina.gob.ar</a> · <a href="https://normlex.ilo.org" target="_blank" rel="noreferrer">ILO NORMLEX</a> · <a href="https://www.ohchr.org" target="_blank" rel="noreferrer">OHCHR</a> · Mongabay · Greenpeace Argentina · CELS · Cultural Survival · Agencia Tierra Viva · Informe Los Leandros "Expedición Bermejo" (Dic 2022) · Entrevistas con actores locales, enlace comunitario Rewilding Argentina (2025).
          </p>
        </footer>
      </div>
    </div>

    {lightbox && (
      <div className={styles.lightbox} onClick={() => setLightbox(null)}>
        <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
        <div
          className={styles.lightboxInner}
          style={zoomed ? { overflow: 'auto', maxWidth: '90vw', maxHeight: '90vh' } : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {lightbox.caption && !zoomed && (
            <p className={styles.lightboxCaption}>{lightbox.caption}</p>
          )}
          <img
            src={lightbox.src}
            alt="Expanded view"
            className={styles.lightboxImg}
            style={{
              maxWidth:  zoomed ? 'none' : undefined,
              maxHeight: zoomed ? 'none' : undefined,
              cursor: zoomed ? 'zoom-out' : 'zoom-in',
            }}
            onClick={() => setZoomed(z => !z)}
          />
        </div>
      </div>
    )}

    <button
      onClick={() => setCollapsed(c => !c)}
      style={{ ...CONTENT_TAB, left: collapsed ? '4px' : '50vw' }}
      title={collapsed ? 'Expand panel' : 'Collapse panel'}
    >
      {collapsed ? '›' : '‹'}
    </button>
    </>
  );
}
