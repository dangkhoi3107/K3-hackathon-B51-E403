"""SQLite - vector cache dung chung (thay localStorage-moi-trinh-duyet) + log
tuong tac/quiz phuc vu eval/ va validation/. Moi ham tu mo/dong connection rieng
(khong pool) - du dung cho quy mo demo hackathon, tranh loi sqlite thread-safety
giua cac request FastAPI xu ly song song."""

import json
import sqlite3
from datetime import datetime, timezone

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS slide_vectors (
  fingerprint TEXT NOT NULL,
  page INTEGER NOT NULL,
  vector TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (fingerprint, page)
);

CREATE TABLE IF NOT EXISTS interaction_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  lesson_id TEXT,
  type TEXT,
  query TEXT,
  response_pages TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  lesson_id TEXT,
  page INTEGER,
  question TEXT,
  is_correct INTEGER,
  tier TEXT,
  created_at TEXT NOT NULL
);
"""


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def load_vectors(fingerprint):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT page, vector FROM slide_vectors WHERE fingerprint = ?", (fingerprint,)
        ).fetchall()
        if not rows:
            return None
        return [{"page": row["page"], "vector": json.loads(row["vector"])} for row in rows]
    finally:
        conn.close()


def save_vectors(fingerprint, slide_vectors):
    conn = get_connection()
    try:
        created_at = _now_iso()
        conn.executemany(
            "INSERT OR REPLACE INTO slide_vectors (fingerprint, page, vector, created_at) VALUES (?, ?, ?, ?)",
            [(fingerprint, item["page"], json.dumps(item["vector"]), created_at) for item in slide_vectors],
        )
        conn.commit()
    finally:
        conn.close()


def insert_interaction(session_id, lesson_id, interaction_type, query, response_pages):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO interaction_log (session_id, lesson_id, type, query, response_pages, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, lesson_id, interaction_type, query, json.dumps(response_pages or []), _now_iso()),
        )
        conn.commit()
    finally:
        conn.close()


def insert_quiz_result(session_id, lesson_id, page, question, is_correct, tier):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO quiz_results (session_id, lesson_id, page, question, is_correct, tier, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (session_id, lesson_id, page, question, 1 if is_correct else 0, tier, _now_iso()),
        )
        conn.commit()
    finally:
        conn.close()


def export_interactions():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM interaction_log ORDER BY id DESC").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def export_quiz_results():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM quiz_results ORDER BY id DESC").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
