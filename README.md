# PriceLens — Real-Estate Price Intelligence

ML-powered real-estate price prediction system with full transparency — compare 5 regression models, inspect residuals, and understand predictions through SHAP explainability.

## Tech Stack

- **Backend:** Python, FastAPI, scikit-learn, SHAP, statsmodels
- **Frontend:** React (Vite), Recharts
- **Communication:** REST API (JSON)

## Setup Instructions

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Place your CSV datasets in `/backend/data/`:
- `AmesHousing.csv` — Ames Housing dataset
- `housing.csv` — California Housing dataset
- `kc_house_data.csv` — King County house sales
- `Zillow_Housing_data.csv` — Zillow home value index

Start the server:
```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Models

1. **Linear Regression** — baseline ordinary least squares
2. **Polynomial Regression** — degree=2 on top 5 features
3. **Ridge Regression** — L2 regularisation (RidgeCV)
4. **Lasso Regression** — L1 regularisation (LassoCV)
5. **ElasticNet Regression** — L1+L2 regularisation (ElasticNetCV)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/datasets` | List available datasets |
| POST | `/train` | Train all models on a dataset |
| POST | `/predict` | Predict price with SHAP values |
| GET | `/model-comparison` | Metrics for all models |
| GET | `/residuals/{model}` | Residual analysis data |
| GET | `/feature-importance` | Global SHAP importance |

## Team

| USN | Name | Role |
|-----|------|------|
| 1VI23CS036 | J JOSHIKA | Problem Statement |
| 1VI23CS037 | J NAVYA BHARGAVI | Objective |
| 1VI23CS038 | JAGRUTHI M | Datasets |
| 1VI23CS039 | K N LOKESH REDDY | Techniques |
