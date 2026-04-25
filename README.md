# PriceLens ◈ Real-Estate Price Intelligence

PriceLens is a data-driven real-estate valuation platform built with **FastAPI** and **React**. It leverages multiple regression models and SHAP-based explainability to provide high-fidelity property estimates with full transparency.

![PriceLens Banner](https://raw.githubusercontent.com/AbhijithA2005/PriceLens/main/frontend/src/assets/hero.png)

---

## 🚀 Key Features
- **5 ML Models**: Compare Linear, Ridge, Lasso, ElasticNet, and Polynomial regressions in real-time.
- **3D Interactive Diagnostics**: Full 3D rotation of residuals, Q-Q plots, and error landscapes via Plotly.js.
- **SHAP Explainability**: Local and global feature importance to understand "Black Box" predictions.
- **Automated Pipeline**: Auto-detects and pre-processes datasets (Ames, California, Zillow, King County).
- **Premium UI**: Dark-mode glassmorphism interface with custom micro-animations.

---

## 🛠️ Tech Stack
- **Backend**: Python (FastAPI, Scikit-Learn, Pandas, SHAP)
- **Frontend**: React 19, Vite, Plotly.js (GL3D), Recharts
- **Styling**: Vanilla CSS (Custom Design System)
- **Deployment**: Production-ready architecture with code-splitting and Error Boundaries.

---

## 📖 Documentation
For a deep dive into the system architecture, ML pipeline, and 3D diagnostic math, see the full [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md).

---

## ⚡ Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/AbhijithA2005/PriceLens.git
cd PriceLens
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## ◈ Credits
Built by the PriceLens Engineering Team.
- **Aesthetics**: Code Carnage 2.0 Design Language.
- **Models**: Scikit-Learn Open Source Project.
