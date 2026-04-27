from flask import Flask, request, jsonify

from spam_filter.spam_predict import predict_spam
from category_classifier.category_predict import predict_category
from duplicate_detection.duplicate_logic import (
    check_duplicate_optimized,
    generate_image_hash,
    generate_video_hash
)

app = Flask(__name__)


@app.route("/")
def home():
    return "ML Service Running 🚀"


@app.route("/predict-full", methods=["POST"])
def predict_full():
    try:
        data = request.get_json()

        # ✅ SAFE INPUT HANDLING (NO BREAKING CHANGE)
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        text = data.get("description")
        existing_texts = data.get("existing_texts", [])
        existing_hashes = data.get("existing_hashes", [])
        media_url = data.get("uploaded_media_url")
        media_type = data.get("media_type")
        distance_ok = data.get("distance_ok", True)

        # ✅ BASIC VALIDATION (SAFE)
        if not text:
            return jsonify({"error": "Description is required"}), 400

        # ===========================
        # 🔥 SPAM
        # ===========================
        spam_result = predict_spam(text)

        # ===========================
        # 🔥 CATEGORY
        # ===========================
        category_result = predict_category(text)

        # ===========================
        # 🔥 HASH GENERATION
        # ===========================
        new_hash = None

        if media_url and media_type:
            try:
                if media_type == "image":
                    new_hash = generate_image_hash(media_url)
                elif media_type == "video":
                    new_hash = generate_video_hash(media_url)
            except Exception as hash_error:
                print("Hash error:", hash_error)
                new_hash = None  # fail-safe

        # ===========================
        # 🔥 DUPLICATE CHECK
        # ===========================
        duplicate_result = check_duplicate_optimized(
            new_text=text,
            existing_texts=existing_texts,
            existing_hashes=existing_hashes,
            new_hash=new_hash,
            media_type=media_type,
            distance_ok=distance_ok
        )

        # ===========================
        # ✅ FINAL RESPONSE (UNCHANGED)
        # ===========================
        return jsonify({
            "is_spam": spam_result["is_spam"],
            "spam_confidence": spam_result["confidence"],
            "category": category_result["category"],
            "category_confidence": category_result["confidence"],
            "duplicate": duplicate_result["duplicate"],
            "text_similarity": duplicate_result["text_similarity"],
            "media_match": duplicate_result["media_similarity"] > 0.90,
            "media_hash": new_hash
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500


# ===========================
# 🚀 LOCAL RUN (KEEP THIS)
# ===========================
import os

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=PORT)