import { useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import coverageData from '../data/mapbiomas-coverage.json';
import styles from './MapBiomasCoverageChart.module.css';
import { useLang } from '../context/LangContext';

const { years, classes, data } = coverageData;

// Build chart rows once — array of { year, <classId>: Mha, ... }
const CHART_DATA = years.map(y => {
  const row = { year: y };
  for (const cls of classes) {
    row[cls.id] = +(data[y][cls.id] / 1e6).toFixed(3); // hectares → Mha
  }
  return row;
});

const COLOR_MAP = Object.fromEntries(classes.map(c => [c.id, c.color]));
const LABEL_MAP = Object.fromEntries(classes.map(c => [c.id, c.label]));

function CustomTooltip({ active, payload, label, selectedYear, lang }) {
  if (!active || !payload?.length) return null;
  const isSelected = label === selectedYear;
  const selectedLabel = lang === 'es' ? ' ◀ seleccionado' : ' ◀ selected';
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipYear}>{label}{isSelected ? selectedLabel : ''}</p>
      {[...payload].reverse().map(p => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipSwatch} style={{ background: p.fill }} />
          <span className={styles.tooltipLabel}>{LABEL_MAP[p.dataKey]}</span>
          <span className={styles.tooltipVal}>{p.value.toFixed(1)} Mha</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend() {
  return (
    <div className={styles.legend}>
      {classes.map(cls => (
        <div key={cls.id} className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: cls.color }} />
          <span className={styles.legendLabel}>{cls.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function MapBiomasCoverageChart({ year, onYearChange }) {
  const { lang } = useLang();
  const handleClick = useCallback((e) => {
    if (e?.activeLabel) onYearChange?.(e.activeLabel);
  }, [onYearChange]);

  const tickYears = useMemo(
    () => years.filter(y => y % 5 === 0 || y === years[0] || y === years[years.length - 1]),
    []
  );

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>{lang === 'es' ? 'Hacé clic en una barra para saltar a ese año en el mapa' : 'Click a bar to jump the map to that year'}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={CHART_DATA}
          margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          barSize={9}
          barCategoryGap="10%"
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          <XAxis
            dataKey="year"
            ticks={tickYears}
            tick={{ fontSize: 9, fill: 'rgba(222,216,207,0.55)', fontFamily: 'inherit' }}
            axisLine={{ stroke: 'rgba(222,216,207,0.18)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${v}M`}
            tick={{ fontSize: 9, fill: 'rgba(222,216,207,0.55)', fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            content={<CustomTooltip selectedYear={year} lang={lang} />}
            cursor={{ fill: 'rgba(222,216,207,0.07)' }}
          />
          {classes.map(cls => (
            <Bar
              key={cls.id}
              dataKey={cls.id}
              stackId="a"
              fill={cls.color}
              isAnimationActive={false}
            >
              {CHART_DATA.map(entry => (
                <Cell
                  key={entry.year}
                  fill={cls.color}
                  opacity={entry.year === year ? 1 : 0.55}
                />
              ))}
            </Bar>
          ))}
          <ReferenceLine
            x={year}
            stroke="rgba(222,216,207,0.7)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        </BarChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}
