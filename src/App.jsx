import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HistoryView from './components/HistoryView';
import LegislationView from './components/LegislationView';
import AnalyzeView from './components/AnalyzeView';
import WelcomeModal from './components/WelcomeModal';
import TourOverlay from './components/TourOverlay';
import KeyboardHintOverlay from './components/KeyboardHintOverlay';
import ActView from './components/ActView';
import { useFirmsData } from './hooks/useFirmsData';
import { useFloodData } from './hooks/useFloodData';
import { useInaGaugeData } from './hooks/useInaGaugeData';
import { useVerifiedSubmissions } from './hooks/useVerifiedSubmissions';
import { useTour } from './hooks/useTour';

const DEFAULT_LAYERS = {
  park: false,
  buffer: false,
  pumps: false,
  firms: false,
  gsw_seasonality: false,
  gsw_transitions: false,
  floodGauges: false,
  inaStations: false,
  community: false,
};

const EXPLORE_LAYERS    = { ...DEFAULT_LAYERS, park: true, buffer: true, pumps: true };
const POST_TOUR_LAYERS  = { ...DEFAULT_LAYERS, park: true, buffer: true, pumps: true, floodGauges: true, firms: true, inaStations: true };

function buildMonths() {
  const months = [];
  const now = new Date();
  let y = 2015, m = 6;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

const MONTHS = buildMonths();
const INITIAL_DATE = MONTHS[MONTHS.length - 1];

export default function App() {
  // null = intro playing, 'welcome' = modal, 'touring' = tour, 'exploring' = free
  const [tourPhase, setTourPhase] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const [sentinel] = useState({
    enabled: false,
    band: 'true-color',
    date: INITIAL_DATE,
  });
  const [mapbiomas, setMapbiomas] = useState({ enabled: false, year: 2023 });
  const mapRef = useRef(null);

  const [actPin, setActPin] = useState(null);

  const { rows: firmsRows, geojson: firmsGeoJSON, loading: firmsLoading, error: firmsError, fetchedAt: firmsFetchedAt } = useFirmsData();
  const { gauges: floodGauges, geojson: floodGeoJSON } = useFloodData();
  const { stations: inaStations, geojson: inaGeoJSON, loading: inaLoading } = useInaGaugeData();
  const { geojson: communityGeoJSON } = useVerifiedSubmissions(true);

  const firmsStats = useMemo(() => {
    const rows = firmsRows ?? [];
    const high    = rows.filter(r => r.confidence === 'h' || r.confidence === 'high').length;
    const low     = rows.filter(r => r.confidence === 'l' || r.confidence === 'low').length;
    const nominal = rows.length - high - low;
    const lastDetection = rows.length ? [...rows.map(r => r.acq_date).filter(Boolean)].sort().at(-1) : null;
    return { total: rows.length, high, nominal, low, lastDetection, fetchedAt: firmsFetchedAt?.toLocaleTimeString() };
  }, [firmsRows, firmsFetchedAt]);

  // Pin is only active while on the Act tab — derive rather than sync
  const effectiveActPin = activeTab === 'Act' ? actPin : null;

  const handleTourComplete = useCallback(() => {
    setTourPhase('exploring');
    setShowKeyboardHint(false);
    setActiveTab('Discover');
    setLayers(POST_TOUR_LAYERS);
  }, []);

  const { overlay, startTour, stopTour, goBack, goForward, togglePause, paused } = useTour(mapRef, { onComplete: handleTourComplete, firmsStats, floodGauges, inaStations });

  const handleIntroComplete = useCallback(() => setTourPhase('welcome'), []);

  const handleTakeTour = useCallback(() => {
    setTourPhase('touring');
    setShowKeyboardHint(true);
    startTour();
  }, [startTour]);

  // Keyboard controls — Space=pause, ArrowLeft=back, ArrowRight=forward
  useEffect(() => {
    if (tourPhase !== 'touring') return;
    const onKey = (e) => {
      if (e.code === 'Space')      { e.preventDefault(); togglePause(); }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); goBack(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); goForward(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourPhase, togglePause, goBack, goForward]);

  const handleExplore = useCallback(() => {
    setTourPhase('exploring');
    setActiveTab('Discover');
    setLayers(EXPLORE_LAYERS);
  }, []);

  const handleSkipTour = useCallback(() => {
    stopTour();
    setTourPhase('exploring');
    setShowKeyboardHint(false);
    setActiveTab('Discover');
    setLayers(EXPLORE_LAYERS);
  }, [stopTour]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        layers={layers}
        mapRef={mapRef}
        sentinel={sentinel}
        months={MONTHS}
        firmsGeoJSON={firmsGeoJSON}
        floodGeoJSON={floodGeoJSON}
        floodGauges={floodGauges}
        inaGeoJSON={inaGeoJSON}
        inaStations={inaStations}
        mapbiomas={mapbiomas}
        communityGeoJSON={communityGeoJSON}
        actMode={activeTab === 'Act'}
        actPin={effectiveActPin}
        onActPick={setActPin}
        onIntroComplete={handleIntroComplete}
      />

      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'Discover' && (
        <Sidebar
          layers={layers}
          setLayers={setLayers}
          mapbiomas={mapbiomas}
          setMapbiomas={setMapbiomas}
        />
      )}

      {activeTab === 'History'     && <HistoryView />}
      {activeTab === 'Legislation' && <LegislationView />}
      {activeTab === 'Act' && (
        <ActView actPin={effectiveActPin} onClearPin={() => setActPin(null)} />
      )}

      {activeTab === 'Analyze'     && (
        <AnalyzeView
          firmsRows={firmsRows}
          firmsLoading={firmsLoading}
          firmsError={firmsError}
          firmsFetchedAt={firmsFetchedAt}
          mapbiomas={mapbiomas}
          setMapbiomas={setMapbiomas}
          inaStations={inaStations}
          inaLoading={inaLoading}
        />
      )}

      {tourPhase === 'welcome' && (
        <WelcomeModal onTour={handleTakeTour} onExplore={handleExplore} />
      )}

      {tourPhase === 'touring' && (
        <>
          <TourOverlay step={overlay} onSkip={handleSkipTour} />
          <KeyboardHintOverlay show={showKeyboardHint} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            width: 76, height: 76,
            borderRadius: '50%',
            background: 'rgba(6,10,18,0.62)',
            border: '1.5px solid rgba(222,216,207,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, color: 'rgba(222,216,207,0.92)',
            opacity: paused ? 1 : 0,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>⏸</div>
        </>
      )}
    </div>
  );
}
