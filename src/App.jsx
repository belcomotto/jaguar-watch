import { useState, useRef } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HistoryView from './components/HistoryView';
import LegislationView from './components/LegislationView';
import FloodHubView from './components/FloodHubView';

const DEFAULT_LAYERS = {
  park: true,
  buffer: true,
  pumps: true,
  gsw_seasonality: false,
  gsw_extent: false,
  gsw_transitions: false,
  floodGauges: false,
};

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
  const [activeTab, setActiveTab] = useState('Discover');
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [sentinel, setSentinel] = useState({
    enabled: false,
    band: 'true-color',
    date: INITIAL_DATE,
  });
  const mapRef = useRef(null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        layers={layers}
        mapRef={mapRef}
        sentinel={sentinel}
        months={MONTHS}
      />

      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'Discover' && (
        <Sidebar
          layers={layers}
          setLayers={setLayers}
          sentinel={sentinel}
          setSentinel={setSentinel}
        />
      )}

      {activeTab === 'History'     && <HistoryView />}
      {activeTab === 'Legislation' && <LegislationView />}
      {activeTab === 'Analyze'     && <FloodHubView />}
    </div>
  );
}
