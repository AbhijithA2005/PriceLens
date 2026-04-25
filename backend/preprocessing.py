"""
preprocessing.py — Data loading, cleaning, encoding, scaling, and splitting.
"""

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer


# ---------------------------------------------------------------------------
# Dataset detection helpers
# ---------------------------------------------------------------------------

# Ames uses space-separated column names
AMES_MARKER_COLS = {"Gr Liv Area", "Overall Qual", "SalePrice"}
CALIFORNIA_MARKER_COLS = {"median_income", "housing_median_age", "median_house_value"}
KC_MARKER_COLS = {"sqft_living", "bedrooms", "price", "zipcode"}
ZILLOW_MARKER_COLS = {"RegionName", "RegionID", "SizeRank"}


def detect_dataset(df: pd.DataFrame) -> str:
    """Return a canonical dataset name based on column names."""
    cols = set(df.columns)
    if AMES_MARKER_COLS.issubset(cols):
        return "ames"
    if CALIFORNIA_MARKER_COLS.issubset(cols):
        return "california"
    if KC_MARKER_COLS.issubset(cols):
        return "kc_house"
    if ZILLOW_MARKER_COLS.issubset(cols):
        return "zillow"
    return "unknown"


def detect_target(df: pd.DataFrame, dataset_name: str) -> str:
    """Return the target column name for the given dataset."""
    mapping = {
        "ames": "SalePrice",
        "california": "median_house_value",
        "kc_house": "price",
        "zillow": "latest_value",  # We'll create this in preprocess_zillow
    }
    target = mapping.get(dataset_name)
    if target and target in df.columns:
        return target
    # Fallback: last numeric column
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    return numeric_cols[-1] if numeric_cols else df.columns[-1]


# ---------------------------------------------------------------------------
# Zillow data reshaping (wide → long)
# ---------------------------------------------------------------------------

def preprocess_zillow(df: pd.DataFrame) -> pd.DataFrame:
    """
    Zillow data is wide-format (dates as columns).
    Reshape: use the latest available value per region as target.
    """
    meta_cols = [c for c in df.columns if not _is_date_col(c)]
    date_cols = [c for c in df.columns if _is_date_col(c)]

    if not date_cols:
        return df

    # Use the latest date column as the target value
    latest_col = date_cols[-1]

    # Build a simpler DataFrame: region metadata + latest value + a few derived features
    result = df[meta_cols].copy()
    result["latest_value"] = pd.to_numeric(df[latest_col], errors="coerce")

    # Add a few time-series derived features if enough date columns
    if len(date_cols) >= 12:
        recent_12 = date_cols[-12:]
        recent_vals = df[recent_12].apply(pd.to_numeric, errors="coerce")
        result["avg_last_12m"] = recent_vals.mean(axis=1)
        result["change_12m"] = (
            pd.to_numeric(df[date_cols[-1]], errors="coerce") -
            pd.to_numeric(df[date_cols[-12]], errors="coerce")
        )

    if len(date_cols) >= 60:
        result["change_5y"] = (
            pd.to_numeric(df[date_cols[-1]], errors="coerce") -
            pd.to_numeric(df[date_cols[-60]], errors="coerce")
        )

    # Drop rows where target is NaN
    result = result.dropna(subset=["latest_value"])
    return result


def _is_date_col(col: str) -> bool:
    """Check if a column name looks like a date (YYYY-MM-DD)."""
    try:
        if len(col) == 10 and col[4] == '-' and col[7] == '-':
            return True
    except (IndexError, TypeError):
        pass
    return False


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def list_datasets() -> list[dict]:
    """Return metadata about available CSV files in /data."""
    os.makedirs(DATA_DIR, exist_ok=True)

    datasets = []
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.endswith(".csv"):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        try:
            df = pd.read_csv(fpath, nrows=5)
        except Exception:
            continue
        name = detect_dataset(df)
        if name == "unknown":
            name = fname.replace(".csv", "").lower().replace(" ", "_")
        datasets.append({
            "file": fname,
            "name": name,
            "columns": list(df.columns[:20]),  # cap preview columns
            "rows": sum(1 for _ in open(fpath)) - 1,
        })
    return datasets


def load_dataset(dataset_name: str) -> pd.DataFrame:
    """Load a dataset by canonical name."""
    for fname in os.listdir(DATA_DIR):
        if not fname.endswith(".csv"):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        try:
            df_head = pd.read_csv(fpath, nrows=5)
        except Exception:
            continue
        detected = detect_dataset(df_head)
        if detected == "unknown":
            detected = fname.replace(".csv", "").lower().replace(" ", "_")
        if detected == dataset_name:
            df = pd.read_csv(fpath)
            # Special handling for Zillow wide-format
            if dataset_name == "zillow":
                df = preprocess_zillow(df)
            return df
    raise FileNotFoundError(f"Dataset '{dataset_name}' not found in {DATA_DIR}")


# ---------------------------------------------------------------------------
# Preprocessing pipeline
# ---------------------------------------------------------------------------

from typing import Optional

def preprocess(df: pd.DataFrame, dataset_name: Optional[str] = None):
    """
    Full preprocessing pipeline.

    Returns
    -------
    X_train, X_test, y_train, y_test, feature_names, preprocessor (fitted)
    """
    if dataset_name is None:
        dataset_name = detect_dataset(df)

    target_col = detect_target(df, dataset_name)
    print(f"[preprocessing] Dataset={dataset_name}, target={target_col}, shape={df.shape}")

    # Drop columns with > 40% missing
    thresh = 0.4 * len(df)
    df = df.dropna(axis=1, thresh=int(len(df) - thresh))

    # Separate target
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found. Columns: {list(df.columns[:10])}")
    y = df[target_col].copy()
    X = df.drop(columns=[target_col])

    # Drop non-informative columns
    drop_patterns = ["id", "order", "pid", "date", "regionid"]
    drop_cols = [c for c in X.columns if c.lower().strip() in drop_patterns]
    X = X.drop(columns=drop_cols, errors="ignore")

    # Identify column types
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()

    # Fill missing values before pipeline
    for col in numeric_cols:
        X[col] = X[col].fillna(X[col].median())
    for col in categorical_cols:
        mode = X[col].mode()
        X[col] = X[col].fillna(mode.iloc[0] if not mode.empty else "MISSING")

    # Drop rows where target is NaN
    mask = y.notna()
    X = X.loc[mask].reset_index(drop=True)
    y = y.loc[mask].reset_index(drop=True)

    # Build column transformer
    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append((
            "cat",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False, max_categories=15),
            categorical_cols,
        ))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Fit & transform
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    # Build feature names
    feature_names = []
    for name, trans, cols in transformers:
        if name == "num":
            feature_names.extend(cols)
        elif name == "cat":
            fitted_encoder = preprocessor.named_transformers_["cat"]
            feature_names.extend(fitted_encoder.get_feature_names_out(cols).tolist())

    print(f"[preprocessing] Features: {len(feature_names)}, Train: {X_train_processed.shape[0]}, Test: {X_test_processed.shape[0]}")

    return X_train_processed, X_test_processed, np.array(y_train), np.array(y_test), feature_names, preprocessor


def get_input_features(dataset_name: str) -> list[dict]:
    """Return the expected input features for the predictor form."""
    if dataset_name == "ames":
        return [
            {"name": "Gr Liv Area", "label": "Above Ground Living Area (sq ft)", "type": "number", "default": 1500},
            {"name": "Overall Qual", "label": "Overall Quality (1-10)", "type": "number", "default": 7},
            {"name": "Year Built", "label": "Year Built", "type": "number", "default": 2000},
            {"name": "Total Bsmt SF", "label": "Total Basement Area (sq ft)", "type": "number", "default": 1000},
            {"name": "Garage Cars", "label": "Garage Capacity (cars)", "type": "number", "default": 2},
        ]
    elif dataset_name == "california":
        return [
            {"name": "median_income", "label": "Median Income (10k $)", "type": "number", "default": 3.5},
            {"name": "housing_median_age", "label": "House Age (years)", "type": "number", "default": 20},
            {"name": "total_rooms", "label": "Total Rooms", "type": "number", "default": 2000},
            {"name": "population", "label": "Population", "type": "number", "default": 1200},
            {"name": "latitude", "label": "Latitude", "type": "number", "default": 34.05},
            {"name": "longitude", "label": "Longitude", "type": "number", "default": -118.25},
        ]
    elif dataset_name == "kc_house":
        return [
            {"name": "bedrooms", "label": "Bedrooms", "type": "number", "default": 3},
            {"name": "bathrooms", "label": "Bathrooms", "type": "number", "default": 2.0},
            {"name": "sqft_living", "label": "Living Area (sq ft)", "type": "number", "default": 1800},
            {"name": "sqft_lot", "label": "Lot Size (sq ft)", "type": "number", "default": 6000},
            {"name": "floors", "label": "Floors", "type": "number", "default": 1.5},
            {"name": "condition", "label": "Condition (1-5)", "type": "number", "default": 3},
            {"name": "grade", "label": "Grade (1-13)", "type": "number", "default": 7},
            {"name": "yr_built", "label": "Year Built", "type": "number", "default": 1990},
        ]
    elif dataset_name == "zillow":
        return [
            {"name": "SizeRank", "label": "Size Rank", "type": "number", "default": 50},
            {"name": "RegionName", "label": "Region Name", "type": "text", "default": "New York"},
        ]
    else:
        return [
            {"name": "feature_1", "label": "Feature 1", "type": "number", "default": 0},
        ]
