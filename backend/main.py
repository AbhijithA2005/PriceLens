"""
main.py — FastAPI application: mounts all API endpoints for PriceLens.
"""

import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd

from preprocessing import (
    list_datasets,
    load_dataset,
    preprocess,
    detect_dataset,
    get_input_features,
)
from models import train_all_models
from diagnostics import residual_data, qq_data, breusch_pagan_test, cross_val
from explainability import explain_prediction, global_shap_summary

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(title="PriceLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state ───────────────────────────────────────────────────────
# Structure:  trained[dataset_name] = {
#   "models": {model_name: {model, metrics, feature_names, ...}},
#   "X_train", "X_test", "y_train", "y_test",
#   "feature_names", "preprocessor",
# }
trained: dict = {}


# ── Pydantic schemas ─────────────────────────────────────────────────────
class TrainRequest(BaseModel):
    dataset: str


class PredictRequest(BaseModel):
    dataset: str
    model: str
    features: dict


# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/datasets")
def get_datasets():
    """List available CSV datasets."""
    return list_datasets()


@app.post("/train")
def train(req: TrainRequest):
    """Train all 5 models on the selected dataset."""
    try:
        df = load_dataset(req.dataset)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    try:
        X_train, X_test, y_train, y_test, feature_names, preprocessor = preprocess(df, req.dataset)

        results = train_all_models(X_train, X_test, y_train, y_test, feature_names)

        # Build a reference row (median for numeric, mode for categorical)
        # to use as defaults when predicting with partial inputs
        target_col = [c for c in df.columns if c == "SalePrice" or c == "median_house_value" or c == "price" or c == "latest_value"]
        predict_cols = [c for c in df.columns if c not in target_col]
        ref_row = {}
        for col in predict_cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                median_val = df[col].median()
                ref_row[col] = 0 if pd.isna(median_val) else float(median_val)
            else:
                mode = df[col].mode()
                ref_row[col] = mode.iloc[0] if not mode.empty else "MISSING"

        # Store in memory
        trained[req.dataset] = {
            "models": results,
            "X_train": X_train,
            "X_test": X_test,
            "y_train": y_train,
            "y_test": y_test,
            "feature_names": feature_names,
            "preprocessor": preprocessor,
            "df_columns": list(df.columns),
            "ref_row": ref_row,
        }

        # Build response (exclude heavy arrays)
        summary = {}
        for name, info in results.items():
            m = info["metrics"].copy()
            m.pop("residuals", None)
            m.pop("y_pred_test", None)
            summary[name] = {
                "display_name": info["display_name"],
                **m,
            }

        return {
            "status": "ok",
            "dataset": req.dataset,
            "models": summary,
            "input_features": get_input_features(req.dataset),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(req: PredictRequest):
    """Predict price for a given set of features."""
    if req.dataset not in trained:
        raise HTTPException(status_code=400, detail=f"Dataset '{req.dataset}' not trained yet. Call POST /train first.")

    state = trained[req.dataset]
    if req.model not in state["models"]:
        raise HTTPException(status_code=400, detail=f"Model '{req.model}' not found. Available: {list(state['models'].keys())}")

    model_info = state["models"][req.model]
    model = model_info["model"]
    preprocessor = state["preprocessor"]
    feature_names = state["feature_names"]

    # Build a single-row DataFrame from the feature dict
    try:
        # Start from a reference row (all columns with median/mode defaults)
        row = state["ref_row"].copy()
        # Override with user-provided features
        for k, v in req.features.items():
            if k in row:
                row[k] = v

        # Create dataframe with one row
        input_df = pd.DataFrame([row])

        # Transform through the preprocessor
        X_input = preprocessor.transform(input_df)

        # For polynomial model, subset to the right features
        if req.model == "polynomial" and "poly_indices" in model_info:
            X_input = X_input[:, model_info["poly_indices"]]

        prediction = float(model.predict(X_input)[0])

        # SHAP explanation (skip for polynomial — different feature space)
        shap_values = []
        if req.model != "polynomial":
            shap_values = explain_prediction(
                model,
                state["X_train"],
                X_input,
                feature_names,
                top_n=10,
            )

        return {
            "predicted_price": round(prediction, 2),
            "shap_values": shap_values,
            "model": req.model,
            "dataset": req.dataset,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-comparison")
def model_comparison():
    """Return metrics for all trained models across all datasets."""
    if not trained:
        raise HTTPException(status_code=400, detail="No models trained yet.")

    result = {}
    for dataset_name, state in trained.items():
        dataset_metrics = {}
        for model_name, info in state["models"].items():
            m = info["metrics"].copy()
            m.pop("residuals", None)
            m.pop("y_pred_test", None)
            dataset_metrics[model_name] = {
                "display_name": info["display_name"],
                **m,
            }
        result[dataset_name] = dataset_metrics
    return result


@app.get("/residuals/{model_name}")
def get_residuals(model_name: str, dataset: str = ""):
    """Return residual analysis for a given model."""
    # Find the dataset
    ds = dataset
    if not ds:
        ds = list(trained.keys())[0] if trained else ""
    if ds not in trained:
        raise HTTPException(status_code=400, detail="Dataset not trained.")

    state = trained[ds]
    if model_name not in state["models"]:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found.")

    model_info = state["models"][model_name]
    y_test = state["y_test"]
    y_pred = model_info["metrics"]["y_pred_test"]

    # Residual scatter data
    res = residual_data(y_test, y_pred)

    # Q-Q data
    qq = qq_data(y_test, y_pred)

    # Breusch-Pagan
    X_test = state["X_test"]
    if model_name == "polynomial" and "poly_indices" in model_info:
        X_test = X_test[:, model_info["poly_indices"]]
    bp = breusch_pagan_test(X_test, y_test, y_pred)

    # Cross-validation
    model = model_info["model"]
    X_train = state["X_train"]
    if model_name == "polynomial" and "poly_indices" in model_info:
        X_train = X_train[:, model_info["poly_indices"]]
    cv = cross_val(model, X_train, state["y_train"])

    return {
        "model": model_name,
        "dataset": ds,
        "residual_plot": res,
        "qq_plot": qq,
        "breusch_pagan": bp,
        "cross_validation": cv,
    }


@app.get("/feature-importance")
def feature_importance(dataset: str = ""):
    """Return global SHAP importance for the best model."""
    ds = dataset
    if not ds:
        ds = list(trained.keys())[0] if trained else ""
    if ds not in trained:
        raise HTTPException(status_code=400, detail="Dataset not trained.")

    state = trained[ds]

    # Find best model by test R²
    best_name = max(
        state["models"],
        key=lambda k: state["models"][k]["metrics"]["r2_test"],
    )
    best_info = state["models"][best_name]
    model = best_info["model"]
    feature_names = best_info["feature_names"]

    X_bg = state["X_train"]
    # Skip polynomial for global SHAP (different feature space)
    if best_name == "polynomial":
        # Use second-best
        candidates = {k: v for k, v in state["models"].items() if k != "polynomial"}
        best_name = max(candidates, key=lambda k: candidates[k]["metrics"]["r2_test"])
        best_info = candidates[best_name]
        model = best_info["model"]
        feature_names = best_info["feature_names"]
        X_bg = state["X_train"]

    summary = global_shap_summary(model, X_bg, feature_names, top_n=15)

    return {
        "model": best_name,
        "dataset": ds,
        "importance": summary,
    }
