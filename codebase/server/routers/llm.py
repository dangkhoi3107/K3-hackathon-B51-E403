"""Proxy /api/llm/* - client goi day thay vi goi thang Gemini/OpenRouter, key khong
con roi tram may khach. Server goi 1 lan, tra nguyen payload provider goc + status
code de client giu nguyen vong lap retry da co (callLLMAPI/callGeminiAgentTurn trong
src/app.js)."""

from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .. import providers

router = APIRouter(prefix="/api/llm", tags=["llm"])


class ImagePart(BaseModel):
    data: str
    mimeType: str = "image/png"


class GenerateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    providerId: str
    model: Optional[str] = None
    promptText: str
    json_mode: bool = Field(default=False, alias="json")
    temperature: Optional[float] = None
    imageBase64: Optional[str] = None
    imageMimeType: str = "image/png"
    images: Optional[List[ImagePart]] = None


class AgentTurnRequest(BaseModel):
    model: Optional[str] = None
    systemInstruction: Optional[str] = None
    contents: list[dict]
    tools: Optional[list[dict]] = None
    temperature: Optional[float] = 0.3


@router.post("/generate")
async def generate(payload: GenerateRequest):
    try:
        status_code, data = await providers.call_generate(
            provider_id=payload.providerId,
            model=payload.model,
            prompt_text=payload.promptText,
            json_mode=payload.json_mode,
            temperature=payload.temperature,
            image_base64=payload.imageBase64,
            image_mime_type=payload.imageMimeType,
            images=[{"data": image.data, "mime_type": image.mimeType} for image in (payload.images or [])],
        )
    except providers.ProviderError as error:
        return JSONResponse(status_code=error.status_code, content={"error": {"message": error.message}})
    return JSONResponse(status_code=status_code, content=data)


@router.post("/agent-turn")
async def agent_turn(payload: AgentTurnRequest):
    try:
        status_code, data = await providers.call_agent_turn(
            model=payload.model,
            system_instruction=payload.systemInstruction,
            contents=payload.contents,
            tools=payload.tools,
            temperature=payload.temperature,
        )
    except providers.ProviderError as error:
        return JSONResponse(status_code=error.status_code, content={"error": {"message": error.message}})
    return JSONResponse(status_code=status_code, content=data)
