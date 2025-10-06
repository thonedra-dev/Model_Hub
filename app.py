# app.py — unified backend with wine model prepared

from flask import Flask, request, render_template
import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin  # required for unpickling custom steps

# ---- Helpers required to unpickle pipelines trained in Colab (why: pickle resolves by name) ----
def _to_1d(arr):
    import numpy as _np
    return _np.asarray(arr).ravel()

class FrequencyEncoder(BaseEstimator, TransformerMixin):
    """Maps values to training frequency counts; unseen -> 0. Keep name/signature identical to training."""
    def __init__(self):
        self.freq_ = None
    def fit(self, X, y=None):
        s = pd.Series(_to_1d(X))
        self.freq_ = s.value_counts()
        return self
    def transform(self, X):
        s = pd.Series(_to_1d(X))
        return s.map(self.freq_).fillna(0).to_numpy(dtype=float).reshape(-1, 1)

# Car pipeline helper functions (kept because they’re referenced inside the saved car pipeline)
def _clean_mileage(arr):
    s = pd.Series(_to_1d(arr)).astype(str).str.replace(" km", "", regex=False)
    s = pd.to_numeric(s, errors="coerce").fillna(0).clip(upper=300_000)
    return s.to_numpy(dtype=float).reshape(-1, 1)

def _clean_engine_volume(arr):
    s = pd.to_numeric(pd.Series(_to_1d(arr)), errors="coerce").fillna(0).clip(upper=6.0)
    return s.to_numpy(dtype=float).reshape(-1, 1)

def _clean_prod_year(arr):
    s = pd.to_numeric(pd.Series(_to_1d(arr)), errors="coerce").fillna(1970).clip(lower=1970)
    return s.to_numpy(dtype=float).reshape(-1, 1)

def _map_leather(arr):
    mapping = {"Yes": 1, "No": 0, "YES": 1, "NO": 0, True: 1, False: 0, "True": 1, "False": 0}
    s = pd.Series(_to_1d(arr)).map(mapping).fillna(0)
    return s.to_numpy(dtype=float).reshape(-1, 1)
# -----------------------------------------------------------------------------------------------

app = Flask(__name__)

# Load models AFTER helper definitions exist
house_model = joblib.load("house_price_prediction_xg_model.pkl")
car_model   = joblib.load("car_price_pipeline.joblib")

# Wine model is optional; don’t crash if not present yet
try:
    wine_model = joblib.load("wine_points_pipeline.joblib")
except Exception:
    wine_model = None  # why: allow app to run before the wine artifact is added

@app.route("/")
@app.route("/index")
def home():
    return render_template("index.html")

# 1) HOUSE PRICE PREDICTION (HTML form posts here directly)
@app.route("/predict", methods=["POST"])
def predict_house():
    try:
        features = np.array([[
            float(request.form["Rooms"]),
            float(request.form["Distance"]),
            float(request.form["Bathroom"]),
            float(request.form["Landsize"]),
            float(request.form["BuildingArea"]),
            float(request.form["Lattitude"]),
            float(request.form["Longtitude"]),
            float(request.form["Car"]),
        ]])
        pred = float(house_model.predict(features)[0])
        return render_template("index.html", prediction_text=f"🏠 Predicted House Price: ${pred:,.2f}")
    except Exception as e:
        return render_template("index.html", prediction_text=f"Error: {e}")

# 2) CAR PRICE PREDICTION (JS wizard posts FormData here)
@app.route("/predict_car", methods=["POST"])
def predict_car():
    try:
        row = {
            "Manufacturer": request.form.get("Manufacturer"),
            "Model": request.form.get("Model"),
            "Prod. year": request.form.get("Prod. year"),
            "Category": request.form.get("Category"),
            "Mileage": request.form.get("Mileage"),
            "Engine volume": request.form.get("Engine volume"),
            "Leather interior": request.form.get("Leather interior"),
            "Fuel type": request.form.get("Fuel type"),
            "Gear box type": request.form.get("Gear box type"),
            "Drive wheels": request.form.get("Drive wheels"),
            "Airbags": request.form.get("Airbags"),
        }
        X_infer = pd.DataFrame([row], columns=[
            "Manufacturer","Model","Prod. year","Category","Mileage",
            "Engine volume","Leather interior","Fuel type",
            "Gear box type","Drive wheels","Airbags",
        ])
        pred = float(car_model.predict(X_infer)[0])
        return render_template("index.html", car_prediction_text=f"🚗 Predicted Car Price: ${pred:,.2f}")
    except Exception as e:
        return render_template("index.html", car_prediction_text=f"Error: {e}")

# 3) WINE POINTS PREDICTION (NEW) — expects raw fields; pipeline handles encoding
@app.route("/predict_wine", methods=["POST"])
def predict_wine():
    try:
        if wine_model is None:
            return render_template("index.html", wine_prediction_text="Error: wine pipeline not loaded. Place wine_points_pipeline.joblib next to app.py.")

        row = {
            "country":  request.form.get("country"),
            "province": request.form.get("province"),
            "region_1": request.form.get("region_1"),
            "variety":  request.form.get("variety"),
            "winery":   request.form.get("winery"),
            "price":    request.form.get("price"),
        }
        X_infer = pd.DataFrame([row], columns=["country","province","region_1","variety","winery","price"])
        pred = float(wine_model.predict(X_infer)[0])
        return render_template("index.html", wine_prediction_text=f"🍷 Predicted Points: {pred:.1f}")
    except Exception as e:
        return render_template("index.html", wine_prediction_text=f"Error: {e}")

if __name__ == "__main__":
    app.run(debug=True, port=15000)
