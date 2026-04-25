import { useState, useEffect, Suspense } from 'react';
import { fetchFeatureImportance } from '../hooks/useTrainModels';
import Plot from './PlotlyChart';

const PLOTLY_CONFIG = {
  displayModeBar: true,
  modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
  displaylogo: false,
  responsive: true,
};

export default function FeatureImportance({ dataset, trained }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trained || !dataset) return;
    setLoading(true);
    fetchFeatureImportance(dataset)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dataset, trained]);

  if (!trained) return (
    <section className="section" id="importance">
      <h2 className="section-title">Feature Importance</h2>
      <p className="section-subtitle">Train models to see global SHAP feature importance</p>
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#55556a' }}>
        No feature importance data available yet
      </div>
    </section>
  );

  const importance = data?.importance || [];
  const maxVal = importance.length > 0 ? importance[0].mean_abs_shap : 1;

  // 3D Bar chart: Features (X) × Rank (Y) × SHAP Value (Z)
  const features = importance.map(d => d.feature.length > 20 ? d.feature.slice(0, 18) + '…' : d.feature);
  const values = importance.map(d => d.mean_abs_shap);
  const fullNames = importance.map(d => d.feature);

  const colors = values.map(v => {
    const ratio = v / maxVal;
    const r = Math.round(85 + ratio * 164);
    const g = Math.round(85 + ratio * 30);
    const b = Math.round(85 - ratio * 63);
    return `rgb(${r},${g},${b})`;
  });

  // 3D scatter: each feature is a point floating in 3D space
  const scatter3dTrace = {
    x: importance.map((_, i) => i),
    y: values,
    z: importance.map((_, i) => Math.random() * 0.3),  // slight jitter for depth
    mode: 'markers+text',
    type: 'scatter3d',
    text: features,
    textposition: 'top center',
    textfont: { size: 8, color: '#8b8b9e', family: "'DM Sans'" },
    marker: {
      size: values.map(v => 6 + (v / maxVal) * 18),
      color: values,
      colorscale: [[0, '#3b82f6'], [0.3, '#8b5cf6'], [0.6, '#f97316'], [1, '#ef4444']],
      opacity: 0.85,
      line: { width: 0.5, color: 'rgba(255,255,255,0.15)' },
      colorbar: {
        title: { text: 'Mean |SHAP|', font: { size: 10, color: '#8b8b9e' } },
        tickfont: { size: 9, color: '#55556a' },
        thickness: 12,
        len: 0.6,
      },
    },
    hovertemplate: importance.map((d, i) =>
      `<b>${d.feature}</b><br>` +
      `Rank: #${i + 1}<br>` +
      `Mean |SHAP|: ${d.mean_abs_shap.toFixed(4)}<extra></extra>`
    ),
  };

  // Stem lines connecting each point to the floor
  const stemLines = importance.map((d, i) => ({
    x: [i, i],
    y: [0, d.mean_abs_shap],
    z: [0, 0],
    mode: 'lines',
    type: 'scatter3d',
    line: { color: colors[i], width: 3 },
    opacity: 0.4,
    hoverinfo: 'skip',
    showlegend: false,
  }));

  const scatter3dLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: "'DM Sans', sans-serif", color: '#8b8b9e', size: 11 },
    margin: { l: 0, r: 0, t: 40, b: 0 },
    title: { text: 'SHAP Feature Importance (3D)', font: { size: 13, color: '#8b8b9e' } },
    scene: {
      bgcolor: 'rgba(0,0,0,0)',
      xaxis: { title: { text: 'Feature Rank', font: { size: 10, color: '#8b8b9e' } }, gridcolor: 'rgba(255,255,255,0.05)', color: '#55556a' },
      yaxis: { title: { text: 'Mean |SHAP|', font: { size: 10, color: '#8b8b9e' } }, gridcolor: 'rgba(255,255,255,0.05)', color: '#55556a' },
      zaxis: { title: { text: '', font: { size: 10, color: '#8b8b9e' } }, gridcolor: 'rgba(255,255,255,0.03)', color: '#55556a', showticklabels: false },
      camera: { eye: { x: 1.4, y: -2.0, z: 0.8 } },
    },
    showlegend: false,
    hoverlabel: {
      bgcolor: '#1a1a24',
      bordercolor: 'rgba(255,255,255,0.1)',
      font: { family: "'Space Mono', monospace", size: 11, color: '#f0f0f5' },
    },
  };

  // 2D Horizontal bar as a flat overview (kept for quick scanning)
  const barTrace = {
    y: features.slice().reverse(),
    x: values.slice().reverse(),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: colors.slice().reverse(),
      line: { width: 0 },
    },
    hovertemplate: fullNames.slice().reverse().map((name, i) =>
      `<b>${name}</b><br>Mean |SHAP|: ${values.slice().reverse()[i].toFixed(4)}<extra></extra>`
    ),
  };

  const barLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: "'DM Sans', sans-serif", color: '#8b8b9e', size: 11 },
    margin: { l: 140, r: 20, t: 10, b: 40 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', tickfont: { size: 10, color: '#55556a', family: "'Space Mono'" }, zeroline: false },
    yaxis: { tickfont: { size: 10, color: '#8b8b9e' }, automargin: true },
    hoverlabel: {
      bgcolor: '#1a1a24',
      bordercolor: 'rgba(255,255,255,0.1)',
      font: { family: "'Space Mono', monospace", size: 11, color: '#f0f0f5' },
    },
  };

  return (
    <section className="section" id="importance">
      <h2 className="section-title">Feature Importance</h2>
      <p className="section-subtitle">
        Global SHAP values (mean |SHAP|) from the best-performing model
        {data?.model && <span className="badge badge-orange" style={{ marginLeft: 8 }}>{data.model}</span>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Horizontal bar chart */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#8b8b9e', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Feature Ranking</h3>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /><p>Computing SHAP values…</p></div>
          ) : (
            <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><p>Loading chart…</p></div>}>
              <Plot
                data={[barTrace]}
                layout={barLayout}
                config={PLOTLY_CONFIG}
                style={{ width: '100%', height: `${Math.max(400, importance.length * 28)}px` }}
                useResizeHandler
              />
            </Suspense>
          )}
        </div>

        {/* 3D scatter */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /><p>Computing SHAP values…</p></div>
          ) : (
            <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><p>Loading 3D engine…</p></div>}>
              <Plot
                data={[scatter3dTrace, ...stemLines]}
                layout={scatter3dLayout}
                config={PLOTLY_CONFIG}
                style={{ width: '100%', height: '480px' }}
                useResizeHandler
              />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}
