/**
 * Parses all per-year MapBiomas coverage CSVs into a single JSON file.
 * Run once: node scripts/parse_mapbiomas_coverage.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CSV_DIR = '/Users/belencomotto/Desktop/MASTER THESIS/ImepentrableWatch/csv. Coverage Gran Chaco Chart';
const OUT = './src/data/mapbiomas-coverage.json';

// Each class is matched by [L1, L2, L3, L4] exact strings (empty = "")
// Colors taken directly from MapBiomasPanel LEGEND (hex values already in the project)
const CLASS_DEFS = [
  // Natural wooded vegetation — Level 2
  { id: 'closed_woodland',   label: 'Closed woodland',     color: '#1f8d49', match: ['Natural wooded vegetation',           'Closed woodland',          '',               '']           },
  { id: 'open_woodland',     label: 'Open woodland',       color: '#7dc975', match: ['Natural wooded vegetation',           'Open woodland',            '',               '']           },
  { id: 'sparse_woodland',   label: 'Sparse woodland',     color: '#807a40', match: ['Natural wooded vegetation',           'Sparse woodland',          '',               '']           },
  { id: 'flooded_woodland',  label: 'Flooded woodland',    color: '#026975', match: ['Natural wooded vegetation',           'Flooded woodland',         '',               '']           },
  // Natural non-wooded vegetation — Level 3 (only one L2 "Grassland", so go deeper)
  { id: 'closed_grassland',  label: 'Closed Grassland',    color: '#c2d26b', match: ['Natural non-wooded vegetation',       'Grassland',                'Closed Grassland',   '']      },
  { id: 'open_grassland',    label: 'Open Grassland',      color: '#a5b35b', match: ['Natural non-wooded vegetation',       'Grassland',                'Open Grassland',     '']      },
  { id: 'sparse_grassland',  label: 'Sparse Grassland',    color: '#cbe286', match: ['Natural non-wooded vegetation',       'Grassland',                'Sparse Grassland',   '']      },
  { id: 'flooded_grassland', label: 'Flooded Grassland',   color: '#519799', match: ['Natural non-wooded vegetation',       'Grassland',                'Flooded Grassland',  '']      },
  // Agricultural — Level 2 (Pasture, Shrub/Forest plantation) + Level 4 for crops
  { id: 'pasture',           label: 'Pasture',             color: '#edde8e', match: ['Agricultural and livestock areas',     'Pasture',                  '',               '']           },
  { id: 'single_crop',       label: 'Single crop',         color: '#f99fff', match: ['Agricultural and livestock areas',     'Agriculture',              'Annual Crops',   'Single crop']},
  { id: 'multiple_crop',     label: 'Multiple crop',       color: '#d84690', match: ['Agricultural and livestock areas',     'Agriculture',              'Annual Crops',   'Multiple crop']},
  { id: 'shrub_plantation',  label: 'Shrub plantation',    color: '#d082de', match: ['Agricultural and livestock areas',     'Shrub plantation',         '',               '']           },
  { id: 'forest_plantation', label: 'Forest plantation',   color: '#7a5900', match: ['Agricultural and livestock areas',     'Forest plantation',        '',               '']           },
  // Non-vegetated — Level 2
  { id: 'beach_dune',        label: 'Beach, Dune & Sand',  color: '#ffa07a', match: ['Non-vegetated area',                  'Beach, Dune and Sand Spot','',               '']           },
  { id: 'urban',             label: 'Urban Area',          color: '#d4271e', match: ['Non-vegetated area',                  'Urban Area',               '',               '']           },
  { id: 'other_non_veg',     label: 'Other non-vegetated', color: '#db4d4f', match: ['Non-vegetated area',                  'Other non Vegetated Areas','',               '']           },
  { id: 'salt_flat',         label: 'Salt Flat',           color: '#f5d5d5', match: ['Non-vegetated area',                  'Salt Flat',                '',               '']           },
  // Water — Level 1 (no sub-categories)
  { id: 'water',             label: 'Water bodies',        color: '#2532e4', match: ['Water bodies',                        '',                         '',               '']           },
];

function parseCSV(text) {
  // Strip BOM if present
  const clean = text.replace(/^﻿/, '');
  const lines = clean.trim().split('\n');
  // Skip header (line 0)
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Parse quoted CSV fields
    const fields = [];
    let inQuote = false, current = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { fields.push(current); current = ''; continue; }
      current += ch;
    }
    fields.push(current);
    rows.push(fields);
  }
  return rows;
}

function matchKey(row, def) {
  return row[0] === def.match[0] &&
         row[1] === def.match[1] &&
         row[2] === def.match[2] &&
         row[3] === def.match[3];
}

const files = readdirSync(CSV_DIR).filter(f => f.endsWith('.csv')).sort();
const data = {};

for (const file of files) {
  const yearMatch = file.match(/(\d{4})\.csv$/);
  if (!yearMatch) continue;
  const year = parseInt(yearMatch[1]);

  const text = readFileSync(join(CSV_DIR, file), 'utf8');
  const rows = parseCSV(text);

  data[year] = {};
  for (const def of CLASS_DEFS) {
    const row = rows.find(r => matchKey(r, def));
    // Value is last field (index 4); convert from m² to ha already done (values are in ha from MapBiomas)
    data[year][def.id] = row ? Math.round(parseFloat(row[4])) : 0;
  }
}

const years = Object.keys(data).map(Number).sort((a, b) => a - b);

const output = {
  years,
  classes: CLASS_DEFS.map(({ id, label, color }) => ({ id, label, color })),
  data,
};

writeFileSync(OUT, JSON.stringify(output, null, 2));
console.log(`Written ${years.length} years, ${CLASS_DEFS.length} classes → ${OUT}`);
for (const [year, vals] of Object.entries(data)) {
  const total = Object.values(vals).reduce((s, v) => s + v, 0);
  console.log(`  ${year}: total ${(total / 1e6).toFixed(1)} Mha`);
}
