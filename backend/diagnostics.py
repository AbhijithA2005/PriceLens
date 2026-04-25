"""
diagnostics.py — Residual analysis, Q-Q plot, Breusch-Pagan, cross-validation.
"""

import numpy as np
from scipy import stats
from sklearn.model_selection import cross_val_score
from statsmodels.stats.diagnostic import het_breuschpagan
import statsmodels.api as sm


def residual_data(y_test, y_pred):
    """Return scatter data for predicted-vs-residuals plot."""
    residuals = y_test - y_pred
    return {
        "predicted": np.array(y_pred).tolist(),
        "residuals": np.array(residuals).tolist(),
    }


def qq_data(y_test, y_pred):
    """Return Q-Q plot coordinates for the residuals."""
    residuals = np.array(y_test) - np.array(y_pred)
    (theoretical, sample), (slope, intercept, _) = stats.probplot(residuals, dist="norm")
    return {
        "theoretical": theoretical.tolist(),
        "sample": sample.tolist(),
        "fit_slope": float(slope),
        "fit_intercept": float(intercept),
    }


def breusch_pagan_test(X, y_test, y_pred):
    """
    Run Breusch-Pagan test for heteroscedasticity.

    Returns
    -------
    dict with lm_stat, lm_pvalue, f_stat, f_pvalue, homoscedastic (bool)
    """
    residuals = np.array(y_test) - np.array(y_pred)
    X_arr = np.array(X)

    # Add constant for OLS
    X_const = sm.add_constant(X_arr)

    try:
        lm_stat, lm_pval, f_stat, f_pval = het_breuschpagan(residuals, X_const)
    except Exception:
        # If the test fails (e.g., singular matrix), return defaults
        return {
            "lm_stat": None,
            "lm_pvalue": None,
            "f_stat": None,
            "f_pvalue": None,
            "homoscedastic": None,
            "message": "Test could not be computed",
        }

    return {
        "lm_stat": round(float(lm_stat), 4),
        "lm_pvalue": round(float(lm_pval), 6),
        "f_stat": round(float(f_stat), 4),
        "f_pvalue": round(float(f_pval), 6),
        "homoscedastic": float(lm_pval) > 0.05,
    }


def cross_val(model, X_train, y_train, cv=5):
    """
    5-fold cross-validation returning mean ± std R² score.
    """
    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="r2")
    return {
        "cv_scores": scores.tolist(),
        "cv_mean": round(float(scores.mean()), 4),
        "cv_std": round(float(scores.std()), 4),
    }
