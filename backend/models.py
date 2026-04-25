"""
models.py — Train 5 regression models, compute metrics.
"""

import numpy as np
from sklearn.linear_model import LinearRegression, RidgeCV, LassoCV, ElasticNetCV
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _metrics(model, X_train, X_test, y_train, y_test):
    """Compute standard regression metrics for a fitted model."""
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    residuals = (y_test - y_pred_test).tolist()

    return {
        "r2_train": round(float(r2_score(y_train, y_pred_train)), 4),
        "r2_test": round(float(r2_score(y_test, y_pred_test)), 4),
        "rmse_train": round(float(np.sqrt(mean_squared_error(y_train, y_pred_train))), 2),
        "rmse_test": round(float(np.sqrt(mean_squared_error(y_test, y_pred_test))), 2),
        "mae_test": round(float(mean_absolute_error(y_test, y_pred_test)), 2),
        "residuals": residuals,
        "y_pred_test": y_pred_test.tolist(),
    }


def _safe_coef(model):
    """Extract coefficients from a model (handle pipelines)."""
    if hasattr(model, "coef_"):
        return model.coef_.tolist() if hasattr(model.coef_, "tolist") else list(model.coef_)
    # Pipeline — get the last estimator
    if hasattr(model, "steps"):
        return _safe_coef(model.steps[-1][1])
    if hasattr(model, "named_steps"):
        for step in reversed(list(model.named_steps.values())):
            if hasattr(step, "coef_"):
                return step.coef_.tolist()
    return []


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train_all_models(X_train, X_test, y_train, y_test, feature_names):
    """
    Train all 5 regression models.

    Returns
    -------
    dict[str, dict]  — model_name → {model, metrics, feature_names}
    """
    results = {}

    # 1. Multiple Linear Regression
    print("[models] Training Linear Regression …")
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    results["linear"] = {
        "model": lr,
        "metrics": _metrics(lr, X_train, X_test, y_train, y_test),
        "feature_names": feature_names,
        "display_name": "Linear Regression",
    }
    print(f"  R²={results['linear']['metrics']['r2_test']}, RMSE={results['linear']['metrics']['rmse_test']}")

    # 2. Polynomial Regression (degree=2, top 5 numeric features only)
    print("[models] Training Polynomial Regression (deg=2) …")
    n_poly_features = min(5, X_train.shape[1])
    # Use only top-N features by variance to keep dimensionality manageable
    variances = np.var(X_train, axis=0)
    top_idx = np.argsort(variances)[-n_poly_features:]
    X_train_poly_sub = X_train[:, top_idx]
    X_test_poly_sub = X_test[:, top_idx]

    poly_pipe = make_pipeline(PolynomialFeatures(degree=2, include_bias=False), LinearRegression())
    poly_pipe.fit(X_train_poly_sub, y_train)

    # Metrics use the subset
    y_pred_train_poly = poly_pipe.predict(X_train_poly_sub)
    y_pred_test_poly = poly_pipe.predict(X_test_poly_sub)
    poly_metrics = {
        "r2_train": round(float(r2_score(y_train, y_pred_train_poly)), 4),
        "r2_test": round(float(r2_score(y_test, y_pred_test_poly)), 4),
        "rmse_train": round(float(np.sqrt(mean_squared_error(y_train, y_pred_train_poly))), 2),
        "rmse_test": round(float(np.sqrt(mean_squared_error(y_test, y_pred_test_poly))), 2),
        "mae_test": round(float(mean_absolute_error(y_test, y_pred_test_poly)), 2),
        "residuals": (y_test - y_pred_test_poly).tolist(),
        "y_pred_test": y_pred_test_poly.tolist(),
    }
    poly_feature_names = [feature_names[i] for i in top_idx]
    results["polynomial"] = {
        "model": poly_pipe,
        "metrics": poly_metrics,
        "feature_names": poly_feature_names,
        "poly_indices": top_idx.tolist(),
        "display_name": "Polynomial Regression",
    }
    print(f"  R²={poly_metrics['r2_test']}, RMSE={poly_metrics['rmse_test']}")

    # 3. Ridge Regression
    print("[models] Training Ridge Regression …")
    ridge = RidgeCV(alphas=[0.01, 0.1, 1.0, 10.0, 100.0])
    ridge.fit(X_train, y_train)
    results["ridge"] = {
        "model": ridge,
        "metrics": _metrics(ridge, X_train, X_test, y_train, y_test),
        "feature_names": feature_names,
        "display_name": "Ridge Regression",
        "alpha": float(ridge.alpha_),
    }
    print(f"  R²={results['ridge']['metrics']['r2_test']}, RMSE={results['ridge']['metrics']['rmse_test']}, α={ridge.alpha_}")

    # 4. Lasso Regression
    print("[models] Training Lasso Regression …")
    lasso = LassoCV(max_iter=10000, random_state=42)
    lasso.fit(X_train, y_train)
    results["lasso"] = {
        "model": lasso,
        "metrics": _metrics(lasso, X_train, X_test, y_train, y_test),
        "feature_names": feature_names,
        "display_name": "Lasso Regression",
        "alpha": float(lasso.alpha_),
    }
    print(f"  R²={results['lasso']['metrics']['r2_test']}, RMSE={results['lasso']['metrics']['rmse_test']}, α={lasso.alpha_}")

    # 5. ElasticNet Regression
    print("[models] Training ElasticNet Regression …")
    enet = ElasticNetCV(max_iter=10000, random_state=42)
    enet.fit(X_train, y_train)
    results["elasticnet"] = {
        "model": enet,
        "metrics": _metrics(enet, X_train, X_test, y_train, y_test),
        "feature_names": feature_names,
        "display_name": "ElasticNet Regression",
        "alpha": float(enet.alpha_),
        "l1_ratio": float(enet.l1_ratio_),
    }
    print(f"  R²={results['elasticnet']['metrics']['r2_test']}, RMSE={results['elasticnet']['metrics']['rmse_test']}, α={enet.alpha_}")

    return results
