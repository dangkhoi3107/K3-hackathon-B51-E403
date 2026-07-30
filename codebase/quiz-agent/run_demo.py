"""
Demo CLI cho quiz-agent — dung cho CP2/CP3 (flow bam duoc + >=1 AI call that).

Chay:
    python run_demo.py            # interactive, tu nhap dap an
    python run_demo.py --auto     # tu dong chon dap an dau tien (demo nhanh khong can go tay)

In ra + luu log tho vao eval/run_log.jsonl de doi chieu sau nay.
"""

import argparse
import json
import sys
import time
from pathlib import Path

from quiz_agent import generate_self_check, grade

LOG_PATH = Path(__file__).resolve().parent.parent.parent / "eval" / "run_log.jsonl"

# Case 1 - HAPPY PATH: doan that tu transcript-01-clean.md (T01-049), du can cu -> phai ra status=ok
CASE_OK = {
    "page_label": "transcript-01-clean.md [T01-049] — Mo hinh Double Diamond",
    "text": (
        "Thi bay gio co cach nao de minh tim ra duoc van de dung hay khong? Co mot ky thuat ma "
        "minh xai kha nhieu, thay rat co ich de xac dinh van de trong lam san pham: phase dau "
        "tien la problem discovery - kham pha van de, va sau day la kham pha giai phap. Day la "
        "mo hinh double diamond - kim cuong doi, cung cua ong Don dua ra. Duong di len la mo "
        "rong, di xuong la hoi tu - no co bon pha: mo rong roi hoi tu, xong lai mo rong roi lai "
        "hoi tu. Vien thu nhat giup chung ta tim ra dung van de, vien thu hai giup chung ta tim "
        "ra dung giai phap cho van de day. Moi buoc chung ta deu co hai quy trinh: mo rong, sau "
        "day thu hep."
    ),
}

# Case 2 - CHO KHO: doan qua ngan / chi la tieu de -> phai tu choi (status=insufficient_content)
CASE_THIN = {
    "page_label": "transcript-01-clean.md — tieu de muc, khong co noi dung",
    "text": "## Phat trien san pham AI co gi khac",
}


def run_case(label: str, case: dict, auto: bool) -> dict:
    print(f"\n{'=' * 70}\n{label}: {case['page_label']}\n{'=' * 70}")
    t0 = time.time()
    result = generate_self_check(case["text"], case["page_label"])
    latency_ms = int((time.time() - t0) * 1000)

    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"label": label, "page_label": case["page_label"], "latency_ms": latency_ms, "result": result}, ensure_ascii=False) + "\n")

    if result.get("status") == "insufficient_content":
        print(f"[TU CHOI - dung thiet ke] Ly do: {result.get('reason')}")
        print(f"(latency {latency_ms}ms)")
        return result

    questions = result.get("questions", [])
    print(f"AI sinh {len(questions)} cau hoi (latency {latency_ms}ms):\n")
    user_answers = []
    for i, q in enumerate(questions, 1):
        print(f"Cau {i}: {q['question']}")
        for j, choice in enumerate(q["choices"]):
            print(f"   {chr(65+j)}. {choice}")
        if auto:
            ans = 0
            print("   -> (auto) chon A")
        else:
            raw = input("   Dap an cua ban (A/B/C/D): ").strip().upper()
            ans = "ABCD".index(raw) if raw in "ABCD" else 0
        user_answers.append(ans)
        print()

    print("--- Ket qua ---")
    for i, r in enumerate(grade(result, user_answers), 1):
        mark = "DUNG" if r["is_correct"] else "SAI"
        print(f"Cau {i}: [{mark}] Ban chon: {r['your_answer']}")
        if not r["is_correct"]:
            print(f"   Dap an dung: {r['correct_answer']}")
        print(f"   Vi sao: {r['explanation']}")
        print(f'   Can cu: "{r["quote"]}"')
        print()
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--auto", action="store_true", help="tu dong chon dap an A, khong can nhap tay")
    args = parser.parse_args()

    LOG_PATH.parent.mkdir(exist_ok=True)

    run_case("CASE 1 (happy path)", CASE_OK, args.auto)
    run_case("CASE 2 (cho kho - noi dung qua mong)", CASE_THIN, args.auto)


if __name__ == "__main__":
    sys.exit(main())
