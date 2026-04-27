import pandas as pd
import joblib

from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score


# LOAD DATA
df = pd.read_csv("civic_spam_dataset.csv")
df = df.dropna()

texts = df["text"].astype(str).tolist()
labels = df["label"].astype(int)


# LOAD MODEL
print("Loading MiniLM...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")
X = embedding_model.encode(texts, show_progress_bar=True)


# SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    X, labels, test_size=0.2, random_state=42
)


# TRAIN
model = LogisticRegression(max_iter=2000)
model.fit(X_train, y_train)


# EVALUATE
preds = model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, preds))
print("\nReport:\n", classification_report(y_test, preds))


# SAVE ONLY CLASSIFIER
joblib.dump(model, "spam_minilm_model.pkl")

print("✅ MiniLM spam model saved")