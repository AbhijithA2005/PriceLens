import { useState, useEffect, useMemo, Suspense } from 'react';
import { fetchModelComparison } from '../hooks/useTrainModels';
import Plot from './PlotlyChart';

const COLORS = ['#f97316', '#fb923c', '#fbbf24', '#22c55e', '#3b82f6'];

const PLOTLY_CONFIG = {
  displayModeBar: true,
  modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
  displaylogo: false,
  responsive: true,
};

export default function ModelComparison({ dataset, trained }) {
  const [data, setData] = useState(null);
  const [sortCol, setSortCol] = useState('r2_test');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!trained) return;
    fetchModelComparison().then(setData).catch(() => {});
  }, [trained]);

  const metrics = useMemo(() => {
    if (!data || !data[dataset]) return [];
    const models = data[dataset];
    return Object.entries(models).map(([key, m]) => ({
      key, name: m.display_name,
      r2_train: m.r2_train, r2_test: m.r2_test,
      rmse_train: m.rmse_train, rmse_test: m.rmse_test,
      mae_test: m.mae_test,
    }));
  }, [data, dataset]);

  const sorted = useMemo(() => {
    if (!metrics.length) return [];
    return [...metrics].sort((a, b) => sortAsc ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol]);
  }, [metrics, sortCol, sortAsc]);

  const best = useMemo(() => {
    if (!metrics.length) return {};
    const r = {};
    ['r2_test', 'rmse_test', 'mae_test'].forEach(col => {
      const vals = metrics.map(m => m[col]);
      r[col] = col.startsWith('r2') ? Math.max(...vals) : Math.min(...vals);
    });
    return r;
  }, [metrics]);

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  if (!trained) return (
    <section className="section" id="comparison">
      <h2 className="section-title">Model Comparison</h2>
      <p className="section-subtitle">Train a dataset above to see model performance metrics</p>
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#55556a' }}>
        Select a dataset and train models to compare performance
      </div>
    </section>
  );

  // 3D Bar chart data: each model gets a 3D bar for RMSE, R², and MAE
  const modelNames = sorted.map(m => m.name.replace(' Regression', ''));
  const metricLabels = ['RMSE (Test)', 'R² (Test)', 'MAE (Test)'];

  // Build 3D bars as scatter3d markers (stacked by metric)
  const barTraces = sorted.map((m, i) => ({
    x: [m.name.replace(' Regression', '')],
    y: ['RMSE'],
    z: [m.rmse_test],
    type: 'bar',
    name: m.name.replace(' Regression', ''),
    marker: { color: COLORS[i % COLORS.length], opacity: 0.9 },
    hovertemplate: `<b>${m.name.replace(' Regression', '')}</b><br>RMSE: %{z:,.0f}<extra></extra>`,
    showlegend: true,
  }));

  const barLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: "'DM Sans', sans-serif", color: '#8b8b9e', size: 11 },
    margin: { l: 60, r: 20, t: 30, b: 60 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', tickfont: { size: 11, color: '#8b8b9e' } },
    yaxis: { 
      type: 'log',
      title: { text: 'RMSE (Log Scale)', font: { size: 10, color: '#55556a' } },
      gridcolor: 'rgba(255,255,255,0.05)', 
      tickfont: { size: 10, color: '#55556a', family: "'Space Mono'" } 
    },
    barmode: 'group',
    hoverlabel: {
      bgcolor: '#1a1a24',
      bordercolor: 'rgba(255,255,255,0.1)',
      font: { family: "'Space Mono', monospace", size: 11, color: '#f0f0f5' },
    },
    showlegend: true,
    legend: { font: { size: 10, color: '#8b8b9e' }, bgcolor: 'rgba(0,0,0,0)', borderwidth: 0 },
  };

  // Multi-metric 3D surface: Models × Metrics × Value
  const multiTrace = [
    {
      x: modelNames,
      y: ['RMSE', 'MAE'],
      z: [
        sorted.map(m => m.rmse_test),
        sorted.map(m => m.mae_test),
      ],
      type: 'surface',
      colorscale: [[0, '#3b82f6'], [0.35, '#8b5cf6'], [0.65, '#f97316'], [1, '#ef4444']],
      opacity: 0.85,
      showscale: true,
      colorbar: {
        title: { text: 'Error', font: { size: 10, color: '#8b8b9e' } },
        tickfont: { size: 9, color: '#55556a' },
        thickness: 12,
        len: 0.6,
      },
      hovertemplate: '<b>Model:</b> %{x}<br><b>Metric:</b> %{y}<br><b>Value:</b> %{z:,.0f}<extra></extra>',
    },
  ];

  const surfaceLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: "'DM Sans', sans-serif", color: '#8b8b9e', size: 11 },
    margin: { l: 0, r: 0, t: 40, b: 0 },
    title: { text: 'Error Landscape (3D Surface)', font: { size: 13, color: '#8b8b9e' } },
    scene: {
      bgcolor: 'rgba(0,0,0,0)',
      xaxis: { title: { text: 'Model', font: { size: 10, color: '#8b8b9e' } }, gridcolor: 'rgba(255,255,255,0.05)', color: '#55556a' },
      yaxis: { title: { text: 'Metric', font: { size: 10, color: '#8b8b9e' } }, gridcolor: 'rgba(255,255,255,0.05)', color: '#55556a' },
      zaxis: { title: { text: 'Value', font: { size: 10, color: '#8b8b9e' } }, gridcolor: 'rgba(255,255,255,0.05)', color: '#55556a' },
      camera: { eye: { x: 1.8, y: -1.4, z: 0.9 } },
    },
    hoverlabel: {
      bgcolor: '#1a1a24',
      bordercolor: 'rgba(255,255,255,0.1)',
      font: { family: "'Space Mono', monospace", size: 11, color: '#f0f0f5' },
    },
  };

  return (
    <section className="section" id="comparison">
      <h2 className="section-title">Model Comparison</h2>
      <p className="section-subtitle">Performance metrics across all 5 regression models — click columns to sort</p>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr>
              <th>Model</th>
              {['r2_train','r2_test','rmse_train','rmse_test','mae_test'].map(c => (
                <th key={c} onClick={() => handleSort(c)}>
                  {c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())} {sortCol===c?(sortAsc?'↑':'↓'):''}
                </th>
              ))}
            </tr></thead>
            <tbody className="stagger-children">
              {sorted.map(m => (
                <tr key={m.key}>
                  <td style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{m.name}</td>
                  <td>{m.r2_train}</td>
                  <td className={m.r2_test === best.r2_test ? 'best-value' : ''}>{m.r2_test}</td>
                  <td>{m.rmse_train?.toLocaleString()}</td>
                  <td className={m.rmse_test === best.rmse_test ? 'best-value' : ''}>{m.rmse_test?.toLocaleString()}</td>
                  <td className={m.mae_test === best.mae_test ? 'best-value' : ''}>{m.mae_test?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* RMSE Bar Chart */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#8b8b9e', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Test RMSE Comparison</h3>
          <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><p>Loading chart…</p></div>}>
            <Plot
              data={barTraces}
              layout={barLayout}
              config={PLOTLY_CONFIG}
              style={{ width: '100%', height: '400px' }}
              useResizeHandler
            />
          </Suspense>
        </div>

        {/* 3D Surface */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><p>Loading 3D engine…</p></div>}>
            <Plot
              data={multiTrace}
              layout={surfaceLayout}
              config={PLOTLY_CONFIG}
              style={{ width: '100%', height: '400px' }}
              useResizeHandler
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
