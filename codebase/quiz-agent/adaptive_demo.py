"""
Demo nho: Adaptive mastery quiz agent - sinh TUNG CAU HOI MOT, danh gia dung/sai,
roi tu chon cau tiep theo (De hon CUNG concept neu sai, chuyen concept MOI kho hon
neu dung). Day la ban demo de nhom "nhin thay" agent hoat dong truoc khi build vao
src/ - KHONG phai ban nop cuoi cung.

Quyet dinh AI trung tam (lap lai moi luot): danh gia cau tra loi vua roi -> chon
hanh dong ke tiep (cau de hon cung concept / concept moi kho hon / dung lai giai
thich va bo qua).

Rule kiem soat (theo thoa thuan trong spec):
  - Toi da 2 luot hoi/1 concept (1 chuan + 1 de hon) truoc khi bo qua, khong bia
    them lan thu 3.
  - Toi da 6 cau hoi/phien (an toan cho demo 5 phut).
  - Khong bao gio bia cau hoi ngoai noi dung duoc cap (source_snippet + quote).

Chay:
  python adaptive_demo.py          # nhap tay dap an A/B/C/D
  python adaptive_demo.py --auto   # tu dong dien dap an de xem het 3 nhanh:
                                    #   concept 1: sai lan dau -> de hon -> dung
                                    #   concept 2: dung ngay lan dau
                                    #   concept 3: sai ca 2 lan -> het luot, bo qua
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

MAX_ATTEMPTS_PER_CONCEPT = 2
MAX_QUESTIONS_PER_SESSION = 6
LOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "eval", "run_log.jsonl")

# 3 concept lay tu data duoc cap (data/vlearn-pack/transcript) - dung de demo,
# ban that se doc dong theo day_code nguoi hoc dang xem.
CONCEPTS = [
    {
        "id": "double_diamond",
        "label": "Mo hinh Double Diamond",
        "source": "transcript-01-clean.md [T01-049]",
        "text": (
            "Co mot ky thuat de xac dinh van de trong lam san pham: phase dau tien "
            "la problem discovery - kham pha van de, va sau day la kham pha giai "
            "phap. Day la mo hinh double diamond - kim cuong doi. Co ai biet mo "
            "hinh nay bao gio chua? No don gian thoi: hai vien kim cuong. Duong di "
            "len la mo rong, di xuong la hoi tu - no co bon pha: mo rong roi hoi "
            "tu, xong lai mo rong roi lai hoi tu. Vien thu nhat giup chung ta tim "
            "ra dung van de, vien thu hai giup chung ta tim ra dung giai phap cho "
            "van de day. Moi buoc chung ta deu co hai quy trinh: mo rong, sau day "
            "thu hep."
        ),
    },
    {
        "id": "automation_augment",
        "label": "Automation vs Augmentation",
        "source": "transcript-02-clean.md [T02-032, T02-033]",
        "text": (
            "Buoc thu hai la chon muc do tu dong hoa. O day co hai thang: "
            "automation hay augmentation. Automation nghia la de may no tu dong "
            "lam - tu dong hoa. Augmentation la van can con nguoi, AI chi giup tang "
            "cuong cong viec day thoi - AI ho tro; con phan automate la AI lam "
            "thay. Cai nay se phai danh doi: khi ban cho AI toan quyen thi ban "
            "phai chap nhan mot so rui ro nhat dinh. Thuong nguoi ta se bat dau "
            "voi augmentation truoc - tang cuong truoc, tuc la luon co con nguoi "
            "giam sat o day - sau day moi tang dan muc do automate len theo cai "
            "pho day."
        ),
    },
    {
        "id": "rule_workflow_agent",
        "label": "Ba cap do ky thuat: rule-based, workflow, agent",
        "source": "transcript-02-clean.md [T02-036, T02-037]",
        "text": (
            "Cap do thu nhat la dung cac quy tac. Nhung gi co the viet thanh quy "
            "tac ro rang duoc thi co the dua vao code va may chay, khong can den "
            "AI luon. Cap do hai la build theo dang workflow: van co the chia "
            "thanh cac buoc lon, thiet ke duoc thanh workflow, va trong tung nut "
            "day chung ta se co AI agent, AI LLM de ho tro - dang don gian nhat la "
            "di tuan tu tung buoc, cai thu hai la co phan nhanh, buoc thu ba la "
            "chay song song."
        ),
    },
]

QUESTION_SCHEMA = {
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
        "explanation": {"type": "STRING"},
        "quote": {
            "type": "STRING",
            "description": "Trich nguyen van ngan (<=25 tu) tu doan tai lieu lam can cu.",
        },
    },
    "required": ["question", "choices", "correct_index", "explanation", "quote"],
}


def build_prompt(concept: str, difficulty: str, avoid_questions: list[str]) -> str:
    avoid_block = ""
    if avoid_questions:
        avoid_block = (
            "Cac cau hoi DA hoi roi, KHONG duoc lap lai y tuong tuong tu:\n"
            + "\n".join(f"- {q}" for q in avoid_questions)
            + "\n\n"
        )
    return (
        f'Doan tai lieu (day la NGUON DUY NHAT duoc dung):\n"""{concept["text"]}"""\n\n'
        f"{avoid_block}"
        f"Muc do can hoi: {difficulty}.\n"
        "Hay tao DUNG 1 cau hoi trac nghiem 4 lua chon bam sat doan tai lieu tren.\n"
        "QUY TAC: chi dung thong tin co trong doan tai lieu, khong dung kien thuc "
        "ngoai, khong bia them chi tiet. Cau hoi phai kem quote trich nguyen van "
        "(<=25 tu) tu doan tai lieu lam can cu, va explanation giai thich dap an "
        "dung bam sat quote do."
    )


def generate_question(concept: dict, difficulty: str, avoid_questions: list[str], api_key: str) -> dict:
    payload = {
        "system_instruction": {
            "parts": [{
                "text": (
                    "Ban la AI Quiz Generator cua VLearn, dang tao TUNG CAU HOI MOT "
                    "cho phien tu kiem tra thich ung (adaptive). Chi duoc dung "
                    "thong tin co trong doan tai lieu duoc cung cap trong moi luot."
                )
            }]
        },
        "contents": [{"role": "user", "parts": [{"text": build_prompt(concept, difficulty, avoid_questions)}]}],
        "generationConfig": {
            "temperature": 0.5,
            "response_mime_type": "application/json",
            "response_schema": QUESTION_SCHEMA,
        },
    }
    req = urllib.request.Request(
        f"{API_URL}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Gemini API loi {e.code}: {e.read().decode('utf-8')[:500]}") from e
    text = body["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text)


def append_log(entry: dict) -> None:
    entry["logged_at"] = datetime.now(timezone.utc).isoformat()
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def ask_user_answer(choices: list[str], auto_choice: int | None) -> int:
    for i, c in enumerate(choices):
        print(f"    {chr(65 + i)}. {c}")
    if auto_choice is not None:
        print(f"  -> (auto) chon {chr(65 + auto_choice)}")
        return auto_choice
    raw = input("  Dap an cua ban (A/B/C/D): ").strip().upper()
    return "ABCD".index(raw) if raw in "ABCD" else -1


def run_session(auto: bool) -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Thieu GEMINI_API_KEY trong bien moi truong.")

    # Kich ban auto de xem het 3 nhanh hanh vi trong 1 lan chay:
    #   concept[0]: sai lan 1 (forced) -> hoi lai de hon -> dung  => "pass sau remedial"
    #   concept[1]: dung ngay lan 1                                => "pass ngay, sang concept kho hon"
    #   concept[2]: sai ca 2 lan (forced)                          => "het luot ho tro, bo qua"
    forced_wrong = {("double_diamond", 1), ("rule_workflow_agent", 1), ("rule_workflow_agent", 2)}

    total_asked = 0
    session_summary = []

    print(f"=== ADAPTIVE MASTERY QUIZ DEMO (model={MODEL}) ===\n")

    for concept in CONCEPTS:
        if total_asked >= MAX_QUESTIONS_PER_SESSION:
            print("Da cham tran so cau/phien -> dung phien, tong hop ket qua.\n")
            break

        print(f"--- Concept: {concept['label']} ({concept['source']}) ---")
        difficulty = "CHUAN (kiem tra hieu khai niem cot loi)"
        asked_texts: list[str] = []
        passed = False

        for attempt in range(1, MAX_ATTEMPTS_PER_CONCEPT + 1):
            if total_asked >= MAX_QUESTIONS_PER_SESSION:
                break
            total_asked += 1
            q = generate_question(concept, difficulty, asked_texts, api_key)
            asked_texts.append(q["question"])

            print(f"\n  [Lan {attempt}/{MAX_ATTEMPTS_PER_CONCEPT} - {difficulty}]")
            print(f"  Q: {q['question']}")
            auto_choice = None
            if auto:
                if (concept["id"], attempt) in forced_wrong:
                    auto_choice = (q["correct_index"] + 1) % 4
                else:
                    auto_choice = q["correct_index"]
            ua = ask_user_answer(q["choices"], auto_choice)
            correct = ua == q["correct_index"]

            print(f"  -> {'DUNG' if correct else 'SAI'}. Giai thich: {q['explanation']}")
            print(f"  Trich dan can cu: \"{q['quote']}\" ({concept['source']})")

            append_log({
                "engine": "adaptive_demo",
                "concept_id": concept["id"],
                "concept_label": concept["label"],
                "attempt": attempt,
                "difficulty": difficulty,
                "question": q["question"],
                "correct_index": q["correct_index"],
                "user_answer_index": ua,
                "is_correct": correct,
                "quote": q["quote"],
            })

            if correct:
                passed = True
                print("  => Hieu dung: chuyen sang CONCEPT TIEP THEO, cau hoi se KHO HON.\n")
                break
            elif attempt < MAX_ATTEMPTS_PER_CONCEPT:
                difficulty = "DE HON (chi hoi 1 y don gian nhat, bam sat 1 cau chu)"
                print("  => Chua hieu dung: hoi lai cau DE HON cung concept nay.\n")
            else:
                print("  => Da het luot ho tro (toi da 2 lan) cho concept nay: "
                      "khong bia them cau hoi 3, ghi nhan CHUA DAT va CHUYEN TIEP.\n")

        session_summary.append({"concept": concept["label"], "passed": passed, "questions_used": len(asked_texts)})

    print("=== TONG KET PHIEN ===")
    for row in session_summary:
        status = "DAT" if row["passed"] else "CHUA DAT (da het luot ho tro)"
        print(f"  - {row['concept']}: {status} ({row['questions_used']} cau)")
    print(f"\nTong so cau da hoi: {total_asked}/{MAX_QUESTIONS_PER_SESSION}")
    print(f"Log chi tiet da ghi vao: {os.path.abspath(LOG_PATH)}")


if __name__ == "__main__":
    run_session(auto="--auto" in sys.argv)
