import joblib
import os
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ✅ FIX PATHS
classifier = joblib.load(os.path.join(BASE_DIR, "miniLM_classifier.pkl"))
label_encoder = joblib.load(os.path.join(BASE_DIR, "miniLM_label_encoder.pkl"))

# DO NOT load embedding from pickle → load fresh
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def predict_category(text):

    embedding = embedding_model.encode([text])

    prediction = classifier.predict(embedding)
    probabilities = classifier.predict_proba(embedding)

    category = label_encoder.inverse_transform(prediction)[0]
    confidence = np.max(probabilities)

    if confidence < 0.60:
        category = "other"

    return {
        "category": category,
        "confidence": float(confidence)
    }