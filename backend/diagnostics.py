"""
diagnostics.py — Residual analysis, Q-Q plot, Breusch-Pagan, cross-validation.
"""

import numpy as np
from scipy import stats
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LinearRegression
from scipy import stats

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
    Run Breusch-Pagan test for heteroscedasticity using manual LM-statistic calculation.
    (Reduces bundle size by removing statsmodels dependency).
    """
    try:
        residuals = np.array(y_test) - np.array(y_pred)
        n = len(residuals)
        
        # Squared residuals
        sq_residuals = residuals ** 2
        
        # Auxiliary regression: squared residuals on features
        # We use sklearn's LinearRegression
        aux_model = LinearRegression()
        aux_model.fit(X, sq_residuals)
        
        # R-squared of auxiliary regression
        r2_aux = aux_model.score(X, sq_residuals)
        
        # LM Statistic = n * R2
        lm_stat = n * r2_aux
        
        # p-value from chi-squared distribution
        df = X.shape[1]
        lm_pval = 1 - stats.chi2.cdf(lm_stat, df)
        
        return {
            "lm_stat": round(float(lm_stat), 4),
            "lm_pvalue": round(float(lm_pval), 6),
            "homoscedastic": float(lm_pval) > 0.05,
        }
    except Exception:
        return {
            "lm_stat": None,
            "lm_pvalue": None,
            "homoscedastic": None,
            "message": "Manual BP test could not be computed",
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
