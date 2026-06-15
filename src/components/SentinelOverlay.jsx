import { useEffect, useRef, useCallback } from 'react';

// Exact bounding box from the KMZ KML files
const B = {
  west:  -62.347412,
  north: -24.106658,
  east:  -60.177612,
  south: -25.659090,
};

// Mapbox image source corner order: NW NE SE SW
const COORDS = [
  [B.west, B.north],
  [B.east, B.north],
  [B.east, B.south],
  [B.west, B.south],
];

// Canvas dimensions — aspect ratio matches bbox
const CW = 2048;
const CH = Math.round(CW * (B.north - B.south) / (B.east - B.west));

const SEASONS = {
  dry: { before: 'dry_early',  after: 'dry_recent',  beforeLabel: 'Jul 2016', afterLabel: 'Jul 2025' },
  wet: { before: 'wet_early',  after: 'wet_recent',  beforeLabel: 'Dec 2015', afterLabel: 'Jan 2026' },
};

const LABEL = {
  position: 'absolute',
  fontFamily: "'Icone Pro', 'IM Fell Double Pica', serif",
  fontSize: '9px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(250,249,247,0.9)',
  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
  background: 'rgba(0,0,0,0.4)',
  padding: '2px 7px',
  borderRadius: '2px',
  pointerEvents: 'none',
  zIndex: 4,
  whiteSpace: 'nowrap',
  display: 'none',
};

export default function SentinelOverlay({ mapRef, sentinelView, setSentinelView, sentCanvasRef }) {
  const { enabled, season, band } = sentinelView;
  const sd = SEASONS[season] ?? SEASONS.dry;

  // sentCanvasRef is created and owned by MapView (inside map.on('load'))
  // We alias it locally for clarity
  const canvasRef = sentCanvasRef;

  const loadGenRef    = useRef(0); // generation counter to abort stale loads
  const beforeImgRef  = useRef(null);
  const afterImgRef   = useRef(null);

  // Divider longitude — stored as ref so drag updates don't cause re-renders
  const divLngRef = useRef(sentinelView.dividerLng);
  const isDragging = useRef(false);

  // DOM refs for the overlay elements (mutated directly, no React state)
  const wrapRef   = useRef(null);
  const lineRef   = useRef(null);
  const handleRef = useRef(null);
  const lblBRef   = useRef(null);
  const lblARef   = useRef(null);

  // ─── 2. Draw the before/after split onto the canvas ───────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const bImg   = beforeImgRef.current;
    const aImg   = afterImgRef.current;
    if (!canvas || !bImg?.complete || !aImg?.complete) return;

    const ctx = canvas.getContext('2d');
    const t   = Math.max(0, Math.min(1, (divLngRef.current - B.west) / (B.east - B.west)));
    const sx  = Math.round(t * CW);

    ctx.clearRect(0, 0, CW, CH);

    // Left portion: before image
    if (sx > 0) {
      ctx.drawImage(bImg, 0, 0, bImg.naturalWidth * t, bImg.naturalHeight, 0, 0, sx, CH);
    }
    // Right portion: after image
    if (sx < CW) {
      ctx.drawImage(aImg, aImg.naturalWidth * t, 0, aImg.naturalWidth * (1 - t), aImg.naturalHeight, sx, 0, CW - sx, CH);
    }
  }, []);

  // ─── 3. Load images when season / band changes ────────────────────────────
  useEffect(() => {
    loadGenRef.current += 1;
    const gen = loadGenRef.current;

    beforeImgRef.current = null;
    afterImgRef.current  = null;

    const bImg = new Image();
    const aImg = new Image();
    let done = 0;

    const onLoad = () => {
      if (++done < 2 || loadGenRef.current !== gen) return;
      beforeImgRef.current = bImg;
      afterImgRef.current  = aImg;
      drawCanvas();
    };

    bImg.onload = onLoad;
    aImg.onload = onLoad;
    bImg.src = `/data/sentinel/${sd.before}_${band}.jpg`;
    aImg.src = `/data/sentinel/${sd.after}_${band}.jpg`;
  }, [season, band, drawCanvas, sd.before, sd.after]);

  // ─── 4. Show/hide Mapbox layer ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer('_sentinel_split_layer')) return;
      map.setPaintProperty('_sentinel_split_layer', 'raster-opacity', enabled ? 0.95 : 0);
      // Redraw canvas in case images loaded before the canvas was ready
      if (enabled) drawCanvas();
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
  }, [enabled, mapRef, drawCanvas]);

  // ─── 5. Sync divider DOM position on every map render frame ──────────────
  const syncDOM = useCallback(() => {
    const map = mapRef.current;
    if (!map || !enabled) return;

    const lng  = divLngRef.current;
    const p    = map.project([lng, (B.north + B.south) / 2]);
    const nw   = map.project([B.west, B.north]);
    const se   = map.project([B.east, B.south]);
    const imgH = Math.max(0, se.y - nw.y);

    if (lineRef.current) {
      const l = lineRef.current;
      l.style.left    = `${p.x}px`;
      l.style.top     = `${nw.y}px`;
      l.style.height  = `${imgH}px`;
      l.style.display = 'block';
    }
    if (handleRef.current) {
      const h = handleRef.current;
      h.style.left    = `${p.x}px`;
      h.style.top     = `${(nw.y + se.y) / 2}px`;
      h.style.display = 'flex';
    }
    if (lblBRef.current) {
      lblBRef.current.style.left    = `${nw.x + 10}px`;
      lblBRef.current.style.top     = `${se.y - 26}px`;
      lblBRef.current.style.display = 'block';
    }
    if (lblARef.current) {
      lblARef.current.style.left      = `${se.x - 10}px`;
      lblARef.current.style.top       = `${se.y - 26}px`;
      lblARef.current.style.transform = 'translateX(-100%)';
      lblARef.current.style.display   = 'block';
    }
  }, [enabled, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled) {
      // Hide overlay elements when disabled
      [lineRef, handleRef, lblBRef, lblARef].forEach(r => {
        if (r.current) r.current.style.display = 'none';
      });
      return;
    }
    map.on('render', syncDOM);
    syncDOM();
    return () => map.off('render', syncDOM);
  }, [enabled, mapRef, syncDOM]);

  // ─── 6. Keep ref in sync with state (e.g. after toggle re-enable) ─────────
  useEffect(() => {
    divLngRef.current = sentinelView.dividerLng;
    drawCanvas();
  }, [sentinelView.dividerLng, drawCanvas]);

  // ─── 7. Drag the handle ───────────────────────────────────────────────────
  const onHandleDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const map = mapRef.current;
    if (!map) return;

    const onMove = (e) => {
      if (!isDragging.current) return;
      const clientX  = e.touches ? e.touches[0].clientX : e.clientX;
      const canvasEl = map.getCanvas();
      const rect     = canvasEl.getBoundingClientRect();
      const x        = clientX - rect.left;
      const lng      = map.unproject([x, canvasEl.height / 2]).lng;
      const clamped  = Math.max(B.west, Math.min(B.east, lng));
      divLngRef.current = clamped;
      drawCanvas();
      syncDOM();
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setSentinelView(prev => ({ ...prev, dividerLng: divLngRef.current }));
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };
  }, [enabled, drawCanvas, syncDOM, mapRef, setSentinelView]);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>

      {/* Divider line */}
      <div ref={lineRef} style={{
        display: 'none',
        position: 'absolute',
        width: 2,
        background: 'rgba(250,249,247,0.9)',
        transform: 'translateX(-50%)',
        boxShadow: '0 0 6px rgba(0,0,0,0.5)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* Draggable handle */}
      <div
        ref={handleRef}
        onMouseDown={onHandleDown}
        onTouchStart={onHandleDown}
        style={{
          display: 'none',
          position: 'absolute',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(250,249,247,0.95)',
          border: '2px solid rgba(99,65,47,0.7)',
          transform: 'translate(-50%, -50%)',
          cursor: 'col-resize',
          pointerEvents: 'all',
          zIndex: 4,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#63412F',
          userSelect: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}
      >⟺</div>

      {/* Before label */}
      <div ref={lblBRef} style={LABEL}>{sd.beforeLabel}</div>

      {/* After label */}
      <div ref={lblARef} style={LABEL}>{sd.afterLabel}</div>
    </div>
  );
}
