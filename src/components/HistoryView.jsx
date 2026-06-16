import { useState, useEffect } from 'react';
import styles from './ContentView.module.css';
import { useLang } from '../context/LangContext';

const SECTIONS_EN = [
  {
    year: 'Pre-Colonial',
    title: 'The People of the Bermejo',
    body: `Long before the Chaco had a name on any map, the Wichí, Qom (Toba), and Moqoit peoples shaped their lives around its rhythms. The Bermejo River was not a boundary — it was the pulse of everything: food, mobility, ceremony, memory. The dry Chaco they inhabited was one of South America's largest continuous forests, a landscape of extremes that demanded deep knowledge to survive and offered extraordinary richness in return. That knowledge is still here. It never left.`,
    images: [
      { src: '/images/history/pre-colonial-1.jpeg', caption: 'El Impenetrable — historical photograph. Photo: Sebastián DM. Fundación Rewilding Argentina.' },
      { src: '/images/history/pre-colonial-2.jpg',  caption: '"Rio Vermejo — Indians Fishing." Wood engraving depicting Toba people fishing with bows while the US Navy steamship Water Witch is moored in the background during the 1854 expedition. Published in: Page, Thomas Jefferson. La Plata, the Argentine Confederation, and Paraguay. New York: Harper & Brothers, 1859, p. 249.' },
    ],
  },
  {
    year: '1872',
    title: 'The Land Is Given Away',
    body: `The origins of La Fidelidad date to 1872, when the estate was handed by the Saltean government — at the time there was no province of Chaco — to Natalio Roldán, a Buenos Aires merchant, in recognition of his role navigating and exploring the Teuco River. It was a reward for conquest dressed up as discovery. The land was never empty.\n\nChaco was among the last Argentine provinces to be formally constituted, partly because of the persistent presence of its Indigenous inhabitants. As the state began pushing for productive settlement, it started granting land to settlers from neighboring provinces. The region became populated by criollos and "gringos" - migrants that local community liaisons working in the area describe vividly: Germans, Ukrainians, Czechs, arriving in successive waves, settling mostly around Castelli,the gateway town to El Impenetrable, and the largest population center in that part of Chaco.`,
    images: [
      { src: '/images/history/1872-1.jpg', caption: 'Plano del Río Bermejo desde sus cabezeras hasta su desagüe en el del Paraguay, navegado y reconocido en 1826 por Pablo Soria. Buenos Aires, 10 October 1831. Archivo General de la Nación (AGN), División Cartografía, II-230.' },
      { src: '/images/history/1872-2.jpg', caption: 'Plano del Río Bermejo por Nicolás Descalzi. Lithograph. Buenos Aires, 15 December 1831 (expedition conducted 1826). Includes vignettes of Toba ceremonies, indigenous fishing, and an inset of the Salto de Yzó. Archivo General de la Nación (AGN), División Cartografía, II-228.' },
      { src: '/images/history/1872-3.jpg', caption: '"Expedicionarios del Chaco." Colección Witcomb, No. 602. c. 1890s–1900s. Photograph by Alexander Spiers Witcomb. Archivo General de la Nación (AGN), Departamento de Documentos Fotográficos, Buenos Aires.' },
    ],
  },
  {
    year: 'Early 20th Century',
    title: 'Bunge & Born and the Extraction Economy',
    body: `The estate passed to Jorge Born of the agro-industrial giant Bunge & Born, who ran it as a private *estancia*: cattle, timber, cotton, corrals, infrastructure pushed into the monte. When it stopped being profitable, they traded it to Italian brothers from the textile industry — Luis and Manuel Roseo — who acquired it in the early 1970s. Under the Roseos, the land became something between a private fiefdom and a forgotten territory. Local criollos and originarios recall going to hunt — guazuncho, tapir, quirquincho, to fish the Bermejo — with a quiet understanding that the land belonged to nobody in particular. *Tierra de nadie*, as those who have worked closely with these communities describe it.`,
    images: [
      { src: '/images/history/early-20th-1.jpg', caption: 'Quebracho obraje — oxen, logs, and camp sheds, Gran Chaco. c. 1900–1930. Archive no. 129468. The image documents the extractive tannin and timber industry that drove large-scale deforestation across the Chaco. Repository unconfirmed; likely Archivo General de la Nación (AGN), Departamento de Documentos Fotográficos.' },
      { src: '/images/history/early-20th-2.jpg', caption: 'Quebracho obraje — field of felled logs, Gran Chaco. c. 1900–1930. Archive no. 150387. An estimated 150 million quebracho trees were felled during this period by companies such as La Forestal, using indigenous and migrant labour under harsh conditions. Repository unconfirmed; likely Archivo General de la Nación (AGN).' },
      { src: '/images/history/early-20th-3.jpg', caption: 'Small steam launch navigating a narrow, densely vegetated Chaco river channel. c. 1890s–1910s. Photograph. Possible vessel: vapor Bolivia, employed in Argentine Chaco and Pilcomayo river exploration from the 1890s onward. Source and repository unconfirmed.' },
      { src: '/images/history/early-20th-4.jpg', caption: 'Official seal of the Compañía de Navegación a Vapor del Río Bermejo. c. 1869–1880. The company was founded by Natalio Roldán and Francisco G. Molina, incorporated under Ley Nacional No. 354 (1869), to open the Río Bermejo to commercial navigation and colonize the Gran Chaco. Source: Historia de la navegación del río Bermejo, Yumpu doc. 63329720.' },
      { src: '/images/history/early-20th-5.jpg', caption: 'River steamer on the Bermejo, early 20th century. Photograph of a multi-deck shallow-draft river steamer characteristic of the Compañía Oficial de Navegación del Río Bermejo. Source: Historia de la navegación del río Bermejo, Yumpu doc. 63329720. Original archival source unconfirmed.' },
      { src: '/images/history/early-20th-6.jpg', caption: 'El vapor "114 B.", descargando mercaderías en puerto Presidente Roca, sobre el Bermejo navegable. c. 1910s–1930s. Photograph of a flat-bottomed Bermejo steamer unloading cargo at Presidencia Roca, Chaco Province. Source: Historia de la navegación del río Bermejo, Yumpu doc. 63329720. Original publication unconfirmed.' },
    ],
  },
  {
    year: 'January 13, 2011',
    title: 'The Murder That Changed Everything',
    body: `On January 13, 2011, in the town of Juan José Castelli, Manuel Roseo — 75 years old — and his sister-in-law Nelly Bartolomé — 73 years old, widow of his brother — were tortured and murdered by a criminal organization seeking to seize the estate, valued at 250 million dollars. The group was linked to a network of notaries, lawyers, and businesspeople who had fraudulently sold parcels of the estate to multinational grain companies without the owner's knowledge or consent.\n\nRoseo had no recognized children. He had refused all offers to sell. After the murders, the land entered a complex inheritance dispute — and simultaneously, something shifted in the conservation world. The crime had made the land visible. Environmental organizations, writers, and activists mobilized immediately. What had been a decades-long conservationist dream suddenly had political momentum.`,
    images: [
      { src: '/images/history/jan-2011-1.png', caption: 'Estancia La Fidelidad — the estate that would become El Impenetrable National Park.' },
      { src: '/images/history/jan-2011-2.jpg', caption: 'El Impenetrable — today a national park, opened to its first visitors in 2017. Photo: Florian von der Fecht, August 2023.' },
    ],
  },
  {
    year: '2011–2014',
    title: 'The Long Push to Create a Park',
    body: `On August 5, 2011, then-governor Jorge Capitanich announced the expropriation process to transform La Fidelidad into a national park. It wasn't straightforward. The inheritance dispute dragged through the courts. Heirs appeared. Injunctions were filed. The process that should have taken months took years.\n\nThrough it all, a coalition held it together: environmental NGOs, the organizations Banco de Bosques and CEIBA, Fundación Flora y Fauna Argentina, and — crucially — the financial support of Douglas Tompkins' Conservation Land Trust, which committed the funds needed to close the gap between what had been raised and what the expropriation law required. The law creating the national park was passed unanimously in both chambers of the Argentine Congress on October 22, 2014. Rewilding Argentina had been on the ground since December 2012, running wildlife surveys, building relationships with communities, and quietly holding the place while the bureaucracies caught up.`,
    images: [
      { src: '/images/history/2011-2014-1.jpg', caption: 'Parque Nacional El Impenetrable — created by Ley 26.996, passed unanimously October 22, 2014.' },
      { src: '/images/history/2011-2014-2.png', caption: 'La Fidelidad division — the Chaco side became the national park; the Formosa side remains in the hands of heirs.' },
    ],
  },
  {
    year: 'August 25, 2017',
    title: 'The Park Opens',
    body: `The park was officially inaugurated on August 25, 2017, three years after the law, delayed by the same judicial battles that had slowed everything else. National Parks could only formally enter to begin protection in April 2017. The 130,000 hectares on the Chaco side were now protected. But the Formosa side — another 100,000 hectares, the other half of La Fidelidad — remained in the hands of the heirs, still tangled in succession proceedings. Rewilding Argentina wants to purchase it. As of today, that process continues.\n\nWhat the locals call it matters here. They don't say "El Impenetrable." They say *La Fidelidad*. That name holds the memory of everything that came before — the Roseos, the hunters who slipped through the fence, the sense of a place that existed outside the official story. Conservation renamed it. The people remember both.`,
    images: [
      { src: '/images/history/aug-2017-1.jpg', caption: 'August 25, 2017 — official inauguration of Parque Nacional El Impenetrable.' },
    ],
  },
  {
    year: '2017–Present',
    title: 'Rewilding and the Question of Community',
    body: `The arrival of uniformed park rangers in 2017 was jarring for many local residents. Institutions don't always translate well into places that have long operated without them. Rewilding Argentina took a different approach: building relationships first, bringing economic alternatives second. Tourism — nature tourism, wildlife watching — became the framework. Before Rewilding arrived, there was no tourism in the area. Communities had never seen a tourist. The concept required explanation.\n\nSlowly, it took shape: local women became cooks and guides, artisans began working with natural pigments and dead wood, weaving patterns that echoed the jaguar's markings. The monte — which communities already knew and identified with — became the basis for a regenerative economy. The Bermejo River was harder. Many people living 30 kilometers from the river had never seen it. Community workers in the area describe this as one of the deeper challenges: *El Impenetrable se asocia a la falta de agua* — the Impenetrable is associated with the absence of water, not its presence. Building a relationship between people and a river they've never touched is slow, patient work.`,
    images: [
      { src: '/images/history/2017-present-1.jpg', caption: 'El Impenetrable. Photo: Estrella Herrera. Fundación Rewilding Argentina.' },
      { src: '/images/history/2017-present-2.jpg', caption: 'El Impenetrable. Photo: Estrella Herrera. Fundación Rewilding Argentina.' },
      { src: '/images/history/2017-present-3.jpg', caption: 'El Impenetrable — nature tourism, August 2023. Photo: Florian von der Fecht. Fundación Rewilding Argentina.' },
      { src: '/images/history/2017-present-4.jpg', caption: 'El Impenetrable — nature tourism, August 2023. Photo: Florian von der Fecht. Fundación Rewilding Argentina.' },
    ],
  },
  {
    year: '2018–Present',
    title: 'The Jaguar Returns',
    body: `In September 2019, jaguar footprints were recorded in the national park for the first time. Camera traps confirmed it: a solitary male, later named Qaramta, roaming the dry forest. He was one of fewer than ten confirmed jaguars remaining across the million square kilometers of Argentine Gran Chaco — and all of them were male. Without females, the species faced a genetic dead end in the Chaco.\n\nIn March 2024, Keraná — a female jaguar rescued in Paraguay as a cub after her mother was killed by hunters — became the first female jaguar released into El Impenetrable. Others followed: Nalá, born at the park's breeding center; Acaí, translocated from Iberá; and in March 2025, Miní — the first wild-born jaguar ever translocated between wild populations anywhere in the world.\n\nThe jaguar's return is not just ecological. It is, as Jaguar Rivers puts it, proof that if the jaguar returns, everything else can follow. The rivers, the forests, the people, the future.`,
    images: [
      { src: '/images/history/2018-present-1.jpg', caption: 'Jaguar footprint — drone survey, Yungas landscapes. Photo: Lucinda Di Martino. Fundación Rewilding Argentina.' },
      { src: '/images/history/2018-present-2.jpg', caption: 'Nalá and her cub, July 2025. Photo: Pablo Luna. Fundación Rewilding Argentina.' },
    ],
  },
  {
    year: 'Today',
    title: 'The Unfinished Work',
    body: `The park exists. The jaguars are returning. And the pressures are real. The agricultural frontier has consumed much of what surrounds El Impenetrable — satellite images show how Castelli sits at the edge of an erased landscape. The park's inaccessibility — no roads, no ports on the Bermejo — has so far protected the core. But there is no buffer without presence. There is no presence without community. And there is no community without alternatives.\n\nThis investigation maps what happens at the edges — where the protection ends and the pressures begin. The illegal water pumps on the Bermejo are not isolated infractions. They are symptoms of a deeper absence: of governance, of belonging, of the legal clarity that would let the people who live here actually claim this land as their own.\n\nThe river is still running. The jaguar is still here. The question is whether the systems that protect them can move as fast as the systems that don't.`,
    images: [],
  },
];

const SECTIONS_ES = [
  {
    year: 'Período Precolonial',
    title: 'Los Pueblos del Bermejo',
    body: `Mucho antes de que el Chaco tuviera nombre en algún mapa, los pueblos Wichí, Qom (Toba) y Moqoit moldearon sus vidas en torno a sus ritmos. El río Bermejo no era un límite — era el pulso de todo: alimento, movilidad, ceremonia, memoria. El Chaco seco que habitaban era uno de los bosques continuos más extensos de América del Sur, un paisaje de extremos que exigía un profundo conocimiento para sobrevivir y ofrecía una riqueza extraordinaria a cambio. Ese conocimiento todavía está aquí. Nunca se fue.`,
    images: [
      { src: '/images/history/pre-colonial-1.jpeg', caption: 'El Impenetrable — fotografía histórica. Foto: Sebastián DM. Fundación Rewilding Argentina.' },
      { src: '/images/history/pre-colonial-2.jpg',  caption: '"Rio Vermejo — Indians Fishing." Grabado en madera que muestra a los Toba pescando con arcos mientras el buque de vapor de la Marina de EE.UU. Water Witch está anclado al fondo durante la expedición de 1854. Publicado en: Page, Thomas Jefferson. La Plata, the Argentine Confederation, and Paraguay. Nueva York: Harper & Brothers, 1859, p. 249.' },
    ],
  },
  {
    year: '1872',
    title: 'La Tierra Se Entrega',
    body: `Los orígenes de La Fidelidad se remontan a 1872, cuando la estancia fue entregada por el gobierno salteño — en ese entonces no existía la provincia del Chaco — a Natalio Roldán, un comerciante porteño, en reconocimiento de su papel navegando y explorando el río Teuco. Fue un premio por la conquista disfrazado de descubrimiento. La tierra no estaba vacía. Nunca estuvo vacía.\n\nEl Chaco fue una de las últimas provincias argentinas en constituirse formalmente, en parte por la presencia persistente de sus habitantes indígenas. A medida que el Estado comenzó a impulsar el poblamiento productivo, empezó a otorgar tierras a colonos de provincias vecinas. La región fue poblada por Wichí, Qom y criollos — junto con oleadas de migrantes que los referentes comunitarios que trabajan en la zona describen vívidamente: alemanes, ucranianos, checos, llegando en sucesivas oleadas, asentándose principalmente alrededor de Castelli — la ciudad puerta de acceso a El Impenetrable, y el centro poblacional más grande de esa parte del Chaco.`,
    images: [
      { src: '/images/history/1872-1.jpg', caption: 'Plano del Río Bermejo desde sus cabezeras hasta su desagüe en el del Paraguay, navegado y reconocido en 1826 por Pablo Soria. Buenos Aires, 10 de octubre de 1831. Archivo General de la Nación (AGN), División Cartografía, II-230.' },
      { src: '/images/history/1872-2.jpg', caption: 'Plano del Río Bermejo por Nicolás Descalzi. Litografía. Buenos Aires, 15 de diciembre de 1831 (expedición realizada en 1826). Incluye viñetas de ceremonias Toba, pesca indígena y un recuadro del Salto de Yzó. Archivo General de la Nación (AGN), División Cartografía, II-228.' },
      { src: '/images/history/1872-3.jpg', caption: '"Expedicionarios del Chaco." Colección Witcomb, No. 602. c. 1890s–1900s. Fotografía de Alexander Spiers Witcomb. Archivo General de la Nación (AGN), Departamento de Documentos Fotográficos, Buenos Aires.' },
    ],
  },
  {
    year: 'Principios del Siglo XX',
    title: 'Bunge & Born y la Economía Extractiva',
    body: `La estancia pasó a Jorge Born, del gigante agroindustrial Bunge & Born, quien la administró como una *estancia* privada: ganadería, madera, algodón, corrales, infraestructura empujada monte adentro. Cuando dejó de ser rentable, la cedieron a los hermanos italianos de la industria textil — Luis y Manuel Roseo — quienes la adquirieron a principios de los años 70. Bajo los Roseo, la tierra se convirtió en algo entre un feudo privado y un territorio olvidado. Los criollos y originarios locales recuerdan ir a cazar — guazuncho, tapir, quirquincho, a pescar en el Bermejo — con el entendimiento tácito de que la tierra no pertenecía a nadie en particular. *Tierra de nadie*, como la describen quienes han trabajado de cerca con estas comunidades.`,
    images: [
      { src: '/images/history/early-20th-1.jpg', caption: 'Obraje de quebracho — bueyes, troncos y galpones de campaña, Gran Chaco. c. 1900–1930. Archivo no. 129468. La imagen documenta la industria extractiva de tanino y madera que impulsó la deforestación a gran escala en el Chaco. Repositorio no confirmado; posiblemente Archivo General de la Nación (AGN), Departamento de Documentos Fotográficos.' },
      { src: '/images/history/early-20th-2.jpg', caption: 'Obraje de quebracho — campo de troncos talados, Gran Chaco. c. 1900–1930. Archivo no. 150387. Se estima que 150 millones de árboles de quebracho fueron talados durante este período por empresas como La Forestal, utilizando mano de obra indígena y migrante en condiciones precarias. Repositorio no confirmado; posiblemente Archivo General de la Nación (AGN).' },
      { src: '/images/history/early-20th-3.jpg', caption: 'Pequeña lancha a vapor navegando un angosto canal fluvial chaqueño de densa vegetación. c. 1890s–1910s. Fotografía. Posible embarcación: vapor Bolivia, empleado en la exploración de los ríos Chaco y Pilcomayo argentinos desde los años 1890. Fuente y repositorio no confirmados.' },
      { src: '/images/history/early-20th-4.jpg', caption: 'Sello oficial de la Compañía de Navegación a Vapor del Río Bermejo. c. 1869–1880. La compañía fue fundada por Natalio Roldán y Francisco G. Molina, constituida bajo la Ley Nacional No. 354 (1869), para abrir el Río Bermejo a la navegación comercial y colonizar el Gran Chaco. Fuente: Historia de la navegación del río Bermejo, Yumpu doc. 63329720.' },
      { src: '/images/history/early-20th-5.jpg', caption: 'Vapor fluvial en el Bermejo, principios del siglo XX. Fotografía de un vapor fluvial de cubierta múltiple y calado reducido característico de la Compañía Oficial de Navegación del Río Bermejo. Fuente: Historia de la navegación del río Bermejo, Yumpu doc. 63329720. Fuente archivística original no confirmada.' },
      { src: '/images/history/early-20th-6.jpg', caption: 'El vapor "114 B.", descargando mercaderías en puerto Presidente Roca, sobre el Bermejo navegable. c. 1910s–1930s. Fotografía de un vapor de fondo plano del Bermejo descargando carga en Presidencia Roca, provincia del Chaco. Fuente: Historia de la navegación del río Bermejo, Yumpu doc. 63329720. Publicación original no confirmada.' },
    ],
  },
  {
    year: '13 de enero de 2011',
    title: 'El Crimen que Cambió Todo',
    body: `El 13 de enero de 2011, en la localidad de Juan José Castelli, Manuel Roseo — 75 años — y su cuñada Nelly Bartolomé — 73 años, viuda de su hermano — fueron torturados y asesinados por una organización criminal que buscaba apoderarse de la estancia, valuada en 250 millones de dólares. El grupo estaba vinculado a una red de escribanos, abogados y empresarios que habían vendido fraudulentamente parcelas de la estancia a compañías multinacionales de granos sin el conocimiento ni el consentimiento del propietario.\n\nRoseo no tenía hijos reconocidos. Había rechazado todas las ofertas de venta. El propio Douglas Tompkins se había reunido con él. Tras los asesinatos, la tierra entró en una compleja disputa sucesoria — y al mismo tiempo, algo cambió en el mundo de la conservación. El crimen había hecho visible la tierra. Organizaciones ambientales, escritores y activistas se movilizaron de inmediato. Lo que había sido el sueño conservacionista de décadas de repente tenía impulso político.`,
    images: [
      { src: '/images/history/jan-2011-1.png', caption: 'Estancia La Fidelidad — la estancia que se convertiría en el Parque Nacional El Impenetrable.' },
      { src: '/images/history/jan-2011-2.jpg', caption: 'El Impenetrable — hoy un parque nacional, abierto a sus primeros visitantes en 2017. Foto: Florian von der Fecht, agosto de 2023.' },
    ],
  },
  {
    year: '2011–2014',
    title: 'La Lucha para Crear el Parque',
    body: `El 5 de agosto de 2011, el entonces gobernador Jorge Capitanich anunció el proceso de expropiación para transformar La Fidelidad en un parque nacional. No fue sencillo. La disputa sucesoria se prolongó en los tribunales. Aparecieron herederos. Se presentaron medidas cautelares. El proceso que debería haber llevado meses duró años.\n\nA lo largo de todo esto, una coalición lo sostuvo: ONGs ambientales, las organizaciones Banco de Bosques y CEIBA, Fundación Flora y Fauna Argentina, y — de manera decisiva — el apoyo económico del Conservation Land Trust de Douglas Tompkins, que comprometió los fondos necesarios para cerrar la brecha entre lo recaudado y lo que exigía la ley de expropiación. La ley que crea el parque nacional fue aprobada por unanimidad en ambas cámaras del Congreso Nacional el 22 de octubre de 2014. Rewilding Argentina estaba en el terreno desde diciembre de 2012, realizando relevamientos de fauna, construyendo relaciones con las comunidades y sosteniendo el lugar tranquilamente mientras las burocracias se ponían al día.`,
    images: [
      { src: '/images/history/2011-2014-1.jpg', caption: 'Parque Nacional El Impenetrable — creado por Ley 26.996, aprobada por unanimidad el 22 de octubre de 2014.' },
      { src: '/images/history/2011-2014-2.png', caption: 'División de La Fidelidad — el lado chaqueño se convirtió en el parque nacional; el lado formoseño permanece en manos de herederos.' },
    ],
  },
  {
    year: '25 de agosto de 2017',
    title: 'El Parque Abre sus Puertas',
    body: `El parque fue inaugurado oficialmente el 25 de agosto de 2017, tres años después de la ley, con demoras por las mismas batallas judiciales que habían ralentizado todo. Parques Nacionales pudo ingresar formalmente para iniciar la protección recién en abril de 2017. Las 130.000 hectáreas del lado chaqueño estaban ahora protegidas. Pero el lado formoseño — otras 100.000 hectáreas, la otra mitad de La Fidelidad — seguía en manos de los herederos, aún enredada en trámites sucesorios. Rewilding Argentina quiere adquirirla. Al día de hoy, ese proceso continúa.\n\nLo que los lugareños la llaman importa aquí. No dicen "El Impenetrable". Dicen *La Fidelidad*. Ese nombre contiene la memoria de todo lo que vino antes — los Roseo, los cazadores que se colaban por el alambrado, la sensación de un lugar que existía fuera de la historia oficial. La conservación lo rebautizó. La gente recuerda los dos.`,
    images: [
      { src: '/images/history/aug-2017-1.jpg', caption: '25 de agosto de 2017 — inauguración oficial del Parque Nacional El Impenetrable.' },
    ],
  },
  {
    year: '2017–Actualidad',
    title: 'Rewilding y la Pregunta por la Comunidad',
    body: `La llegada de guardaparques uniformados en 2017 fue perturbadora para muchos residentes locales. Las instituciones no siempre se traducen bien en lugares que han funcionado durante mucho tiempo sin ellas. Rewilding Argentina adoptó un enfoque diferente: construir relaciones primero, ofrecer alternativas económicas después. El turismo — turismo de naturaleza, observación de fauna — se convirtió en el marco. Antes de que llegara Rewilding, no había turismo en la zona. Las comunidades nunca habían visto un turista. El concepto requirió explicación.\n\nDe a poco tomó forma: mujeres locales se convirtieron en cocineras y guías, artesanos comenzaron a trabajar con pigmentos naturales y madera muerta, tejiendo patrones que evocaban las manchas del jaguar. El monte — que las comunidades ya conocían e identificaban como propio — se convirtió en la base de una economía regenerativa. El río Bermejo fue más difícil. Mucha gente que vive a 30 kilómetros del río nunca lo había visto. Los trabajadores comunitarios de la zona describen esto como uno de los desafíos más profundos: *El Impenetrable se asocia a la falta de agua* — El Impenetrable se asocia a la ausencia del agua, no a su presencia. Construir una relación entre las personas y un río que nunca han tocado es un trabajo lento y paciente.`,
    images: [
      { src: '/images/history/2017-present-1.jpg', caption: 'El Impenetrable. Foto: Estrella Herrera. Fundación Rewilding Argentina.' },
      { src: '/images/history/2017-present-2.jpg', caption: 'El Impenetrable. Foto: Estrella Herrera. Fundación Rewilding Argentina.' },
      { src: '/images/history/2017-present-3.jpg', caption: 'El Impenetrable — turismo de naturaleza, agosto de 2023. Foto: Florian von der Fecht. Fundación Rewilding Argentina.' },
      { src: '/images/history/2017-present-4.jpg', caption: 'El Impenetrable — turismo de naturaleza, agosto de 2023. Foto: Florian von der Fecht. Fundación Rewilding Argentina.' },
    ],
  },
  {
    year: '2018–Actualidad',
    title: 'El Jaguar Regresa',
    body: `En septiembre de 2019 se registraron huellas de jaguar en el parque nacional por primera vez. Las cámaras trampa lo confirmaron: un macho solitario, al que luego llamaron Qaramta, recorriendo el bosque seco. Era uno de menos de diez jaguares confirmados que quedaban en los millones de kilómetros cuadrados del Gran Chaco argentino — y todos eran machos. Sin hembras, la especie enfrentaba un callejón sin salida genético en el Chaco.\n\nEn marzo de 2024, Keraná — una jaguar rescatada en Paraguay siendo cachorra tras el asesinato de su madre por cazadores — se convirtió en la primera hembra jaguar liberada en El Impenetrable. Otras la siguieron: Nalá, nacida en el centro de cría del parque; Acaí, trasladada desde Iberá; y en marzo de 2025, Miní — la primera jaguar silvestre trasladada entre poblaciones silvestres en cualquier lugar del mundo.\n\nEl regreso del jaguar no es solo ecológico. Es, como lo expresa Jaguar Rivers, la prueba de que si el jaguar vuelve, todo lo demás puede seguir. Los ríos, los bosques, las personas, el futuro.`,
    images: [
      { src: '/images/history/2018-present-1.jpg', caption: 'Huella de jaguar — relevamiento con dron, paisajes de Yungas. Foto: Lucinda Di Martino. Fundación Rewilding Argentina.' },
      { src: '/images/history/2018-present-2.jpg', caption: 'Nalá y su cría, julio de 2025. Foto: Pablo Luna. Fundación Rewilding Argentina.' },
    ],
  },
  {
    year: 'Hoy',
    title: 'La Obra Inconclusa',
    body: `El parque existe. Los jaguares están regresando. Y las presiones son reales. La frontera agropecuaria ha consumido gran parte de lo que rodea a El Impenetrable — las imágenes satelitales muestran cómo Castelli está al borde de un paisaje borrado. La inaccesibilidad del parque — sin caminos, sin puertos en el Bermejo — lo ha protegido hasta ahora. Pero no hay amortiguación sin presencia. No hay presencia sin comunidad. Y no hay comunidad sin alternativas.\n\nEsta investigación mapea lo que ocurre en los bordes — donde termina la protección y comienzan las presiones. Las bombas ilegales de agua en el Bermejo no son infracciones aisladas. Son síntomas de una ausencia más profunda: de gobernanza, de pertenencia, de la claridad jurídica que permitiría a quienes viven aquí reclamar esta tierra como propia.\n\nEl río sigue corriendo. El jaguar sigue aquí. La pregunta es si los sistemas que los protegen pueden moverse tan rápido como los que no.`,
    images: [],
  },
];

const UI = {
  en: {
    title: 'History',
    lead: 'The long arc of land, water, and power in El Impenetrable — and what it takes to protect what remains.',
    sourcesLabel: 'Sources:',
    footer: 'Rewilding Argentina, Tompkins Conservation, Wikipedia ES — Parque Nacional El Impenetrable & Proyecto Parque Nacional La Fidelidad, La Nación, Mongabay, Argentina.gob.ar, EcuRed,',
    footerInterview: 'Interview with Luli, Rewilding Argentina community liaison, El Impenetrable, 2025.',
  },
  es: {
    title: 'Historia',
    lead: 'El largo arco de la tierra, el agua y el poder en El Impenetrable — y lo que se necesita para proteger lo que queda.',
    sourcesLabel: 'Fuentes:',
    footer: 'Rewilding Argentina, Tompkins Conservation, Wikipedia ES — Parque Nacional El Impenetrable & Proyecto Parque Nacional La Fidelidad, La Nación, Mongabay, Argentina.gob.ar, EcuRed,',
    footerInterview: 'Entrevista con Luli, enlace comunitario de Rewilding Argentina, El Impenetrable, 2025.',
  },
};

function renderText(text) {
  return text.split('\n\n').map((para, pi) => (
    <p key={pi} className={styles.sectionBody}>
      {para.split(/(\*[^*]+\*)/).map((chunk, ci) =>
        chunk.startsWith('*') && chunk.endsWith('*')
          ? <em key={ci}>{chunk.slice(1, -1)}</em>
          : chunk
      )}
    </p>
  ));
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

export default function HistoryView() {
  const [lightbox, setLightbox] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { lang } = useLang();
  const ui = UI[lang] ?? UI.en;
  const sections = lang === 'es' ? SECTIONS_ES : SECTIONS_EN;

  useEffect(() => { setZoomed(false); }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <>
      <div className={`${styles.view}${collapsed ? ` ${styles.viewCollapsed}` : ''}`}>
        <div className={styles.scroll}>
          <header className={styles.viewHeader}>
            <h2 className={styles.viewTitle}>{ui.title}</h2>
            <p className={styles.viewLead}>
              <em>{ui.lead}</em>
            </p>
          </header>

          <div className={styles.timeline}>
            {sections.map((s, i) => (
              <article key={i} className={styles.timelineItem}>
                <div className={styles.timelineYear}>{s.year}</div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.sectionTitle}>{s.title}</h3>
                  {renderText(s.body)}
                </div>
                {s.images?.length > 0 && (
                  <div className={styles.imgStrip}>
                    {s.images.map((img, j) => (
                      <img
                        key={j}
                        src={img.src}
                        alt={`${s.year} — ${j + 1}`}
                        className={styles.imgStripItem}
                        loading="lazy"
                        onClick={() => setLightbox(img)}
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <footer className={styles.viewFooter}>
            <p>
              <strong>{ui.sourcesLabel}</strong> {ui.footer}{' '}
              <a href="https://www.jaguarrivers.com/en" target="_blank" rel="noreferrer">Jaguar Rivers Initiative</a>.{' '}
              {ui.footerInterview}
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
