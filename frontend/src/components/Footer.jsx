export default function Footer() {
  const team = [
    { usn: '1VI23CS036', name: 'J JOSHIKA', role: 'Problem Statement' },
    { usn: '1VI23CS037', name: 'J NAVYA BHARGAVI', role: 'Objective' },
    { usn: '1VI23CS038', name: 'JAGRUTHI M', role: 'Datasets' },
    { usn: '1VI23CS039', name: 'K N LOKESH REDDY', role: 'Techniques' },
  ];

  const techStack = [
    'Python', 'FastAPI', 'scikit-learn', 'SHAP', 'React', 'Recharts', 'NumPy', 'Pandas',
  ];

  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        {/* Team */}
        <div style={styles.section}>
          <h3 style={styles.heading}>Project Team</h3>
          <div style={styles.teamGrid}>
            {team.map(t => (
              <div key={t.usn} className="glass-card" style={styles.teamCard}>
                <div style={styles.avatar}>{t.name[0]}</div>
                <div>
                  <div style={styles.memberName}>{t.name}</div>
                  <div style={styles.memberRole}>{t.role}</div>
                  <div className="mono" style={styles.usn}>{t.usn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div style={styles.section}>
          <h3 style={styles.heading}>Tech Stack</h3>
          <div style={styles.badges}>
            {techStack.map(t => (
              <span key={t} className="badge badge-orange">{t}</span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={styles.bottom}>
          <div style={styles.brand}>
            <span style={styles.logo}>◈</span>
            <span style={{ fontWeight: 600 }}>PriceLens</span>
          </div>
          <div style={styles.copyright}>
            Real-Estate Price Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    marginTop: '2rem',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '3rem 1.5rem 2rem',
  },
  section: {
    marginBottom: '2.5rem',
  },
  heading: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#55556a',
    marginBottom: '1rem',
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '0.75rem',
  },
  teamCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f97316, #fbbf24)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#0a0a0f',
    flexShrink: 0,
  },
  memberName: {
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  memberRole: {
    fontSize: '0.75rem',
    color: '#8b8b9e',
  },
  usn: {
    fontSize: '0.68rem',
    color: '#55556a',
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    color: '#f0f0f5',
  },
  logo: {
    fontSize: '1.2rem',
    color: '#f97316',
  },
  copyright: {
    fontSize: '0.75rem',
    color: '#55556a',
  },
};
