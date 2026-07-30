"""Vector search that qua Gemini embedding (batchEmbedContents), cache trong SQLite
(server/db.py) - thay toan bo embedTexts/ensureLessonSlideVectors/retrieveSlidesByVector
truoc day chay trong trinh duyet. Loi (thieu key/mang/quota) van tra 200 voi
used_vector=false de client tu roi ve retrieval tu-khoa (retrieveRelevantSlides trong
grounding.mjs) - khong co duong nao lam search "cam" hoan toan."""

from fastapi import APIRouter
from pydantic import BaseModel

from .. import db, providers, vectorstore

router = APIRouter(prefix="/api/embed", tags=["embed"])


class Slide(BaseModel):
    page: int
    title: str = ""
    content: str = ""


class SearchRequest(BaseModel):
    lesson_id: str
    slides: list[Slide]
    query: str
    limit: int = 3


@router.post("/search")
async def search(payload: SearchRequest):
    slides = [slide.model_dump() for slide in payload.slides if slide.content.strip()]
    if not slides or not payload.query.strip():
        return {"matches": [], "used_vector": False}

    fingerprint = vectorstore.fingerprint_slides(slides)
    slide_vectors = db.load_vectors(fingerprint)

    if slide_vectors is None:
        try:
            status_code, vectors = await providers.call_embed(
                [f"{slide['title']}\n{slide['content']}" for slide in slides],
                task_type="RETRIEVAL_DOCUMENT",
            )
        except providers.ProviderError:
            return {"matches": [], "used_vector": False}
        if status_code != 200 or vectors is None:
            return {"matches": [], "used_vector": False}
        slide_vectors = [{"page": slide["page"], "vector": vector} for slide, vector in zip(slides, vectors)]
        db.save_vectors(fingerprint, slide_vectors)

    try:
        status_code, query_vectors = await providers.call_embed([payload.query], task_type="RETRIEVAL_QUERY")
    except providers.ProviderError:
        return {"matches": [], "used_vector": False}
    if status_code != 200 or not query_vectors:
        return {"matches": [], "used_vector": False}

    ranked = vectorstore.rank_slides_by_vector(slides, slide_vectors, query_vectors[0], limit=payload.limit)
    return {
        "matches": [{"page": item["slide"]["page"], "score": item["score"]} for item in ranked],
        "used_vector": True,
    }
