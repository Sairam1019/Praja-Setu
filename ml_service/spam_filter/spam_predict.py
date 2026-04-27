import joblib
import os
import re
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load trained classifier
model = joblib.load(os.path.join(BASE_DIR, "spam_minilm_model.pkl"))

# Load MiniLM (NOT pickled)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


# CLEAN TEXT
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text


# PREDICT
def predict_spam(text):

    text = clean_text(text)

    embedding = embedding_model.encode([text])

    prediction = model.predict(embedding)[0]
    probability = model.predict_proba(embedding).max()

    return {
        "is_spam": bool(prediction),
        "confidence": float(probability)
    }