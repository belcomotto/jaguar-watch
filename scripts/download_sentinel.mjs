/**
 * Sentinel-2 batch downloader — 30 m / pixel, 3×3 tiled
 *
 * The Sentinel Hub Process API caps single requests at 2500 px per dimension.
 * At 30 m the study area is ~6666×6309 px, so each composite is split into a
 * 3×3 grid of tiles (each ≤2222×2103 px), downloaded in parallel row-by-row,
 * then stitched into a single PNG with sharp.
 *
 * Cloud strategy: tries maxCloudCoverage thresholds [30, 60, 100] in order.
 * Accepts the first result where ≥60% of pixels are non-transparent.
 * On the last attempt the time window also expands ±1 month.
 * Existing files are skipped unless --force is passed.
 *
 * Run:    node scripts/download_sentinel.mjs
 * Force:  node scripts/download_sentinel.mjs --force   (re-downloads all)
 * Output: public/sentinel/{band}/{YYYY-MM}.png  (~6666×6309 px, 30 m/px)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'sentinel');

const FORCE = process.argv.includes('--force');
const ONLY_MONTH = process.argv.find(a => /^\d{4}-\d{2}$/.test(a)) || null;
const ONLY_YEARS = (() => {
  const arg = process.argv.find(a => a.startsWith('--years='));
  return arg ? arg.replace('--years=', '').split(',').map(Number) : null;
})();

let creditsExhausted = false;

const TOKEN_URL   = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

// Full study area [W, S, E, N]
const BBOX = [-62.5, -25.7, -60.4, -24.0];

// ─── Cloud fallback strategy ──────────────────────────────────────────────────
// Mirrors the Python NDWI pipeline: start strict, escalate if coverage is poor.
// MIN_COVERAGE: fraction of non-transparent pixels required to accept the image.
const CLOUD_STEPS   = [30, 60, 100]; // maxCloudCoverage % per attempt
const MIN_COVERAGE  = 0.60;          // accept if ≥60% of pixels are non-transparent

// ─── Tiling geometry ──────────────────────────────────────────────────────────

const GRID_COLS = 3;
const GRID_ROWS = 3;
const RESOLUTION_M = 30;

const [WEST, SOUTH, EAST, NORTH] = BBOX;
const D_LNG = (EAST - WEST) / GRID_COLS;
const D_LAT = (NORTH - SOUTH) / GRID_ROWS;
const CENTER_LAT = (NORTH + SOUTH) / 2;

const TILE_W = Math.round((D_LNG * Math.cos(CENTER_LAT * Math.PI / 180) * 111320) / RESOLUTION_M);
const TILE_H = Math.round((D_LAT * 111320) / RESOLUTION_M);
const TOTAL_W = GRID_COLS * TILE_W;
const TOTAL_H = GRID_ROWS * TILE_H;

// row 0 = northernmost = top of final PNG
const TILES = [];
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    TILES.push({
      row, col,
      bbox: [
        WEST + col * D_LNG,
        NORTH - (row + 1) * D_LAT,
        WEST + (col + 1) * D_LNG,
        NORTH - row * D_LAT,
      ],
    });
  }
}

// ─── Evalscripts ─────────────────────────────────────────────────────────────
//
// All bands use ORBIT mosaicking: evaluatePixel receives one sample per
// Sentinel-2 pass in the time window. Passes are sorted least-cloudy-first via
// filterScenes; we pick the first pixel whose SCL class is clear sky.
// If every pass is cloudy at a pixel we return the least-cloudy available value
// (second loop) rather than transparent — no black holes.
//
// Clear-sky SCL classes: 4=vegetation, 5=non-veg, 6=water, 7=unclassified, 11=snow
// Excluded: 0=no-data, 1=saturated, 2=dark/shadow, 3=cloud-shadow,
//           8=cloud-med, 9=cloud-high, 10=thin-cirrus

// Sort by cloud cover ascending, keep top 12 scenes (was 8 — more material for
// ORBIT mosaicking in months with sparse clear passes).
const FILTER_SCENES = `
function filterScenes(scenes){
  return scenes.sort(function(a,b){return(a.cloudCoverPercentage||0)-(b.cloudCoverPercentage||0);}).slice(0,12);
}`;

function trueColorScript() {
  return `//VERSION=3
function setup(){return{input:[{bands:["B04","B03","B02","SCL","dataMask"]}],output:{bands:4},mosaicking:"ORBIT"};}
${FILTER_SCENES}
function evaluatePixel(samples){
  var CLEAR={4:1,5:1,6:1,7:1,11:1};
  for(var i=0;i<samples.length;i++){var s=samples[i];if(s.dataMask&&CLEAR[s.SCL]){return[Math.min(1,3.5*s.B04),Math.min(1,3.5*s.B03),Math.min(1,3.5*s.B02),1];}}
  for(var i=0;i<samples.length;i++){var s=samples[i];if(s.dataMask){return[Math.min(1,3.5*s.B04),Math.min(1,3.5*s.B03),Math.min(1,3.5*s.B02),1];}}
  return[0,0,0,0];
}`;
}

function ndviScript() {
  return `//VERSION=3
function setup(){return{input:[{bands:["B08","B04","SCL","dataMask"]}],output:{bands:4},mosaicking:"ORBIT"};}
${FILTER_SCENES}
function evaluatePixel(samples){
  var CLEAR={4:1,5:1,6:1,7:1,11:1};
  function px(s){var v=(s.B08-s.B04)/(s.B08+s.B04+1e-6);var r=colorBlend(v,[-1,-0.2,0,0.15,0.35,0.55,1],[[0.5,0,0],[0.9,0.35,0],[1,0.9,0.05],[0.6,0.85,0.1],[0.05,0.6,0.05],[0,0.4,0],[0,0.2,0]]);return[r[0],r[1],r[2],1];}
  for(var i=0;i<samples.length;i++){if(samples[i].dataMask&&CLEAR[samples[i].SCL])return px(samples[i]);}
  for(var i=0;i<samples.length;i++){if(samples[i].dataMask)return px(samples[i]);}
  return[0,0,0,0];
}`;
}

function ndwiScript() {
  // NDWI = (B03 - B08) / (B03 + B08)  — McFeeters 1996
  // Color ramp matches EO Browser standard: tan (dry land) → pale green (veg) → cyan → deep blue (water)
  return `//VERSION=3
function setup(){return{input:[{bands:["B03","B08","SCL","dataMask"]}],output:{bands:4},mosaicking:"ORBIT"};}
${FILTER_SCENES}
function evaluatePixel(samples){
  var CLEAR={4:1,5:1,6:1,7:1,11:1};
  function px(s){var v=(s.B03-s.B08)/(s.B03+s.B08+1e-6);var r=colorBlend(v,[-1,-0.5,-0.1,0,0.1,0.3,0.5,1],[[0.0,0.30,0.0],[0.10,0.50,0.10],[0.40,0.75,0.40],[0.82,0.95,0.82],[0.70,0.90,0.95],[0.25,0.60,0.90],[0.05,0.25,0.80],[0.00,0.05,0.55]]);return[r[0],r[1],r[2],1];}
  for(var i=0;i<samples.length;i++){if(samples[i].dataMask&&CLEAR[samples[i].SCL])return px(samples[i]);}
  for(var i=0;i<samples.length;i++){if(samples[i].dataMask)return px(samples[i]);}
  return[0,0,0,0];
}`;
}

function moistureScript() {
  return `//VERSION=3
function setup(){return{input:[{bands:["B8A","B11","SCL","dataMask"]}],output:{bands:4},mosaicking:"ORBIT"};}
${FILTER_SCENES}
function evaluatePixel(samples){
  var CLEAR={4:1,5:1,6:1,7:1,11:1};
  function px(s){var v=(s.B8A-s.B11)/(s.B8A+s.B11+1e-6);var r=colorBlend(v,[-1,-0.4,0,0.2,0.5,1],[[0.5,0.25,0.05],[0.8,0.55,0.2],[0.95,0.95,0.75],[0.25,0.6,0.95],[0.05,0.3,0.9],[0,0.1,0.75]]);return[r[0],r[1],r[2],1];}
  for(var i=0;i<samples.length;i++){if(samples[i].dataMask&&CLEAR[samples[i].SCL])return px(samples[i]);}
  for(var i=0;i<samples.length;i++){if(samples[i].dataMask)return px(samples[i]);}
  return[0,0,0,0];
}`;
}

function sclScript() {
  return `//VERSION=3
function setup(){return{input:[{bands:["SCL","dataMask"]}],output:{bands:4},mosaicking:"ORBIT"};}
${FILTER_SCENES}
function evaluatePixel(samples){
  var c={0:[0,0,0],1:[1,0,0],2:[0.4,0.4,0.4],3:[0.6,0.3,0],4:[0.3,0.6,0.2],5:[1,1,0.4],6:[0.4,0.7,1],7:[0.7,0.7,0.7],8:[0.8,0.8,0.8],9:[0.9,0.9,0.9],10:[0.9,0.7,0.7],11:[0.5,0.7,1]};
  var CLEAR={4:1,5:1,6:1,7:1,11:1};
  for(var i=0;i<samples.length;i++){var s=samples[i];if(s.dataMask&&CLEAR[s.SCL]){var rgb=c[s.SCL]||[0,0,0];return[rgb[0],rgb[1],rgb[2],1];}}
  for(var i=0;i<samples.length;i++){var s=samples[i];if(s.dataMask){var rgb=c[s.SCL]||[0,0,0];return[rgb[0],rgb[1],rgb[2],1];}}
  return[0,0,0,0];
}`;
}

const BANDS = {
  'true-color':           trueColorScript(),
  'ndvi':                 ndviScript(),
  'ndwi':                 ndwiScript(),
  'moisture-index':       moistureScript(),
  'scene-classification': sclScript(),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getToken() {
  const body = new URLSearchParams({
    client_id: 'cdse-public',
    grant_type: 'password',
    username: process.env.CDSE_USERNAME || 'Belencomotto@gmail.com',
    password: process.env.CDSE_PASSWORD || 'Monito130901Be.',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Auth failed ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 90) * 1000 };
}

// ─── Time-range helper ────────────────────────────────────────────────────────

function monthRange(year, month, extend = 0) {
  const pad = n => String(n).padStart(2, '0');
  const from = new Date(year, month - 1 - extend, 1);
  const to   = new Date(year, month + extend, 0);
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-01T00:00:00Z`,
    to:   `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}T23:59:59Z`,
  };
}

// ─── Download one tile ────────────────────────────────────────────────────────

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ' +
  'AABjkB6QAAAABJRU5ErkJggg==',
  'base64'
);

async function downloadTile(auth, bandKey, year, month, tileBbox, maxCloudCoverage, extend) {
  const range = monthRange(year, month, extend);

  const payload = {
    input: {
      bounds: {
        bbox: tileBbox,
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
      },
      data: [{
        type: 'sentinel-2-l2a',
        dataFilter: {
          timeRange: { from: range.from, to: range.to },
          maxCloudCoverage,
        },
      }],
    },
    output: {
      width: TILE_W,
      height: TILE_H,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }],
    },
    evalscript: BANDS[bandKey],
  };

  const res = await fetch(PROCESS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 204 || res.status === 404) return null;
  if (res.status === 403) {
    const body = await res.text();
    if (body.includes('processing units') || body.includes('INSUFFICIENT') || body.includes('credits')) {
      creditsExhausted = true;
      throw new Error('CREDITS_EXHAUSTED: Sentinel Hub processing units depleted — stopping.');
    }
    throw new Error(`403: ${body.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Stitch 3×3 tiles into final image ────────────────────────────────────────

async function stitchTiles(tileBuffers) {
  const composites = TILES
    .filter(({ row, col }) => tileBuffers[`${row},${col}`] != null)
    .map(({ row, col }) => ({
      input: tileBuffers[`${row},${col}`],
      top:  row * TILE_H,
      left: col * TILE_W,
    }));

  if (composites.length === 0) return null;

  return sharp({
    create: { width: TOTAL_W, height: TOTAL_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png({ compressionLevel: 6 })
    .toBuffer();
}

// ─── Measure fraction of non-transparent pixels ───────────────────────────────
// Resizes to a small thumbnail before reading raw pixels — the full image is
// 7071×6309×4 channels = ~178 MB uncompressed, which crashes sharp on most machines.

async function measureCoverage(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .resize(400, null, { fit: 'inside', kernel: 'nearest' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const total = info.width * info.height;
  let covered = 0;
  for (let i = 3; i < data.length; i += info.channels) {
    if (data[i] > 0) covered++;
  }
  return covered / total;
}

// ─── Download composite with cloud-threshold fallback ─────────────────────────

async function downloadComposite(auth, bandKey, year, month, maxCloudCoverage, extend) {
  const tileBuffers = {};

  for (const tile of TILES) {
    if (Date.now() >= auth.expiresAt) {
      process.stdout.write('\n[token] Refreshing...\n');
      const refreshed = await getToken();
      auth.token = refreshed.token;
      auth.expiresAt = refreshed.expiresAt;
    }

    try {
      tileBuffers[`${tile.row},${tile.col}`] = await downloadTile(
        auth, bandKey, year, month, tile.bbox, maxCloudCoverage, extend
      );
    } catch (e) {
      tileBuffers[`${tile.row},${tile.col}`] = null;
      process.stdout.write(`\n  ! tile r${tile.row}c${tile.col}: ${e.message}\n`);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  return tileBuffers;
}

// ─── Month list ────────────────────────────────────────────────────────────────

function buildMonths() {
  const months = [];
  const now = new Date();
  let y = 2015, m = 8;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    months.push({ year: y, month: m, str: `${y}-${String(m).padStart(2, '0')}` });
    if (++m > 12) { m = 1; y++; }
  }
  return months;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let months = buildMonths();
  if (ONLY_MONTH) months = months.filter(m => m.str === ONLY_MONTH);
  if (ONLY_YEARS) months = months.filter(m => ONLY_YEARS.includes(m.year));
  const bandKeys = Object.keys(BANDS);
  const totalComposites = months.length * bandKeys.length;

  console.log(`Sentinel-2 tiled download @ ${RESOLUTION_M} m/px`);
  console.log(`Grid: ${GRID_COLS}×${GRID_ROWS} tiles — each ${TILE_W}×${TILE_H} px → final ${TOTAL_W}×${TOTAL_H} px`);
  console.log(`Bands: ${bandKeys.join(', ')}`);
  console.log(`Months: ${months[0].str} → ${months.at(-1).str} (${months.length} months)`);
  console.log(`Total composites: ${totalComposites}  |  ~2 hours  |  ~7–15 GB`);
  console.log(`Cloud strategy: try ${CLOUD_STEPS.join('% → ')}% — accept if ≥${MIN_COVERAGE * 100}% pixels non-transparent`);
  if (FORCE) console.log('Mode: --force (re-downloading all existing files)\n');
  else       console.log('Mode: skip existing files (pass --force to re-download)\n');

  for (const key of bandKeys) mkdirSync(join(OUTPUT_DIR, key), { recursive: true });

  console.log('Authenticating with Copernicus Data Space...');
  const auth = await getToken();
  console.log('OK\n');

  let done = 0, skipped = 0, noData = 0, errors = 0;
  const fallbackLog = []; // months that needed escalated thresholds

  for (const { year, month, str } of months) {
    if (creditsExhausted) break;
    for (const bandKey of bandKeys) {
      if (creditsExhausted) break;
      done++;
      const outPath = join(OUTPUT_DIR, bandKey, `${str}.png`);

      if (!FORCE && existsSync(outPath)) {
        skipped++;
        process.stdout.write(`\r[${done}/${totalComposites}] Skipped ${bandKey}/${str}            `);
        continue;
      }

      let finalBuffer = null;
      let usedThreshold = null;

      for (let attempt = 0; attempt < CLOUD_STEPS.length; attempt++) {
        const maxCloud = CLOUD_STEPS[attempt];
        // Last attempt: also widen the time window ±1 month (more scenes to mosaic from)
        const extend = attempt === CLOUD_STEPS.length - 1 ? 1 : 0;

        process.stdout.write(
          `\r[${done}/${totalComposites}] ${bandKey}/${str}: cloud≤${maxCloud}%${extend ? ' ±1mo' : ''}...      `
        );

        try {
          const tileBuffers = await downloadComposite(auth, bandKey, year, month, maxCloud, extend);
          const stitched    = await stitchTiles(tileBuffers);

          if (stitched) {
            let coverage = MIN_COVERAGE; // default: accept if coverage check fails
            try {
              coverage = await measureCoverage(stitched);
            } catch (coverageErr) {
              process.stdout.write(`\n  ! coverage check failed (${coverageErr.message}) — accepting image\n`);
            }
            if (coverage >= MIN_COVERAGE) {
              finalBuffer   = stitched;
              usedThreshold = attempt > 0 ? `cloud≤${maxCloud}%${extend ? '+±1mo' : ''}` : null;
              break;
            }
            process.stdout.write(`\n  ~ ${bandKey}/${str} cloud≤${maxCloud}%: coverage ${(coverage * 100).toFixed(0)}% < ${MIN_COVERAGE * 100}% — escalating\n`);
          }
        } catch (e) {
          process.stdout.write(`\n  ✗ ${bandKey}/${str} attempt ${attempt + 1}: ${e.message}\n`);
        }
      }

      if (creditsExhausted) {
        console.log(`\n\n⚠️  CREDITS EXHAUSTED — stopped before saving ${bandKey}/${str}. Re-run to resume.`);
        break;
      }
      if (finalBuffer) {
        writeFileSync(outPath, finalBuffer);
        if (usedThreshold) fallbackLog.push(`  ${bandKey}/${str} → needed ${usedThreshold}`);
      } else {
        writeFileSync(outPath, TRANSPARENT_PNG);
        noData++;
      }
    }
  }

  console.log(`\n\n── Summary ───────────────────────────`);
  console.log(`  Downloaded:  ${done - skipped - noData - errors}`);
  console.log(`  No imagery:  ${noData} (no usable data after all fallbacks → transparent placeholder)`);
  console.log(`  Already had: ${skipped}`);
  console.log(`  Errors:      ${errors}`);
  if (fallbackLog.length) {
    console.log(`\n  Months that needed fallback thresholds (${fallbackLog.length}):`);
    fallbackLog.forEach(l => console.log(l));
  }
  console.log(`─────────────────────────────────────`);
  console.log(`\nImages saved to: public/sentinel/`);
  console.log(`Resolution: ${RESOLUTION_M} m/px — ${TOTAL_W}×${TOTAL_H} px per image`);
}

main().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });
