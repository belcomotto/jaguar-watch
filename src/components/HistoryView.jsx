import { useState, useEffect } from 'react';
import styles from './ContentView.module.css';

const SECTIONS = [
  {
    year: 'Pre-Colonial',
    title: 'The People of the Bermejo',
    body: `Long before the Chaco had a name on any map, the Wichí, Qom (Toba), and Moqoit peoples shaped their lives around its rhythms. The Bermejo River was not a boundary — it was the pulse of everything: food, mobility, ceremony, memory. The dry Chaco they inhabited was one of South America's largest continuous forests, a landscape of extremes that demanded deep knowledge to survive and offered extraordinary richness in return. That knowledge is still here. It never left.`,
    images: [
      { src: '/images/history/pre-colonial-1.jpeg', caption: '' },
      { src: '/images/history/pre-colonial-2.jpg',  caption: '' },
    ],
  },
  {
    year: '1872',
    title: 'The Land Is Given Away',
    body: `The origins of La Fidelidad date to 1872, when the estate was handed by the Saltean government — at the time there was no province of Chaco — to Natalio Roldán, a Buenos Aires merchant, in recognition of his role navigating and exploring the Teuco River. It was a reward for conquest dressed up as discovery. The land was not empty. It was never empty.\n\nChaco was among the last Argentine provinces to be formally constituted, partly because of the persistent presence of its Indigenous inhabitants. As the state began pushing for productive settlement, it started granting land to settlers from neighboring provinces. The region became populated by Wichí, Qom, and criollos — along with waves of migrants that local community liaisons working in the area describe vividly: Germans, Ukrainians, Czechs, arriving in successive waves, settling mostly around Castelli — the gateway town to El Impenetrable, and the largest population center in that part of Chaco.`,
    images: [
      { src: '/images/history/1872-1.jpg', caption: '' },
      { src: '/images/history/1872-2.jpg', caption: '' },
      { src: '/images/history/1872-3.jpg', caption: '' },
    ],
  },
  {
    year: 'Early 20th Century',
    title: 'Bunge & Born and the Extraction Economy',
    body: `The estate passed to Jorge Born of the agro-industrial giant Bunge & Born, who ran it as a private *estancia*: cattle, timber, cotton, corrals, infrastructure pushed into the monte. When it stopped being profitable, they traded it to Italian brothers from the textile industry — Luis and Manuel Roseo — who acquired it in the early 1970s. Under the Roseos, the land became something between a private fiefdom and a forgotten territory. Local criollos and originarios recall going to hunt — guazuncho, tapir, quirquincho, to fish the Bermejo — with a quiet understanding that the land belonged to nobody in particular. *Tierra de nadie*, as those who have worked closely with these communities describe it.`,
    images: [
      { src: '/images/history/early-20th-1.jpg', caption: '' },
      { src: '/images/history/early-20th-2.jpg', caption: '' },
      { src: '/images/history/early-20th-3.jpg', caption: '' },
      { src: '/images/history/early-20th-4.jpg', caption: '' },
      { src: '/images/history/early-20th-5.jpg', caption: '' },
      { src: '/images/history/early-20th-6.jpg', caption: '' },
    ],
  },
  {
    year: 'January 13, 2011',
    title: 'The Murder That Changed Everything',
    body: `On January 13, 2011, in the town of Juan José Castelli, Manuel Roseo — 75 years old — and his sister-in-law Nelly Bartolomé — 73 years old, widow of his brother — were tortured and murdered by a criminal organization seeking to seize the estate, valued at 250 million dollars. The group was linked to a network of notaries, lawyers, and businesspeople who had fraudulently sold parcels of the estate to multinational grain companies without the owner's knowledge or consent.\n\nRoseo had no recognized children. He had refused all offers to sell. Douglas Tompkins himself had met with him. After the murders, the land entered a complex inheritance dispute — and simultaneously, something shifted in the conservation world. The crime had made the land visible. Environmental organizations, writers, and activists mobilized immediately. What had been a decades-long conservationist dream suddenly had political momentum.`,
    images: [
      { src: '/images/history/jan-2011-1.png', caption: '' },
      { src: '/images/history/jan-2011-2.jpg', caption: '' },
    ],
  },
  {
    year: '2011–2014',
    title: 'The Long Push to Create a Park',
    body: `On August 5, 2011, then-governor Jorge Capitanich announced the expropriation process to transform La Fidelidad into a national park. It wasn't straightforward. The inheritance dispute dragged through the courts. Heirs appeared. Injunctions were filed. The process that should have taken months took years.\n\nThrough it all, a coalition held it together: environmental NGOs, the organizations Banco de Bosques and CEIBA, Fundación Flora y Fauna Argentina, and — crucially — the financial support of Douglas Tompkins' Conservation Land Trust, which committed the funds needed to close the gap between what had been raised and what the expropriation law required. The law creating the national park was passed unanimously in both chambers of the Argentine Congress on October 22, 2014. Rewilding Argentina had been on the ground since December 2012, running wildlife surveys, building relationships with communities, and quietly holding the place while the bureaucracies caught up.`,
    images: [
      { src: '/images/history/2011-2014-1.jpg', caption: '' },
      { src: '/images/history/2011-2014-2.png', caption: '' },
    ],
  },
  {
    year: 'August 25, 2017',
    title: 'The Park Opens',
    body: `The park was officially inaugurated on August 25, 2017, three years after the law, delayed by the same judicial battles that had slowed everything else. National Parks could only formally enter to begin protection in April 2017. The 130,000 hectares on the Chaco side were now protected. But the Formosa side — another 100,000 hectares, the other half of La Fidelidad — remained in the hands of the heirs, still tangled in succession proceedings. Rewilding Argentina wants to purchase it. As of today, that process continues.\n\nWhat the locals call it matters here. They don't say "El Impenetrable." They say *La Fidelidad*. That name holds the memory of everything that came before — the Roseos, the hunters who slipped through the fence, the sense of a place that existed outside the official story. Conservation renamed it. The people remember both.`,
    images: [
      { src: '/images/history/aug-2017-1.jpg', caption: '' },
    ],
  },
  {
    year: '2017–Present',
    title: 'Rewilding and the Question of Community',
    body: `The arrival of uniformed park rangers in 2017 was jarring for many local residents. Institutions don't always translate well into places that have long operated without them. Rewilding Argentina took a different approach: building relationships first, bringing economic alternatives second. Tourism — nature tourism, wildlife watching — became the framework. Before Rewilding arrived, there was no tourism in the area. Communities had never seen a tourist. The concept required explanation.\n\nSlowly, it took shape: local women became cooks and guides, artisans began working with natural pigments and dead wood, weaving patterns that echoed the jaguar's markings. The monte — which communities already knew and identified with — became the basis for a regenerative economy. The Bermejo River was harder. Many people living 30 kilometers from the river had never seen it. Community workers in the area describe this as one of the deeper challenges: *El Impenetrable se asocia a la falta de agua* — the Impenetrable is associated with the absence of water, not its presence. Building a relationship between people and a river they've never touched is slow, patient work.`,
    images: [
      { src: '/images/history/2017-present-1.jpg', caption: '' },
      { src: '/images/history/2017-present-2.jpg', caption: '' },
      { src: '/images/history/2017-present-3.jpg', caption: '' },
      { src: '/images/history/2017-present-4.jpg', caption: '' },
    ],
  },
  {
    year: '2018–Present',
    title: 'The Jaguar Returns',
    body: `In September 2019, jaguar footprints were recorded in the national park for the first time. Camera traps confirmed it: a solitary male, later named Qaramta, roaming the dry forest. He was one of fewer than ten confirmed jaguars remaining across the million square kilometers of Argentine Gran Chaco — and all of them were male. Without females, the species faced a genetic dead end in the Chaco.\n\nIn March 2024, Keraná — a female jaguar rescued in Paraguay as a cub after her mother was killed by hunters — became the first female jaguar released into El Impenetrable. Others followed: Nalá, born at the park's breeding center; Acaí, translocated from Iberá; and in March 2025, Miní — the first wild-born jaguar ever translocated between wild populations anywhere in the world.\n\nThe jaguar's return is not just ecological. It is, as Jaguar Rivers puts it, proof that if the jaguar returns, everything else can follow. The rivers, the forests, the people, the future.`,
    images: [
      { src: '/images/history/2018-present-1.jpg', caption: '' },
      { src: '/images/history/2018-present-2.jpg', caption: '' },
    ],
  },
  {
    year: 'Today',
    title: 'The Unfinished Work',
    body: `The park exists. The jaguars are returning. And the pressures are real. The agricultural frontier has consumed much of what surrounds El Impenetrable — satellite images show how Castelli sits at the edge of an erased landscape. The park's inaccessibility — no roads, no ports on the Bermejo — has so far protected the core. But there is no buffer without presence. There is no presence without community. And there is no community without alternatives.\n\nThis investigation maps what happens at the edges — where the protection ends and the pressures begin. The illegal water pumps on the Bermejo are not isolated infractions. They are symptoms of a deeper absence: of governance, of belonging, of the legal clarity that would let the people who live here actually claim this land as their own.\n\nThe river is still running. The jaguar is still here. The question is whether the systems that protect them can move as fast as the systems that don't.`,
    images: [],
  },
];

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

export default function HistoryView() {
  const [lightbox, setLightbox] = useState(null); // { src, caption } or null

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <>
      <div className={styles.view}>
        <div className={styles.scroll}>
          <header className={styles.viewHeader}>
            <h2 className={styles.viewTitle}>History</h2>
            <p className={styles.viewLead}>
              <em>The long arc of land, water, and power in El Impenetrable — and what it takes to protect what remains.</em>
            </p>
          </header>

          <div className={styles.timeline}>
            {SECTIONS.map((s, i) => (
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
              <strong>Sources:</strong> Rewilding Argentina, Tompkins Conservation, Wikipedia ES — Parque Nacional El Impenetrable &amp; Proyecto Parque Nacional La Fidelidad, La Nación, Mongabay, Argentina.gob.ar, EcuRed,{' '}
              <a href="https://www.jaguarrivers.com/en" target="_blank" rel="noreferrer">Jaguar Rivers Initiative</a>.
              Interview with Luli, Rewilding Argentina community liaison, El Impenetrable, 2025.
            </p>
          </footer>
        </div>
      </div>

      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            {lightbox.caption && (
              <p className={styles.lightboxCaption}>{lightbox.caption}</p>
            )}
            <img
              src={lightbox.src}
              alt="Expanded view"
              className={styles.lightboxImg}
            />
          </div>
        </div>
      )}
    </>
  );
}
