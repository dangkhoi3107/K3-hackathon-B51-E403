"""Cau hinh backend - doc .env o goc repo (cung file .env.example da co san tu truoc),
khong tao .env rieng cho server/ de tranh 2 nguon config lech nhau."""

from pathlib import Path

from dotenv import load_dotenv
import os

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SRC_DIR = REPO_ROOT / "codebase" / "src"
DB_PATH = Path(__file__).resolve().parent / "vlearn.db"

load_dotenv(REPO_ROOT / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openrouter/free")
PORT = int(os.environ.get("PORT", "8787"))

PROVIDER_KEYS = {
    "gemini": GEMINI_API_KEY,
    "openrouter": OPENROUTER_API_KEY,
}
