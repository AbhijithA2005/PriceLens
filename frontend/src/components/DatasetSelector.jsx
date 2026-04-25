import { useState, useEffect, useRef } from 'react';
import { fetchDatasets } from '../hooks/useTrainModels';

const DatasetIcon = ({ name }) => {
  const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: '#f97316', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'ames': return (
      <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    );
    case 'california': return (
      <svg {...props}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    );
    case 'kc_house': return (
      <svg {...props}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
    );
    case 'zillow': return (
      <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    );
    default: return (
      <svg {...props}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
    );
  }
};

const CORE_DATASETS = ['ames', 'california', 'zillow'];
const BONUS_DATASET = 'kc_house';

const DATASET_META = {
  ames: { label: 'Ames Housing', desc: 'Iowa residential properties — 80 features' },
  california: { label: 'California Housing', desc: 'CA median house values — 8 features' },
  zillow: { label: 'Zillow Housing Index', desc: 'Zillow home value index — time series' },
  kc_house: { label: 'King County Houses', desc: 'Seattle-area home sales — 21 features' },
};

export default function DatasetSelector({ selected, onSelect, onTrain, training }) {
  const [datasets, setDatasets] = useState([]);
  const [bonusRevealed, setBonusRevealed] = useState(false);
  const leaveTimerRef = useRef(null);

  const handleBonusEnter = () => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null; }
    setBonusRevealed(true);
  };

  const handleBonusLeave = () => {
    // Don't collapse if KC is the active/selected dataset
    if (selected === BONUS_DATASET) return;
    leaveTimerRef.current = setTimeout(() => {
      setBonusRevealed(false);
      leaveTimerRef.current = null;
    }, 1000);
  };

  useEffect(() => {
    fetchDatasets()
      .then(setDatasets)
      .catch(() => {});
  }, []);

  const handleSelect = (name) => {
    onSelect(name);
    onTrain(name);
  };

  const coreDatasets = datasets.filter(ds => CORE_DATASETS.includes(ds.name));
  const bonusDs = datasets.find(ds => ds.name === BONUS_DATASET);

  const renderCard = (ds, isActive) => {
    const meta = DATASET_META[ds.name] || { label: ds.name, desc: ds.file };
    return (
      <button
        key={ds.name}
        className="glass-card"
        style={{
          ...styles.card,
          borderColor: isActive ? 'rgba(249,115,22,0.5)' : undefined,
          boxShadow: isActive ? '0 0 30px rgba(249,115,22,0.1)' : undefined,
        }}
        onClick={() => handleSelect(ds.name)}
        disabled={training}
      >
        <div style={styles.iconWrap}><DatasetIcon name={ds.name} /></div>
        <div style={styles.cardContent}>
          <div style={styles.cardTitle}>
            {meta.label}
            {isActive && <span className="badge badge-orange" style={{ marginLeft: 8 }}>Active</span>}
          </div>
          <div style={styles.cardDesc}>{meta.desc}</div>
          <div style={styles.cardMeta}>
            <span className="mono">{ds.rows?.toLocaleString()} rows</span>
            <span>•</span>
            <span className="mono">{ds.columns?.length} cols</span>
          </div>
        </div>
        {training && isActive && (
          <div style={styles.trainingBadge}>
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Training…
          </div>
        )}
      </button>
    );
  };

  return (
    <section className="section" id="datasets">
      <h2 className="section-title">Select Dataset</h2>
      <p className="section-subtitle">Choose a housing dataset to train all 5 regression models</p>

      {/* Glowing dashed border container */}
      <div 
        style={styles.dashedBorder}
        onMouseLeave={handleBonusLeave}
      >
        <div style={styles.grid}>
          {coreDatasets.map((ds) => renderCard(ds, selected === ds.name))}

          {/* +1 Bonus card */}
          {bonusDs && !bonusRevealed && (
            <div
              style={styles.bonusCard}
              onMouseEnter={handleBonusEnter}
            >
              <div style={styles.bonusPulseRing} />
              <div style={styles.bonusInner}>
                <span style={styles.bonusPlus}>+1</span>
                <span style={styles.bonusLabel}>Bonus Dataset</span>
                <span style={styles.bonusHint}>Hover to reveal</span>
              </div>
            </div>
          )}

          {/* Revealed bonus card */}
          {bonusDs && bonusRevealed && (
            <div onMouseEnter={handleBonusEnter}>
              {renderCard(bonusDs, selected === bonusDs.name)}
            </div>
          )}

          {datasets.length === 0 && (
            <div style={styles.empty}>
              <div className="spinner" />
              <p>Loading datasets…</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  dashedBorder: {
    border: '2px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: 20,
    padding: '1.25rem',
    position: 'relative',
    boxShadow: '0 0 20px rgba(249, 115, 22, 0.04), inset 0 0 20px rgba(249, 115, 22, 0.02)',
    animation: 'borderGlow 3s ease-in-out infinite alternate',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1rem',
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1.25rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '120px',
    height: '100%',
    width: '100%',
    borderRadius: '16px',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    color: '#f0f0f5',
  },
  cardDesc: {
    fontSize: '0.82rem',
    color: '#8b8b9e',
    marginBottom: '8px',
  },
  cardMeta: {
    display: 'flex',
    gap: '6px',
    fontSize: '0.72rem',
    color: '#55556a',
    fontFamily: "'Space Mono', monospace",
  },
  trainingBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.72rem',
    color: '#f97316',
    fontFamily: "'Space Mono', monospace",
  },

  /* ── Bonus +1 Card ── */
  bonusCard: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '120px',
    height: '100%',
    borderRadius: 16,
    border: '2px dashed rgba(249, 115, 22, 0.25)',
    background: 'rgba(249, 115, 22, 0.03)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
    overflow: 'hidden',
  },
  bonusPulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '2px solid rgba(249, 115, 22, 0.15)',
    animation: 'pulse 2s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bonusInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  bonusPlus: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#f97316',
    fontFamily: "'Space Mono', monospace",
    lineHeight: 1,
  },
  bonusLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#8b8b9e',
    letterSpacing: '0.02em',
  },
  bonusHint: {
    fontSize: '0.65rem',
    color: '#55556a',
    fontStyle: 'italic',
    marginTop: 2,
  },

  empty: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem',
    color: '#8b8b9e',
  },
};
