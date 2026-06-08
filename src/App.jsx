import { useState, useRef, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HistoryView from './components/HistoryView';
import LegislationView from './components/LegislationView';
import AnalyzeView from './components/AnalyzeView';
import WelcomeModal from './components/WelcomeModal';
import TourOverlay from './components/TourOverlay';
import { useFirmsData } from './hooks/useFirmsData';
import { useTour } from './hooks/useTour';

const DEFAULT_LAYERS = {
  park: false,
  buffer: false,
  pumps: false,
  firms: false,
  gsw_seasonality: false,
  gsw_transitions: false,
  floodGauges: false,
};

const EXPLORE_LAYERS = { ...DEFAULT_LAYERS, park: true, buffer: true, pumps: true };
const POST_TOUR_LAYERS = { ...DEFAULT_LAYERS, park: true, buffer: true, pumps: true, floodGauges: true, firms: true };

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
  const [sentinel] = useState({
    enabled: false,
    band: 'true-color',
    date: INITIAL_DATE,
  });
  const [mapbiomas, setMapbiomas] = useState({ enabled: false, year: 2023 });
  const mapRef = useRef(null);

  const { rows: firmsRows, geojson: firmsGeoJSON, loading: firmsLoading, error: firmsError, fetchedAt: firmsFetchedAt } = useFirmsData();

  const firmsStats = useMemo(() => {
    if (!firmsRows?.length) return null;
    const high    = firmsRows.filter(r => r.confidence === 'h' || r.confidence === 'high').length;
    const low     = firmsRows.filter(r => r.confidence === 'l' || r.confidence === 'low').length;
    const nominal = firmsRows.length - high - low;
    const lastDetection = [...firmsRows.map(r => r.acq_date).filter(Boolean)].sort().at(-1);
    return { total: firmsRows.length, high, nominal, low, lastDetection, fetchedAt: firmsFetchedAt?.toLocaleTimeString() };
  }, [firmsRows, firmsFetchedAt]);

  const handleTourComplete = useCallback(() => {
    setTourPhase('exploring');
    setActiveTab('Discover');
    setLayers(POST_TOUR_LAYERS);
  }, []);

  const { overlay, startTour, stopTour, goBack, canGoBack, goForward, canGoForward, togglePause, paused } = useTour(mapRef, { onComplete: handleTourComplete, firmsStats });

  const handleIntroComplete = useCallback(() => setTourPhase('welcome'), []);

  const handleTakeTour = useCallback(() => {
    setTourPhase('touring');
    startTour();
  }, [startTour]);

  const handleExplore = useCallback(() => {
    setTourPhase('exploring');
    setActiveTab('Discover');
    setLayers(EXPLORE_LAYERS);
  }, []);

  const handleSkipTour = useCallback(() => {
    stopTour();
    setTourPhase('exploring');
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
        mapbiomas={mapbiomas}
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
      {activeTab === 'Analyze'     && (
        <AnalyzeView
          firmsRows={firmsRows}
          firmsLoading={firmsLoading}
          firmsError={firmsError}
          firmsFetchedAt={firmsFetchedAt}
          mapbiomas={mapbiomas}
          setMapbiomas={setMapbiomas}
        />
      )}

      {tourPhase === 'welcome' && (
        <WelcomeModal onTour={handleTakeTour} onExplore={handleExplore} />
      )}

      {tourPhase === 'touring' && (
        <TourOverlay
          step={overlay}
          onSkip={handleSkipTour}
          onBack={goBack}
          canGoBack={canGoBack}
          onForward={goForward}
          canGoForward={canGoForward}
          onPause={togglePause}
          paused={paused}
        />
      )}
    </div>
  );
}
