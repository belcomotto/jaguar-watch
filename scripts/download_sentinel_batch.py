#!/usr/bin/env python3
"""
Jaguar Watch — Sentinel-2 Production Download Pipeline
=======================================================
Downloads monthly Sentinel-2 L2A composites for the Bermejo basin (2016–2026)
via the Copernicus Data Space Ecosystem Process API.

3-phase cloud strategy:
  Phase 1 — ≤25% cloud  → accept if ≥70% valid pixels
  Phase 2 — ≤40% cloud  → accept if ≥70% valid pixels
  Phase 3 — temporal interpolation from M-1 and M+1 (second pass)

Outputs: GeoTIFF (LZW, EPSG:3857) in jaguar-watch-data/raw/mapbox/{YYYY}/{YYYY-MM}/
Tracking: SQLite at jaguar-watch-data/database/inventory.db

Usage:
  python scripts/download_sentinel_batch.py            # full run 2016–2026
  python scripts/download_sentinel_batch.py --test     # 3 sample months
  python scripts/download_sentinel_batch.py --month 2020-06

Requirements:
  pip install requests rasterio numpy pyproj
"""

import os, sys, json, time, sqlite3, logging, calendar, tempfile, shutil, argparse, warnings
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict

# ── Dependency check ──────────────────────────────────────────────────────────
try:
    import requests
    import numpy as np
    import rasterio
    from rasterio.merge import merge as rio_merge
    from pyproj import Transformer
except ImportError as exc:
    sys.exit(f"Missing dependency: {exc}\nRun: pip install requests rasterio numpy pyproj")

# ── Configuration ─────────────────────────────────────────────────────────────
BBOX_WGS84   = (-62.5, -25.7, -60.4, -24.0)   # West, South, East, North — from MapView.jsx:8
RESOLUTION_M = 30                               # metres/pixel (matches existing pipeline)
GRID_COLS    = 4                                # 4×3 grid keeps tile width ≤ 2500px at 30m/px
GRID_ROWS    = 3
OUTPUT_CRS   = "EPSG:3857"

START_YEAR, START_MONTH = 2016, 1
END_YEAR,   END_MONTH   = 2026, 5

PHASE1_CLOUD = 25
PHASE2_CLOUD = 40
MIN_VALID_PCT = 70.0          # % valid pixels required to accept an image

DATA_DIR    = Path(__file__).parent.parent / "jaguar-watch-data"
MAPBOX_DIR  = DATA_DIR / "raw" / "mapbox"
DB_PATH     = DATA_DIR / "database" / "inventory.db"
LOG_PATH    = DATA_DIR / "logs" / "batch_download.log"
CACHE_PATH  = DATA_DIR / "cache" / "processed_months.json"

CDSE_TOKEN_URL  = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
SH_PROCESS_URL  = "https://sh.dataspace.copernicus.eu/api/v1/process"

# SCL classes that count as VALID (not cloud / shadow / nodata)
SCL_VALID = {2, 4, 5, 6, 7}   # dark area, vegetation, bare soil, water, unclassified

# ── Evalscripts (JavaScript, Sentinel Hub v3 format) ─────────────────────────
EVALSCRIPTS: Dict[str, str] = {

    "SCL": """
//VERSION=3
function setup() {
  return { input: ["SCL"], output: { bands: 1, sampleType: "UINT8" } };
}
function evaluatePixel(s) { return [s.SCL]; }
""",

    "NDWI": """
//VERSION=3
// McFeeters (1996): water-body detection
function setup() {
  return { input: ["B03", "B08"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  return [(s.B03 - s.B08) / (s.B03 + s.B08 + 1e-9)];
}
""",

    "NDVI": """
//VERSION=3
function setup() {
  return { input: ["B04", "B08"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  return [(s.B08 - s.B04) / (s.B08 + s.B04 + 1e-9)];
}
""",

    "TrueColor": """
//VERSION=3
// Gain of 3.5 maps typical Gran Chaco reflectance (0-0.3) to 0-255.
// Output UINT8 so files are viewer- and Mapbox-ready without rescaling.
function setup() {
  return { input: ["B04", "B03", "B02"], output: { bands: 3, sampleType: "UINT8" } };
}
function evaluatePixel(s) {
  const gain = 3.5;
  return [
    Math.min(255, Math.max(0, Math.round(s.B04 * gain * 255))),
    Math.min(255, Math.max(0, Math.round(s.B03 * gain * 255))),
    Math.min(255, Math.max(0, Math.round(s.B02 * gain * 255)))
  ];
}
""",

    "MoistureIndex": """
//VERSION=3
// (B8A - B11) / (B8A + B11) — vegetation moisture, same formula as download_sentinel.mjs
function setup() {
  return { input: ["B8A", "B11"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  return [(s.B8A - s.B11) / (s.B8A + s.B11 + 1e-9)];
}
""",
}

LAYER_DTYPES = {
    "SCL":           "uint8",
    "NDWI":          "float32",
    "NDVI":          "float32",
    "TrueColor":     "uint8",
    "MoistureIndex": "float32",
}

LAYERS = list(EVALSCRIPTS.keys())


# ── Geo utilities ─────────────────────────────────────────────────────────────

_transformer = None
def _get_transformer():
    global _transformer
    if _transformer is None:
        _transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    return _transformer

def wgs84_to_3857(west, south, east, north) -> List[float]:
    t = _get_transformer()
    minx, miny = t.transform(west, south)
    maxx, maxy = t.transform(east, north)
    return [minx, miny, maxx, maxy]

def split_bbox(west, south, east, north, ncols, nrows) -> List[Tuple]:
    dlng = (east - west) / ncols
    dlat = (north - south) / nrows
    tiles = []
    for row in range(nrows):
        for col in range(ncols):
            tw = west + col * dlng;  te = tw + dlng
            ts = south + row * dlat; tn = ts + dlat
            tiles.append((tw, ts, te, tn))
    return tiles

def tile_pixel_size(bbox_3857, resolution_m):
    minx, miny, maxx, maxy = bbox_3857
    w = max(1, round((maxx - minx) / resolution_m))
    h = max(1, round((maxy - miny) / resolution_m))
    return w, h


# ── Authentication ────────────────────────────────────────────────────────────

class CDSEAuth:
    def __init__(self, username: str, password: str, client_id: str = "cdse-public"):
        self.username   = username
        self.password   = password
        self.client_id  = client_id
        self._token:    Optional[str] = None
        self._expiry:   float = 0.0

    def token(self) -> str:
        if self._token and time.time() < self._expiry - 60:
            return self._token
        resp = requests.post(CDSE_TOKEN_URL, data={
            "grant_type": "password",
            "username":   self.username,
            "password":   self.password,
            "client_id":  self.client_id,
        }, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        self._token  = data["access_token"]
        self._expiry = time.time() + data.get("expires_in", 600)
        return self._token


# ── Sentinel Hub Process API ──────────────────────────────────────────────────

def fetch_tile(auth: CDSEAuth, bbox_wgs84: Tuple, layer: str,
               time_from: str, time_to: str, cloud_pct: int,
               max_retries: int = 3) -> Optional[bytes]:
    """Request one tile from the SH Process API. Returns TIFF bytes or None."""
    bbox_3857 = wgs84_to_3857(*bbox_wgs84)
    width, height = tile_pixel_size(bbox_3857, RESOLUTION_M)
    n_bands = 3 if layer == "TrueColor" else 1

    payload = {
        "input": {
            "bounds": {
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/3857"},
                "bbox": bbox_3857,
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange":      {"from": time_from, "to": time_to},
                    "mosaickingOrder": "leastCC",
                    "maxCloudCoverage": cloud_pct,
                },
            }],
        },
        "output": {
            "width": width,
            "height": height,
            "responses": [{"identifier": "default", "format": {"type": "image/tiff"}}],
        },
        "evalscript": EVALSCRIPTS[layer],
    }

    backoff = [10, 30, 60]
    for attempt in range(max_retries):
        try:
            resp = requests.post(SH_PROCESS_URL, json=payload, headers={
                "Authorization": f"Bearer {auth.token()}",
                "Accept":        "image/tiff",
            }, timeout=180)

            ct = resp.headers.get("Content-Type", "")
            if resp.status_code == 200 and "tiff" in ct:
                return resp.content
            if resp.status_code == 204:
                return None   # no data for this period/area
            if resp.status_code == 429:
                wait = 120 * (attempt + 1)
                logging.warning(f"    rate limited — waiting {wait}s")
                time.sleep(wait)
                continue
            # Other errors
            logging.warning(f"    HTTP {resp.status_code}: {resp.text[:300]}")
            if attempt < max_retries - 1:
                time.sleep(backoff[attempt])
        except requests.RequestException as exc:
            logging.warning(f"    request error (attempt {attempt+1}): {exc}")
            if attempt < max_retries - 1:
                time.sleep(backoff[attempt])

    return None


# ── Rasterio mosaicking ───────────────────────────────────────────────────────

def mosaic_tiles(tile_paths: List[Path], out_path: Path) -> bool:
    """Merge tile TIFFs into a single LZW-compressed GeoTIFF. Returns success."""
    valid = [p for p in tile_paths if p.exists() and p.stat().st_size > 2000]
    if not valid:
        return False

    if len(valid) == 1:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(valid[0], out_path)
        return True

    datasets = []
    try:
        datasets = [rasterio.open(p) for p in valid]
        mosaic, transform = rio_merge(datasets, method="first")

        profile = datasets[0].profile.copy()
        profile.update({
            "height":    mosaic.shape[1],
            "width":     mosaic.shape[2],
            "transform": transform,
            "compress":  "lzw",
            "predictor": 2,
            "tiled":     True,
            "blockxsize": 256,
            "blockysize": 256,
        })
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with rasterio.open(out_path, "w", **profile) as dst:
            dst.write(mosaic)
        return True

    except Exception as exc:
        logging.error(f"    mosaic failed: {exc}")
        return False
    finally:
        for ds in datasets:
            ds.close()


# ── Valid-pixel calculation (from SCL) ────────────────────────────────────────

def valid_pct_from_scl(scl_path: Optional[Path]) -> float:
    if not scl_path or not scl_path.exists():
        return 0.0
    try:
        with rasterio.open(scl_path) as src:
            data     = src.read(1)
            nodata   = src.nodata
            has_data = (data != nodata) if nodata is not None else np.ones_like(data, bool)
            total    = int(has_data.sum())
            if total == 0:
                return 0.0
            valid = np.isin(data, list(SCL_VALID)) & has_data
            return float(valid.sum() / total * 100)
    except Exception as exc:
        logging.error(f"    SCL read error: {exc}")
        return 0.0


# ── Temporal interpolation (Phase 3) ─────────────────────────────────────────

def interpolate_month(prev_paths: Dict[str, Path], next_paths: Dict[str, Path],
                      out_dir: Path, year: int, month: int) -> Dict[str, Path]:
    """Average M-1 and M+1 images. Returns dict of output paths (may be partial)."""
    done = {}
    for layer in LAYERS:
        p1 = prev_paths.get(layer)
        p2 = next_paths.get(layer)
        if not p1 or not p2 or not p1.exists() or not p2.exists():
            continue
        out = out_dir / f"{layer}_{year:04d}-{month:02d}.tif"
        try:
            with rasterio.open(p1) as s1, rasterio.open(p2) as s2:
                d1 = s1.read().astype(np.float64)
                d2 = s2.read().astype(np.float64)
                avg = (d1 + d2) / 2.0
                dtype = LAYER_DTYPES[layer]
                if dtype == "uint8":
                    avg = avg.clip(0, 255).astype(np.uint8)
                elif dtype == "uint16":
                    avg = avg.clip(0, 65535).astype(np.uint16)
                else:
                    avg = avg.astype(np.float32)

                profile = s1.profile.copy()
                profile.update({"compress": "lzw", "predictor": 2,
                                "tiled": True, "blockxsize": 256, "blockysize": 256})
                out_dir.mkdir(parents=True, exist_ok=True)
                with rasterio.open(out, "w", **profile) as dst:
                    dst.write(avg)
            done[layer] = out
        except Exception as exc:
            logging.error(f"    interpolation {layer}: {exc}")
    return done


# ── SQLite inventory ──────────────────────────────────────────────────────────

class DB:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(path)
        self._schema()

    def _schema(self):
        self.conn.executescript("""
        CREATE TABLE IF NOT EXISTS monthly_images (
          id                         INTEGER PRIMARY KEY,
          year                       INTEGER NOT NULL,
          month                      INTEGER NOT NULL,
          scl_path_3857              TEXT,
          ndwi_path_3857             TEXT,
          ndvi_path_3857             TEXT,
          true_color_path_3857       TEXT,
          moisture_index_path_3857   TEXT,
          cloud_coverage_percent     REAL,
          processing_phase           INTEGER,
          valid_pixel_percent        REAL,
          source_batch_id            TEXT,
          is_interpolated            BOOLEAN DEFAULT FALSE,
          interpolation_source_months TEXT,
          processed_date             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(year, month)
        );

        CREATE TABLE IF NOT EXISTS batch_tracking (
          id              INTEGER PRIMARY KEY,
          batch_id        TEXT UNIQUE,
          year            INTEGER,
          month           INTEGER,
          phase           INTEGER,
          submission_date TIMESTAMP,
          completion_date TIMESTAMP,
          status          TEXT,
          error_message   TEXT,
          retry_count     INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS processing_log (
          id         INTEGER PRIMARY KEY,
          timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          event_type TEXT,
          year       INTEGER,
          month      INTEGER,
          details    TEXT,
          success    BOOLEAN
        );
        """)
        self.conn.commit()

    def is_done(self, year: int, month: int) -> bool:
        row = self.conn.execute(
            "SELECT valid_pixel_percent FROM monthly_images WHERE year=? AND month=?",
            (year, month)).fetchone()
        return row is not None and row[0] is not None and row[0] >= MIN_VALID_PCT

    def upsert(self, year: int, month: int, paths: Dict[str, Path],
               cloud_pct, phase: int, valid_pct: float,
               interpolated: bool = False, src_months=None):
        self.conn.execute("""
          INSERT INTO monthly_images
            (year, month, scl_path_3857, ndwi_path_3857, ndvi_path_3857,
             true_color_path_3857, moisture_index_path_3857,
             cloud_coverage_percent, processing_phase, valid_pixel_percent,
             is_interpolated, interpolation_source_months)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(year, month) DO UPDATE SET
            scl_path_3857=excluded.scl_path_3857,
            ndwi_path_3857=excluded.ndwi_path_3857,
            ndvi_path_3857=excluded.ndvi_path_3857,
            true_color_path_3857=excluded.true_color_path_3857,
            moisture_index_path_3857=excluded.moisture_index_path_3857,
            cloud_coverage_percent=excluded.cloud_coverage_percent,
            processing_phase=excluded.processing_phase,
            valid_pixel_percent=excluded.valid_pixel_percent,
            is_interpolated=excluded.is_interpolated,
            interpolation_source_months=excluded.interpolation_source_months,
            processed_date=CURRENT_TIMESTAMP
        """, (
            year, month,
            str(paths.get("SCL",           "")),
            str(paths.get("NDWI",          "")),
            str(paths.get("NDVI",          "")),
            str(paths.get("TrueColor",     "")),
            str(paths.get("MoistureIndex", "")),
            cloud_pct, phase, valid_pct, interpolated,
            json.dumps(src_months) if src_months else None,
        ))
        self.conn.commit()

    def get_paths(self, year: int, month: int) -> Optional[Dict[str, Path]]:
        row = self.conn.execute("""
          SELECT scl_path_3857, ndwi_path_3857, ndvi_path_3857,
                 true_color_path_3857, moisture_index_path_3857
          FROM monthly_images WHERE year=? AND month=?
        """, (year, month)).fetchone()
        if not row:
            return None
        keys = ["SCL", "NDWI", "NDVI", "TrueColor", "MoistureIndex"]
        return {k: Path(v) for k, v in zip(keys, row) if v}

    def log(self, event: str, year: int, month: int, details: str, ok: bool):
        self.conn.execute(
            "INSERT INTO processing_log (event_type, year, month, details, success) VALUES (?,?,?,?,?)",
            (event, year, month, details, ok))
        self.conn.commit()

    def summary(self) -> Dict:
        rows = self.conn.execute(
            "SELECT processing_phase, COUNT(*) FROM monthly_images GROUP BY processing_phase"
        ).fetchall()
        return {f"phase_{r[0]}": r[1] for r in rows}

    def close(self):
        self.conn.close()


# ── Pipeline orchestrator ─────────────────────────────────────────────────────

class SentinelPipeline:

    def __init__(self, username: str, password: str,
                 test_months: Optional[List[Tuple[int,int]]] = None):
        self.auth        = CDSEAuth(username, password)
        self.db          = DB(DB_PATH)
        self.test_months = test_months
        self.grid        = split_bbox(*BBOX_WGS84, GRID_COLS, GRID_ROWS)

        # Ensure all output dirs exist
        for d in [MAPBOX_DIR, DATA_DIR/"database", DATA_DIR/"cache", DATA_DIR/"logs"]:
            d.mkdir(parents=True, exist_ok=True)

        # Suppress noisy PROJ/rasterio CRS registry warnings (cosmetic, data is correct)
        warnings.filterwarnings("ignore", message=".*EPSG.*", category=UserWarning)
        logging.getLogger("rasterio").setLevel(logging.ERROR)

        # Logging: file + stdout
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)-8s %(message)s",
            handlers=[
                logging.FileHandler(LOG_PATH),
                logging.StreamHandler(sys.stdout),
            ])

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _month_dir(self, year: int, month: int) -> Path:
        return MAPBOX_DIR / str(year) / f"{year:04d}-{month:02d}"

    def _time_range(self, year: int, month: int) -> Tuple[str, str]:
        last = calendar.monthrange(year, month)[1]
        return (f"{year:04d}-{month:02d}-01T00:00:00Z",
                f"{year:04d}-{month:02d}-{last:02d}T23:59:59Z")

    def _prev_next(self, year: int, month: int):
        py, pm = (year, month-1) if month > 1 else (year-1, 12)
        ny, nm = (year, month+1) if month < 12 else (year+1, 1)
        return (py, pm), (ny, nm)

    # ── Phase 1 / 2: download all tiles + mosaic ──────────────────────────────

    def _download_phase(self, year: int, month: int, cloud_pct: int) -> Optional[Dict[str, Path]]:
        """Download all 9 tiles for all 5 layers at given cloud threshold. Returns paths or None."""
        time_from, time_to = self._time_range(year, month)
        month_dir = self._month_dir(year, month)

        paths: Dict[str, Path] = {}

        for layer in LAYERS:
            out = month_dir / f"{layer}_{year:04d}-{month:02d}.tif"

            # Resume: skip if file already looks complete
            if out.exists() and out.stat().st_size > 10_000:
                logging.info(f"  {layer}: resuming from cache")
                paths[layer] = out
                continue

            tile_tiffs: List[Path] = []

            with tempfile.TemporaryDirectory() as tmp:
                for ti, tile_bbox in enumerate(self.grid):
                    data = fetch_tile(self.auth, tile_bbox, layer,
                                      time_from, time_to, cloud_pct)
                    if data is None:
                        logging.debug(f"  {layer} tile {ti}: no data")
                        continue
                    tp = Path(tmp) / f"{layer}_t{ti}.tif"
                    tp.write_bytes(data)
                    tile_tiffs.append(tp)
                    logging.debug(f"  {layer} tile {ti}: {len(data)//1024} KB")

                if not tile_tiffs:
                    logging.warning(f"  {layer}: 0/{len(self.grid)} tiles returned")
                    return None  # entire layer missing → escalate phase

                ok = mosaic_tiles(tile_tiffs, out)

            if ok:
                logging.info(f"  {layer}: ok ({len(tile_tiffs)}/{len(self.grid)} tiles, {out.stat().st_size//1024} KB)")
                paths[layer] = out
            else:
                logging.warning(f"  {layer}: mosaic failed")
                return None

        return paths if len(paths) == len(LAYERS) else None

    # ── Per-month processing ──────────────────────────────────────────────────

    def process_month(self, year: int, month: int) -> str:
        """
        Run the 3-phase strategy for one month.
        Returns: 'phase1' | 'phase2' | 'phase3' | 'skip' | 'fail'
        """
        ym = f"{year:04d}-{month:02d}"

        if self.db.is_done(year, month):
            logging.info(f"{ym}: already cached (≥{MIN_VALID_PCT}% valid) — skip")
            return "skip"

        # ── Phase 1 ───────────────────────────────────────────────────────────
        logging.info(f"{ym} → Phase 1 (≤{PHASE1_CLOUD}% cloud)")
        paths = self._download_phase(year, month, PHASE1_CLOUD)
        if paths:
            vp = valid_pct_from_scl(paths.get("SCL"))
            logging.info(f"  valid pixels: {vp:.1f}%")
            if vp >= MIN_VALID_PCT:
                self.db.upsert(year, month, paths, PHASE1_CLOUD, 1, vp)
                self.db.log("PHASE1_OK", year, month, f"{vp:.1f}% valid", True)
                return "phase1"

        # ── Phase 2 ───────────────────────────────────────────────────────────
        logging.info(f"{ym} → Phase 2 (≤{PHASE2_CLOUD}% cloud)")
        paths2 = self._download_phase(year, month, PHASE2_CLOUD)
        if paths2:
            vp = valid_pct_from_scl(paths2.get("SCL"))
            logging.info(f"  valid pixels: {vp:.1f}%")
            if vp >= MIN_VALID_PCT:
                self.db.upsert(year, month, paths2, PHASE2_CLOUD, 2, vp)
                self.db.log("PHASE2_OK", year, month, f"{vp:.1f}% valid", True)
                return "phase2"

        # Phase 3 is deferred to the second pass (needs adjacent months)
        logging.warning(f"{ym}: Phase 1+2 insufficient — queued for interpolation")
        return "pending"

    def try_interpolate(self, year: int, month: int) -> bool:
        """Phase 3: temporal average of M-1 and M+1 (run after the main pass)."""
        ym = f"{year:04d}-{month:02d}"
        if self.db.is_done(year, month):
            return True

        (py, pm), (ny, nm) = self._prev_next(year, month)
        prev = self.db.get_paths(py, pm)
        nxt  = self.db.get_paths(ny, nm)

        if not prev or not nxt:
            logging.warning(f"{ym} Phase 3: missing adjacent months ({py}-{pm:02d} / {ny}-{nm:02d})")
            self.db.log("NO_DATA", year, month, "adjacent months unavailable", False)
            return False

        out_dir = self._month_dir(year, month)
        done    = interpolate_month(prev, nxt, out_dir, year, month)

        if len(done) == len(LAYERS):
            src = [f"{py:04d}-{pm:02d}", f"{ny:04d}-{nm:02d}"]
            self.db.upsert(year, month, done, None, 3, 100.0,
                           interpolated=True, src_months=src)
            self.db.log("PHASE3_OK", year, month, f"interpolated from {src}", True)
            logging.info(f"{ym}: DONE (Phase 3 — interpolated from {src})")
            return True

        logging.warning(f"{ym}: Phase 3 incomplete — only {len(done)}/{len(LAYERS)} layers")
        self.db.log("NO_DATA", year, month, "interpolation incomplete", False)
        return False

    # ── Main run ──────────────────────────────────────────────────────────────

    def run(self):
        logging.info("=" * 64)
        logging.info("Jaguar Watch — Sentinel-2 Download Pipeline")
        logging.info(f"Bbox:       {BBOX_WGS84}")
        logging.info(f"Grid:       {GRID_COLS}×{GRID_ROWS} tiles, {RESOLUTION_M} m/px")
        logging.info(f"Output CRS: {OUTPUT_CRS}")

        # Validate auth
        try:
            self.auth.token()
            logging.info("Auth:       OK (CDSE OAuth2)")
        except Exception as exc:
            logging.error(f"Authentication failed: {exc}")
            sys.exit(1)

        # Build month list
        months: List[Tuple[int,int]] = []
        y, m = START_YEAR, START_MONTH
        while (y, m) <= (END_YEAR, END_MONTH):
            months.append((y, m))
            m += 1
            if m > 12:
                m, y = 1, y + 1

        if self.test_months:
            months = self.test_months
            logging.info(f"TEST MODE:  {months}")

        total   = len(months)
        pending = []  # months that need Phase 3

        logging.info(f"Months:     {total}")
        logging.info("=" * 64)

        # ── Pass 1: Phase 1 + Phase 2 ─────────────────────────────────────────
        for i, (year, month) in enumerate(months, 1):
            logging.info(f"\n[{i}/{total}] {year:04d}-{month:02d}")
            try:
                result = self.process_month(year, month)
                if result == "pending":
                    pending.append((year, month))
            except Exception as exc:
                logging.error(f"{year:04d}-{month:02d}: unexpected error: {exc}", exc_info=True)
                pending.append((year, month))
            if i % 5 == 0:
                summary = self.db.summary()
                logging.info(f"  ── progress {i}/{total}: {summary}")

        # ── Pass 2: Phase 3 interpolation ─────────────────────────────────────
        if pending:
            logging.info(f"\n{'='*64}")
            logging.info(f"Pass 2 — Phase 3 interpolation for {len(pending)} months")
            for year, month in pending:
                try:
                    self.try_interpolate(year, month)
                except Exception as exc:
                    logging.error(f"{year:04d}-{month:02d} interpolation error: {exc}", exc_info=True)

        # ── Final report ──────────────────────────────────────────────────────
        summary = self.db.summary()
        no_data = sum(1 for y, m in months if not self.db.is_done(y, m))
        logging.info(f"\n{'='*64}")
        logging.info(f"COMPLETE — {total} months processed")
        logging.info(f"  Phase 1 (≤25% cloud):       {summary.get('phase_1', 0)}")
        logging.info(f"  Phase 2 (≤40% cloud):       {summary.get('phase_2', 0)}")
        logging.info(f"  Phase 3 (interpolated):     {summary.get('phase_3', 0)}")
        logging.info(f"  No data:                    {no_data}")

        # Write cache JSON
        cache = {
            "generated": datetime.now(timezone.utc).isoformat(),
            "summary":   summary,
            "no_data":   no_data,
        }
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache, indent=2))
        logging.info(f"Cache written → {CACHE_PATH}")

        self.db.close()


# ── CLI entry point ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Jaguar Watch — Sentinel-2 production download pipeline")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--test",  action="store_true",
                       help="Quick test on 3 sample months (Jan 2020, Jun 2016, Dec 2024)")
    group.add_argument("--month", metavar="YYYY-MM",
                       help="Process a single month (e.g. 2022-07)")
    parser.add_argument("--start", metavar="YYYY-MM", default=None,
                        help="Override start month for full run")
    args = parser.parse_args()

    username = os.getenv("CDSE_USERNAME")
    password = os.getenv("CDSE_PASSWORD")

    if not username or not password:
        sys.exit(
            "ERROR: CDSE_USERNAME and CDSE_PASSWORD must be set.\n"
            "Add them to .env and run with: source .env or use dotenv."
        )

    test_months = None
    if args.test:
        test_months = [(2020, 1), (2016, 6), (2024, 12)]
        print("Running in TEST mode — 3 sample months only")
    elif args.month:
        y, m = args.month.split("-")
        test_months = [(int(y), int(m))]

    pipeline = SentinelPipeline(username, password, test_months=test_months)
    pipeline.run()


if __name__ == "__main__":
    main()
