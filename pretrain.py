import os
import joblib
import pandas as pd
import sys

# Ensure we can import from the backend directory
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from preprocessing import load_dataset, preprocess
from models import train_all_models

def pretrain_all():
    trained_data = {}
    datasets = ["ames", "california", "kc_house", "zillow"]
    
    for ds in datasets:
        print(f"Pre-training {ds}...")
        try:
            df = load_dataset(ds)
            X_train, X_test, y_train, y_test, feature_names, preprocessor = preprocess(df, ds)
            results = train_all_models(X_train, X_test, y_train, y_test, feature_names)
            
            # Build ref row
            target_col = [c for c in df.columns if c in ["SalePrice", "median_house_value", "price", "latest_value"]]
            predict_cols = [c for c in df.columns if c not in target_col]
            ref_row = {}
            for col in predict_cols:
                if pd.api.types.is_numeric_dtype(df[col]):
                    median_val = df[col].median()
                    ref_row[col] = 0 if pd.isna(median_val) else float(median_val)
                else:
                    mode = df[col].mode()
                    ref_row[col] = mode.iloc[0] if not mode.empty else "MISSING"

            trained_data[ds] = {
                "models": results,
                "X_train": X_train[:100], # Keep a small sample for SHAP fallbacks
                "X_test": X_test[:100],
                "y_train": y_train[:100],
                "y_test": y_test[:100],
                "feature_names": feature_names,
                "preprocessor": preprocessor,
                "df_columns": list(df.columns),
                "ref_row": ref_row,
            }
        except Exception as e:
            print(f"Failed to pre-train {ds}: {e}")

    # Save to a file that will be included in the deployment
    save_path = os.path.join(os.path.dirname(__file__), "backend", "pretrained_models.joblib")
    joblib.dump(trained_data, save_path)
    print(f"Saved pre-trained models to {save_path}")

if __name__ == "__main__":
    pretrain_all()
