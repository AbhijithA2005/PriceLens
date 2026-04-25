import { useState, useCallback, lazy, Suspense } from 'react';
import './styles/globals.css';
import Hero from './components/Hero';
import DatasetSelector from './components/DatasetSelector';
import Predictor from './components/Predictor';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { useTrainModels } from './hooks/useTrainModels';

// Lazy load Plotly-heavy components
const ModelComparison = lazy(() => import('./components/ModelComparison'));
const ResidualPanel = lazy(() => import('./components/ResidualPanel'));
const FeatureImportance = lazy(() => import('./components/FeatureImportance'));

const LoadingFallback = () => (
  <div className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
    <div className="spinner" />
  </div>
);

export default function App() {
  const [dataset, setDataset] = useState('');
  const [trained, setTrained] = useState(false);
  const [inputFeatures, setInputFeatures] = useState(null);
  const [toast, setToast] = useState(null);
  const { train, loading: training } = useTrainModels();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleTrain = useCallback(async (dsName) => {
    setTrained(false);
    try {
      const result = await train(dsName);
      setInputFeatures(result.input_features);
      setTrained(true);
      showToast('success', `Models trained successfully on ${dsName} ✓`);
    } catch (err) {
      showToast('error', `Training failed: ${err.message}`);
    }
  }, [train]);

  return (
    <div>
      {/* Shooting Stars Background */}
      <div className="shooting-stars-container">
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
      </div>
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Navigation */}
      <nav style={navStyles.nav}>
        <div style={navStyles.brand}>
          <span style={navStyles.logo}>◈</span>
          <span style={navStyles.brandName}>PriceLens</span>
        </div>
        <div style={navStyles.links}>
          <a href="#datasets" style={navStyles.link}>Datasets</a>
          <a href="#comparison" style={navStyles.link}>Models</a>
          <a href="#predictor" style={navStyles.link}>Estimator</a>
          <a href="#residuals" style={navStyles.link}>Diagnostics</a>
          <a href="#importance" style={navStyles.link}>SHAP</a>
        </div>
      </nav>

      <Hero />
      <DatasetSelector
        selected={dataset}
        onSelect={setDataset}
        onTrain={handleTrain}
        training={training}
      />
      
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary>
          <ModelComparison dataset={dataset} trained={trained} />
        </ErrorBoundary>
      </Suspense>

      <Predictor dataset={dataset} inputFeatures={inputFeatures} trained={trained} />

      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary>
          <ResidualPanel dataset={dataset} trained={trained} />
        </ErrorBoundary>
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary>
          <FeatureImportance dataset={dataset} trained={trained} />
        </ErrorBoundary>
      </Suspense>

      <Footer />
    </div>
  );
}

const navStyles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    background: 'rgba(10, 10, 15, 0.8)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logo: {
    fontSize: '1.2rem',
    color: '#f97316',
  },
  brandName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f0f0f5',
    letterSpacing: '-0.01em',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    fontSize: '0.78rem',
    color: '#8b8b9e',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s',
    letterSpacing: '0.02em',
  },
};
