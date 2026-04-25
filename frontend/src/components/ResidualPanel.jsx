import { useState, useEffect, Suspense } from 'react';
import { fetchResiduals } from '../hooks/useTrainModels';
import Plot from './PlotlyChart';

const MODELS = ['linear', 'polynomial', 'ridge', 'lasso', 'elasticnet'];

const DARK_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: "'DM Sans', sans-serif", color: '#8b8b9e', size: 11 },
  margin: { l: 50, r: 20, t: 40, b: 50 },
  scene: {
    bgcolor: 'rgba(0,0,0,0)',
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)', color: '#55556a', title: { font: { size: 11, color: '#8b8b9e' } } },
    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)', color: '#55556a', title: { font: { size: 11, color: '#8b8b9e' } } },
    zaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)', color: '#55556a', title: { font: { size: 11, color: '#8b8b9e' } } },
    camera: { eye: { x: 1.6, y: -1.6, z: 1.0 } },
  },
  hoverlabel: {
    bgcolor: '#1a1a24',
    bordercolor: 'rgba(255,255,255,0.1)',
    font: { family: "'Space Mono', monospace", size: 11, color: '#f0f0f5' },
  },
};

const PLOTLY_CONFIG = {
  displayModeBar: true,
  modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
  displaylogo: false,
  responsive: true,
};

export default function ResidualPanel({ dataset, trained }) {
  const [model, setModel] = useState('ridge');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trained || !dataset) return;
    setLoading(true);
    fetchResiduals(model, dataset)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [model, dataset, trained]);

  if (!trained) return (
    <section className="section" id="residuals">
      <h2 className="section-title">Residual Analysis</h2>
      <p className="section-subtitle">Train models to view diagnostic plots</p>
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#55556a' }}>
        No residual data available yet
      </div>
    </section>
  );

  const predicted = data?.residual_plot?.predicted || [];
  const residuals = data?.residual_plot?.residuals || [];
  const theoretical = data?.qq_plot?.theoretical || [];
  const sample = data?.qq_plot?.sample || [];
  const bp = data?.breusch_pagan;
  const cv = data?.cross_validation;

  // 3D Residual Plot: Predicted (X) × Observation# (Y) × Residual (Z)
  const residualTrace = {
    x: predicted,
    y: predicted.map((_, i) => i),
    z: residuals,
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: 3,
      color: residuals,
      colorscale: [[0, '#3b82f6'], [0.5, '#f97316'], [1, '#ef4444']],
      opacity: 0.75,
      line: { width: 0 },
      colorbar: {
        title: { text: 'Residual', font: { size: 10, color: '#8b8b9e' } },
        tickfont: { size: 9, color: '#55556a' },
        thickness: 12,
        len: 0.6,
      },
    },
    hovertemplate:
      '<b>Predicted:</b> %{x:,.0f}<br>' +
      '<b>Observation:</b> #%{y}<br>' +
      '<b>Residual:</b> %{z:,.0f}<extra></extra>',
  };

  // Zero plane for reference
  const zeroPlane = {
    x: [Math.min(...predicted), Math.max(...predicted), Math.max(...predicted), Math.min(...predicted)],
    y: [0, 0, predicted.length, predicted.length],
    z: [0, 0, 0, 0],
    type: 'mesh3d',
    opacity: 0.08,
    color: '#f97316',
    hoverinfo: 'skip',
  };

  const residualLayout = {
    ...DARK_LAYOUT,
    title: { text: 'Predicted vs Residuals (3D)', font: { size: 13, color: '#8b8b9e' } },
    scene: {
      ...DARK_LAYOUT.scene,
      xaxis: { ...DARK_LAYOUT.scene.xaxis, title: { text: 'Predicted Value', font: { size: 10, color: '#8b8b9e' } } },
      yaxis: { ...DARK_LAYOUT.scene.yaxis, title: { text: 'Observation #', font: { size: 10, color: '#8b8b9e' } } },
      zaxis: { ...DARK_LAYOUT.scene.zaxis, title: { text: 'Residual', font: { size: 10, color: '#8b8b9e' } } },
    },
  };

  // 3D Q-Q Plot: Theoretical (X) × Observation# (Y) × Sample (Z)
  const qqTrace = {
    x: theoretical,
    y: theoretical.map((_, i) => i),
    z: sample,
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: 3,
      color: theoretical,
      colorscale: [[0, '#8b5cf6'], [0.5, '#3b82f6'], [1, '#06b6d4']],
      opacity: 0.75,
      line: { width: 0 },
      colorbar: {
        title: { text: 'Z-Score', font: { size: 10, color: '#8b8b9e' } },
        tickfont: { size: 9, color: '#55556a' },
        thickness: 12,
        len: 0.6,
      },
    },
    hovertemplate:
      '<b>Theoretical:</b> %{x:.3f}<br>' +
      '<b>Observation:</b> #%{y}<br>' +
      '<b>Sample:</b> %{z:,.0f}<extra></extra>',
  };

  // Reference diagonal
  const qqRefLine = data?.qq_plot ? {
    x: theoretical,
    y: theoretical.map((_, i) => i),
    z: theoretical.map(t => t * data.qq_plot.fit_slope + data.qq_plot.fit_intercept),
    mode: 'lines',
    type: 'scatter3d',
    line: { color: '#22c55e', width: 3, dash: 'dot' },
    opacity: 0.5,
    hoverinfo: 'skip',
    showlegend: false,
  } : null;

  const qqLayout = {
    ...DARK_LAYOUT,
    title: { text: 'Q-Q Plot (3D Normality)', font: { size: 13, color: '#8b8b9e' } },
    scene: {
      ...DARK_LAYOUT.scene,
      xaxis: { ...DARK_LAYOUT.scene.xaxis, title: { text: 'Theoretical Quantile', font: { size: 10, color: '#8b8b9e' } } },
      yaxis: { ...DARK_LAYOUT.scene.yaxis, title: { text: 'Observation #', font: { size: 10, color: '#8b8b9e' } } },
      zaxis: { ...DARK_LAYOUT.scene.zaxis, title: { text: 'Sample Quantile', font: { size: 10, color: '#8b8b9e' } } },
    },
  };

  return (
    <section className="section" id="residuals">
      <h2 className="section-title">Residual Analysis</h2>
      <p className="section-subtitle">3D diagnostic plots — drag to rotate, scroll to zoom, hover to inspect</p>

      <div style={{ marginBottom: '1rem' }}>
        <div className="input-group" style={{ maxWidth: 240 }}>
          <label>Select Model</label>
          <select className="input-field" value={model} onChange={e => setModel(e.target.value)}>
            {MODELS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /><p>Loading diagnostics…</p></div>
      ) : (
        <>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {bp && bp.homoscedastic !== null && (
              <span className={`badge ${bp.homoscedastic ? 'badge-green' : 'badge-orange'}`}>
                {bp.homoscedastic ? '✓ Homoscedastic' : '⚠ Heteroscedastic'}
                {bp.lm_pvalue !== null && ` (p=${bp.lm_pvalue})`}
              </span>
            )}
            {cv && (
              <span className="badge badge-blue">
                CV R²: {cv.cv_mean} ± {cv.cv_std}
              </span>
            )}
            <span className="badge badge-green" style={{ gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              3D Interactive
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* 3D Residual Plot */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><p>Loading 3D engine…</p></div>}>
                <Plot
                  data={predicted.length > 0 ? [residualTrace, zeroPlane] : []}
                  layout={residualLayout}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: '480px' }}
                  useResizeHandler
                />
              </Suspense>
            </div>

            {/* 3D Q-Q Plot */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><p>Loading 3D engine…</p></div>}>
                <Plot
                  data={[qqTrace, ...(qqRefLine ? [qqRefLine] : [])]}
                  layout={qqLayout}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: '480px' }}
                  useResizeHandler
                />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
