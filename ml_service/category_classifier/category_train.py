import pandas as pd
import joblib
import numpy as np

from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder


# ===============================
# LOAD DATA
# ===============================

df = pd.read_csv("civic_category_dataset.csv")
df = df.dropna()

df["text"] = df["text"].astype(str).str.strip()
df["label"] = df["label"].astype(str).str.strip().str.lower()

# Keep only valid 10 categories
valid_categories = [
    "garbage_waste",
    "road_pothole",
    "water_supply",
    "drainage_sewage",
    "streetlight_electrical",
    "traffic_roadsafety",
    "stray_animals",
    "public_property_damage",
    "illegal_activities",
    "other"
]

df = df[df["label"].isin(valid_categories)]

print("\nCategory Distribution:\n")
print(df["label"].value_counts())


# ===============================
# ENCODE LABELS
# ===============================

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df["label"])


# ===============================
# LOAD MINI LM MODEL
# ===============================

print("\nLoading MiniLM model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")
X = embedding_model.encode(df["text"].tolist(), show_progress_bar=True)


# ===============================
# TRAIN TEST SPLIT
# ===============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# ===============================
# TRAIN CLASSIFIER
# ===============================

classifier = LogisticRegression(max_iter=3000)
classifier.fit(X_train, y_train)


# ===============================
# EVALUATE
# ===============================

predictions = classifier.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, predictions))
print("\nClassification Report:\n")
print(classification_report(y_test, predictions, target_names=label_encoder.classes_))


# ===============================
# SAVE MODEL
# ===============================

joblib.dump(classifier, "miniLM_classifier.pkl")
joblib.dump(label_encoder, "miniLM_label_encoder.pkl")
joblib.dump(embedding_model, "miniLM_embedding_model.pkl")

print("\nMiniLM model trained and saved successfully.")