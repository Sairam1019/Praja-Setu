import numpy as np
from sentence_transformers import SentenceTransformer
import requests
from io import BytesIO
from PIL import Image
import imagehash
import tempfile
import cv2
import hashlib
import faiss

# =========================
# MODEL (GPU SUPPORT)
# =========================
model = SentenceTransformer(
    "all-MiniLM-L6-v2",
    device="cuda" if cv2.cuda.getCudaEnabledDeviceCount() > 0 else "cpu"
)

# =========================
# FAISS INDEX
# =========================
dimension = 384
faiss_index = faiss.IndexFlatL2(dimension)


# =========================
# TEXT SIMILARITY
# =========================
def text_similarity(new_text, existing_texts):
    if not existing_texts:
        return 0.0

    embeddings = model.encode(existing_texts).astype("float32")
    faiss_index.reset()
    faiss_index.add(embeddings)

    new_emb = model.encode([new_text]).astype("float32")

    D, _ = faiss_index.search(new_emb, k=1)

    return float(1 - D[0][0])


# =========================
# IMAGE HASH
# =========================
def generate_image_hash(url):
    try:
        response = requests.get(url, timeout=5)
        img = Image.open(BytesIO(response.content)).convert("RGB")

        phash = imagehash.phash(img)
        dhash = imagehash.dhash(img)
        ahash = imagehash.average_hash(img)

        return str(phash) + str(dhash) + str(ahash)

    except Exception as e:
        print("Image hash error:", e)
        return None


# =========================
# VIDEO HASH
# =========================
def generate_video_hash(url):
    try:
        response = requests.get(url, timeout=10)

        temp = tempfile.NamedTemporaryFile(delete=False)
        temp.write(response.content)

        cap = cv2.VideoCapture(temp.name)

        if not cap.isOpened():
            return None

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            return None

        frame_ids = np.linspace(0, total_frames - 1, 20, dtype=int)

        frame_hashes = []
        prev_gray = None
        motion = []

        for f in frame_ids:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(f))
            ret, frame = cap.read()

            if not ret:
                continue

            frame = cv2.resize(frame, (128, 128))

            img = Image.fromarray(frame)
            ph = str(imagehash.phash(img))
            frame_hashes.append(ph)

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            if prev_gray is not None:
                diff = cv2.absdiff(prev_gray, gray)
                motion.append(str(int(np.mean(diff))))

            prev_gray = gray

        cap.release()

        if not frame_hashes:
            return None

        combined = "".join(frame_hashes) + "".join(motion)

        final_hash = hashlib.sha256(combined.encode()).hexdigest()

        return final_hash

    except Exception as e:
        print("Video hash error:", e)
        return None


# =========================
# HASH SIMILARITY
# =========================
def similarity_score(h1, h2):
    matches = sum(c1 == c2 for c1, c2 in zip(h1, h2))
    return matches / len(h1)


# =========================
# FINAL DUPLICATE CHECK 🔥
# =========================
def check_duplicate_optimized(
    new_text,
    existing_texts,
    existing_hashes=None,
    new_hash=None,
    media_type=None,
    distance_ok=True
):

    score = 0
    media_similarity = 0
    text_sim = 0

    # =========================
    # MEDIA SIMILARITY
    # =========================
    if new_hash and existing_hashes:
        for h in existing_hashes:
            if not isinstance(h, str):
                continue

            sim = similarity_score(new_hash, h)
            media_similarity = max(media_similarity, sim)

    # =========================
    # TEXT SIMILARITY
    # =========================
    if existing_texts:
        text_sim = text_similarity(new_text, existing_texts)

    # =========================
    # SCORING SYSTEM
    # =========================

    # LOCATION
    if distance_ok:
        score += 40

    # MEDIA
    if media_similarity > 0.92:
        score += 40
    elif media_similarity > 0.85:
        score += 30

    # TEXT
    if text_sim > 0.80:
        score += 20
    elif text_sim > 0.65:
        score += 10

    # =========================
    # FINAL DECISION
    # =========================
    is_duplicate = score >= 60

    return {
        "duplicate": is_duplicate,
        "score": score,
        "text_similarity": float(text_sim),
        "media_similarity": float(media_similarity)
    }


# =========================
# MAIN PIPELINE FUNCTION
# =========================
def process_complaint(
    description,
    existing_texts,
    existing_hashes,
    uploaded_media_url=None,
    media_type=None,
    distance_ok=True
):

    new_hash = None

    # GENERATE HASH
    if uploaded_media_url:
        if media_type == "image":
            new_hash = generate_image_hash(uploaded_media_url)

        elif media_type == "video":
            new_hash = generate_video_hash(uploaded_media_url)

    # CHECK DUPLICATE
    result = check_duplicate_optimized(
        description,
        existing_texts,
        existing_hashes,
        new_hash,
        media_type,
        distance_ok
    )

    return {
        "duplicate": result["duplicate"],
        "text_similarity": result["text_similarity"],
        "media_match": result["media_similarity"] > 0.90,
        "media_hash": new_hash
    }