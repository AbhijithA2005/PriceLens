"""
explainability.py — SHAP-based explanations for linear regression models.
"""

import numpy as np
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False



def explain_prediction(model, X_background, X_instance, feature_names, top_n=10):
    """
    Explain a single prediction using SHAP LinearExplainer.

    Parameters
    ----------
    model : fitted sklearn linear model
    X_background : ndarray — training data (or a sample of it)
    X_instance : ndarray — single row to explain, shape (1, n_features)
    feature_names : list[str]
    top_n : int — number of top features to return

    Returns
    -------
    list[dict] — [{feature, shap_value, contribution_direction}, ...]
    """
    if SHAP_AVAILABLE:
        try:
            explainer = shap.LinearExplainer(model, X_background)
            shap_values = explainer.shap_values(X_instance)
        except Exception:
            SHAP_AVAILABLE = False # Fallback for next time or this time
            return explain_prediction(model, X_background, X_instance, feature_names, top_n)
    else:
        # Fallback: use coefficient-based pseudo-SHAP
        if hasattr(model, "coef_"):
            coef = np.array(model.coef_).flatten()
            shap_values = (X_instance * coef).flatten()
        else:
            return []

    sv = np.array(shap_values).flatten()

    # Sort by absolute value
    indices = np.argsort(np.abs(sv))[::-1][:top_n]

    result = []
    for idx in indices:
        fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
        val = float(sv[idx])
        result.append({
            "feature": fname,
            "shap_value": round(val, 4),
            "direction": "positive" if val >= 0 else "negative",
        })
    return result


def global_shap_summary(model, X_background, feature_names, top_n=15):
    """
    Compute global SHAP importance: mean |SHAP value| per feature.

    Returns
    -------
    list[dict] — [{feature, mean_abs_shap}, ...] sorted descending
    """
    if SHAP_AVAILABLE:
        try:
            explainer = shap.LinearExplainer(model, X_background)
            # Use a sample if dataset is large
            sample_size = min(500, X_background.shape[0])
            X_sample = X_background[:sample_size]
            shap_values = explainer.shap_values(X_sample)
        except Exception:
            return global_shap_summary(model, X_background, feature_names, top_n) # Let it hit the else
    else:
        # Fallback: coefficient magnitudes
        if hasattr(model, "coef_"):
            coef = np.abs(np.array(model.coef_).flatten())
            indices = np.argsort(coef)[::-1][:top_n]
            return [
                {
                    "feature": feature_names[i] if i < len(feature_names) else f"feature_{i}",
                    "mean_abs_shap": round(float(coef[i]), 4),
                }
                for i in indices
            ]
        return []

    sv = np.array(shap_values)
    mean_abs = np.mean(np.abs(sv), axis=0)

    indices = np.argsort(mean_abs)[::-1][:top_n]

    result = []
    for idx in indices:
        fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
        result.append({
            "feature": fname,
            "mean_abs_shap": round(float(mean_abs[idx]), 4),
        })
    return result
