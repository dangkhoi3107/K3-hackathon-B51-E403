"""FastAPI app - mount cac router /api/*, serve src/ lam static site tai "/", khoi
tao SQLite luc startup. Chay tu goc repo: uvicorn server.main:app --port 8787"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import db
from .config import GEMINI_API_KEY, OPENROUTER_API_KEY, SRC_DIR
from .routers import embed, llm, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="VLearn AI Tutor Backend", lifespan=lifespan)

app.include_router(llm.router)
app.include_router(embed.router)
app.include_router(logs.router)


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "gemini_configured": bool(GEMINI_API_KEY),
        "openrouter_configured": bool(OPENROUTER_API_KEY),
    }


# Mount SAU cung - route /api/* da dang ky o tren duoc Starlette khop truoc,
# mount "/" chi bat phan con lai (static file cua src/).
app.mount("/", StaticFiles(directory=str(SRC_DIR), html=True), name="static")
