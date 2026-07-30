"""Log tuong tac/quiz vao SQLite - phuc vu truc tiep eval/ (Do Tuan Son can them
case that tu chatlog/lượt live) va validation/ (Dang Duc can feedback log nguoi
test that ngoai nhom). Client goi kieu fire-and-forget - loi log khong duoc phep
lam hong trai nghiem hoc."""

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from .. import db

router = APIRouter(prefix="/api/logs", tags=["logs"])


class InteractionLog(BaseModel):
    session_id: str
    lesson_id: Optional[str] = None
    type: str
    query: str
    response_pages: list[int] = []


class QuizResultLog(BaseModel):
    session_id: str
    lesson_id: Optional[str] = None
    page: Optional[int] = None
    question: str
    is_correct: bool
    tier: Optional[str] = None


@router.post("/interaction")
def log_interaction(payload: InteractionLog):
    db.insert_interaction(
        payload.session_id, payload.lesson_id, payload.type, payload.query, payload.response_pages
    )
    return {"ok": True}


@router.post("/quiz-result")
def log_quiz_result(payload: QuizResultLog):
    db.insert_quiz_result(
        payload.session_id, payload.lesson_id, payload.page, payload.question, payload.is_correct, payload.tier
    )
    return {"ok": True}


@router.get("/export")
def export_logs(type: str = "interaction"):
    if type == "quiz":
        return db.export_quiz_results()
    return db.export_interactions()
