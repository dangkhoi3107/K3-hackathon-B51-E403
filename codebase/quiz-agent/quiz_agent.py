"""
Quiz / self-check agent cho VLearn — sinh cau hoi tu kiem tra bam sat 1 trang tai lieu.

Quyet dinh AI trung tam (lat cat MOT CAU):
  Khi hoc vien doc xong mot trang slide va bam "tu kiem tra", AI sinh 3 cau hoi
  trac nghiem bam DUNG noi dung trang do kem trich dan, tu choi neu noi dung
  qua mong/khong du can cu de ra cau hoi chat luong (khong bia).

Automation: Conditional — AI tu sinh quiz khi co du can cu trong doan duoc chon;
khong du -> tu choi va noi ro ly do, KHONG bia cau hoi. Ly do (cost-of-error):
cau hoi/dap an sai se khien hoc vien tu hoc sai kien thuc ngay tai thoi diem
ho dang tin tuong nhat (dang tu kiem tra) -> sai thi dat, phai chan truoc.

AI call: Google Gemini (GEMINI_API_KEY tu bien moi truong) — model gemini-2.5-flash.
"""

import json
import os
import urllib.request
import urllib.error

MODEL = "gemini-3.1-flash-lite"  # cung model VLearn dang dung trong production (xem DATA_DICTIONARY.md)
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "status": {"type": "STRING", "enum": ["ok", "insufficient_content"]},
        "reason": {
            "type": "STRING",
            "description": "Bat buoc khi status=insufficient_content: vi sao noi dung khong du de ra cau hoi.",
        },
        "questions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "question": {"type": "STRING"},
                    "choices": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                        "minItems": 4,
                        "maxItems": 4,
                    },
                    "correct_index": {"type": "INTEGER"},
                    "explanation": {
                        "type": "STRING",
                        "description": "Giai thich vi sao dap an dung, phai bam sat cau chu/y trong doan tai lieu duoc cung cap.",
                    },
                    "quote": {
                        "type": "STRING",
                        "description": "Trich nguyen van ngan (<=25 tu) tu doan tai lieu lam can cu cho cau hoi nay.",
                    },
                },
                "required": ["question", "choices", "correct_index", "explanation", "quote"],
            },
        },
    },
    "required": ["status"],
}

SYSTEM_PROMPT = """Ban la tro giang AI cua VLearn, dang tao bo cau hoi tu-kiem-tra (self-check) \
cho hoc vien ngay sau khi ho doc xong MOT trang tai lieu cu the.

QUY TAC BAT BUOC:
1. CHI duoc dung thong tin co trong doan tai lieu duoc cung cap. Khong duoc dung \
kien thuc ben ngoai, khong duoc suy doan hay bia them chi tiet khong co trong doan.
2. Neu doan tai lieu qua ngan, chi la tieu de/hinh anh minh hoa, hoac khong co du \
noi dung ki thuat de ra duoc cau hoi kiem tra hieu bai chat luong -> tra ve \
status="insufficient_content" kem ly do ro rang. TUYET DOI khong co gang bia cau \
hoi cho co.
3. Neu du can cu -> tra ve status="ok" va dung 3 cau hoi trac nghiem 4 lua chon, \
moi cau phai kem "quote" trich nguyen van tu doan tai lieu lam can cu, va \
"explanation" giai thich dap an dung bam vao dung cau chu do (khong dien giai \
xa roi tai lieu).
4. Do kho: kiem tra HIEU khai niem, khong kiem tra tri nho tieu tiet (so trang, \
thu tu liet ke) khong quan trong.
5. Van phong tieng Viet, ro rang, dung voi trinh do hoc vien dang hoc AI/prompt \
engineering trong khoa hoc.
"""


def generate_self_check(slide_text: str, page_label: str, api_key: str | None = None) -> dict:
    """Goi Gemini de sinh bo cau hoi tu-kiem-tra bam sat slide_text.

    Tra ve dict theo RESPONSE_SCHEMA. Neu API loi (network/quota), nem exception —
    khong fallback bang cau hoi bia, vi ung dung cost-of-error yeu cau tha con hon bia.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("Thieu GEMINI_API_KEY trong bien moi truong.")

    user_prompt = (
        f'Trang: "{page_label}"\n'
        f"--- Noi dung doan tai lieu ---\n{slide_text}\n--- Het noi dung ---\n\n"
        "Hay tao bo cau hoi tu-kiem-tra theo dung quy tac da neu."
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "response_mime_type": "application/json",
            "response_schema": RESPONSE_SCHEMA,
        },
    }

    req = urllib.request.Request(
        f"{API_URL}?key={key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Gemini API loi {e.code}: {e.read().decode('utf-8')[:500]}") from e

    try:
        text = body["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Khong doc duoc response tu Gemini: {json.dumps(body)[:500]}") from e

    return json.loads(text)


def grade(quiz: dict, user_answers: list[int]) -> list[dict]:
    """Cham diem tat dinh (khong goi AI lan 2) — tranh AI "phan xu" chu quan lan 2
    cho cung mot cau hoi no vua tu dat ra; giai thich da co san tu buoc sinh cau hoi.
    """
    results = []
    for q, ua in zip(quiz.get("questions", []), user_answers):
        correct = ua == q["correct_index"]
        results.append(
            {
                "question": q["question"],
                "your_answer": q["choices"][ua] if 0 <= ua < len(q["choices"]) else "(khong hop le)",
                "correct_answer": q["choices"][q["correct_index"]],
                "is_correct": correct,
                "explanation": q["explanation"],
                "quote": q["quote"],
            }
        )
    return results
