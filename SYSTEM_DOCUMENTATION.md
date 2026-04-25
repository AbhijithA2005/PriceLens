# PriceLens: Real-Estate Price Intelligence
## System Architecture & Technical Documentation

PriceLens is a high-fidelity, data-driven real-estate valuation engine that combines modern web design (Dark-Mode, Glassmorphism) with advanced machine learning diagnostics. It provides full transparency into model performance through interactive 3D visualizations and SHAP-based explainability.

---

## 1. Project Philosophy & Design
PriceLens follows the **"Code Carnage 2.0"** design language.
- **Aesthetic**: Premium dark-mode interface with orange/gold accent colors.
- **Interactivity**: Dynamic elements like the "Bonus Dataset" revealed on hover and interactive 3D coordinate spaces.
- **Transparency**: Moving beyond "Black Box" AI by providing Residual Analysis, Q-Q Plots, and Feature Importance directly to the user.

---

## 2. Technology Stack

### Backend (Python/FastAPI)
- **Framework**: FastAPI (Asynchronous REST API).
- **ML Engine**: Scikit-Learn (Linear, Ridge, Lasso, ElasticNet, Polynomial).
- **Preprocessing**: Pandas & NumPy for data manipulation; Scikit-Learn `ColumnTransformer` for automated scaling and one-hot encoding.
- **Explainability**: `SHAP` (SHapley Additive exPlanations) for quantifying feature contribution.
- **Diagnostics**: `Statsmodels` and `SciPy` for statistical tests (Breusch-Pagan, Q-Q normality).

### Frontend (React/Vite)
- **Framework**: React 19 with Vite for ultra-fast HMR and bundling.
- **Styling**: Vanilla CSS with custom design tokens for glassmorphism and animations.
- **Visualizations**:
  - **Plotly.js (GL3D Dist)**: Powering the interactive 3D scatter plots, surface plots, and stem visualizations.
  - **Recharts**: Handling 2D metrics and SHAP bar charts.
- **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`).

---

## 3. Machine Learning Pipeline

### Data Preprocessing
When a dataset is selected, the backend performs the following:
1.  **Automatic Detection**: Identifies the dataset (Ames, California, Zillow, or King County) based on column signature.
2.  **Cleaning**: Handles missing values (Median for numerical, Mode for categorical).
3.  **Feature Engineering**: 
    - **Numerical**: Scaled using `StandardScaler`.
    - **Categorical**: Encoded using `OneHotEncoder`.
    - **Polynomial**: Generated for specific models to capture non-linear relationships.
4.  **Splitting**: 80/20 Train/Test split.

### Regression Models
PriceLens trains 5 distinct models concurrently for comparison:
1.  **Linear Regression**: The baseline model.
2.  **Ridge Regression**: Linear regression with L2 regularization to prevent overfitting.
3.  **Lasso Regression**: L1 regularization, which also performs feature selection by zeroing out less important weights.
4.  **ElasticNet**: A hybrid of Ridge and Lasso.
5.  **Polynomial Regression**: Captures curvature in price trends (e.g., how age affects price non-linearly).

---

## 4. Advanced 3D Diagnostics

The "Diagnostics" section provides deeper insight into model health:

### Residual Analysis (3D Scatter)
- **X-Axis**: Predicted Price.
- **Y-Axis**: Observation Index (Time/Order).
- **Z-Axis**: Residual Value (Error).
- **Logic**: Users can rotate the 3D space to detect **Heteroscedasticity** (non-constant variance) which is automatically flagged via the Breusch-Pagan test.

### Normality Analysis (3D Q-Q Plot)
- Visualizes the distribution of errors against a theoretical normal distribution.
- **Stem Visualization**: Points are connected to the "floor" plane to emphasize deviation from the zero-line.

### Error Landscape (3D Surface)
- In the Model Comparison section, a 3D Surface Plot visualizes the performance metrics (RMSE, MAE, R²) across all trained models simultaneously.

---

## 5. Explainable AI (SHAP)

PriceLens uses **SHAP Values** to explain *why* a certain price was predicted:
- **Local Explanation**: When a user inputs property details, SHAP calculates exactly how many dollars each feature (e.g., 3 Bedrooms, 2000 sqft) added to or subtracted from the base price.
- **Global Explanation**: The "SHAP" tab provides a 3D bubble chart showing the overall most influential features for the entire dataset.

---

## 6. System Interaction & UX

### Dataset Selector
- Features a glowing dashed border with a "breathing" animation.
- Includes a **+1 Bonus Dataset** (King County) that reveals itself when hovered.
- **Hover Reset Delay**: To prevent accidental UI flickering, the revealed card persists for 1 second after the cursor leaves the boundary before resetting.

### Error Handling & Stability
- **ErrorBoundary**: Custom React Error Boundary wrapper around Plotly charts to prevent the whole app from crashing if WebGL fails or assets time out.
- **Lazy Loading**: Plotly-heavy components are code-split and only loaded when needed.

---

## 7. How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Runs on http://localhost:8000*

### Frontend
```bash
cd frontend
npm install
npm run dev
```
*Runs on http://localhost:5173*

---

## 8. File Structure
- `backend/`: FastAPI logic, ML models, and diagnostics.
- `frontend/src/components/`: Modular UI components.
- `frontend/src/hooks/`: Custom hooks for API communication.
- `frontend/src/styles/`: Global CSS and design tokens.
- `data/`: CSV datasets for Ames, CA, Zillow, and King County.
