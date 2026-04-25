export default function Hero() {
  const scrollToDatasets = () => {
    const el = document.getElementById('datasets');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section style={styles.hero}>
      {/* Radial gradient glow behind content */}
      <div style={styles.glowOrb} />
      <div style={styles.glowOrbSecondary} />

      <div style={styles.content} className="animate-fade-in-up">
        <div style={styles.tagline}>
          <span style={styles.dot} />
          ML-POWERED VALUATION ENGINE
        </div>
        <h1 style={styles.title}>
          Real-Estate Price
          <br />
          <span style={styles.highlight}>Intelligence</span>
        </h1>
        <p style={styles.subtitle}>
          ML-powered valuation with full transparency — compare 5 regression models,
          inspect residuals, and understand predictions through SHAP explainability.
        </p>
        <div style={styles.ctas}>
          <button className="btn btn-primary" onClick={scrollToDatasets}>
            Estimate a Property
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M7 7h10v10"/></svg>
          </button>
          <button className="btn btn-secondary" onClick={scrollToDatasets}>
            View Model Metrics
          </button>
        </div>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <span className="mono" style={styles.statNum}>5</span>
            <span style={styles.statLabel}>Regression Models</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span className="mono" style={styles.statNum}>4</span>
            <span style={styles.statLabel}>Datasets</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span className="mono" style={styles.statNum}>SHAP</span>
            <span style={styles.statLabel}>Explainability</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -55%)',
    width: '700px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.08) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
    filter: 'blur(40px)',
  },
  glowOrbSecondary: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
    pointerEvents: 'none',
    zIndex: 0,
    filter: 'blur(60px)',
    animation: 'float 8s ease-in-out infinite',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    maxWidth: '720px',
    padding: '0 1.5rem',
  },
  tagline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: '#f97316',
    marginBottom: '1.5rem',
    fontFamily: "'Space Mono', monospace",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#f97316',
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
  },
  title: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: '1.25rem',
    letterSpacing: '-0.03em',
  },
  highlight: {
    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: '#8b8b9e',
    lineHeight: 1.7,
    marginBottom: '2rem',
    maxWidth: '560px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctas: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '3rem',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statNum: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f0f0f5',
  },
  statLabel: {
    fontSize: '0.72rem',
    color: '#55556a',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  statDivider: {
    width: 1,
    height: 32,
    background: 'rgba(255,255,255,0.08)',
  },
};
