import pandas as pd
import joblib
import re

from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


# =========================
# CLEAN TEXT
# =========================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text


# =========================
# LOAD DATA
# =========================
df = pd.read_csv("civic_spam_dataset.csv")

df = df.dropna()
df["text"] = df["text"].apply(clean_text)

# Shuffle
df = df.sample(frac=1, random_state=42).reset_index(drop=True)


# =========================
# LABELS
# =========================
X_text = df["text"]
y = df["label"]


# =========================
# LOAD MiniLM
# =========================
print("Loading MiniLM...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")
X = embedding_model.encode(X_text.tolist(), show_progress_bar=True)


# =========================
# SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# =========================
# TRAIN MODEL
# =========================
model = LogisticRegression(max_iter=3000)
model.fit(X_train, y_train)


# =========================
# EVALUATION
# =========================
predictions = model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, predictions))
print("\nReport:\n")
print(classification_report(y_test, predictions))


# =========================
# SAVE
# =========================
joblib.dump(model, "spam_minilm_model.pkl")

print("\n✅ MiniLM Spam model saved")