"""Python port cua src/vectorstore.mjs - toan hoc rank vector (cosine similarity) +
fingerprint noi dung slide de cache trong SQLite (server/db.py) thay cho
localStorage-moi-trinh-duyet cua ban truoc. Khong tu goi AI o day - embedding
that nam trong server/providers.py."""

import hashlib
import math


def fingerprint_slides(slides):
    """slides: list [{page, title, content}]. Fingerprint doi theo NOI DUNG, khong
    theo lesson_id, de PDF tai lai (id moi moi lan tren client) van khop cache neu
    noi dung giong het."""
    parts = [
        f"{slide.get('page')}|{slide.get('title', '')}|{slide.get('content', '')}"
        for slide in slides
        if str(slide.get("content", "")).strip()
    ]
    raw = "\n---\n".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if not norm_a or not norm_b:
        return 0.0
    return dot / (norm_a * norm_b)


def rank_slides_by_vector(slides, slide_vectors, query_vector, limit=3):
    """Top-k theo cosine similarity, khong chan nguong cung - de LLM + verifier phia
    client (validateHybridResponse trong grounding.mjs) la lop quyet dinh co can cu
    hay khong, tranh mot nguong doan mo lam rong ket qua am tham."""
    vector_by_page = {int(item["page"]): item["vector"] for item in slide_vectors}
    scored = []
    for slide in slides:
        page = int(slide.get("page"))
        vector = vector_by_page.get(page)
        if vector is None:
            continue
        scored.append({"slide": slide, "score": cosine_similarity(vector, query_vector)})
    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:limit]
