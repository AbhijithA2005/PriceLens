import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usePredict } from '../hooks/usePredict';

const MODEL_OPTIONS = [
  { value: 'ridge', label: 'Ridge Regression' },
  { value: 'lasso', label: 'Lasso Regression' },
  { value: 'linear', label: 'Linear Regression' },
  { value: 'elasticnet', label: 'ElasticNet Regression' },
  { value: 'polynomial', label: 'Polynomial Regression' },
];

export default function Predictor({ dataset, inputFeatures, trained }) {
  const { predict, loading, error, result, reset } = usePredict();
  const [model, setModel] = useState('ridge');
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (!inputFeatures) return;
    const defaults = {};
    inputFeatures.forEach(f => { defaults[f.name] = f.default; });
    setFormValues(defaults);
    reset();
  }, [inputFeatures]);

  const handleChange = (name, val) => {
    setFormValues(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const features = {};
    Object.entries(formValues).forEach(([k, v]) => {
      features[k] = isNaN(Number(v)) ? v : Number(v);
    });
    predict(dataset, model, features);
  };

  const shapData = (result?.shap_values || []).map(sv => ({
    feature: sv.feature.length > 20 ? sv.feature.slice(0, 18) + '…' : sv.feature,
    value: sv.shap_value,
    dir: sv.direction,
  }));

  if (!trained) return (
    <section className="section" id="predictor">
      <h2 className="section-title">Property Estimator</h2>
      <p className="section-subtitle">Train models first to enable price predictions</p>
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#55556a' }}>
        Train a dataset to unlock the price estimator
      </div>
    </section>
  );

  const formatPrice = (val) => {
    if (dataset === 'california') return `$${(val * 100000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const ttStyle = { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5', fontSize: 12 };

  return (
    <section className="section" id="predictor">
      <h2 className="section-title">Property Estimator</h2>
      <p className="section-subtitle">Enter property features to get an ML-powered price estimate with SHAP explanations</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {(inputFeatures || []).map(f => (
                <div className="input-group" key={f.name}>
                  <label>{f.label}</label>
                  <input
                    className="input-field"
                    type={f.type === 'number' ? 'number' : 'text'}
                    step="any"
                    value={formValues[f.name] ?? ''}
                    onChange={e => handleChange(f.name, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label>Model</label>
              <select className="input-field" value={model} onChange={e => setModel(e.target.value)}>
                {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Predicting…</> : 'Predict Price'}
            </button>
            {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
          </form>
        </div>

        {/* Result */}
        <div className="glass-card" style={{ padding: '1.5rem', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
          {result ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Estimated Price
                </div>
                <div className="mono animate-fade-in-up" style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {formatPrice(result.predicted_price)}
                </div>
                <div className="badge badge-green" style={{ marginTop: 8 }}>
                  {result.model.charAt(0).toUpperCase() + result.model.slice(1)} Model
                </div>
              </div>
              {shapData.length > 0 && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#8b8b9e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    SHAP Feature Contributions
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
                      <XAxis type="number" tick={{ fill: '#55556a', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="feature" tick={{ fill: '#8b8b9e', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={ttStyle} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800}>
                        {shapData.map((d, i) => <Cell key={i} fill={d.dir === 'positive' ? '#f97316' : '#3b82f6'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#55556a', textAlign: 'center', fontSize: '0.9rem' }}>
              Enter property details and click<br />"Predict Price" to see results
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
